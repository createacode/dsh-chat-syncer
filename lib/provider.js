/**
 * Gitee / GitHub REST adapter.
 *
 * The plugin deliberately uses the repository contents API instead of a local
 * git checkout: the user only needs an access token, and no Git binary or
 * credential helper is involved. Every request carries the token locally and
 * never exposes it to the browser.
 */
import { Buffer } from 'node:buffer';
import { dataRepoReadme } from './data-readme.js';
import { sha256 } from './util.js';

export const PROVIDERS = Object.freeze({
  gitee: {
    id: 'gitee',
    label: 'Gitee',
    apiBase: 'https://gitee.com/api/v5',
    webBase: 'https://gitee.com',
    tokenUrl: 'https://gitee.com/profile/personal_access_tokens',
    tokenHint: '需要 projects 权限（勾选仓库相关权限）',
    defaultBranch: 'master',
  },
  github: {
    id: 'github',
    label: 'GitHub',
    apiBase: 'https://api.github.com',
    webBase: 'https://github.com',
    tokenUrl: 'https://github.com/settings/tokens/new?scopes=repo&description=dsh-chat-syncer',
    tokenHint: 'Classic token 需要 repo 权限；Fine-grained token 需要 Contents 读写权限',
    defaultBranch: 'main',
  },
});

export class RepoError extends Error {
  constructor(message, options = {}) {
    super(message);
    this.name = 'RepoError';
    this.status = options.status ?? 0;
    this.code = options.code ?? 'repository';
    this.detail = options.detail ?? '';
    this.retryable = Boolean(options.retryable);
    this.retryAfterMs = Number(options.retryAfterMs) || 0;
  }
}

/** Gitee/GitHub answer a 403 with these words when the repo itself is blocked. */
const BLOCKED_RE = /屏蔽|封禁|冻结|暂停|blocked|suspended|disabled|unavailable for legal|dmca/i;
/** Rate limit wording differs per platform: English on both APIs, Chinese on the web tier. */
const RATE_LIMIT_RE = /rate.?limit|too many|api rate|限流|频率|频繁/i;
const TOO_LARGE_RE = /too large|payload too large|file is too big|文件过大|超过.*(?:大小|上限)/i;

/** Retry-After is either delta-seconds or an HTTP date; both are tolerated. */
function parseRetryAfter(headers) {
  try {
    const raw = headers?.get?.('retry-after');
    if (!raw) return 0;
    const seconds = Number(raw);
    if (Number.isFinite(seconds) && seconds >= 0) return Math.round(seconds * 1000);
    const at = Date.parse(raw);
    return Number.isFinite(at) ? Math.max(0, at - Date.now()) : 0;
  } catch {
    return 0;
  }
}

function providerConfig(kind) {
  const normalized = String(kind ?? '').toLowerCase();
  if (!PROVIDERS[normalized]) throw new RepoError(`不支持的仓库平台：${kind}`, { code: 'provider' });
  return PROVIDERS[normalized];
}

export function providerLabel(kind) {
  try {
    return providerConfig(kind).label;
  } catch {
    return String(kind ?? '');
  }
}

export function providerPublicInfo(kind) {
  const config = providerConfig(kind);
  return {
    id: config.id,
    label: config.label,
    tokenUrl: config.tokenUrl,
    tokenHint: config.tokenHint,
  };
}

function encodePath(value) {
  return String(value)
    .replace(/\\/g, '/')
    .split('/')
    .filter(Boolean)
    .map((part) => encodeURIComponent(part))
    .join('/');
}

/** Never let a token or access_token query value reach an error surface. */
function redact(text, token) {
  let value = String(text ?? '');
  if (token) {
    value = value.split(token).join('[redacted]');
  }
  return value.replace(/access_token=[^&\s]+/gi, 'access_token=[redacted]');
}

function normalizePrivate(kind, data) {
  if (!data || typeof data !== 'object') return false;
  if (kind === 'github') return data.private === true;
  return data.private === true
    || data.private === 1
    || data.private === 'true'
    || data.public === 0
    || data.public === '0';
}

function normalizeRepo(kind, data, fallbackOwner, fallbackName) {
  const owner = data?.owner?.login || data?.namespace?.path || data?.namespace?.name || fallbackOwner;
  const name = data?.name || data?.path || fallbackName;
  return {
    provider: kind,
    owner,
    name,
    fullName: data?.full_name || data?.full_path || `${owner}/${name}`,
    private: normalizePrivate(kind, data),
    defaultBranch: data?.default_branch || data?.default_branch_name || '',
    htmlUrl: data?.html_url || data?.web_url || data?.url || '',
    description: data?.description || '',
  };
}

export class RepoClient {
  constructor(options) {
    const config = providerConfig(options.provider);
    this.kind = config.id;
    this.config = config;
    this.token = String(options.token ?? '');
    this.owner = String(options.owner ?? '');
    this.repo = String(options.repo ?? '');
    this.branch = String(options.branch ?? '');
    this.repoInfo = null;
  }

  /** Build the authenticated request URL without ever logging the token. */
  url(pathname, query = {}) {
    const url = new URL(`${this.config.apiBase}${pathname}`);
    if (this.kind === 'gitee') url.searchParams.set('access_token', this.token);
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null || value === '') continue;
      url.searchParams.set(key, String(value));
    }
    return url;
  }

  headers(extra = {}) {
    const headers = {
      accept: 'application/json',
      'content-type': 'application/json',
      'user-agent': 'dsh-chat-syncer/0.1 (+https://github.com)',
      ...extra,
    };
    if (this.kind === 'github') {
      headers.authorization = `Bearer ${this.token}`;
      headers['x-github-api-version'] = '2022-11-28';
    }
    return headers;
  }

  async request(pathname, options = {}) {
    const method = options.method ?? 'GET';
    const url = this.url(pathname, options.query);
    const timeout = options.timeout ?? 30_000;
    const maxRateLimitRetries = options.rateLimitRetries ?? 2;
    let attempt = 0;
    for (;;) {
      let response;
      try {
        response = await fetch(url, {
          method,
          headers: this.headers(options.headers),
          body: options.body === undefined ? undefined : JSON.stringify(options.body),
          signal: AbortSignal.timeout(timeout),
          redirect: 'follow',
        });
      } catch (error) {
        if (error && (error.name === 'TimeoutError' || error.name === 'AbortError')) {
          throw new RepoError(`连接 ${this.config.label} 超时，请检查网络后重试`, {
            code: 'timeout',
            retryable: true,
          });
        }
        throw new RepoError(`无法连接 ${this.config.label}：${redact(error instanceof Error ? error.message : String(error), this.token)}`, {
          code: 'network',
          retryable: true,
        });
      }

      const text = await response.text().catch(() => '');
      if (response.status === 404 && options.allow404) return null;
      if (!response.ok) {
        let payload = null;
        try {
          payload = text ? JSON.parse(text) : null;
        } catch {
          payload = null;
        }
        const detail = redact(String(
          payload?.message
          || payload?.error
          || payload?.error_description
          || text.slice(0, 300)
          || '',
        ).trim(), this.token);
        const error = this.errorFor(response, detail);
        /* A rate-limited request was rejected before it ran, so replaying it is
         * safe even for writes. Everything else is never retried automatically. */
        if (attempt < maxRateLimitRetries && error.code === 'rate-limited') {
          const wait = error.retryAfterMs > 0
            ? Math.min(error.retryAfterMs, 20_000)
            : Math.min(1500 * (attempt + 1), 5000);
          attempt += 1;
          await new Promise((resolve) => setTimeout(resolve, wait));
          continue;
        }
        throw error;
      }
      if (response.status === 204 || text === '') return null;
      try {
        return JSON.parse(text);
      } catch {
        throw new RepoError(`${this.config.label} 返回了无法解析的数据`, {
          status: response.status,
          code: 'format',
        });
      }
    }
  }

  errorFor(response, detail) {
    const status = response.status;
    const retryAfterMs = parseRetryAfter(response.headers);
    const rateLimited = status === 429 || (status === 403 && RATE_LIMIT_RE.test(detail));
    let code = 'http';
    let message;
    if (status === 401) {
      code = 'unauthorized';
      message = `${this.config.label} 令牌无效或已过期，请重新登录`;
    } else if (status === 403 && BLOCKED_RE.test(detail)) {
      code = 'repo-blocked';
      message = `${this.config.label} 仓库已被平台屏蔽${detail ? `：${detail}` : ''}`;
    } else if (rateLimited) {
      code = 'rate-limited';
      const wait = retryAfterMs > 0 ? `，约 ${Math.ceil(retryAfterMs / 1000)} 秒后重试` : '，请稍后再试';
      message = `${this.config.label} 请求频率受限${wait}${detail ? `（${detail}）` : ''}`;
    } else if (status === 403) {
      code = 'forbidden';
      message = `${this.config.label} 令牌权限不足${detail ? `：${detail}` : '，平台拒绝了这次请求'}`;
    } else if (status === 404) {
      code = 'not-found';
      message = `${this.config.label} 仓库或文件不存在，或当前账号无权访问`;
    } else if (status === 413 || TOO_LARGE_RE.test(detail)) {
      code = 'too-large';
      message = `${this.config.label} 拒绝了过大的文件${detail ? `：${detail}` : '，超出平台单文件上限'}`;
    } else if (status === 422) {
      code = 'validation';
      message = `${this.config.label} 拒绝了这次请求${detail ? `：${detail}` : ''}`;
    } else {
      message = `${this.config.label} 接口错误（${status}）${detail ? `：${detail}` : ''}`;
    }
    return new RepoError(message, {
      status,
      code,
      detail,
      retryAfterMs,
      retryable: status >= 500 || status === 429 || rateLimited,
    });
  }

  async getUser() {
    const data = await this.request('/user');
    return {
      provider: this.kind,
      id: String(data?.id ?? ''),
      login: String(data?.login ?? data?.username ?? ''),
      name: String(data?.name ?? ''),
      avatarUrl: String(data?.avatar_url ?? ''),
      htmlUrl: String(data?.html_url ?? ''),
    };
  }

  /**
   * Validate the token and read any scopes the platform exposes. Classic
   * GitHub tokens expose x-oauth-scopes; Gitee and fine-grained GitHub tokens
   * may return no list, in which case the caller must treat permission as
   * "unknown" and rely on the actual repository operation as the final check.
   */
  async inspectToken() {
    let response;
    try {
      response = await fetch(this.url('/user'), {
        headers: this.headers(),
        signal: AbortSignal.timeout(30_000),
        redirect: 'follow',
      });
    } catch (error) {
      if (error && (error.name === 'TimeoutError' || error.name === 'AbortError')) {
        throw new RepoError(`连接 ${this.config.label} 超时，请检查网络后重试`, { code: 'timeout', retryable: true });
      }
      throw new RepoError(`无法连接 ${this.config.label}`, { code: 'network', retryable: true });
    }
    const text = await response.text().catch(() => '');
    if (!response.ok) throw this.errorFor(response, redact(text.slice(0, 300), this.token));
    let data;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      throw new RepoError(`${this.config.label} 返回了无法解析的账号信息`, { code: 'format' });
    }
    const rawScopes = [
      response.headers.get('x-oauth-scopes'),
      response.headers.get('x-accepted-oauth-scopes'),
      response.headers.get('x-gitee-scopes'),
    ].filter(Boolean).join(',');
    const scopes = [...new Set(rawScopes.split(/[,\s]+/).map((scope) => scope.trim()).filter(Boolean))];
    return {
      account: {
        provider: this.kind,
        id: String(data?.id ?? ''),
        login: String(data?.login ?? data?.username ?? ''),
        name: String(data?.name ?? ''),
        avatarUrl: String(data?.avatar_url ?? ''),
        htmlUrl: String(data?.html_url ?? ''),
      },
      scopes,
    };
  }

  /**
   * A lightweight read probe for platforms that do not expose token scopes.
   * It cannot prove write/create permission, but a 401/403 proves the token is
   * not even allowed to list the account's repositories.
   */
  async probeRepositoryAccess() {
    try {
      await this.request('/user/repos', { query: { per_page: 1 } });
      return { ok: true };
    } catch (error) {
      if (error && (error.code === 'forbidden' || error.code === 'unauthorized')) {
        return { ok: false, error };
      }
      return { ok: true, warning: error instanceof Error ? error.message : String(error) };
    }
  }

  async getRepo(owner = this.owner, repo = this.repo, options = {}) {
    if (!owner || !repo) return null;
    const data = await this.request(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`, {
      allow404: options.allow404 ?? true,
    });
    if (!data) return null;
    this.repoInfo = normalizeRepo(this.kind, data, owner, repo);
    if (this.repoInfo.defaultBranch) this.branch = this.repoInfo.defaultBranch;
    return this.repoInfo;
  }

  async listCommits(limit = 20, path = '') {
    if (!this.owner || !this.repo) return [];
    const data = await this.request(`/repos/${encodeURIComponent(this.owner)}/${encodeURIComponent(this.repo)}/commits`, {
      query: {
        ...(this.branch ? { sha: this.branch } : {}),
        ...(path ? { path } : {}),
        per_page: String(Math.max(1, Math.min(50, Number(limit) || 20))),
      },
    });
    if (!Array.isArray(data)) return [];
    return data.map((item) => ({
      sha: String(item?.sha ?? ''),
      shortSha: String(item?.sha ?? '').slice(0, 8),
      message: String(item?.commit?.message ?? '').split('\n')[0].slice(0, 200),
      author: String(item?.commit?.author?.name ?? item?.author?.login ?? ''),
      date: String(item?.commit?.author?.date ?? item?.commit?.committer?.date ?? ''),
      htmlUrl: String(item?.html_url ?? ''),
    }));
  }

  async createRepo(name, description) {
    const body = {
      name,
      description,
      private: true,
      auto_init: true,
    };
    const data = await this.request('/user/repos', { method: 'POST', body });
    this.owner = String(data?.owner?.login || data?.namespace?.path || this.owner);
    this.repo = String(data?.name || name);
    this.repoInfo = normalizeRepo(this.kind, data, this.owner, name);
    if (this.repoInfo.defaultBranch) this.branch = this.repoInfo.defaultBranch;
    return this.repoInfo;
  }

  /**
   * Find the account's sync repository, create a private one when absent, and
   * make sure it has an initial branch/file so contents writes are accepted.
   */
  async ensureRepo(name) {
    let info = await this.getRepo(this.owner, name);
    let created = false;
    if (!info) {
      info = await this.createRepo(name, 'DSH 多端会话同步助手（由 dsh-chat-syncer 自动创建）');
      created = true;
    }
    if (!info) throw new RepoError('无法创建同步仓库', { code: 'repo-create' });
    if (!info.private) {
      throw new RepoError('同名仓库已存在但不是私有仓库。请换一个仓库名，或先在平台把它改为私有。', {
        code: 'repo-public',
      });
    }

    for (let attempt = 0; attempt < 6 && !this.branch; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 400));
      info = await this.getRepo(this.owner, this.repo);
      if (info?.defaultBranch) this.branch = info.defaultBranch;
    }
    if (!this.branch) this.branch = this.config.defaultBranch;

    let readme = null;
    try {
      readme = await this.getContentMeta('README.md');
    } catch (error) {
      if (!error || error.code !== 'not-found') throw error;
    }
    let readmeInitialized = false;
    if (created || !readme) {
      try {
        await this.putFile('README.md', Buffer.from(
          dataRepoReadme(),
          'utf8',
        ), created
          ? '文档：新增数据仓库说明'
          : '文档：初始化数据仓库说明');
        readmeInitialized = true;
      } catch (error) {
        /* A repository with auto_init may still be materializing; a later login retries. */
        if (!this.branch) throw error;
      }
    }
    return { ...info, defaultBranch: this.branch, created, readmeInitialized };
  }

  contentsPath(filePath) {
    return `/repos/${encodeURIComponent(this.owner)}/${encodeURIComponent(this.repo)}/contents/${encodePath(filePath)}`;
  }

  async getContentMeta(filePath, timeout = 30_000, ref = this.branch) {
    const data = await this.request(this.contentsPath(filePath), {
      query: ref ? { ref } : {},
      allow404: true,
      timeout,
    });
    if (!data) return null;
    if (Array.isArray(data)) {
      /* Gitee sometimes answers a missing file below an existing directory
       * with that directory's listing. For our file-oriented calls this means
       * "not created yet", not a corrupt path. */
      return null;
    }
    return {
      sha: String(data.sha ?? ''),
      size: Number(data.size ?? 0),
      content: typeof data.content === 'string' ? data.content : '',
      encoding: String(data.encoding ?? ''),
      downloadUrl: String(data.download_url ?? ''),
      path: String(data.path ?? filePath),
    };
  }

  async getBlob(sha, timeout = 120_000) {
    const data = await this.request(`/repos/${encodeURIComponent(this.owner)}/${encodeURIComponent(this.repo)}/git/blobs/${encodeURIComponent(sha)}`, { timeout });
    if (!data) throw new RepoError('文件内容为空', { code: 'empty' });
    if (data.encoding === 'base64' && typeof data.content === 'string') {
      return Buffer.from(data.content.replace(/\s+/g, ''), 'base64');
    }
    if (typeof data.content === 'string') return Buffer.from(data.content, 'utf8');
    throw new RepoError('无法读取文件内容', { code: 'format' });
  }

  /**
   * Read a file's bytes through the contents API, falling back to the blob
   * endpoint whenever the inline payload cannot be trusted.
   *
   * Gitee truncates the contents API `content` field at 10 MiB while still
   * reporting the real byte count in `size`, so a truncated copy decodes
   * cleanly and would silently fail the caller's sha256 check. Accept the
   * inline copy only when its length matches the recorded size; otherwise ask
   * the blob endpoint for the whole object and verify that too.
   */
  async getFile(filePath, ref = this.branch) {
    const meta = await this.getContentMeta(filePath, 120_000, ref);
    if (!meta) return null;
    if (meta.size === 0) return { buffer: Buffer.alloc(0), meta };
    if (meta.content) {
      const buffer = Buffer.from(meta.content.replace(/\s+/g, ''), 'base64');
      if (buffer.length > 0 && (!meta.size || buffer.length === meta.size)) return { buffer, meta };
    }
    if (!meta.sha) throw new RepoError(`无法读取文件：${filePath}`, { code: 'content' });
    const buffer = await this.getBlob(meta.sha, 120_000);
    if (meta.size && buffer.length !== meta.size) {
      throw new RepoError(
        `${this.config.label} 返回的文件不完整（${buffer.length} / ${meta.size} 字节）：${filePath}`,
        { code: 'content', retryable: true },
      );
    }
    return { buffer, meta };
  }

  async readJson(filePath, ref = this.branch) {
    const file = await this.getFile(filePath, ref);
    if (!file) return null;
    try {
      return JSON.parse(file.buffer.toString('utf8'));
    } catch {
      throw new RepoError(`仓库文件不是合法 JSON：${filePath}`, { code: 'format' });
    }
  }

  async putFile(filePath, bytes, message) {
    if (!this.branch) throw new RepoError('仓库还没有可用分支', { code: 'branch' });
    const data = Buffer.isBuffer(bytes) ? bytes : Buffer.from(bytes);
    const content = data.toString('base64');
    let meta = await this.getContentMeta(filePath);
    const body = {
      message,
      content,
      branch: this.branch,
    };
    if (meta) body.sha = meta.sha;
    if (this.kind === 'gitee') {
      const method = meta ? 'PUT' : 'POST';
      return this.request(this.contentsPath(filePath), {
        method,
        body,
        timeout: 120_000,
      });
    }
    return this.request(this.contentsPath(filePath), {
      method: 'PUT',
      body,
      timeout: 120_000,
    });
  }

  async putJson(filePath, value, message) {
    return this.putFile(filePath, Buffer.from(`${JSON.stringify(value, null, 2)}\n`, 'utf8'), message);
  }

  /**
   * Write one file and hand back both the blob sha (needed for the next rewrite)
   * and the commit sha (the caller pins reads to it so an in-flight push never
   * exposes a half-updated snapshot).
   */
  async writeFileDetailed(filePath, bytes, message, options = {}) {
    const data = Buffer.isBuffer(bytes) ? bytes : Buffer.from(bytes);
    const body = {
      message: message || `sync ${filePath}`,
      content: data.toString('base64'),
      branch: this.branch,
    };
    if (options.sha) body.sha = options.sha;
    const method = this.kind === 'gitee'
      ? (options.sha ? 'PUT' : 'POST')
      : 'PUT';
    const result = await this.request(this.contentsPath(filePath), {
      method,
      body,
      timeout: options.timeout ?? 120_000,
    });
    return {
      commitSha: String(result?.commit?.sha || ''),
      contentSha: String(result?.content?.sha || ''),
      raw: result,
    };
  }

  /** Read a file pinned to a ref (branch or commit sha). */
  async readFileAt(filePath, ref = this.branch, timeout = 120_000) {
    const file = await this.getFile(filePath, ref);
    return file ? file.buffer : null;
  }

  /** Repositories are the only API-level way to reclaim Git history quota. */
  async renameRepo(name) {
    const data = await this.request(
      `/repos/${encodeURIComponent(this.owner)}/${encodeURIComponent(this.repo)}`,
      { method: 'PATCH', body: { name: String(name), path: String(name) } },
    );
    this.repo = String(data?.name || name);
    return data;
  }

  async deleteRepo() {
    await this.request(
      `/repos/${encodeURIComponent(this.owner)}/${encodeURIComponent(this.repo)}`,
      { method: 'DELETE', timeout: 60_000 },
    );
    return true;
  }

  async deleteFile(filePath, message) {
    const meta = await this.getContentMeta(filePath);
    if (!meta) return false;
    if (this.kind === 'gitee') {
      await this.request(this.contentsPath(filePath), {
        method: 'DELETE',
        query: {
          sha: meta.sha,
          message,
          branch: this.branch,
        },
        timeout: 60_000,
      });
      return true;
    }
    const body = {
      message,
      sha: meta.sha,
      branch: this.branch,
    };
    await this.request(this.contentsPath(filePath), {
      method: 'DELETE',
      body,
      timeout: 60_000,
    });
    return true;
  }

  async listTree() {
    if (!this.branch) return [];
    const data = await this.request(
      `/repos/${encodeURIComponent(this.owner)}/${encodeURIComponent(this.repo)}/git/trees/${encodeURIComponent(this.branch)}`,
      { query: { recursive: 1 }, allow404: true },
    );
    if (!data || !Array.isArray(data.tree)) return [];
    return data.tree.filter((entry) => entry && typeof entry.path === 'string');
  }

  async deletePrefix(prefix, message) {
    const normalized = String(prefix).replace(/^\/+|\/+$/g, '');
    if (!normalized) throw new RepoError('refusing to delete the repository root', { code: 'unsafe-delete' });
    const tree = await this.listTree();
    const files = tree
      .filter((entry) => entry.type === 'blob' && (entry.path === normalized || entry.path.startsWith(`${normalized}/`)))
      .map((entry) => entry.path);
    let deleted = 0;
    for (const file of files) {
      if (await this.deleteFile(file, message)) deleted += 1;
    }
    return { deleted, files };
  }

  async listUserRepos() {
    const data = await this.request('/user/repos', { query: { per_page: 100, sort: 'updated' } });
    return Array.isArray(data) ? data : [];
  }
}

export function makeClient(options) {
  return new RepoClient(options);
}

export function repoDigest(value) {
  return sha256(String(value ?? ''));
}
