/**
 * Mandatory local backup: a tar of every session log plus the content-addressed
 * attachment store, encrypted with AES-256-GCM under a key the user can read
 * both from the repository and from the plugin settings page.
 *
 * The backup is written *before* any destructive repository operation
 * (compaction, rotation, clear) so a failed remote step can never be the only
 * copy of the user's data.
 */
import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';

import { decryptWithPassphrase, encryptWithPassphrase } from './crypto.js';
import { createTar, readTar } from './tar.js';
import { ensureDir, nowIso, sha256, writeBuffer } from './util.js';

export const BACKUP_PREFIX = 'backup-';
export const BACKUP_SUFFIX = '.dsyncbak.enc';
const MAX_FILE_BYTES = 64 * 1024 * 1024;

async function walk(root, prefix, output) {
  let entries;
  try {
    entries = await readdir(root, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    const absolute = path.join(root, entry.name);
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      await walk(absolute, relative, output);
      continue;
    }
    if (!entry.isFile()) continue;
    let info;
    try {
      info = await stat(absolute);
    } catch {
      continue;
    }
    if (info.size > MAX_FILE_BYTES) continue;
    output.push({ absolute, relative, size: info.size, mtimeMs: info.mtimeMs });
  }
}

/** Every file that belongs in a local backup, with repository-style names. */
export async function collectBackupFiles({ sessionsRoot, attachmentsRoot }) {
  const sessions = [];
  const attachments = [];
  if (sessionsRoot) await walk(sessionsRoot, '', sessions);
  if (attachmentsRoot) await walk(attachmentsRoot, '', attachments);
  return {
    sessions,
    attachments,
    bytes: sessions.reduce((sum, entry) => sum + entry.size, 0)
      + attachments.reduce((sum, entry) => sum + entry.size, 0),
  };
}

/**
 * Write one encrypted backup file.
 * @returns {Promise<{file: string, bytes: number, plainBytes: number, sessions: number, attachments: number, sha256: string}>}
 */
export async function createEncryptedBackup(options) {
  const { sessionsRoot, attachmentsRoot, dir, key } = options;
  if (!key) throw new Error('备份密钥为空');
  const collected = await collectBackupFiles({ sessionsRoot, attachmentsRoot });
  const entries = [];
  for (const entry of collected.sessions) {
    entries.push({
      path: `sessions/${entry.relative}`,
      data: await readFile(entry.absolute),
      mtimeMs: entry.mtimeMs,
    });
  }
  for (const entry of collected.attachments) {
    entries.push({
      path: `attachments/${entry.relative}`,
      data: await readFile(entry.absolute),
      mtimeMs: entry.mtimeMs,
    });
  }
  const plain = createTar(entries);
  const encrypted = encryptWithPassphrase(key, plain);
  const stamp = nowIso().replace(/[:.]/g, '-');
  const filename = `${BACKUP_PREFIX}${stamp}${BACKUP_SUFFIX}`;
  const target = path.join(dir, filename);
  await ensureDir(dir);
  await writeBuffer(target, encrypted.bytes, { mode: 0o600 });
  return {
    file: target,
    name: filename,
    bytes: encrypted.bytes.length,
    plainBytes: plain.length,
    sessions: collected.sessions.length,
    attachments: collected.attachments.length,
    sha256: sha256(encrypted.bytes),
  };
}

/** Decrypt a backup created by {@link createEncryptedBackup}. */
export async function readEncryptedBackup(file, key) {
  const bytes = await readFile(file);
  const plain = decryptWithPassphrase(key, bytes);
  return readTar(plain);
}

/** Backup files newest first, without decrypting them. */
export async function listEncryptedBackups(dir) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return [];
  }
  const items = [];
  for (const entry of entries) {
    if (!entry.isFile()) continue;
    if (!entry.name.startsWith(BACKUP_PREFIX) || !entry.name.endsWith(BACKUP_SUFFIX)) continue;
    const absolute = path.join(dir, entry.name);
    const info = await stat(absolute).catch(() => null);
    if (!info) continue;
    items.push({
      name: entry.name,
      path: absolute,
      bytes: info.size,
      createdAt: info.mtime.toISOString(),
    });
  }
  return items.sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}
