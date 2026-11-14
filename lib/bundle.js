/**
 * The portable sync package: a gzipped tar containing `manifest.json`, session
 * logs, and (for exports) a public profile snapshot. Optional AES-256-GCM
 * encryption wraps the entire tarball, so filenames are hidden too.
 */
import { readFile, stat } from 'node:fs/promises';
import { gzipSync, gunzipSync } from 'node:zlib';
import {
  decryptWithKey,
  decryptWithPassphrase,
  encryptWithKey,
  encryptWithPassphrase,
  isEncryptedPackage,
} from './crypto.js';
import { createTar, readTar } from './tar.js';
import {
  attachmentObjectPath,
  collectAttachmentIds,
  readSessionRecord,
  readSessionRecords,
  scanSessions,
} from './sessions.js';
import {
  MAX_BUNDLE_BYTES,
  SCHEMA_VERSION,
  createSyncValue,
  nowIso,
  sha256,
  sha256Object,
  userKeyFor,
} from './util.js';

/* One image can legitimately be large, but a bundle must stay under the 100 MB
 * package limit, so attachments get their own budget and the rest are reported. */
const MAX_ATTACHMENT_BYTES = 20 * 1024 * 1024;
const MAX_ATTACHMENT_BUDGET = 48 * 1024 * 1024;

export class BundleError extends Error {
  constructor(message, code = 'bundle') {
    super(message);
    this.name = 'BundleError';
    this.code = code;
  }
}

function normalizedUser(user, device) {
  const login = String(user?.login ?? 'unknown');
  const provider = String(user?.provider ?? 'gitee');
  return {
    provider,
    id: String(user?.id ?? ''),
    login,
    displayName: String(user?.displayName ?? user?.name ?? login),
    userKey: user?.userKey || userKeyFor(provider, login),
  };
}

/**
 * Pack an explicit set of session records/files. This is used for normal
 * snapshots and for incremental merges of the remote snapshot with locally
 * selected sessions.
 * @param {object} options
 * @returns {object}
 */
export function buildBundleFromFiles(options) {
  const {
    files,
    records,
    user,
    device,
    agreement = null,
    purpose = 'sync',
    profile = null,
    dataKey = null,
    passphrase = '',
    encrypt = false,
    attachments = null,
    missingAttachments = null,
  } = options;

  const unique = new Map();
  for (const record of Array.isArray(records) ? records : []) {
    if (!record || typeof record.relPath !== 'string' || !record.relPath.startsWith('sessions/')) continue;
    if (!files || !files.has(record.relPath)) continue;
    unique.set(record.relPath, record);
  }
  const selectedRecords = [...unique.values()];
  if (selectedRecords.length === 0) {
    throw new BundleError('没有选中任何会话，未生成同步包', 'no-sessions');
  }
  const selectedBytes = selectedRecords.reduce((sum, record) => sum + Number(record.size || 0), 0);
  const selectedWorkspaces = new Set(selectedRecords.map((record) => record.project)).size;
  if (selectedBytes > MAX_BUNDLE_BYTES) {
    throw new BundleError('会话数据超过 100 MB 包限制', 'too-large');
  }

  const manifest = {
    schema: SCHEMA_VERSION,
    purpose,
    generatedAt: nowIso(),
    contentHash: '',
    user: normalizedUser(user, device),
    device: {
      id: String(device?.id ?? ''),
      name: String(device?.name ?? ''),
      platform: String(device?.platform ?? process.platform),
      arch: String(device?.arch ?? process.arch),
      os: String(device?.os ?? ''),
    },
    agreement: agreement?.accepted
      ? {
        version: agreement.version,
        acceptedAt: agreement.acceptedAt,
        hash: agreement.hash,
      }
      : null,
    encryption: {
      enabled: Boolean(encrypt || dataKey),
      algorithm: encrypt || dataKey ? 'AES-256-GCM' : null,
    },
    totals: {
      sessions: selectedRecords.length,
      bytes: selectedBytes,
      workspaces: selectedWorkspaces,
      attachments: attachments instanceof Map ? attachments.size : 0,
    },
    sessions: selectedRecords,
    attachments: attachments instanceof Map
      ? [...attachments.entries()].map(([attachmentId, data]) => ({ attachmentId, size: data.length }))
      : [],
    missingAttachments: Array.isArray(missingAttachments) ? missingAttachments.slice(0, 2000) : [],
  };
  manifest.contentHash = sha256Object({
    purpose: manifest.purpose,
    user: manifest.user,
    device: manifest.device,
    agreement: manifest.agreement,
    encryption: manifest.encryption,
    sessions: manifest.sessions,
    attachments: manifest.attachments,
  });

  const entries = [{
    path: 'manifest.json',
    data: Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`, 'utf8'),
    mtimeMs: Date.now(),
  }];
  if (profile) {
    entries.push({
      path: 'export.json',
      data: Buffer.from(`${JSON.stringify(profile, null, 2)}\n`, 'utf8'),
      mtimeMs: Date.now(),
    });
  }
  for (const record of selectedRecords) {
    entries.push({
      path: record.relPath,
      data: files.get(record.relPath),
      mtimeMs: record.mtimeMs,
    });
  }
  if (attachments instanceof Map) {
    for (const [attachmentId, data] of attachments) {
      entries.push({
        path: `attachments/${String(attachmentId).replace(/^sha256:/, '')}`,
        data,
        mtimeMs: Date.now(),
      });
    }
  }

  const tarball = createTar(entries);
  if (tarball.length > MAX_BUNDLE_BYTES) {
    throw new BundleError('同步包超过 100 MB 限制', 'too-large');
  }

  let bytes;
  let resultingDataKey = null;
  let encrypted = false;
  if (encrypt || dataKey) {
    if (dataKey) {
      bytes = encryptWithKey(dataKey, tarball);
      resultingDataKey = dataKey;
    } else {
      if (String(passphrase).length < 1) throw new BundleError('需要加密口令', 'passphrase-required');
      const encryptedResult = encryptWithPassphrase(passphrase, tarball);
      bytes = encryptedResult.bytes;
      resultingDataKey = encryptedResult.dataKey;
    }
    encrypted = true;
  } else {
    bytes = gzipSync(tarball, { level: 6 });
  }

  if (bytes.length > MAX_BUNDLE_BYTES) {
    throw new BundleError('同步包超过 100 MB 限制', 'too-large');
  }

  const dataSha256 = sha256(bytes);
  const dataHashShort = dataSha256.slice(0, 12);
  const revision = createSyncValue();
  const sessionSetHash = sha256Object(
    selectedRecords
      .map((record) => ({ relPath: record.relPath, sha256: record.sha256, size: record.size }))
      .sort((left, right) => left.relPath.localeCompare(right.relPath)),
  );
  return {
    bytes,
    encrypted,
    fileName: `latest-${dataHashShort}${encrypted ? '.dsync.enc' : '.dsync'}`,
    revision,
    dataSha256,
    sessionSetHash,
    dataKey: resultingDataKey,
    manifest,
    manifestHash: manifest.contentHash,
    sessionCount: selectedRecords.length,
    workspaceCount: selectedWorkspaces,
    totalBytes: selectedBytes,
  };
}

/**
 * Build a package from the local DSH session root, optionally merging
 * remote-only files for incremental pushes.
 * @param {object} options
 * @returns {Promise<object>}
 */
export async function buildBundle(options) {
  const {
    sessionsRoot,
    sessionRelPaths = null,
    extraFiles = null,
    extraRecords = [],
  } = options;

  const scanned = await scanSessions(sessionsRoot);
  const hasSelection = Array.isArray(sessionRelPaths);
  const selectedPaths = hasSelection ? new Set(sessionRelPaths.map(String)) : null;
  const localRecords = selectedPaths
    ? scanned.records.filter((record) => selectedPaths.has(record.relPath))
    : scanned.records;
  const localPaths = new Set(localRecords.map((record) => record.relPath));
  const selectedRecords = [
    ...localRecords,
    ...(Array.isArray(extraRecords)
      ? extraRecords.filter((record) => record && !localPaths.has(record.relPath))
      : []),
  ];
  if (selectedRecords.length === 0) {
    throw new BundleError('没有选中任何会话，未生成同步包', 'no-sessions');
  }

  const files = new Map();
  for (const record of localRecords) {
    files.set(record.relPath, await readSessionRecord(sessionsRoot, record));
  }
  if (extraFiles instanceof Map) {
    for (const [relPath, data] of extraFiles) {
      if (typeof relPath !== 'string' || !relPath.startsWith('sessions/')) continue;
      if (!Buffer.isBuffer(data)) continue;
      if (!files.has(relPath)) files.set(relPath, data);
    }
  }

  /* Attachments referenced by the bundled session logs travel with them, so a
   * receiver never gets history pointing at files it does not have. Anything the
   * sender itself is missing is reported, and the receiver fills the gap. */
  const attachments = new Map();
  if (options.extraAttachments instanceof Map) {
    for (const [attachmentId, data] of options.extraAttachments) {
      if (typeof attachmentId === 'string' && Buffer.isBuffer(data)) attachments.set(attachmentId, data);
    }
  }
  const missingAttachments = new Set();
  const attachmentsRoot = options.attachmentsRoot;
  if (attachmentsRoot) {
    const ids = new Set();
    for (const data of files.values()) {
      const decoded = readSessionRecords(data);
      if (!decoded.ok) continue;
      for (const attachmentId of collectAttachmentIds(decoded.records)) ids.add(attachmentId);
    }
    let budget = MAX_ATTACHMENT_BUDGET;
    for (const attachmentId of ids) {
      let target;
      try {
        target = attachmentObjectPath(attachmentsRoot, attachmentId);
      } catch {
        missingAttachments.add(attachmentId);
        continue;
      }
      const info = await stat(target).catch(() => null);
      if (!info || !info.isFile() || info.size > MAX_ATTACHMENT_BYTES || info.size > budget) {
        missingAttachments.add(attachmentId);
        continue;
      }
      const data = await readFile(target).catch(() => null);
      if (!data) {
        missingAttachments.add(attachmentId);
        continue;
      }
      budget -= data.length;
      attachments.set(attachmentId, data);
    }
  }

  return buildBundleFromFiles({
    ...options,
    records: selectedRecords,
    files,
    attachments,
    missingAttachments: [...missingAttachments],
  });
}

/**
 * Decode a portable package. Encryption needs either the passphrase or the
 * already-unwrapped data key (the account-recovery path).
 * @param {Buffer} bytes
 * @param {{passphrase?: string, dataKey?: Buffer}} options
 */
export function parseBundle(bytes, options = {}) {
  if (!Buffer.isBuffer(bytes) || bytes.length === 0) throw new BundleError('同步包为空', 'empty');
  if (bytes.length > MAX_BUNDLE_BYTES) throw new BundleError('同步包超过大小限制', 'too-large');

  let tarball;
  let encrypted = false;
  if (isEncryptedPackage(bytes)) {
    encrypted = true;
    if (options.dataKey) {
      try {
        tarball = decryptWithKey(options.dataKey, bytes);
      } catch (error) {
        if (!options.passphrase) throw error;
        tarball = decryptWithPassphrase(options.passphrase, bytes);
      }
    } else {
      if (!options.passphrase) throw new BundleError('这个同步包已加密', 'passphrase-required');
      try {
        tarball = decryptWithPassphrase(options.passphrase, bytes);
      } catch (error) {
        if (error && (error.code === 'bad-key' || error.code === 'bad-passphrase')) {
          throw new BundleError('口令错误', 'bad-passphrase');
        }
        throw error;
      }
    }
  } else {
    try {
      tarball = gunzipSync(bytes, { maxOutputLength: MAX_BUNDLE_BYTES + 16 * 1024 * 1024 });
    } catch {
      throw new BundleError('不是有效的 dsh-chat-syncer 同步包', 'format');
    }
  }

  let files;
  try {
    files = readTar(tarball);
  } catch (error) {
    throw new BundleError(`无法读取同步包：${error instanceof Error ? error.message : String(error)}`, 'format');
  }

  const manifestBytes = files.get('manifest.json');
  if (!manifestBytes) throw new BundleError('同步包缺少 manifest', 'format');
  let manifest;
  try {
    manifest = JSON.parse(manifestBytes.toString('utf8'));
  } catch {
    throw new BundleError('同步包 manifest 不是合法 JSON', 'format');
  }
  if (!manifest || manifest.schema !== SCHEMA_VERSION) {
    throw new BundleError(`不支持的同步包格式版本：${manifest?.schema ?? '缺失'}`, 'schema');
  }
  if (!Array.isArray(manifest.sessions)) throw new BundleError('同步包 manifest 缺少会话列表', 'format');

  const allowed = new Set(['manifest.json', 'export.json']);
  for (const attachment of Array.isArray(manifest.attachments) ? manifest.attachments : []) {
    const sha = String(attachment?.attachmentId ?? '').replace(/^sha256:/, '');
    if (!/^[0-9a-f]{64}$/i.test(sha)) throw new BundleError('同步包 manifest 包含非法的附件 id', 'format');
    allowed.add(`attachments/${sha}`);
  }
  for (const record of manifest.sessions) {
    if (!record || typeof record.relPath !== 'string' || !record.relPath.startsWith('sessions/')) {
      throw new BundleError('同步包 manifest 包含不安全的会话路径', 'format');
    }
    allowed.add(record.relPath);
  }
  for (const file of files.keys()) {
    if (!allowed.has(file)) throw new BundleError(`unexpected file in package: ${file}`, 'format');
  }

  let profile = null;
  const profileBytes = files.get('export.json');
  if (profileBytes) {
    try {
      profile = JSON.parse(profileBytes.toString('utf8'));
    } catch {
      profile = null;
    }
  }

  return {
    manifest,
    profile,
    files,
    encrypted,
    revision: `sha256:${sha256(bytes)}`,
    fileName: encrypted ? 'latest.dsync.enc' : 'latest.dsync',
  };
}
