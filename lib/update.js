/**
 * Self-update from the public Gitee repository.
 *
 * Only a fixed allow-list of package files is downloaded. The current running
 * process keeps its imported modules; a host code change therefore asks the
 * user to restart DSH, while a client-only change can be picked up by reloading
 * the page.
 */
import { readFile, rename, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { BundleError } from './bundle.js';

export const PACKAGE_NAME = 'dsh-chat-syncer';
export const GITEE_OWNER = 'user_gitee';
// The Gitee repository keeps its original name; only the package was renamed.
export const GITEE_REPO = 'dsh-chat-sync';
export const GITEE_REPO_URL = `https://gitee.com/${GITEE_OWNER}/${GITEE_REPO}`;
const BRANCHES = ['master', 'main'];
const REQUEST_TIMEOUT_MS = 30_000;
const MAX_FILE_BYTES = 5 * 1024 * 1024;
const PACKAGE_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const UPDATE_FILES = [
  'package.json',
  'index.js',
  'client.js',
  'cordis.patch.yml',
  'icon.svg',
  'lib/agreement.js',
  'lib/bundle.js',
  'lib/crypto.js',
  'lib/provider.js',
  'lib/service.js',
  'lib/sessions.js',
  'lib/tar.js',
  'lib/update.js',
  'lib/util.js',
];

function messageOf(error) {
  return error instanceof Error ? error.message : String(error);
}

function normalizeVersion(value) {
  const raw = String(value ?? '').trim().replace(/^v/i, '');
  return raw.split('-')[0].split('.').map((part) => {
    const number = Number.parseInt(part, 10);
    return Number.isFinite(number) ? number : 0;
  });
}

export function compareVersions(left, right) {
  const a = normalizeVersion(left);
  const b = normalizeVersion(right);
  const length = Math.max(a.length, b.length, 3);
  for (let index = 0; index < length; index += 1) {
    const delta = (a[index] || 0) - (b[index] || 0);
    if (delta !== 0) return delta > 0 ? 1 : -1;
  }
  return 0;
}

async function readLocalPackage() {
  try {
    return JSON.parse(await readFile(path.join(PACKAGE_ROOT, 'package.json'), 'utf8'));
  } catch (error) {
    /* The self-updater reads the running package from disk. If the directory
     * was removed (uninstalled while DSH kept running) the raw ENOENT is
     * meaningless to the user, so report what actually happened. */
    if (error && error.code === 'ENOENT') {
      throw new BundleError('插件目录已被移除（可能已卸载）。请重新安装插件后再检查更新。', 'plugin-missing');
    }
    throw error;
  }
}

async function fetchRaw(branch, filePath) {
  const encoded = filePath.split('/').map((part) => encodeURIComponent(part)).join('/');
  const url = `https://gitee.com/${GITEE_OWNER}/${GITEE_REPO}/raw/${encodeURIComponent(branch)}/${encoded}`;
  const response = await fetch(url, {
    headers: { 'user-agent': 'dsh-chat-syncer-updater' },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    redirect: 'follow',
  });
  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`Gitee 更新接口返回 ${response.status}`);
  }
  const length = Number(response.headers.get('content-length') || 0);
  if (length > MAX_FILE_BYTES) throw new Error(`${filePath} 超过 5 MB 更新限制`);
  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.length > MAX_FILE_BYTES) throw new Error(`${filePath} 超过 5 MB 更新限制`);
  return buffer;
}

async function fetchLatestPackage() {
  let lastError = null;
  for (const branch of BRANCHES) {
    try {
      const raw = await fetchRaw(branch, 'package.json');
      if (!raw) continue;
      const latest = JSON.parse(raw.toString('utf8'));
      if (latest.name !== PACKAGE_NAME) {
        throw new Error(`Gitee 仓库里的包名是 ${String(latest.name)}，不是 ${PACKAGE_NAME}`);
      }
      if (typeof latest.version !== 'string' || !latest.version.trim()) {
        throw new Error('Gitee 仓库里的 package.json 没有版本号');
      }
      return { branch, latest, raw };
    } catch (error) {
      lastError = error;
    }
  }
  throw new Error(lastError ? messageOf(lastError) : '无法读取 Gitee 更新仓库');
}

/**
 * Check the public Gitee repository for a newer package version.
 * @returns {Promise<object>}
 */
export async function checkForUpdate() {
  const [local, remote] = await Promise.all([readLocalPackage(), fetchLatestPackage()]);
  return {
    ok: true,
    currentVersion: local.version,
    latestVersion: remote.latest.version,
    available: compareVersions(remote.latest.version, local.version) > 0,
    branch: remote.branch,
    repoUrl: GITEE_REPO_URL,
  };
}

function safeTarget(relativePath) {
  const target = path.resolve(PACKAGE_ROOT, relativePath);
  const relative = path.relative(PACKAGE_ROOT, target);
  if (relative === '' || relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(`拒绝写入插件目录以外的文件：${relativePath}`);
  }
  return target;
}

/**
 * Download and atomically replace the known runtime files.
 * @param {string} requestedVersion - version shown to the user before applying
 */
export async function applyUpdate(requestedVersion = '') {
  const remote = await fetchLatestPackage();
  const local = await readLocalPackage();
  if (requestedVersion && requestedVersion !== remote.latest.version) {
    throw new Error(`仓库版本已从 ${requestedVersion} 变为 ${remote.latest.version}，请重新检查更新`);
  }
  if (compareVersions(remote.latest.version, local.version) <= 0) {
    return {
      ok: true,
      applied: false,
      currentVersion: local.version,
      latestVersion: remote.latest.version,
      available: false,
      repoUrl: GITEE_REPO_URL,
    };
  }

  const payload = new Map();
  for (const filePath of UPDATE_FILES) {
    const bytes = await fetchRaw(remote.branch, filePath);
    if (!bytes) {
      if (filePath === 'icon.svg') continue;
      throw new Error(`Gitee 仓库缺少更新文件：${filePath}`);
    }
    payload.set(filePath, bytes);
  }

  const clientBytes = payload.get('client.js');
  if (!clientBytes || !clientBytes.toString('utf8').includes('window.__ModuleLoader__.load')
    || !clientBytes.toString('utf8').includes(PACKAGE_NAME)) {
    throw new Error('远端 client.js 不是有效的 dsh-chat-syncer 客户端包');
  }
  const indexBytes = payload.get('index.js');
  if (!indexBytes || !indexBytes.toString('utf8').includes('export function apply')) {
    throw new Error('远端 index.js 不是有效的 Host 入口');
  }
  const patchBytes = payload.get('cordis.patch.yml');
  if (!patchBytes || !patchBytes.toString('utf8').includes(PACKAGE_NAME)) {
    throw new Error('远端 cordis.patch.yml 不包含插件名');
  }

  const backups = new Map();
  const changed = [];
  try {
    for (const [filePath, bytes] of payload) {
      const target = safeTarget(filePath);
      let previous = null;
      try {
        previous = await readFile(target);
      } catch (error) {
        if (!error || error.code !== 'ENOENT') throw error;
      }
      backups.set(filePath, previous);
      if (previous && previous.equals(bytes)) continue;
      const temporary = `${target}.${process.pid}.update.tmp`;
      await writeFile(temporary, bytes);
      await rename(temporary, target);
      changed.push(filePath);
    }
  } catch (error) {
    for (const filePath of changed.reverse()) {
      const target = safeTarget(filePath);
      const previous = backups.get(filePath);
      try {
        if (previous === null) await unlink(target);
        else await writeFile(target, previous);
      } catch {
        /* Best-effort rollback; the original error is more useful. */
      }
    }
    throw error;
  }

  const hostChanged = changed.some((filePath) => filePath === 'index.js'
    || filePath === 'package.json'
    || filePath === 'cordis.patch.yml'
    || filePath.startsWith('lib/'));
  return {
    ok: true,
    applied: changed.length > 0,
    currentVersion: remote.latest.version,
    latestVersion: remote.latest.version,
    available: false,
    files: changed,
    restartRequired: hostChanged,
    repoUrl: GITEE_REPO_URL,
  };
}
