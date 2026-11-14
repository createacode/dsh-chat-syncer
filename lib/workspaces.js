/**
 * Sidebar membership after a pull.
 *
 * DSH groups sessions by the `cwd` recorded in each session header, and that
 * grouping lives in a durable workspace registry that is bootstrapped exactly
 * once. Copying session files therefore makes them readable but invisible: the
 * sidebar lists a workspace's members, so a session that belongs to no
 * workspace never appears.
 *
 * This module asks the live registry to create (or reuse) the workspace for
 * every restored cwd and to attach the restored sessions. A cwd whose folder is
 * gone is recreated first (`mkdir -p`), so a pull on a fresh machine lands in
 * the same place; creation can be disabled and refused for protected paths.
 * Everything is optional: a profile without a workspace registry (headless,
 * SDK) degrades to `available: false` and the pull result still stands.
 */
import { mkdir, readFile, rename, stat } from 'node:fs/promises';
import path from 'node:path';
import { messageOf } from './util.js';

/**
 * Paths a remote manifest must never bring into existence: a bare drive root
 * and the system directories Windows and other installers own.
 */
const PROTECTED_PREFIXES = (() => {
  const env = process.env;
  const windows = env.SystemRoot || env.windir || 'C:\\Windows';
  const candidates = [
    windows,
    env.ProgramFiles,
    env['ProgramFiles(x86)'],
    env.ProgramData,
  ].filter((value) => typeof value === 'string' && value.trim());
  return candidates.map((value) => path.resolve(value).toLowerCase());
})();

/**
 * Whether a workspace folder may be created for this path.
 *
 * The path comes from a synced session header, so it is remote data driving a
 * local write. Absolute, non-root, non-system paths only.
 * @param {string} target
 * @returns {boolean}
 */
export function isCreatableWorkspacePath(target) {
  const text = String(target ?? '').trim();
  if (!text || !path.isAbsolute(text) || text.includes('\0')) return false;
  const resolved = path.resolve(text);
  if (path.parse(resolved).root === resolved) return false;
  const lower = resolved.toLowerCase();
  return !PROTECTED_PREFIXES.some((prefix) => lower === prefix || lower.startsWith(`${prefix}${path.sep}`));
}

/**
 * Create a workspace folder and confirm it is a directory afterwards.
 * @param {string} target
 * @returns {Promise<boolean>}
 */
export async function ensureDirectory(target) {
  await mkdir(target, { recursive: true });
  return (await stat(target)).isDirectory();
}

/**
 * Group sessions by their recorded working directory.
 * @param {{sessionId: string, cwd: string}[]} entries
 * @returns {Map<string, string[]>} cwd -> unique session ids
 */
export function groupByWorkspace(entries = []) {
  const groups = new Map();
  for (const entry of entries) {
    const sessionId = typeof entry?.sessionId === 'string' ? entry.sessionId.trim() : '';
    const cwd = typeof entry?.cwd === 'string' ? entry.cwd.trim() : '';
    if (!sessionId || !cwd) continue;
    const known = groups.get(cwd);
    if (known === undefined) groups.set(cwd, [sessionId]);
    else if (!known.includes(sessionId)) known.push(sessionId);
  }
  return groups;
}

/**
 * Whether a workspace folder exists locally. A session whose folder is gone
 * cannot be placed: DSH validates the header cwd against a real directory.
 * @param {string} target
 * @returns {Promise<boolean>}
 */
export async function directoryExists(target) {
  try {
    return (await stat(target)).isDirectory();
  } catch {
    return false;
  }
}

/**
 * Create or reuse the workspace for each cwd and attach its sessions.
 *
 * A missing folder is recreated when `createDirectories` is on (the default)
 * and the path passes {@link isCreatableWorkspacePath}. Failures are per
 * session, never fatal: a registry that rejects one cwd still gets the rest,
 * and the caller receives enough detail to offer a repair.
 *
 * @param {object} options
 * @param {object|null} options.registry DSH workspace registry (`create`, entities)
 * @param {{sessionId: string, cwd: string}[]} [options.entries]
 * @param {boolean} [options.createDirectories]
 * @param {(path: string) => Promise<boolean>} [options.checkDirectory]
 * @param {(path: string) => Promise<boolean>} [options.makeDirectory]
 * @returns {Promise<{
 *   available: boolean,
 *   attached: number,
 *   already: number,
 *   created: {path: string, sessionIds: string[]}[],
 *   missing: {path: string, sessionIds: string[]}[],
 *   failed: {path: string, sessionId: string, reason: string}[],
 *   unreadable: number,
 *   error?: string,
 * }>}
 */
export async function reconcileWorkspaces(options = {}) {
  const {
    registry,
    entries = [],
    createDirectories = true,
    checkDirectory = directoryExists,
    makeDirectory = ensureDirectory,
  } = options;
  const report = {
    available: false,
    attached: 0,
    already: 0,
    created: [],
    missing: [],
    failed: [],
    unreadable: 0,
  };
  if (!registry || typeof registry.create !== 'function') return report;
  report.available = true;

  for (const [cwd, sessionIds] of groupByWorkspace(entries)) {
    if (!(await checkDirectory(cwd))) {
      if (!createDirectories || !isCreatableWorkspacePath(cwd)) {
        report.missing.push({ path: cwd, sessionIds });
        continue;
      }
      try {
        await makeDirectory(cwd);
      } catch (error) {
        for (const sessionId of sessionIds) {
          report.failed.push({ path: cwd, sessionId, reason: `无法创建工作区目录：${messageOf(error)}` });
        }
        continue;
      }
      report.created.push({ path: cwd, sessionIds });
    }
    let workspace;
    try {
      workspace = await registry.create(cwd);
    } catch (error) {
      for (const sessionId of sessionIds) {
        report.failed.push({ path: cwd, sessionId, reason: messageOf(error) });
      }
      continue;
    }
    for (const sessionId of sessionIds) {
      try {
        if (Array.isArray(workspace?.sessionIds) && workspace.sessionIds.includes(sessionId)) {
          report.already += 1;
          continue;
        }
        await workspace.attachSession(sessionId);
        report.attached += 1;
      } catch (error) {
        report.failed.push({ path: cwd, sessionId, reason: messageOf(error) });
      }
    }
  }
  return report;
}

/**
 * The sessions a report could not place, kept for a later `workspace-repair`.
 * @param {object|null} report
 * @returns {{sessionId: string, cwd: string}[]}
 */
export function pendingEntries(report) {
  const pending = [];
  for (const item of report?.missing ?? []) {
    for (const sessionId of item.sessionIds ?? []) pending.push({ sessionId, cwd: item.path });
  }
  for (const item of report?.failed ?? []) pending.push({ sessionId: item.sessionId, cwd: item.path });
  return pending;
}

/**
 * Browser-safe projection of a reconcile report.
 *
 * Absolute workspace paths are included on purpose: the user has to know which
 * folder was created or is still missing. No session content, token, or file
 * body crosses this seam.
 *
 * @param {object|null} report
 * @returns {object|null}
 */
export function publicWorkspaceReport(report) {
  if (!report) return null;
  return {
    available: Boolean(report.available),
    attached: report.attached ?? 0,
    already: report.already ?? 0,
    unreadable: report.unreadable ?? 0,
    created: (report.created ?? []).map((item) => ({
      path: item.path,
      sessions: (item.sessionIds ?? []).length,
    })),
    missing: (report.missing ?? []).map((item) => ({
      path: item.path,
      sessions: (item.sessionIds ?? []).length,
    })),
    failed: (report.failed ?? []).map((item) => ({
      path: item.path,
      sessionId: item.sessionId,
      reason: item.reason,
    })),
  };
}

/**
 * Read the durable workspace registry that DSH keeps under `<home>/storages`.
 *
 * A session only shows up in the sidebar when the registry lists it under the
 * workspace whose path equals the session header's cwd. Copying the log file is
 * enough to make it readable, but not enough to make it visible, and a session
 * whose projection cache was built while the log was broken stays stale.
 *
 * @param {string} homeDir
 * @returns {Promise<Map<string, Set<string>>|null>} resolved lower-case cwd -> session ids
 */
export async function registrySnapshot(homeDir) {
  if (!homeDir) return null;
  let raw;
  try {
    raw = await readFile(path.join(homeDir, 'storages', 'workspace.json'), 'utf8');
  } catch {
    return null;
  }
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  const workspaces = parsed?.tables?.workspaces;
  if (!workspaces || typeof workspaces !== 'object') return null;
  const snapshot = new Map();
  for (const workspace of Object.values(workspaces)) {
    const workspacePath = typeof workspace?.path === 'string' ? workspace.path.trim() : '';
    if (!workspacePath) continue;
    const key = path.resolve(workspacePath).toLowerCase();
    const ids = Array.isArray(workspace.sessionIds) ? workspace.sessionIds.map(String) : [];
    const known = snapshot.get(key);
    if (known) for (const id of ids) known.add(id);
    else snapshot.set(key, new Set(ids));
  }
  return snapshot;
}

/**
 * Move the projection cache of the given sessions aside so DSH rebuilds it from
 * the log on the next load. A cache written while the log was unreadable keeps
 * an empty conversation on screen even after the file is repaired.
 *
 * @param {string} homeDir
 * @param {string[]} sessionIds
 * @returns {Promise<{cleared: string[], missing: string[]}>}
 */
export async function clearProjectionCache(homeDir, sessionIds = []) {
  const result = { cleared: [], missing: [] };
  if (!homeDir) return result;
  const dir = path.join(homeDir, 'storages', 'session_projcache', 'sessions');
  const stamp = Date.now();
  for (const sessionId of sessionIds) {
    const file = path.join(dir, `${sessionId}.json`);
    try {
      await stat(file);
    } catch {
      result.missing.push(sessionId);
      continue;
    }
    try {
      await rename(file, `${file}.stale-${stamp}`);
      result.cleared.push(sessionId);
    } catch {
      result.missing.push(sessionId);
    }
  }
  return result;
}
