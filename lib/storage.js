/**
 * Folder-per-session storage (schema 3) and the two transports that can write it.
 *
 * The v1/v2 layout replaced one large bundle on every push, so every turn cost a
 * full snapshot in Git history (measured: 87 MiB per push, 11.9x stored per
 * version). This module keeps one directory per session and only rewrites the
 * sessions that actually changed.
 *
 * Atomicity without a batched commit API:
 *   1. write changed session/attachment files;
 *   2. write an immutable manifest and remember its commit sha;
 *   3. write HEAD last, pointing at that manifest commit.
 * Readers only trust HEAD, and pin every read to `head.manifestCommit`, so an
 * interrupted push never exposes a half-updated snapshot.
 */
import { execFile } from 'node:child_process';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';

import {
  attachmentObjectPath,
  collectAttachmentIds,
  readSessionRecord,
  readSessionRecords,
  scanSessions,
} from './sessions.js';
import {
  ensureDir,
  nowIso,
  readJson,
  sha256,
  userKeyFor,
  writeJson,
} from './util.js';

const run = promisify(execFile);

export const STORAGE_VERSION = 3;
export const DEFAULT_QUOTA_BYTES = 1024 * 1024 * 1024;
export const QUOTA_WARN_RATIO = 0.8;
export const QUOTA_HARD_RATIO = 0.9;

/**
 * Commit trailer that records where a push came from. It is optional (the
 * `includeLocalInfo` setting) because device names, host names and account
 * names are local metadata; when enabled they make each commit traceable.
 */
export function formatLocalInfo(info) {
  if (!info || typeof info !== 'object') return '';
  const line = (label, value) => {
    const text = String(value ?? '').replace(/\s+/g, ' ').trim();
    return text ? `DSH-${label}: ${text}` : '';
  };
  return [
    line('Device', info.deviceName),
    line('DeviceId', info.deviceId),
    line('User', info.user),
    line('Provider', info.provider),
    line('Platform', info.platform),
    line('OS', info.os),
    line('Host', info.hostname),
    line('Account', info.username),
    line('Sessions', info.sessions),
    line('Attachments', info.attachments),
    line('Bytes', info.bytes),
    line('App', info.app),
    line('Time', info.time),
  ].filter(Boolean).join('\n');
}

export function quotaForProvider(provider) {
  /* Gitee community is 500 MiB per repo, the paid tiers 1 GiB and up; GitHub has
   * no hard per-repo cap. The default matches the account tier seen in the field,
   * and the user can override it in settings. */
  if (provider === 'github') return 2 * 1024 * 1024 * 1024;
  return DEFAULT_QUOTA_BYTES;
}

export function userRoot(userKey) {
  return `users/${userKey}`;
}

export function headPath(userKey) {
  return `${userRoot(userKey)}/common/HEAD.json`;
}

export function manifestPath(userKey, revision) {
  return `${userRoot(userKey)}/common/manifests/${revision}.json`;
}

export function attachmentRepoPath(userKey, attachmentId) {
  const hex = String(attachmentId).replace(/^sha256:/, '');
  return `${userRoot(userKey)}/attachments/${hex.slice(0, 2)}/${hex}`;
}

export function sessionRepoPath(userKey, relPath) {
  return `${userRoot(userKey)}/${relPath}`;
}

export function isFolderHead(head) {
  return Boolean(head && Number(head.schema) >= STORAGE_VERSION && head.storage === 'folders');
}

/** Build the immutable manifest for one revision. */
export function buildManifest(options) {
  const {
    userKey,
    provider,
    device,
    revision,
    records,
    attachments,
    encrypted = false,
    encryption = null,
    createdAt = nowIso(),
  } = options;
  const sessions = records
    .map((record) => {
      const item = {
        relPath: record.relPath,
        sha256: record.sha256,
        size: Number(record.size) || 0,
        mtime: Number(record.mtimeMs) || 0,
        project: record.project || '',
      };
      /* Cached attachment ids let an unchanged session skip log decompression
       * on later pushes while still keeping the repository manifest complete. */
      if (Array.isArray(record.attachments)) item.attachments = [...record.attachments].sort();
      return item;
    })
    .sort((left, right) => left.relPath.localeCompare(right.relPath));
  const files = (attachments || [])
    .map((entry) => ({ id: String(entry.id), size: Number(entry.size) || 0 }))
    .sort((left, right) => left.id.localeCompare(right.id));
  const bytes = sessions.reduce((sum, record) => sum + record.size, 0)
    + files.reduce((sum, entry) => sum + entry.size, 0);
  return {
    schema: STORAGE_VERSION,
    storage: 'folders',
    revision,
    provider: String(provider || ''),
    userKey,
    device: {
      id: String(device?.id || ''),
      name: String(device?.name || ''),
    },
    encrypted: Boolean(encrypted),
    encryption: encryption || null,
    sessions,
    attachments: files,
    totals: {
      sessions: sessions.length,
      attachments: files.length,
      bytes,
      workspaces: new Set(sessions.map((record) => record.project).filter(Boolean)).size,
    },
    createdAt,
  };
}

/** Sessions whose content differs between two manifests. */
export function diffSessions(previous, next) {
  const before = new Map((previous?.sessions || []).map((record) => [record.relPath, record]));
  const added = [];
  const updated = [];
  const unchanged = [];
  for (const record of next.sessions) {
    const old = before.get(record.relPath);
    if (!old) added.push(record);
    else if (old.sha256 !== record.sha256) updated.push(record);
    else unchanged.push(record);
  }
  return { added, updated, unchanged };
}

function sameAttachment(previous, next) {
  const known = new Set((previous?.attachments || []).map((entry) => entry.id));
  return next.attachments.filter((entry) => !known.has(entry.id));
}

function mergeSessions(remote, local) {
  const merged = new Map();
  for (const record of remote?.sessions || []) {
    if (record && typeof record.relPath === 'string') merged.set(record.relPath, record);
  }
  for (const record of local) merged.set(record.relPath, record);
  return [...merged.values()];
}

function mergeAttachments(remote, local) {
  const merged = new Map();
  for (const entry of remote?.attachments || []) {
    if (entry && typeof entry.id === 'string') merged.set(entry.id, entry);
  }
  for (const entry of local || []) merged.set(entry.id, entry);
  return [...merged.values()];
}

/**
 * REST writer: one contents-API commit per file. Gitee has no batched write API
 * (its OpenAPI exposes only GET for /git/blobs and /git/trees), so batching has
 * to be expressed by the HEAD pointer instead.
 */
export class RestWriter {
  constructor({ client, log = null }) {
    this.kind = 'rest';
    this.client = client;
    this.log = log;
  }

  async prepare() {}

  async putFile(repoPath, buffer) {
    const meta = await this.client.getContentMeta(repoPath).catch(() => null);
    const result = await this.client.writeFileDetailed(
      repoPath,
      buffer,
      `sync ${path.posix.basename(repoPath)}`,
      { sha: meta?.sha || '' },
    );
    return result;
  }

  async deleteFile(repoPath) {
    return this.client.deleteFile(repoPath, `remove ${path.posix.basename(repoPath)}`).catch(() => false);
  }

  async publish({ manifest, head, manifestRepoPath, message, headMessage }) {
    const written = await this.client.writeFileDetailed(
      manifestRepoPath,
      Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`, 'utf8'),
      message || `manifest ${manifest.revision}`,
    );
    const nextHead = { ...head, manifestCommit: String(written.commitSha || '') };
    const headMeta = await this.client.getContentMeta(headPath(head.userKey)).catch(() => null);
    const headWrite = await this.client.writeFileDetailed(
      headPath(head.userKey),
      Buffer.from(`${JSON.stringify(nextHead, null, 2)}\n`, 'utf8'),
      headMessage || `head ${manifest.revision}`,
      { sha: headMeta?.sha || '' },
    );
    return { head: nextHead, commitSha: String(headWrite.commitSha || ''), manifestCommit: nextHead.manifestCommit };
  }

  async slim() {
    return { supported: false, reason: '当前传输方式不支持原地瘦身，请使用“备份并清空仓库”或安装 git 后重试' };
  }
}

/**
 * Git writer: keeps a shallow clone in the plugin data directory, mirrors the
 * remote tip, writes only changed files, then makes one atomic commit + push.
 * The clone makes an in-place force-push compaction possible without a re-download.
 */
export class GitWriter {
  constructor({ client, token, owner, repo, branch, dir, webBase = 'https://gitee.com', log = null }) {
    this.kind = 'git';
    this.client = client;
    this.token = String(token || '');
    this.owner = String(owner || '');
    this.repo = String(repo || '');
    this.branch = String(branch || 'master');
    this.dir = dir;
    this.webBase = String(webBase || 'https://gitee.com').replace(/\/+$/, '');
    this.log = log;
    this.ready = false;
  }

  env() {
    const basic = Buffer.from(`${this.owner}:${this.token}`).toString('base64');
    return {
      ...process.env,
      GIT_TERMINAL_PROMPT: '0',
      /* Abort a stalled transfer instead of holding the sync for minutes. */
      GIT_HTTP_LOW_SPEED_LIMIT: '1024',
      GIT_HTTP_LOW_SPEED_TIME: '30',
      GIT_CONFIG_COUNT: '1',
      GIT_CONFIG_KEY_0: 'http.extraHeader',
      GIT_CONFIG_VALUE_0: `Authorization: Basic ${basic}`,
    };
  }

  async git(args, options = {}) {
    const { stdout } = await run('git', [
      '-c', 'core.longpaths=true',
      '-c', 'core.autocrlf=false',
      '-c', 'core.quotepath=false',
      ...args,
    ], {
      cwd: this.dir,
      env: this.env(),
      timeout: options.timeout ?? 180_000,
      maxBuffer: 32 * 1024 * 1024,
      windowsHide: true,
    });
    return String(stdout || '');
  }

  url() {
    return this.owner && this.repo ? `${this.webBase}/${this.owner}/${this.repo}.git` : '';
  }

  async prepare() {
    await ensureDir(path.dirname(this.dir));
    let cloned = false;
    try {
      await stat(path.join(this.dir, '.git'));
      cloned = true;
    } catch {
      cloned = false;
    }
    if (!cloned) {
      await run('git', ['clone', '--depth', '1', '--single-branch', '--no-tags', this.url(), this.dir], {
        env: this.env(),
        timeout: 180_000,
        maxBuffer: 32 * 1024 * 1024,
        windowsHide: true,
      });
      this.ready = true;
      return;
    }
    try {
      await this.git(['fetch', '--depth', '1', 'origin', this.branch]);
      await this.git(['reset', '--hard', 'FETCH_HEAD']);
    } catch (error) {
      /* A missing remote branch (fresh empty repo) is fine; anything else is not. */
      const text = String(error?.stderr || error?.message || '');
      if (!/couldn't find remote ref|could not find remote ref|unknown revision/i.test(text)) throw error;
    }
    this.ready = true;
  }

  async putFile(repoPath, buffer) {
    await writeJsonIfDirectory(path.join(this.dir, repoPath), buffer);
    return { commitSha: '' };
  }

  async deleteFile(repoPath) {
    try {
      await this.git(['rm', '--quiet', '--', repoPath]);
    } catch {
      /* not tracked */
    }
    return true;
  }

  async publish({ manifest, head, manifestRepoPath, message, headMessage, author = null }) {
    await writeJsonIfDirectory(path.join(this.dir, manifestRepoPath), Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`, 'utf8'));
    const headFile = path.join(this.dir, headPath(head.userKey));
    await writeJsonIfDirectory(headFile, Buffer.from(`${JSON.stringify(head, null, 2)}\n`, 'utf8'));
    await this.git(['add', '-A']);
    const status = await this.git(['status', '--porcelain']);
    if (!status.trim()) return { head, commitSha: '', noop: true };
    await this.git([...this.authorArgs(author), 'commit', '-q', '-m', message || `sync ${manifest.revision}`]);
    const localSha = (await this.git(['rev-parse', 'HEAD'])).trim();
    await this.git(['push', '-q', 'origin', `HEAD:${this.branch}`], { timeout: 600_000 });
    const nextHead = { ...head, manifestCommit: localSha };
    await writeJsonIfDirectory(headFile, Buffer.from(`${JSON.stringify(nextHead, null, 2)}\n`, 'utf8'));
    await this.git(['add', '-A']);
    const dirty = await this.git(['status', '--porcelain']);
    if (dirty.trim()) {
      await this.git([...this.authorArgs(author), 'commit', '-q', '-m', headMessage || `head ${manifest.revision}`]);
      await this.git(['push', '-q', 'origin', `HEAD:${this.branch}`], { timeout: 600_000 });
    }
    return { head: nextHead, commitSha: localSha, manifestCommit: localSha };
  }

  authorArgs(author) {
    const name = String(author?.name || '').replace(/[\r\n]+/g, ' ').trim();
    const email = String(author?.email || '').replace(/[\s\r\n]+/g, '').trim();
    if (!name) return [];
    return ['-c', `user.name=${name}`, '-c', `user.email=${email || 'sync@localhost'}`];
  }

  async remoteSha() {
    const out = await this.git(['ls-remote', 'origin', `refs/heads/${this.branch}`]);
    const line = String(out || '').trim().split(/\r?\n/)[0] || '';
    return line.split(/\s+/)[0] || '';
  }

  /**
   * Replace the branch with a single parent-less commit holding the current tree.
   * Only history is dropped; the working tree (checked out before the orphan flip)
   * is preserved byte for byte.
   */
  async slim(options = {}) {
    await this.prepare();
    const sha = await this.remoteSha();
    await this.git(['checkout', '--orphan', `slim-${Date.now()}`]);
    await this.git(['add', '-A']);
    await this.git([...this.authorArgs(options.author), 'commit', '-q', '-m', options.message || 'compact: keep current snapshot']);
    const args = ['push', '-q'];
    if (sha) args.push(`--force-with-lease=${this.branch}:${sha}`);
    else args.push('--force');
    args.push('origin', `HEAD:${this.branch}`);
    await this.git(args);
    const after = (await this.git(['rev-parse', 'HEAD'])).trim();
    return { supported: true, commitSha: after, previous: sha };
  }
}

async function writeJsonIfDirectory(absolute, buffer) {
  await ensureDir(path.dirname(absolute));
  const { writeFile } = await import('node:fs/promises');
  await writeFile(absolute, buffer);
}

/** Is a usable git available on this machine? */
export async function detectGit() {
  try {
    const { stdout } = await run('git', ['--version'], { timeout: 5000, windowsHide: true });
    const match = /git version (\d+)\.(\d+)/i.exec(String(stdout || ''));
    if (!match) return { available: false, version: '' };
    return { available: true, version: `${match[1]}.${match[2]}` };
  } catch {
    return { available: false, version: '' };
  }
}

/**
 * Orchestrates reads (always REST, pinned to a commit) and writes (REST or git).
 */
export class FolderStore {
  constructor(options) {
    this.client = options.client;
    this.userKey = options.userKey;
    this.sessionsRoot = options.sessionsRoot;
    this.attachmentsRoot = options.attachmentsRoot || null;
    this.device = options.device;
    this.provider = options.provider;
    this.writer = options.writer;
    this.warn = options.warn || (() => {});
  }

  async readHead() {
    const head = await this.client.readJson(headPath(this.userKey)).catch(() => null);
    return isFolderHead(head) ? head : null;
  }

  async readManifest(head = null) {
    const current = head || await this.readHead();
    if (!current?.manifest) return null;
    const ref = current.manifestCommit || current.branch || undefined;
    const data = await this.client.getFile(current.manifest, ref).catch(() => null);
    if (!data) return null;
    try {
      return JSON.parse(data.buffer.toString('utf8'));
    } catch {
      return null;
    }
  }

  async scan() {
    const scanned = await scanSessions(this.sessionsRoot);
    return scanned;
  }

  async check() {
    const head = await this.readHead();
    if (!head) return { empty: true, head: null, manifest: null };
    const manifest = await this.readManifest(head);
    const scanned = await this.scan();
    const local = new Map(scanned.records.map((record) => [record.relPath, record.sha256]));
    let changed = 0;
    let missing = 0;
    for (const record of manifest?.sessions || []) {
      if (!local.has(record.relPath)) missing += 1;
      else if (local.get(record.relPath) !== record.sha256) changed += 1;
    }
    const remoteOnly = (manifest?.sessions || []).length;
    const localExtra = scanned.records.filter((record) => !(manifest?.sessions || []).some((item) => item.relPath === record.relPath)).length;
    return {
      empty: false,
      head,
      manifest,
      localChanged: changed,
      localMissing: missing,
      localExtra,
      remoteSessions: remoteOnly,
      upToDate: changed === 0 && missing === 0 && localExtra === 0,
    };
  }

  /**
   * Upload only changed sessions, then publish manifest + HEAD.
   * @param {{revision: string, message?: string}} options
   */
  async push(options) {
    const debug = (...args) => { if (process.env.DSH_STORE_DEBUG) console.error('[store]', ...args); };
    const revision = String(options.revision || '');
    const writer = this.writer;
    debug('push begin', revision, writer.kind);
    await writer.prepare();
    debug('prepared');

    const remoteHead = await this.readHead();
    const remoteManifest = remoteHead ? await this.readManifest(remoteHead) : null;
    debug('remote', remoteHead?.revision || 'none');
    const scanned = await this.scan();
    debug('scanned', scanned.records.length);
    const diff = diffSessions(remoteManifest, buildManifest({
      userKey: this.userKey,
      provider: this.provider,
      device: this.device,
      revision,
      records: scanned.records,
      attachments: [],
    }));

    const changes = [...diff.added, ...diff.updated];
    const scannedByPath = new Map(scanned.records.map((record) => [record.relPath, record]));
    const uploaded = { sessions: 0, attachments: 0, bytes: 0 };

    for (const record of changes) {
      const full = scannedByPath.get(record.relPath);
      if (!full) continue;
      const buffer = await readSessionRecord(this.sessionsRoot, full);
      await writer.putFile(sessionRepoPath(this.userKey, record.relPath), buffer);
      uploaded.sessions += 1;
      uploaded.bytes += buffer.length;
    }

    /* Walk every local session once to learn which attachments it references.
     * Unchanged sessions reuse the ids cached in the remote manifest (schema 3),
     * so only changed logs are decompressed after the first push; repositories
     * written before that cache existed are backfilled on the next push. */
    const attachmentsById = new Map(
      (remoteManifest?.attachments || []).map((entry) => [entry.id, entry]),
    );
    const idsBySession = new Map();
    const remoteById = new Map((remoteManifest?.sessions || []).map((record) => [record.relPath, record]));
    const missingIds = new Set();
    if (this.attachmentsRoot) {
      for (const record of scanned.records) {
        const remoteRecord = remoteById.get(record.relPath);
        if (remoteRecord && remoteRecord.sha256 === record.sha256 && Array.isArray(remoteRecord.attachments)) {
          idsBySession.set(record.relPath, remoteRecord.attachments);
          continue;
        }
        let buffer;
        try {
          buffer = await readSessionRecord(this.sessionsRoot, record);
        } catch {
          continue;
        }
        const decoded = readSessionRecords(buffer);
        if (!decoded.ok) continue;
        const ids = collectAttachmentIds(decoded.records);
        idsBySession.set(record.relPath, ids);
        for (const id of ids) {
          if (attachmentsById.has(id)) continue;
          let target;
          try {
            target = attachmentObjectPath(this.attachmentsRoot, id);
          } catch {
            continue;
          }
          const info = await stat(target).catch(() => null);
          if (!info || !info.isFile()) {
            missingIds.add(id);
            continue;
          }
          attachmentsById.set(id, { id, size: info.size });
        }
      }
    }
    const knownIds = new Set((remoteManifest?.attachments || []).map((entry) => entry.id));
    const newAttachments = [...attachmentsById.values()].filter((entry) => !knownIds.has(entry.id));
    for (const entry of newAttachments) {
      if (!this.attachmentsRoot) break;
      const target = attachmentObjectPath(this.attachmentsRoot, entry.id);
      const data = await readFile(target);
      await writer.putFile(attachmentRepoPath(this.userKey, entry.id), data);
      uploaded.attachments += 1;
      uploaded.bytes += data.length;
    }

    const enriched = scanned.records.map((record) => ({
      ...record,
      attachments: idsBySession.get(record.relPath) || [],
    }));
    const mergedSessions = mergeSessions(remoteManifest, enriched);
    const mergedAttachments = mergeAttachments(remoteManifest, [...attachmentsById.values()]);
    const manifest = buildManifest({
      userKey: this.userKey,
      provider: this.provider,
      device: this.device,
      revision,
      records: mergedSessions,
      attachments: mergedAttachments,
      encrypted: Boolean(options.encrypted),
      encryption: options.encryption || null,
    });
    const mPath = manifestPath(this.userKey, revision);
    const head = {
      schema: STORAGE_VERSION,
      storage: 'folders',
      revision,
      userKey: this.userKey,
      manifest: mPath,
      manifestCommit: '',
      sessions: manifest.totals.sessions,
      attachments: manifest.totals.attachments,
      bytes: manifest.totals.bytes,
      workspaces: manifest.totals.workspaces,
      encrypted: manifest.encrypted,
      updatedAt: nowIso(),
      updatedBy: {
        deviceId: this.device?.id || '',
        deviceName: this.device?.name || '',
      },
    };
    const trailer = options.includeLocalInfo === false
      ? ''
      : formatLocalInfo({
        ...(options.localInfo || {}),
        sessions: manifest.totals.sessions,
        attachments: manifest.totals.attachments,
        bytes: manifest.totals.bytes,
      });
    const message = trailer ? `sync ${revision}\n\n${trailer}` : `sync ${revision}`;
    const headMessage = trailer ? `head ${revision}\n\n${trailer}` : `head ${revision}`;
    const author = options.includeLocalInfo === false ? null : (options.author || null);
    const published = await writer.publish({ manifest, head, manifestRepoPath: mPath, message, headMessage, author });
    return {
      head: published.head || head,
      manifest,
      uploaded,
      missingAttachments: [...missingIds],
      noop: uploaded.sessions === 0 && uploaded.attachments === 0,
      manifestCommit: published.manifestCommit || '',
      commitMessage: message,
    };
  }

  /** Download only sessions/attachments that differ, then apply them locally. */
  async pull(options = {}) {
    const { applySessionFiles, applyAttachments, repairSessionAttachments } = await import('./sessions.js');
    const head = await this.readHead();
    if (!head) throw Object.assign(new Error('仓库里还没有可拉取的同步数据'), { code: 'empty' });
    const manifest = await this.readManifest(head);
    if (!manifest) throw Object.assign(new Error('仓库清单缺失或损坏'), { code: 'manifest' });
    const ref = head.manifestCommit || undefined;
    const scanned = await this.scan();
    const localSha = new Map(scanned.records.map((record) => [record.relPath, record.sha256]));
    const files = new Map();
    let downloaded = 0;
    for (const record of manifest.sessions) {
      if (localSha.get(record.relPath) === record.sha256) continue;
      const buffer = await this.client.readFileAt(sessionRepoPath(this.userKey, record.relPath), ref);
      if (!buffer) continue;
      if (sha256(buffer) !== record.sha256) {
        throw Object.assign(new Error(`文件校验失败：${record.relPath}`), { code: 'checksum' });
      }
      files.set(record.relPath, buffer);
      downloaded += 1;
    }

    const live = options.liveIds || new Set();
    const applied = await applySessionFiles({
      sessionsRoot: this.sessionsRoot,
      files,
      manifest,
      liveIds: live,
      backupRoot: options.backupRoot,
      allowOverwrite: true,
      forceOverwrite: options.mode === 'force',
    });

    const attachmentFiles = new Map();
    if (this.attachmentsRoot) {
      for (const entry of manifest.attachments || []) {
        const id = String(entry.id);
        let target;
        try {
          target = attachmentObjectPath(this.attachmentsRoot, id);
        } catch {
          continue;
        }
        const info = await stat(target).catch(() => null);
        if (info && info.isFile() && info.size === Number(entry.size)) continue;
        const buffer = await this.client.readFileAt(attachmentRepoPath(this.userKey, id), ref);
        if (!buffer) continue;
        attachmentFiles.set(id, buffer);
      }
    }
    const attachmentsResult = attachmentFiles.size > 0 && this.attachmentsRoot
      ? await applyAttachments({ objectsRoot: this.attachmentsRoot, attachments: attachmentFiles })
      : { written: 0, skipped: 0 };
    const repair = this.attachmentsRoot
      ? await repairSessionAttachments({
        sessionsRoot: this.sessionsRoot,
        objectsRoot: this.attachmentsRoot,
        backupRoot: options.backupRoot,
        relativePaths: manifest.sessions.map((record) => record.relPath),
        availableIds: new Set([...(manifest.attachments || []).map((entry) => entry.id), ...attachmentFiles.keys()]),
      })
      : { replaced: [] };

    return {
      head,
      manifest,
      downloaded,
      attachments: attachmentsResult,
      repairedAttachments: repair.replaced || [],
      applied,
    };
  }
}

export async function listFolderHeads(client, userKey) {
  return client.readJson(headPath(userKey)).catch(() => null);
}
