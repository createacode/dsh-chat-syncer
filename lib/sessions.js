/**
 * Discovery and import of DSH session-log files.
 *
 * The plugin does not interpret conversation payloads. It moves the same
 * versioned JSONL/Zstandard artifacts DSH already owns, which keeps the
 * backend's own format validation and migration path in charge.
 */
import { createHash } from 'node:crypto';
import { copyFile, lstat, readdir, readFile, rename, stat, utimes, writeFile } from 'node:fs/promises';
import path from 'node:path';
import zlib from 'node:zlib';
import {
  MAX_FILE_BYTES,
  ensureDir,
  nowIso,
  resolveInside,
  sha256,
} from './util.js';

const SESSION_FILE = /^session(?:\.v\d+)?\.jsonl(?:\.zstd)?$/i;
const SKIP_DIRECTORIES = new Set(['backups', 'exports', 'imports', 'tmp', '.git', 'node_modules']);

/* Zstandard frame magic, little endian: DSH stores v4 logs this way. */
const ZSTD_MAGIC = 0xfd2fb528;
const MAX_HEADER_BYTES = 64 * 1024 * 1024;

/**
 * Read the first JSONL record of a stored session log.
 *
 * That record carries the session id and the working directory DSH groups
 * sessions by, which is what a receiver needs to place a restored session in
 * the sidebar. Plain JSONL and Zstandard containers are understood; anything
 * else returns null so callers can report the session as unreadable instead of
 * guessing a workspace.
 *
 * @param {Buffer} data
 * @returns {{id: string, cwd: string, createdAt: number|null}|null}
 */
export function parseSessionHeader(data) {
  if (!Buffer.isBuffer(data) || data.length === 0 || data.length > MAX_HEADER_BYTES) return null;
  let text;
  try {
    if (data.length >= 4 && data.readUInt32LE(0) === ZSTD_MAGIC) {
      if (typeof zlib.zstdDecompressSync !== 'function') return null;
      text = zlib.zstdDecompressSync(data).toString('utf8');
    } else {
      text = data.toString('utf8');
    }
  } catch {
    return null;
  }
  const newline = text.indexOf('\n');
  const line = (newline === -1 ? text : text.slice(0, newline)).trim();
  if (!line) return null;
  let header;
  try {
    header = JSON.parse(line);
  } catch {
    return null;
  }
  if (!header || typeof header !== 'object') return null;
  const id = typeof header.id === 'string' ? header.id : '';
  const cwd = typeof header.cwd === 'string' ? header.cwd : '';
  if (!id || !cwd) return null;
  const createdAt = Number(header.createdAt);
  return { id, cwd, createdAt: Number.isFinite(createdAt) ? createdAt : null };
}

function assertComponent(value, label) {
  const text = String(value ?? '');
  if (!text || text === '.' || text === '..' || text.includes('/') || text.includes('\\') || text.includes('\0')) {
    throw new Error(`${label} 路径不安全：${text}`);
  }
  return text;
}

/**
 * Enumerate `<root>/<project>/<session>/session*.jsonl[.zstd]`.
 * @param {string} root
 * @returns {Promise<{records: object[], totalBytes: number, workspaces: number}>}
 */
export async function scanSessions(root) {
  const records = [];
  let totalBytes = 0;
  let workspaces = 0;

  let projects;
  try {
    projects = await readdir(root, { withFileTypes: true });
  } catch (error) {
    if (error && error.code === 'ENOENT') return { records, totalBytes, workspaces };
    throw error;
  }

  for (const projectEntry of projects) {
    if (!projectEntry.isDirectory() || projectEntry.isSymbolicLink()) continue;
    if (SKIP_DIRECTORIES.has(projectEntry.name)) continue;
    const projectDir = path.join(root, projectEntry.name);
    let sessions;
    try {
      sessions = await readdir(projectDir, { withFileTypes: true });
    } catch {
      continue;
    }
    let projectHasSession = false;
    for (const sessionEntry of sessions) {
      if (!sessionEntry.isDirectory() || sessionEntry.isSymbolicLink()) continue;
      const sessionDir = path.join(projectDir, sessionEntry.name);
      let entries;
      try {
        entries = await readdir(sessionDir, { withFileTypes: true });
      } catch {
        continue;
      }
      for (const entry of entries) {
        if (!entry.isFile() || entry.isSymbolicLink()) continue;
        if (!SESSION_FILE.test(entry.name)) continue;
        const absolute = path.join(sessionDir, entry.name);
        let info;
        try {
          info = await lstat(absolute);
        } catch {
          continue;
        }
        if (!info.isFile() || info.size < 0 || info.size > MAX_FILE_BYTES) continue;
        let data;
        try {
          data = await readFile(absolute);
        } catch {
          continue;
        }
        const digest = createHash('sha256').update(data).digest('hex');
        const relPath = `sessions/${projectEntry.name}/${sessionEntry.name}/${entry.name}`;
        records.push({
          project: projectEntry.name,
          id: sessionEntry.name,
          file: entry.name,
          relPath,
          size: data.length,
          mtimeMs: info.mtimeMs,
          updatedAt: new Date(info.mtimeMs).toISOString(),
          sha256: digest,
        });
        totalBytes += data.length;
        projectHasSession = true;
      }
    }
    if (projectHasSession) workspaces += 1;
  }

  records.sort((left, right) => left.relPath.localeCompare(right.relPath));
  return { records, totalBytes, workspaces };
}

/**
 * Read one session file from disk, re-checking the path shape.
 * @param {string} root
 * @param {{project: string, id: string, file: string}} record
 * @returns {Promise<Buffer>}
 */
export async function readSessionRecord(root, record) {
  const project = assertComponent(record.project, 'project');
  const id = assertComponent(record.id, 'session id');
  const file = assertComponent(record.file, 'session file');
  if (!SESSION_FILE.test(file)) throw new Error(`不是会话文件：${file}`);
  const absolute = resolveInside(root, `${project}/${id}/${file}`);
  const info = await stat(absolute);
  if (!info.isFile()) throw new Error(`会话路径不是文件：${record.relPath}`);
  if (info.size > MAX_FILE_BYTES) throw new Error(`会话文件过大：${record.relPath}`);
  return readFile(absolute);
}

/**
 * Write imported session files. Existing, newer local logs are never clobbered
 * unless `allowOverwrite` is explicitly requested; the caller still receives a
 * conflict report either way.
 */
export async function applySessionFiles(options) {
  const {
    sessionsRoot,
    files,
    manifest,
    liveIds = new Set(),
    backupRoot,
    allowOverwrite = true,
    forceOverwrite = false,
  } = options;
  await ensureDir(sessionsRoot);
  const byPath = new Map();
  for (const record of manifest?.sessions ?? []) {
    if (record && typeof record.relPath === 'string') byPath.set(record.relPath, record);
  }

  const result = {
    added: 0,
    updated: 0,
    unchanged: 0,
    skipped: 0,
    conflicts: [],
    bytes: 0,
    backups: 0,
    touched: [],
  };
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');

  for (const [relPath, data] of files) {
    if (!relPath.startsWith('sessions/')) continue;
    const parts = relPath.split('/');
    if (parts.length < 4) {
      result.skipped += 1;
      continue;
    }
    let project;
    let id;
    let file;
    try {
      project = assertComponent(parts[1], 'project');
      id = assertComponent(parts[2], 'session id');
      file = assertComponent(parts[3], 'session file');
      if (!SESSION_FILE.test(file) || parts.length !== 4) throw new Error('unexpected session path');
    } catch (error) {
      result.conflicts.push({ path: relPath, reason: error instanceof Error ? error.message : String(error) });
      continue;
    }
    if (liveIds.has(id)) {
      result.skipped += 1;
      result.conflicts.push({ path: relPath, reason: 'session is open in this DSH instance' });
      continue;
    }

    let target;
    try {
      target = resolveInside(sessionsRoot, `${project}/${id}/${file}`);
    } catch (error) {
      result.skipped += 1;
      result.conflicts.push({ path: relPath, reason: error instanceof Error ? error.message : String(error) });
      continue;
    }

    let existing = null;
    try {
      existing = await lstat(target);
    } catch (error) {
      if (!error || error.code !== 'ENOENT') {
        result.skipped += 1;
        result.conflicts.push({ path: relPath, reason: 'could not inspect existing file' });
        continue;
      }
    }

    if (existing) {
      if (!existing.isFile()) {
        result.skipped += 1;
        result.conflicts.push({ path: relPath, reason: 'target exists and is not a regular file' });
        continue;
      }
      const current = await readFile(target).catch(() => null);
      if (current && sha256(current) === sha256(data)) {
        result.unchanged += 1;
        continue;
      }
      const record = byPath.get(relPath);
      const remoteMtime = Number(record?.mtimeMs) || 0;
      if (!allowOverwrite || (!forceOverwrite && remoteMtime > 0 && remoteMtime <= existing.mtimeMs)) {
        result.skipped += 1;
        result.conflicts.push({
          path: relPath,
          reason: allowOverwrite ? 'local session is newer; kept local copy' : 'overwrite disabled',
        });
        continue;
      }
      if (backupRoot) {
        const backup = path.join(backupRoot, stamp, project, id, file);
        await ensureDir(path.dirname(backup));
        await copyFile(target, backup);
        result.backups += 1;
      }
      result.updated += 1;
    } else {
      result.added += 1;
    }

    await ensureDir(path.dirname(target));
    const temporary = `${target}.dshsync-${process.pid}-${Date.now()}.tmp`;
    await writeFile(temporary, data);
    await rename(temporary, target);
    const record = byPath.get(relPath);
    const mtime = Number(record?.mtimeMs);
    if (Number.isFinite(mtime) && mtime > 0) {
      const when = new Date(mtime);
      await utimes(target, when, when).catch(() => {});
    }
    result.bytes += data.length;
    result.touched.push(relPath);
  }

  result.touched.sort();
  return result;
}

export function createdAtLabel(record) {
  return record?.updatedAt ?? nowIso();
}

/* -------------------------------------------------------------------------- */
/* Attachment support                                                          */
/* -------------------------------------------------------------------------- */

const ZSTD_FRAME = Buffer.from([0x28, 0xb5, 0x2f, 0xfd]);

/**
 * Decode a stored session log into its JSON records.
 *
 * DSH appends one Zstandard frame per batch, so the file is a concatenation of
 * independent frames: each one is decompressed on its own. Plain JSONL is
 * understood too. A record that does not parse makes the whole decode
 * untrustworthy (`ok: false`) so callers never rewrite a log they misread.
 *
 * @param {Buffer} buffer
 * @returns {{ok: boolean, records: object[], wasZstd: boolean}}
 */
export function readSessionRecords(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) return { ok: false, records: [], wasZstd: false };
  const wasZstd = buffer.length >= 4 && buffer.readUInt32LE(0) === ZSTD_MAGIC;
  let text;
  try {
    if (!wasZstd) {
      text = buffer.toString('utf8');
    } else {
      const chunks = [];
      let position = 0;
      while (position + 4 <= buffer.length) {
        const index = buffer.indexOf(ZSTD_FRAME, position);
        if (index < 0) break;
        try {
          chunks.push(zlib.zstdDecompressSync(buffer.subarray(index)));
        } catch {
          /* A frame that is not a frame start; keep scanning. */
        }
        position = index + 1;
      }
      if (chunks.length === 0) return { ok: false, records: [], wasZstd };
      text = Buffer.concat(chunks).toString('utf8');
    }
  } catch {
    return { ok: false, records: [], wasZstd };
  }
  const records = [];
  for (const line of text.split('\n')) {
    if (!line.trim()) continue;
    try {
      records.push(JSON.parse(line));
    } catch {
      return { ok: false, records: [], wasZstd };
    }
  }
  return { ok: records.length > 0, records, wasZstd };
}

/** Re-encode records in the same container the log arrived in. */
export function writeSessionRecords(records, wasZstd) {
  const text = records.map((record) => JSON.stringify(record)).join('\n') + '\n';
  if (!wasZstd || typeof zlib.zstdCompressSync !== 'function') return Buffer.from(text, 'utf8');
  return zlib.zstdCompressSync(Buffer.from(text, 'utf8'));
}

function walkContent(value, visit) {
  if (Array.isArray(value)) {
    for (const item of value) walkContent(item, visit);
    return;
  }
  if (!value || typeof value !== 'object') return;
  visit(value);
  for (const item of Object.values(value)) walkContent(item, visit);
}

/** Every `sha256:…` attachment id referenced by a session log. */
export function collectAttachmentIds(records) {
  const ids = new Set();
  for (const record of records) {
    walkContent(record, (node) => {
      const attachment = node.attachment;
      const id = typeof node.attachmentId === 'string'
        ? node.attachmentId
        : attachment && typeof attachment === 'object' && typeof attachment.attachmentId === 'string'
          ? attachment.attachmentId
          : '';
      if (id.startsWith('sha256:')) ids.add(id);
    });
  }
  return [...ids];
}

export const MISSING_ATTACHMENT_TEXT = '[附件缺失：同步包里未包含该附件，已用占位文本替代]';

/**
 * Replace image blocks whose attachment is unavailable with a text placeholder.
 * Returns a new record list plus the ids that were replaced; the caller decides
 * whether to write it back (and must back the original up first).
 */
export function replaceMissingAttachments(records, availableIds) {
  const replaced = new Set();
  const updated = JSON.parse(JSON.stringify(records, (key, value) => {
    if (key === '__proto__') return undefined;
    return value;
  }));
  walkContent(updated, (node) => {
    if (node.type !== 'image') return;
    const attachment = node.attachment;
    const id = attachment && typeof attachment === 'object' ? attachment.attachmentId : node.attachmentId;
    if (typeof id !== 'string' || !id.startsWith('sha256:')) return;
    if (availableIds.has(id)) return;
    replaced.add(id);
    const placeholder = MISSING_ATTACHMENT_TEXT;
    for (const key of Object.keys(node)) delete node[key];
    node.type = 'text';
    node.text = placeholder;
  });
  return { records: updated, replaced: [...replaced] };
}

/** `<objectsRoot>/<sha[0..2]>/<sha>` — the layout DSH's attachment store uses. */
export function attachmentObjectPath(objectsRoot, attachmentId) {
  const sha = String(attachmentId || '').replace(/^sha256:/, '');
  if (!/^[0-9a-f]{64}$/i.test(sha)) throw new Error(`附件 id 不合法：${attachmentId}`);
  return path.join(objectsRoot, sha.slice(0, 2), sha);
}

/**
 * Write bundled attachments into the local object store. Equal content stays a
 * single object, so an existing file is left untouched.
 */
export async function applyAttachments({ objectsRoot, attachments }) {
  const result = { written: 0, present: 0, bytes: 0, failed: [] };
  if (!objectsRoot || !(attachments instanceof Map)) return result;
  for (const [attachmentId, data] of attachments) {
    if (!Buffer.isBuffer(data)) continue;
    let target;
    try {
      target = attachmentObjectPath(objectsRoot, attachmentId);
    } catch (error) {
      result.failed.push({ attachmentId, reason: error instanceof Error ? error.message : String(error) });
      continue;
    }
    try {
      const info = await lstat(target).catch(() => null);
      if (info && info.isFile()) { result.present += 1; continue; }
      await ensureDir(path.dirname(target));
      const temporary = `${target}.dshsync-${process.pid}-${Date.now()}.tmp`;
      await writeFile(temporary, data);
      await rename(temporary, target);
      result.written += 1;
      result.bytes += data.length;
    } catch (error) {
      result.failed.push({ attachmentId, reason: error instanceof Error ? error.message : String(error) });
    }
  }
  return result;
}

/**
 * Rewrite a session log in place, frame by frame.
 *
 * DSH stores a log as a concatenation of independent Zstandard frames, one per
 * append batch. Re-encoding the whole file into a single big frame looks
 * equivalent to us but not to DSH's incremental reader, so every frame is
 * decoded, transformed and re-encoded on its own, and the frame boundaries are
 * preserved exactly. Any frame that cannot be decoded aborts the rewrite.
 *
 * @param {Buffer} buffer
 * @param {(records: object[]) => {records: object[], replaced: string[]}} transform
 * @returns {{ok: boolean, buffer: Buffer, replaced: string[]}}
 */
export function rewriteSessionFrames(buffer, transform) {
  const replaced = [];
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) return { ok: false, buffer, replaced };
  const wasZstd = buffer.length >= 4 && buffer.readUInt32LE(0) === ZSTD_MAGIC;
  if (!wasZstd) {
    const records = [];
    for (const line of buffer.toString('utf8').split('\n')) {
      if (!line.trim()) continue;
      try { records.push(JSON.parse(line)); } catch { return { ok: false, buffer, replaced: [] }; }
    }
    const next = transform(records);
    replaced.push(...next.replaced);
    if (next.replaced.length === 0) return { ok: true, buffer, replaced };
    const text = next.records.map((record) => JSON.stringify(record)).join('\n') + '\n';
    return { ok: true, buffer: Buffer.from(text, 'utf8'), replaced };
  }
  const starts = [];
  let position = 0;
  while (position + 4 <= buffer.length) {
    const index = buffer.indexOf(ZSTD_FRAME, position);
    if (index < 0) break;
    starts.push(index);
    position = index + 1;
  }
  if (starts.length === 0) return { ok: false, buffer, replaced };
  const encoded = [];
  let changed = false;
  for (const [index, start] of starts.entries()) {
    const end = index + 1 < starts.length ? starts[index + 1] : buffer.length;
    let records;
    try {
      const text = zlib.zstdDecompressSync(buffer.subarray(start, end)).toString('utf8');
      records = [];
      for (const line of text.split('\n')) {
        if (!line.trim()) continue;
        records.push(JSON.parse(line));
      }
    } catch {
      return { ok: false, buffer, replaced: [] };
    }
    const next = transform(records);
    if (next.replaced.length === 0) {
      encoded.push(buffer.subarray(start, end));
      continue;
    }
    changed = true;
    replaced.push(...next.replaced);
    const text = next.records.map((record) => JSON.stringify(record)).join('\n') + '\n';
    encoded.push(zlib.zstdCompressSync(Buffer.from(text, 'utf8'), {
      params: { [zlib.constants.ZSTD_c_checksumFlag]: 1 },
    }));
  }
  if (!changed) return { ok: true, buffer, replaced };
  return { ok: true, buffer: Buffer.concat(encoded), replaced };
}

/** * Repair already-downloaded session logs: every reference to an attachment that
 * is neither in the store nor in `availableIds` becomes a text placeholder.
 * The original file is copied under `backupRoot` before it is replaced.
 */
export async function repairSessionAttachments(options) {
  const {
    sessionsRoot,
    objectsRoot,
    backupRoot,
    relativePaths = null,
    availableIds = new Set(),
    dryRun = false,
  } = options;
  const report = { scanned: 0, repaired: 0, replaced: 0, skipped: 0, sessions: [], backups: 0 };
  const root = sessionsRoot;
  let targets = Array.isArray(relativePaths) ? relativePaths : null;
  if (!targets) {
    const scanned = await scanSessions(root);
    targets = scanned.records.map((record) => record.relPath);
  }
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  for (const relPath of targets) {
    const parts = String(relPath).split('/');
    if (parts.length !== 4 || parts[0] !== 'sessions') { report.skipped += 1; continue; }
    let file;
    try {
      file = resolveInside(root, `${parts[1]}/${parts[2]}/${parts[3]}`);
    } catch {
      report.skipped += 1;
      continue;
    }
    report.scanned += 1;
    let buffer;
    try {
      buffer = await readFile(file);
    } catch {
      report.skipped += 1;
      continue;
    }
    const decoded = readSessionRecords(buffer);
    if (!decoded.ok) { report.skipped += 1; continue; }
    const referenced = collectAttachmentIds(decoded.records);
    if (referenced.length === 0) continue;
    const available = new Set(availableIds);
    if (objectsRoot) {
      for (const id of referenced) {
        try {
          const info = await lstat(attachmentObjectPath(objectsRoot, id)).catch(() => null);
          if (info && info.isFile()) available.add(id);
        } catch { /* invalid id: treat as missing */ }
      }
    }
    const rewritten = rewriteSessionFrames(buffer, (records) => replaceMissingAttachments(records, available));
    if (!rewritten.ok) { report.skipped += 1; continue; }
    const replaced = rewritten.replaced;
    if (replaced.length === 0) continue;
    if (dryRun) {
      report.repaired += 1;
      report.replaced += replaced.length;
      report.sessions.push({ relPath, replaced: replaced.length });
      continue;
    }
    if (backupRoot) {
      const backup = path.join(backupRoot, stamp, parts[1], parts[2], parts[3]);
      try {
        await ensureDir(path.dirname(backup));
        await copyFile(file, backup);
        report.backups += 1;
      } catch { /* a missing backup must not block the repair */ }
    }
    const out = rewritten.buffer;
    if (out.length === buffer.length && out.equals(buffer)) continue;
    const temporary = `${file}.dshsync-${process.pid}-${Date.now()}.tmp`;
    await writeFile(temporary, out);
    await rename(temporary, file);
    report.repaired += 1;
    report.replaced += replaced.length;
    report.sessions.push({ relPath, replaced: replaced.length });
  }
  return report;
}
