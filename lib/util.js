/**
 * Small host-side helpers shared by the sync service.
 *
 * This module deliberately depends on Node built-ins only: the plugin is
 * installed into a running DSH profile and should not pull a second copy of
 * any framework into that profile.
 */
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { chmod, mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

export const SCHEMA_VERSION = 1;
export const PLUGIN_ID = 'dsh-chat-syncer';
export const DEFAULT_REPO_NAME = 'dsh-chat-syncer-data';
/** Repositories created before the 0.9.3 rename are still reused, never duplicated. */
export const LEGACY_REPO_NAMES = ['dsh-chat-sync-data'];
export const MAX_BUNDLE_BYTES = 100 * 1024 * 1024;
export const MAX_FILE_BYTES = 64 * 1024 * 1024;

export function nowIso() {
  return new Date().toISOString();
}

export function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

export function sha256Object(value) {
  return sha256(JSON.stringify(value));
}

export function randomId(prefix = '') {
  return `${prefix}${randomUUID()}`;
}

export function randomToken(bytes = 24) {
  return randomBytes(bytes).toString('base64url');
}

/**
 * Human-readable, collision-resistant shared sync value.
 *
 * `SYNC-<UTC yyyyMMddHHmmss>-<6 random digits>` is sortable by creation time,
 * contains only letters in the prefix and digits afterwards, and is opaque
 * enough that it does not leak the repository or device identity.
 */
export function createSyncValue(date = new Date()) {
  const pad = (value, width = 2) => String(value).padStart(width, '0');
  const stamp = `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}`
    + `${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}`;
  return `SYNC-${stamp}-${pad(randomBytes(3).readUIntBE(0, 3) % 1_000_000, 6)}`;
}

export function messageOf(error) {
  if (error instanceof Error) return error.message;
  return String(error);
}

export function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export async function ensureDir(directory) {
  await mkdir(directory, { recursive: true, mode: 0o700 });
}

export async function readJson(file, fallback = null) {
  try {
    return JSON.parse(await readFile(file, 'utf8'));
  } catch (error) {
    if (error && (error.code === 'ENOENT' || error.code === 'ENOTDIR')) return fallback;
    if (error instanceof SyntaxError) return fallback;
    throw error;
  }
}

/** Write a JSON file through a same-directory temporary name, then rename. */
export async function writeJson(file, value, options = {}) {
  await ensureDir(path.dirname(file));
  const temporary = `${file}.${process.pid}.${randomBytes(4).toString('hex')}.tmp`;
  const text = `${JSON.stringify(value, null, 2)}\n`;
  await writeFile(temporary, text, { encoding: 'utf8', mode: options.mode ?? 0o600 });
  await rename(temporary, file);
  if (options.mode !== undefined) {
    await chmod(file, options.mode).catch(() => {});
  }
}

export async function writeBuffer(file, value, options = {}) {
  await ensureDir(path.dirname(file));
  const temporary = `${file}.${process.pid}.${randomBytes(4).toString('hex')}.tmp`;
  await writeFile(temporary, value, { mode: options.mode ?? 0o600 });
  await rename(temporary, file);
  if (options.mode !== undefined) {
    await chmod(file, options.mode).catch(() => {});
  }
}

/** Keep a filesystem segment inside a directory, rejecting traversal. */
export function safeSegment(value, fallback = 'unknown') {
  const text = String(value ?? '')
    .normalize('NFKD')
    .replace(/[^\w.-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 96);
  return text || fallback;
}

/** Stable account key used for the per-user folder in the repository. */
export function userKeyFor(provider, login) {
  return `${safeSegment(provider, 'provider').toLowerCase()}-${safeSegment(login, 'account').toLowerCase()}`;
}

export function sanitizeRepositoryPath(value) {
  const text = String(value ?? '').replace(/\\/g, '/').replace(/^\/+/, '');
  const parts = text.split('/').filter(Boolean);
  if (parts.length === 0) throw new Error('empty repository path');
  for (const part of parts) {
    if (part === '.' || part === '..' || part.includes('\0')) {
      throw new Error(`unsafe repository path: ${text}`);
    }
  }
  return parts.join('/');
}

/** Resolve a relative archive path under a root without allowing escape. */
export function resolveInside(root, relativePath) {
  const normalized = sanitizeRepositoryPath(relativePath);
  const absolute = path.resolve(root, ...normalized.split('/'));
  const inside = path.relative(root, absolute);
  if (inside === '' || inside.startsWith('..') || path.isAbsolute(inside)) {
    throw new Error(`path escapes its root: ${relativePath}`);
  }
  return absolute;
}

export function shortRevision(revision) {
  const text = String(revision ?? '');
  if (text.startsWith('SYNC-')) return text;
  const hex = text.includes(':') ? text.slice(text.indexOf(':') + 1) : text;
  return hex.slice(0, 12);
}

export function osDisplayName(platform = process.platform) {
  switch (platform) {
    case 'win32': return 'Windows';
    case 'darwin': return 'macOS';
    case 'linux': return 'Linux';
    default: return String(platform || 'Unknown');
  }
}

export function archDisplayName(arch = process.arch) {
  switch (arch) {
    case 'x64': return 'x64';
    case 'arm64': return 'arm64';
    case 'ia32': return 'x86';
    default: return String(arch || 'unknown');
  }
}

export function formatMac(value) {
  const hex = String(value || '').replace(/[^0-9a-f]/gi, '').toUpperCase();
  if (hex.length !== 12) return hex;
  return hex.match(/.{1,2}/g).join(':');
}

/** Best-effort machine identity for the default device label. */
export function deviceIdentity() {
  let username = '';
  try {
    username = os.userInfo().username || '';
  } catch {
    username = '';
  }
  const hostname = process.env.COMPUTERNAME || process.env.HOSTNAME || os.hostname() || 'device';
  let mac = '';
  let ip = '';
  try {
    for (const addresses of Object.values(os.networkInterfaces())) {
      for (const address of addresses || []) {
        if (!address || address.internal) continue;
        const candidate = String(address.mac || '').replace(/[^0-9a-f]/gi, '').toUpperCase();
        if (!mac && candidate.length === 12 && candidate !== '000000000000') mac = candidate;
        if (!ip && address.family === 'IPv4' && address.address) ip = address.address;
      }
    }
  } catch {
    /* network interfaces are optional */
  }
  return {
    username: String(username || '').slice(0, 24),
    hostname: safeSegment(hostname, 'device').slice(0, 24),
    mac,
    ip: ip.slice(0, 32),
    osVersion: String(os.version?.() || os.release?.() || '').slice(0, 80),
  };
}

export function normalizedDeviceName(platform = process.platform, arch = process.arch) {
  const identity = deviceIdentity();
  return deviceNameFrom(identity, platform, arch);
}

export function deviceNameFrom(identity, platform = process.platform, arch = process.arch) {
  const parts = [];
  if (identity?.username) parts.push(`${identity.username}@${identity.hostname || 'device'}`);
  else parts.push(identity?.hostname || 'device');
  parts.push(`${osDisplayName(platform)} ${archDisplayName(arch)}`);
  return clampText(parts.join(' · '), 80);
}

export function deviceUniqueId(identity = deviceIdentity()) {
  if (identity?.mac) return `MAC-${identity.mac}`;
  return `AUX-${sha256(`${identity?.username || ''}|${identity?.hostname || ''}|${identity?.osVersion || ''}`).slice(0, 20).toUpperCase()}`;
}

export function deviceFingerprint(identity = deviceIdentity(), platform = process.platform, arch = process.arch) {
  const auxiliary = `${identity.username || ''}|${identity.hostname || ''}|${identity.osVersion || ''}|${osDisplayName(platform)}|${archDisplayName(arch)}`;
  if (identity.mac) {
    return `MAC-${identity.mac}-${sha256(auxiliary).slice(0, 8).toUpperCase()}`;
  }
  return `AUX-${sha256(auxiliary).slice(0, 20).toUpperCase()}`;
}

export function clampText(value, max = 120) {
  const text = String(value ?? '').replace(/\s+/g, ' ').trim();
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

