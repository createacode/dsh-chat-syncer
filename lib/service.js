/**
 * The host-side sync service.
 *
 * All repository traffic and all local file access live here. The browser half
 * is a thin UI over the authenticated routes registered by index.js; it never
 * sees an access token, a passphrase-derived key, or an absolute local path.
 */
import { randomBytes } from 'node:crypto';
import { copyFile, readFile, readdir, rm, stat } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {
  BundleError,
  buildBundle,
  parseBundle,
} from './bundle.js';
import {
  CryptoError,
  keyFingerprint,
  newDataKey,
  unwrapForAccount,
  unwrapForPassphrase,
  wrapForAccount,
  wrapForPassphrase,
} from './crypto.js';
import {
  applyAttachments,
  applySessionFiles,
  parseSessionHeader,
  readSessionRecord,
  repairSessionAttachments,
  scanSessions,
} from './sessions.js';
import {
  clearProjectionCache,
  pendingEntries,
  publicWorkspaceReport,
  reconcileWorkspaces,
  registrySnapshot,
} from './workspaces.js';
import { applyUpdate, checkForUpdate } from './update.js';
import {
  PROVIDERS,
  RepoClient,
  RepoError,
  providerPublicInfo,
} from './provider.js';
import {
  AGREEMENT_HASH,
  AGREEMENT_TEXT,
  AGREEMENT_VERSION,
  agreementPublicInfo,
  isValidAgreement,
} from './agreement.js';
import {
  DEFAULT_REPO_NAME,
  LEGACY_REPO_NAMES,
  PLUGIN_ID,
  SCHEMA_VERSION,
  clampText,
  deviceIdentity,
  deviceFingerprint,
  deviceNameFrom,
  deviceUniqueId,
  ensureDir,
  messageOf,
  normalizedDeviceName,
  nowIso,
  osDisplayName,
  randomId,
  readJson,
  safeSegment,
  sha256,
  sha256Object,
  shortRevision,
  userKeyFor,
  writeJson,
} from './util.js';

export const PLUGIN_VERSION = '0.15.0';
const AUTO_PUSH_DELAY_MS = 5000;
const MAX_IMPORT_BYTES = 100 * 1024 * 1024;
const SCHEDULE_INTERVALS = Object.freeze({
  '10m': 10 * 60 * 1000,
  '20m': 20 * 60 * 1000,
  '30m': 30 * 60 * 1000,
  '1h': 60 * 60 * 1000,
  '3h': 3 * 60 * 60 * 1000,
  '6h': 6 * 60 * 60 * 1000,
  '12h': 12 * 60 * 60 * 1000,
  '24h': 24 * 60 * 60 * 1000,
});

export class ServiceError extends Error {
  constructor(message, code = 'service', details = null) {
    super(message);
    this.name = 'ServiceError';
    this.code = code;
    this.details = details;
  }
}

function normalizeError(error) {
  if (error instanceof ServiceError) return error;
  if (error instanceof RepoError) {
    return new ServiceError(error.message, error.code, {
      status: error.status,
      retryable: error.retryable,
    });
  }
  if (error instanceof BundleError) return new ServiceError(error.message, error.code);
  if (error instanceof CryptoError) return new ServiceError(error.message, error.code);
  return new ServiceError(messageOf(error), 'internal');
}

function errorMessage(error) {
  return normalizeError(error).message;
}

function publicHead(head) {
  if (!head) return null;
  return {
    revision: head.revision,
    shortRevision: shortRevision(head.revision),
    updatedAt: head.updatedAt,
    updatedBy: head.updatedBy,
    sessionCount: head.sessionCount,
    workspaceCount: head.workspaceCount,
    encrypted: Boolean(head.encrypted),
    bytes: head.bytes,
    dataFile: head.dataFile,
    agreement: head.agreement,
  };
}

function validateRepoName(value) {
  const name = String(value ?? DEFAULT_REPO_NAME).trim();
  if (!/^[A-Za-z0-9._-]{1,100}$/.test(name) || name === '.' || name === '..') {
    throw new ServiceError('仓库名只能包含字母、数字、点、下划线和短横线（1–100 个字符）', 'repo-name');
  }
  return name;
}

function validatePassphrase(passphrase, confirm) {
  const text = String(passphrase ?? '');
  if (text.length < 8) throw new ServiceError('口令至少需要 8 个字符', 'passphrase-short');
  if (text.length > 256) throw new ServiceError('口令过长（最多 256 个字符）', 'passphrase-long');
  if (confirm !== undefined && text !== String(confirm)) {
    throw new ServiceError('两次输入的口令不一致', 'passphrase-mismatch');
  }
  return text;
}

function displayPath(absolute) {
  const home = process.env.DSH_HOME || path.join(os.homedir(), '.dsh');
  const normalizedHome = path.resolve(home);
  const normalized = path.resolve(absolute);
  if (normalized === normalizedHome) return '~/.dsh';
  if (normalized.startsWith(`${normalizedHome}${path.sep}`)) {
    return `~/.dsh/${path.relative(normalizedHome, normalized).split(path.sep).join('/')}`;
  }
  return normalized;
}

export class SyncService {
  constructor(options) {
    this.ctx = options.ctx;
    this.dataDir = options.dataDir;
    /* DSH's content-addressed attachment store; null disables attachment transfer. */
    this.attachmentsRoot = options.attachmentsRoot || null;
    this.sessionsRoot = options.sessionsRoot;
    this.configFile = path.join(this.dataDir, 'config.json');
    this.secretsFile = path.join(this.dataDir, 'secrets.json');
    this.usersDir = path.join(this.dataDir, 'users');
    this.backupRoot = path.join(this.dataDir, 'backups');
    this.config = null;
    this.token = null;
    this.dataKey = null;
    this.autoTimer = null;
    this.scheduleTimer = null;
    this.pushInFlight = null;
    this.initialized = false;
    this.lastAutoAt = 0;
  }

  defaultConfig() {
    const existingDevice = this.config?.device;
    return {
      schema: SCHEMA_VERSION,
      plugin: PLUGIN_ID,
      provider: 'gitee',
      account: null,
      repo: null,
      userKey: null,
      displayName: '',
      device: existingDevice ?? {
        id: randomId('dev-'),
        name: normalizedDeviceName(),
        platform: process.platform,
        arch: process.arch,
        os: osDisplayName(),
        customName: false,
        ...deviceIdentity(),
        uniqueId: deviceUniqueId(),
        fingerprint: deviceFingerprint(),
        createdAt: nowIso(),
      },
      autoSync: true,
      scheduledSync: true,
      smartSync: true,
      syncInterval: '3h',
      scheduledPaused: false,
      unchangedScheduledCount: 0,
      lastScheduledPauseAt: null,
      autoUpdateMode: 'off',
      syncMode: 'incremental',
      autoCreateWorkspaceDirs: true,
      users: {},
      signedAgreement: null,
      lastRelation: 'same',
      agreement: null,
      encryption: null,
      lastSeenRevision: '',
      lastPushRevision: '',
      lastPushedManifestHash: '',
      lastCheckAt: null,
      lastPushAt: null,
      lastCompletedAt: null,
      lastError: null,
      remoteHead: null,
      pendingWorkspaces: [],
      stats: null,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
  }

  async init() {
    await ensureDir(this.dataDir);
    await ensureDir(this.usersDir);
    await ensureDir(this.backupRoot);
    const stored = await readJson(this.configFile, {});
    this.config = {
      ...this.defaultConfig(),
      ...(stored && typeof stored === 'object' ? stored : {}),
    };
    if (!this.config.device || typeof this.config.device.id !== 'string') {
      this.config.device = this.defaultConfig().device;
    }
    if (!this.config.device.name) this.config.device.name = normalizedDeviceName();
    if (!this.config.device.platform) this.config.device.platform = process.platform;
    if (!this.config.device.arch) this.config.device.arch = process.arch;
    if (!this.config.device.os) this.config.device.os = osDisplayName();
    const identity = deviceIdentity();
    this.config.device.username = this.config.device.username || identity.username;
    this.config.device.hostname = this.config.device.hostname || identity.hostname;
    if (!this.config.device.mac || String(this.config.device.mac).replace(/[^0-9a-f]/gi, '').length !== 12) {
      this.config.device.mac = identity.mac;
    }
    this.config.device.ip = identity.ip || this.config.device.ip || '';
    this.config.device.osVersion = identity.osVersion || this.config.device.osVersion || '';
    this.config.device.uniqueId = deviceUniqueId({ ...identity, mac: this.config.device.mac });
    this.config.device.fingerprint = deviceFingerprint({ ...identity, mac: this.config.device.mac });
    if (typeof this.config.device.customName !== 'boolean') this.config.device.customName = false;
    if (/·\s*[0-9A-F]{6}\s*·\s*\d{1,3}(?:\.\d{1,3}){3}\s*·/i.test(this.config.device.name)) {
      this.config.device.customName = false;
    }
    if (!this.config.device.customName) this.config.device.name = normalizedDeviceName();
    if (!this.config.createdAt) this.config.createdAt = nowIso();
    if (!this.config.users || typeof this.config.users !== 'object') this.config.users = {};
    this.config.scheduledPaused = false;
    this.config.unchangedScheduledCount = 0;
    if (this.config.userKey && this.config.account && !this.config.users[this.config.userKey]) {
      this.config.users[this.config.userKey] = this.accountSnapshot();
    }
    this.token = await this.readStoredToken();
    if (this.token && this.config.userKey) {
      await this.storeToken(this.token, this.config.userKey).catch(() => {});
    }
    this.initialized = true;
    await this.save();
    this.scheduleTimedSync();
    return this;
  }

  async save() {
    if (!this.config) return;
    this.config.updatedAt = nowIso();
    await writeJson(this.configFile, this.config, { mode: 0o600 });
  }

  accountSnapshot() {
    const config = this.config;
    return {
      provider: config.provider,
      account: config.account,
      repo: config.repo,
      userKey: config.userKey,
      displayName: config.displayName,
      agreement: config.agreement,
      encryption: config.encryption,
      lastSeenRevision: config.lastSeenRevision,
      lastPushRevision: config.lastPushRevision,
      lastPushedManifestHash: config.lastPushedManifestHash,
      lastRelation: config.lastRelation || 'same',
      lastCheckAt: config.lastCheckAt,
      lastPushAt: config.lastPushAt,
      lastCompletedAt: config.lastCompletedAt,
      lastError: config.lastError,
      remoteHead: config.remoteHead,
      stats: config.stats,
      autoSync: config.autoSync,
      scheduledSync: config.scheduledSync,
      smartSync: config.smartSync !== false,
      syncInterval: config.syncInterval,
      syncMode: config.syncMode,
    };
  }

  saveActiveUser() {
    if (!this.config?.userKey || !this.config?.account) return;
    this.config.users = this.config.users && typeof this.config.users === 'object' ? this.config.users : {};
    this.config.users[this.config.userKey] = this.accountSnapshot();
  }

  async switchUser(input = {}) {
    const userKey = String(input.userKey ?? '');
    if (!userKey) throw new ServiceError('缺少用户标识', 'user-key');
    if (userKey === this.config?.userKey) return { state: this.publicState(), switched: false };
    const entry = this.config?.users?.[userKey];
    if (!entry || !entry.account || !entry.repo) throw new ServiceError('本机没有这个历史登录用户', 'user-not-found');
    this.saveActiveUser();
    const token = await this.readStoredToken(userKey);
    this.config = {
      ...this.config,
      provider: entry.provider,
      account: entry.account,
      repo: entry.repo,
      userKey,
      displayName: entry.displayName || entry.account.login,
      agreement: entry.agreement || null,
      encryption: entry.encryption || null,
      lastSeenRevision: entry.lastSeenRevision || '',
      lastPushRevision: entry.lastPushRevision || '',
      lastPushedManifestHash: entry.lastPushedManifestHash || '',
      lastRelation: entry.lastRelation || 'same',
      lastCheckAt: entry.lastCheckAt || null,
      lastPushAt: entry.lastPushAt || null,
      lastCompletedAt: entry.lastCompletedAt || null,
      lastError: null,
      remoteHead: entry.remoteHead || null,
      stats: entry.stats || null,
      autoSync: entry.autoSync !== false,
      scheduledSync: entry.scheduledSync !== false,
      smartSync: entry.smartSync !== false,
      syncInterval: SCHEDULE_INTERVALS[entry.syncInterval] ? entry.syncInterval : '3h',
      scheduledPaused: false,
      unchangedScheduledCount: 0,
      syncMode: entry.syncMode === 'incremental' ? 'incremental' : 'overwrite',
      users: this.config.users,
      device: this.config.device,
      autoUpdateMode: this.config.autoUpdateMode,
    };
    if (!isValidAgreement(this.config.agreement) && isValidAgreement(this.config.signedAgreement)) {
      this.config.agreement = {
        ...this.config.signedAgreement,
        userKey,
        deviceId: this.config.device.id,
      };
    }
    this.token = token;
    this.dataKey = null;
    this.setError(null);
    await this.save();
    this.scheduleTimedSync();
    return { state: this.publicState(), switched: true };
  }

  async clearAllData() {
    const keys = Object.keys(this.config?.users || {});
    if (this.config?.userKey) keys.push(this.config.userKey);
    for (const key of new Set(keys)) await this.clearToken(key).catch(() => {});
    this.token = null;
    this.dataKey = null;
    if (this.autoTimer) clearTimeout(this.autoTimer);
    if (this.scheduleTimer) clearTimeout(this.scheduleTimer);
    this.autoTimer = null;
    this.scheduleTimer = null;
    await rm(this.dataDir, { recursive: true, force: true }).catch(() => {});
    await ensureDir(this.dataDir);
    await ensureDir(this.usersDir);
    await ensureDir(this.backupRoot);
    this.config = this.defaultConfig();
    await this.save();
    return this.publicState();
  }

  async initializePlugin() {
    const keep = this.config
      ? {
        provider: this.config.provider,
        account: this.config.account,
        repo: this.config.repo,
        userKey: this.config.userKey,
        displayName: this.config.displayName,
        device: this.config.device,
        agreement: this.config.agreement,
        signedAgreement: this.config.signedAgreement,
      }
      : {};
    const token = this.token;
    const keys = Object.keys(this.config?.users || {});
    for (const key of new Set(keys)) await this.clearToken(key).catch(() => {});
    await rm(this.dataDir, { recursive: true, force: true }).catch(() => {});
    await ensureDir(this.dataDir);
    await ensureDir(this.usersDir);
    await ensureDir(this.backupRoot);
    this.config = { ...this.defaultConfig(), ...keep };
    this.dataKey = null;
    this.config.users = {};
    this.config.agreement = keep.agreement || null;
    this.config.signedAgreement = keep.signedAgreement || null;
    this.token = token;
    if (this.token && this.config.userKey) {
      await this.storeToken(this.token, this.config.userKey).catch(() => {});
      this.config.users[this.config.userKey] = this.accountSnapshot();
      await this.ensureLocalUser();
    }
    await this.save();
    this.scheduleTimedSync();
    return this.publicState();
  }

  async uninstallCleanup() {
    const keys = Object.keys(this.config?.users || {});
    if (this.config?.userKey) keys.push(this.config.userKey);
    for (const key of new Set(keys)) await this.clearToken(key).catch(() => {});
    if (this.autoTimer) clearTimeout(this.autoTimer);
    if (this.scheduleTimer) clearTimeout(this.scheduleTimer);
    this.autoTimer = null;
    this.scheduleTimer = null;
    this.config = null;
    this.token = null;
    this.dataKey = null;
    await rm(this.dataDir, { recursive: true, force: true }).catch(() => {});
    const profileDir = process.env.DSH_PROFILE_DIR
      || (process.env.DSH_HOME && process.env.DSH_PROFILE
        ? path.join(process.env.DSH_HOME, 'profiles', process.env.DSH_PROFILE)
        : null);
    let profileUpdated = false;
    if (profileDir) {
      try {
        const packageFile = path.join(profileDir, 'package.json');
        const pkg = await readJson(packageFile, null);
        // Both names: an install that predates the 0.9.0 rename still cleans up.
        const packageNames = ['dsh-chat-syncer', 'dsh-chat-sync'];
        if (pkg && typeof pkg === 'object') {
          for (const packageName of packageNames) {
            if (pkg.dependencies && pkg.dependencies[packageName]) {
              delete pkg.dependencies[packageName];
            }
          }
          const bundles = pkg.dsh?.profile?.bundles;
          if (Array.isArray(bundles)) {
            pkg.dsh.profile.bundles = bundles.filter((bundle) => !packageNames.includes(bundle));
          }
          await writeJson(packageFile, pkg, { mode: 0o600 });
          profileUpdated = true;
        }
        for (const packageName of packageNames) {
          await rm(path.join(profileDir, 'node_modules', packageName), { recursive: true, force: true }).catch(() => {});
        }
      } catch {
        /* The plugin manager may already have removed the files. */
      }
    }
    await rm(this.dataDir, { recursive: true, force: true }).catch(() => {});
    const delayedCleanup = setTimeout(() => {
      void rm(this.dataDir, { recursive: true, force: true }).catch(() => {});
    }, 2500);
    if (typeof delayedCleanup.unref === 'function') delayedCleanup.unref();
    return { ok: true, profileUpdated, dataCleared: true };
  }

  async deleteAccount(input = {}) {    const userKey = String(input.userKey ?? '');
    if (!userKey || !this.config?.users?.[userKey]) {
      throw new ServiceError('本机没有这个历史登录用户', 'user-not-found');
    }
    await this.clearToken(userKey);
    delete this.config.users[userKey];
    await rm(path.join(this.usersDir, userKey), { recursive: true, force: true }).catch(() => {});
    if (this.config.userKey === userKey) {
      this.config.account = null;
      this.config.repo = null;
      this.config.userKey = null;
      this.config.displayName = '';
      this.config.agreement = null;
      this.config.encryption = null;
      this.config.lastSeenRevision = '';
      this.config.lastPushRevision = '';
      this.config.lastPushedManifestHash = '';
      this.config.remoteHead = null;
      this.config.stats = null;
      this.token = null;
      this.dataKey = null;
    }
    await this.save();
    this.scheduleTimedSync();
    return { state: this.publicState() };
  }

  userBase() {
    if (!this.config?.userKey) throw new ServiceError('尚未登录仓库账号', 'login-required');
    return `users/${this.config.userKey}`;
  }

  // ---------------------------------------------------------------------
  // Token storage
  // ---------------------------------------------------------------------

  tokenRecordId(userKey) {
    return `acct-${sha256(String(userKey || 'account')).slice(0, 20)}`;
  }

  async readStoredToken(userKey = this.config?.userKey) {
    if (this.token && userKey === this.config?.userKey) return this.token;
    if (!userKey) return null;
    const credentials = this.getService('credentials');
    if (credentials && typeof credentials.readRecord === 'function') {
      try {
        const recordId = this.tokenRecordId(userKey);
        // The 0.9.0 rename moved the record key; read the old one as a fallback.
        for (const key of [`dsh-chat-syncer/${recordId}`, `dsh-chat-sync/${recordId}`]) {
          const record = await credentials.readRecord(key);
          const value = record?.payload?.token;
          if (typeof value === 'string' && value.trim()) return value.trim();
        }
      } catch {
        /* Fall back to the legacy active record or the local secrets file. */
      }
      if (userKey === this.config?.userKey) {
        try {
          const legacy = await credentials.readRecord('dsh-chat-syncer/account');
          const value = legacy?.payload?.token;
          if (typeof value === 'string' && value.trim()) return value.trim();
        } catch {
          /* ignore */
        }
      }
    }
    const secrets = await readJson(this.secretsFile, { tokens: {} });
    const value = secrets?.tokens?.[userKey];
    return typeof value === 'string' && value.trim() ? value.trim() : null;
  }

  async storeToken(token, userKey = this.config?.userKey) {
    if (!userKey) return;
    const credentials = this.getService('credentials');
    if (credentials && typeof credentials.modifyRecord === 'function') {
      try {
        await credentials.modifyRecord(`dsh-chat-syncer/${this.tokenRecordId(userKey)}`, async () => ({
          kind: 'grant',
          payload: {
            token,
            provider: this.config.provider,
            login: this.config.account?.login,
            savedAt: nowIso(),
          },
        }));
        return;
      } catch {
        /* Use the local secrets file when the credential service is unavailable. */
      }
    }
    const secrets = await readJson(this.secretsFile, { tokens: {} });
    secrets.tokens = secrets.tokens && typeof secrets.tokens === 'object' ? secrets.tokens : {};
    secrets.tokens[userKey] = token;
    await writeJson(this.secretsFile, secrets, { mode: 0o600 });
  }

  async clearToken(userKey = this.config?.userKey) {
    if (!userKey) return;
    const credentials = this.getService('credentials');
    if (credentials && typeof credentials.deleteRecord === 'function') {
      try {
        await credentials.deleteRecord(`dsh-chat-syncer/${this.tokenRecordId(userKey)}`);
      } catch {
        /* ignore */
      }
      if (userKey === this.config?.userKey) {
        try {
          await credentials.deleteRecord('dsh-chat-syncer/account');
        } catch {
          /* ignore */
        }
      }
    }
    try {
      const secrets = await readJson(this.secretsFile, { tokens: {} });
      if (secrets?.tokens) delete secrets.tokens[userKey];
      await writeJson(this.secretsFile, secrets, { mode: 0o600 });
    } catch {
      /* ignore */
    }
    if (userKey === this.config?.userKey) this.token = null;
  }

  getService(name) {
    try {
      return this.ctx.get(name) ?? null;
    } catch {
      return null;
    }
  }

  // ---------------------------------------------------------------------
  // Public state
  // ---------------------------------------------------------------------

  agreementState() {
    const accepted = isValidAgreement(this.config?.agreement);
    return {
      ...agreementPublicInfo(accepted),
      acceptedAt: this.config?.agreement?.acceptedAt ?? null,
      required: Boolean(this.config?.account) && !accepted,
    };
  }

  publicState() {
    const config = this.config ?? this.defaultConfig();
    const loggedIn = Boolean(config.account && config.repo && this.token);
    const remoteEncrypted = Boolean(config.remoteHead?.encrypted);
    const encryptionEnabled = Boolean(config.encryption?.enabled || remoteEncrypted);
    const encryption = encryptionEnabled
      ? {
        enabled: true,
        algorithm: config.encryption?.algorithm || 'AES-256-GCM',
        locked: !this.dataKey,
        keyFingerprint: this.dataKey ? keyFingerprint(this.dataKey) : null,
        recovery: Boolean(config.encryption?.recovery) || remoteEncrypted,
        local: Boolean(config.encryption?.enabled),
      }
      : { enabled: false, algorithm: null, locked: false, keyFingerprint: null, recovery: false, local: false };
    return {
      ok: true,
      version: PLUGIN_VERSION,
      dshUser: config.device?.username || deviceIdentity().username || '',
      loggedIn,
      needsToken: Boolean(config.account && config.repo && !this.token),
      provider: config.provider,
      account: config.account
        ? {
          provider: config.account.provider,
          id: config.account.id,
          login: config.account.login,
          name: config.account.name,
          displayName: config.displayName || config.account.displayName || config.account.login,
          avatarUrl: config.account.avatarUrl,
          htmlUrl: config.account.htmlUrl,
        }
        : null,
      repo: config.repo
        ? {
          provider: config.repo.provider,
          owner: config.repo.owner,
          name: config.repo.name,
          fullName: config.repo.fullName,
          private: Boolean(config.repo.private),
          defaultBranch: config.repo.defaultBranch,
          htmlUrl: config.repo.htmlUrl,
        }
        : null,
      userKey: config.userKey,
      displayName: config.displayName || config.account?.login || '',
      device: {
        id: config.device?.id,
        name: config.device?.name,
        platform: config.device?.platform,
        arch: config.device?.arch,
        os: config.device?.os,
        username: config.device?.username,
        hostname: config.device?.hostname,
        mac: config.device?.mac,
        ip: config.device?.ip,
        osVersion: config.device?.osVersion,
        uniqueId: config.device?.uniqueId,
        fingerprint: config.device?.fingerprint,
        customName: Boolean(config.device?.customName),
        createdAt: config.device?.createdAt,
      },
      autoSync: config.autoSync !== false,
      scheduledSync: config.scheduledSync !== false,
      smartSync: config.smartSync !== false,
      syncInterval: SCHEDULE_INTERVALS[config.syncInterval] ? config.syncInterval : '3h',
      autoUpdateMode: config.autoUpdateMode === 'prompt' || config.autoUpdateMode === 'install'
        ? config.autoUpdateMode
        : 'off',
      syncMode: config.syncMode === 'incremental' ? 'incremental' : 'overwrite',
      autoCreateWorkspaceDirs: config.autoCreateWorkspaceDirs !== false,
      agreement: this.agreementState(),
      encryption,
      sync: {
        lastSeenRevision: config.lastSeenRevision || '',
        lastSeenShort: shortRevision(config.lastSeenRevision),
        lastPushRevision: config.lastPushRevision || '',
        lastPushShort: shortRevision(config.lastPushRevision),
        lastCheckAt: config.lastCheckAt,
        lastPushAt: config.lastPushAt,
        lastCompletedAt: config.lastCompletedAt,
        lastError: config.lastError,
        remoteHead: config.remoteHead,
        relation: config.lastRelation || 'same',
        smartSync: config.smartSync !== false,
        scheduledPaused: Boolean(config.scheduledPaused),
        unchangedScheduledCount: Number(config.unchangedScheduledCount || 0),
        lastScheduledPauseAt: config.lastScheduledPauseAt || null,
        busy: Boolean(this.pushInFlight),
        pendingWorkspaceCount: Array.isArray(config.pendingWorkspaces) ? config.pendingWorkspaces.length : 0,
      },
      stats: config.stats || {
        sessions: 0,
        workspaces: 0,
        bytes: 0,
        packageBytes: 0,
      },
      providers: Object.fromEntries(Object.keys(PROVIDERS).map((key) => [key, providerPublicInfo(key)])),
      paths: {
        sessions: displayPath(this.sessionsRoot),
        data: displayPath(this.dataDir),
      },
      accounts: Object.entries(config.users || {})
        .filter(([key, entry]) => entry && entry.account && entry.repo)
        .map(([key, entry]) => ({
          userKey: key,
          provider: entry.provider,
          login: entry.account.login,
          displayName: entry.displayName || entry.account.displayName || entry.account.login,
          repo: entry.repo.fullName,
          active: key === config.userKey,
        }))
        .sort((left, right) => Number(right.active) - Number(left.active) || left.login.localeCompare(right.login)),
      busy: Boolean(this.pushInFlight),
    };
  }

  setError(error) {
    this.config.lastError = error ? errorMessage(error) : null;
  }

  // ---------------------------------------------------------------------
  // Authentication and repository setup
  // ---------------------------------------------------------------------

  requireAccount() {
    if (!this.config?.account || !this.config?.userKey) {
      throw new ServiceError('请先登录 Gitee 或 GitHub 账号', 'login-required');
    }
  }

  requireAuth() {
    this.requireAccount();
    if (!this.token) throw new ServiceError('登录状态已失效，请重新登录', 'login-required');
  }

  requireAgreement() {
    if (!isValidAgreement(this.config?.agreement)) {
      throw new ServiceError('上传会话前需要阅读并同意数据上传协议', 'agreement-required');
    }
  }

  client() {
    this.requireAuth();
    return new RepoClient({
      provider: this.config.provider,
      token: this.token,
      owner: this.config.account.login,
      repo: this.config.repo.name,
      branch: this.config.repo.defaultBranch,
    });
  }

  async checkTokenPermissions(input = {}) {
    const provider = String(input.provider ?? 'gitee').toLowerCase();
    if (!PROVIDERS[provider]) throw new ServiceError('请选择 Gitee 或 GitHub', 'provider');
    const token = String(input.token ?? '').trim();
    if (!token) throw new ServiceError('请先粘贴访问令牌', 'token-required');
    const client = new RepoClient({ provider, token, owner: '', repo: '' });
    let inspected;
    try {
      inspected = await client.inspectToken();
    } catch (error) {
      throw normalizeError(error);
    }
    const account = inspected.account;
    if (!account.login) throw new ServiceError('平台没有返回账号信息，请检查令牌', 'account');
    const required = provider === 'gitee' ? ['projects'] : ['repo'];
    const requiredDetail = provider === 'gitee'
      ? 'Gitee 至少需要 projects 权限（仓库读写 + 创建私有仓库）'
      : 'GitHub Classic 至少需要 repo；Fine-grained 至少需要 Contents 读写 + Administration 读写';
    const scopes = inspected.scopes;
    let probe = null;
    if (scopes.length === 0) {
      try {
        probe = await client.probeRepositoryAccess();
      } catch {
        probe = null;
      }
    }
    const missing = scopes.length > 0
      ? required.filter((scope) => !scopes.includes(scope))
      : [];
    let status = 'unknown';
    let message = `平台没有返回权限列表。${requiredDetail}，登录时还会实际验证一次。`;
    if (scopes.length > 0) {
      if (missing.length > 0) {
        status = 'missing';
        message = `令牌缺少必要权限：${missing.join(', ')}。请重新创建令牌并勾选对应权限。`;
      } else {
        status = 'ok';
        message = `权限检查通过：${scopes.join(', ')}`;
      }
    } else if (probe && probe.ok === false) {
      status = 'missing';
      missing.push(...required);
      message = `令牌无法读取仓库列表，可能缺少 ${required.join(', ')} 权限。请重新创建令牌并勾选对应权限。`;
    } else if (probe && probe.ok === true) {
      message = `基础读取权限已通过；平台没有返回完整权限列表。${requiredDetail}，写入/创建私有仓库会在登录时实际验证。`;
    }
    return {
      ok: true,
      provider,
      account,
      scopes,
      required,
      requiredDetail,
      probe,
      status,
      missing,
      message,
    };
  }

  async login(input = {}) {
    if (this.autoTimer) {
      clearTimeout(this.autoTimer);
      this.autoTimer = null;
    }
    this.saveActiveUser();
    const knownUsers = this.config?.users || {};
    const globalSignedAgreement = this.config?.signedAgreement || null;
    const provider = String(input.provider ?? 'gitee').toLowerCase();
    if (!PROVIDERS[provider]) throw new ServiceError('请选择 Gitee 或 GitHub', 'provider');
    const token = String(input.token ?? '').trim();
    if (!token) throw new ServiceError('请填写访问令牌', 'token-required');
    let repoName = validateRepoName(input.repoName || this.config?.repo?.name || DEFAULT_REPO_NAME);

    const client = new RepoClient({ provider, token, owner: '', repo: repoName });
    let account;
    try {
      account = await client.getUser();
    } catch (error) {
      throw normalizeError(error);
    }
    if (!account.login) throw new ServiceError('平台没有返回账号信息，请检查令牌', 'account');
    client.owner = account.login;
    client.repo = repoName;

    /* Only when the user did not name a repository: keep a pre-0.9.3 account on
     * its existing repository instead of creating a second one. */
    if (!input.repoName && !this.config?.repo?.name) {
      repoName = await this.reuseLegacyRepo(client);
      client.repo = repoName;
    }

    let repo;
    try {
      repo = await client.ensureRepo(repoName);
    } catch (error) {
      throw normalizeError(error);
    }

    const userKey = userKeyFor(provider, account.login);
    const sameUser = this.config?.userKey === userKey;
    const existing = knownUsers[userKey];
    const previous = sameUser ? this.config : (existing || {});
    const sameRepo = Boolean(existing || sameUser)
      && (previous.repo?.fullName || '').toLowerCase() === String(repo.fullName || `${repo.owner}/${repo.name}`).toLowerCase();
    const displayName = clampText(
      input.displayName || previous.displayName || account.name || account.login,
      60,
    );
    this.config = {
      ...this.defaultConfig(),
      ...previous,
      provider,
      account: {
        ...account,
        displayName,
      },
      repo: {
        ...repo,
        provider,
        owner: repo.owner || account.login,
        name: repo.name || repoName,
        defaultBranch: repo.defaultBranch || client.branch,
        private: true,
      },
      userKey,
      displayName,
      autoSync: previous.autoSync !== false,
      scheduledSync: previous.scheduledSync !== false,
      syncInterval: SCHEDULE_INTERVALS[previous.syncInterval] ? previous.syncInterval : '3h',
      syncMode: previous.syncMode === 'incremental' ? 'incremental' : 'overwrite',
      users: knownUsers,
      signedAgreement: globalSignedAgreement,
    };
    if (!existing || !sameRepo) {
      this.config.agreement = null;
      this.config.encryption = null;
      this.config.lastSeenRevision = '';
      this.config.lastPushRevision = '';
      this.config.lastPushedManifestHash = '';
      this.config.lastCheckAt = null;
      this.config.lastPushAt = null;
      this.config.remoteHead = null;
      this.config.stats = null;
      this.dataKey = null;
    }
    if (!isValidAgreement(this.config.agreement) && isValidAgreement(globalSignedAgreement)) {
      this.config.agreement = {
        ...globalSignedAgreement,
        userKey: this.config.userKey,
        deviceId: this.config.device.id,
      };
    }
    this.token = token;
    this.setError(null);
    await this.storeToken(token, userKey);
    await this.ensureLocalUser();
    this.config.users[userKey] = this.accountSnapshot();
    try {
      await this.writeRemoteAccount(client);
      if (isValidAgreement(this.config.agreement)) {
        await this.writeRemoteAgreement(client);
      }
    } catch (error) {
      this.setError(error);
    }
    await this.save();
    this.scheduleTimedSync();

    let update = null;
    try {
      update = await this.checkInternal({ client });
    } catch (error) {
      this.setError(error);
      update = { ok: false, error: errorMessage(error), code: normalizeError(error).code };
      await this.save();
    }
    this.config.users[userKey] = this.accountSnapshot();
    await this.save();
    return {
      state: this.publicState(),
      update,
      repoCreated: Boolean(repo.created),
      switched: Boolean(existing) && !sameUser,
    };
  }

  /**
   * The data repository is called dsh-chat-syncer-data since 0.9.3. An account
   * that already has the pre-rename repository keeps using it, so synced history
   * does not silently split across two repositories.
   */
  async reuseLegacyRepo(client) {
    for (const name of LEGACY_REPO_NAMES) {
      try {
        const info = await client.getRepo(client.owner, name);
        if (info?.private) return name;
      } catch {
        /* Probe failures fall through to the new default name. */
      }
    }
    return DEFAULT_REPO_NAME;
  }

  async logout() {
    if (this.autoTimer) {
      clearTimeout(this.autoTimer);
      this.autoTimer = null;
    }
    if (this.scheduleTimer) {
      clearTimeout(this.scheduleTimer);
      this.scheduleTimer = null;
    }
    this.saveActiveUser();
    this.token = null;
    this.dataKey = null;
    this.config.account = null;
    this.config.repo = null;
    this.config.userKey = null;
    this.config.displayName = '';
    this.config.agreement = null;
    this.config.encryption = null;
    this.config.lastSeenRevision = '';
    this.config.lastPushRevision = '';
    this.config.lastPushedManifestHash = '';
    this.config.remoteHead = null;
    this.config.stats = null;
    this.setError(null);
    await this.save();
    return this.publicState();
  }

  async ensureLocalUser() {
    this.requireAccount();
    const directory = path.join(this.usersDir, this.config.userKey);
    await ensureDir(directory);
    const profile = {
      schema: SCHEMA_VERSION,
      provider: this.config.provider,
      account: this.config.account,
      repo: this.config.repo,
      userKey: this.config.userKey,
      displayName: this.config.displayName,
      updatedAt: nowIso(),
    };
    await writeJson(path.join(directory, 'profile.json'), profile, { mode: 0o600 });
    if (isValidAgreement(this.config.agreement)) {
      await writeJson(path.join(directory, 'agreement.json'), this.config.agreement, { mode: 0o600 });
    }
    return profile;
  }

  async writeRemoteAccount(client = this.client()) {
    this.requireAccount();
    const body = {
      schema: SCHEMA_VERSION,
      provider: this.config.provider,
      id: this.config.account.id,
      login: this.config.account.login,
      name: this.config.account.name,
      displayName: this.config.displayName,
      avatarUrl: this.config.account.avatarUrl,
      userKey: this.config.userKey,
      updatedAt: nowIso(),
    };
    await client.putJson(`${this.userBase()}/account.json`, body, '更新账号信息');
    return body;
  }

  async writeRemoteAgreement(client = this.client()) {
    this.requireAccount();
    if (!isValidAgreement(this.config.agreement)) return null;
    const body = {
      schema: SCHEMA_VERSION,
      ...this.config.agreement,
      userKey: this.config.userKey,
    };
    await client.putJson(`${this.userBase()}/agreement.json`, body, '记录数据上传协议');
    return body;
  }

  async acceptAgreement(input = {}) {
    this.requireAccount();
    const version = String(input.version ?? AGREEMENT_VERSION);
    if (version !== AGREEMENT_VERSION) {
      throw new ServiceError('协议版本已更新，请刷新页面后重新阅读', 'agreement-version');
    }
    this.config.agreement = {
      accepted: true,
      version: AGREEMENT_VERSION,
      hash: AGREEMENT_HASH,
      acceptedAt: nowIso(),
      userKey: this.config.userKey,
      deviceId: this.config.device.id,
    };
    this.config.signedAgreement = { ...this.config.agreement };
    await this.ensureLocalUser();
    let warning = null;
    try {
      await this.writeRemoteAgreement();
    } catch (error) {
      warning = `协议已在本机记录，但写入仓库失败：${errorMessage(error)}`;
    }
    await this.save();
    return { state: this.publicState(), warning };
  }

  async withdrawAgreement() {
    this.requireAuth();
    const key = this.config.userKey;
    try {
      const client = this.client();
      await client.deleteFile(`${this.userBase()}/agreement.json`, 'docs: withdraw dsh-chat-syncer consent');
    } catch {
      /* The local withdrawal still takes effect if the remote delete fails. */
    }
    this.config.agreement = null;
    this.config.signedAgreement = null;
    if (key) await rm(path.join(this.usersDir, key, 'agreement.json'), { force: true }).catch(() => {});
    await this.logout();
    return this.publicState();
  }

  async updateSettings(input = {}) {
    if (typeof input.autoSync === 'boolean') this.config.autoSync = input.autoSync;
    if (typeof input.scheduledSync === 'boolean') this.config.scheduledSync = input.scheduledSync;
    if (typeof input.smartSync === 'boolean') this.config.smartSync = input.smartSync;
    if (typeof input.syncInterval === 'string' && SCHEDULE_INTERVALS[input.syncInterval]) {
      this.config.syncInterval = input.syncInterval;
    }
    if (typeof input.scheduledSync === 'boolean' || typeof input.smartSync === 'boolean' || typeof input.syncInterval === 'string') {
      this.config.scheduledPaused = false;
      this.config.unchangedScheduledCount = 0;
    }
    if (input.autoUpdateMode === 'off' || input.autoUpdateMode === 'prompt' || input.autoUpdateMode === 'install') {
      this.config.autoUpdateMode = input.autoUpdateMode;
    }
    if (input.syncMode === 'overwrite' || input.syncMode === 'incremental') {
      this.config.syncMode = input.syncMode;
    }
    if (typeof input.autoCreateWorkspaceDirs === 'boolean') {
      this.config.autoCreateWorkspaceDirs = input.autoCreateWorkspaceDirs;
    }
    if (typeof input.deviceName === 'string' && input.deviceName.trim()) {
      this.config.device.name = clampText(input.deviceName, 80);
      this.config.device.customName = true;
    }
    if (typeof input.deviceUsername === 'string') {
      this.config.device.username = clampText(input.deviceUsername.trim(), 24);
    }
    if (typeof input.deviceHostname === 'string') {
      this.config.device.hostname = safeSegment(input.deviceHostname.trim(), 'device').slice(0, 24);
    }
    if ((typeof input.deviceUsername === 'string' || typeof input.deviceHostname === 'string')
      && !this.config.device.customName) {
      this.config.device.name = deviceNameFrom(this.config.device, this.config.device.platform, this.config.device.arch);
    }
    if (typeof input.deviceUsername === 'string' || typeof input.deviceHostname === 'string') {
      this.config.device.uniqueId = deviceUniqueId(this.config.device);
      this.config.device.fingerprint = deviceFingerprint(this.config.device);
    }
    await this.save();
    this.scheduleTimedSync();
    return { state: this.publicState() };
  }

  scheduleTimedSync() {
    if (this.scheduleTimer) {
      clearTimeout(this.scheduleTimer);
      this.scheduleTimer = null;
    }
    if (this.config?.scheduledSync === false) return;
    if (this.config?.scheduledPaused) return;
    const interval = SCHEDULE_INTERVALS[this.config?.syncInterval] || SCHEDULE_INTERVALS['3h'];
    this.scheduleTimer = setTimeout(() => {
      this.scheduleTimer = null;
      this.scheduleTimedSync();
      void this.runScheduledPush();
    }, interval);
    if (typeof this.scheduleTimer.unref === 'function') this.scheduleTimer.unref();
  }

  async runScheduledPush() {
    if (this.config?.scheduledSync === false) return;
    if (this.config?.scheduledPaused) return;
    if (!this.config?.account || !this.config?.repo || !this.token) return;
    if (!isValidAgreement(this.config?.agreement)) return;
    if ((this.config.encryption?.enabled || this.config.remoteHead?.encrypted) && !this.dataKey) return;
    if (this.pushInFlight) return;
    try {
      const result = await this.push({ reason: 'scheduled' });
      if (this.config?.smartSync !== false) {
        if (result?.noop) {
          this.config.unchangedScheduledCount = Number(this.config.unchangedScheduledCount || 0) + 1;
          if (this.config.unchangedScheduledCount >= 2) {
            this.config.scheduledPaused = true;
            this.config.lastScheduledPauseAt = nowIso();
            this.scheduleTimedSync();
          }
        } else {
          this.config.unchangedScheduledCount = 0;
          this.config.scheduledPaused = false;
        }
        await this.save();
      }
    } catch (error) {
      this.setError(error);
      await this.save().catch(() => {});
    }
  }

  async updateCheck() {
    try {
      return await checkForUpdate();
    } catch (error) {
      throw normalizeError(error);
    }
  }

  async updateApply(version) {
    try {
      return await applyUpdate(String(version ?? ''));
    } catch (error) {
      throw normalizeError(error);
    }
  }

  // ---------------------------------------------------------------------
  // Encryption
  // ---------------------------------------------------------------------

  requireUnlocked(passphrase) {
    if (!this.config.encryption?.enabled) return;
    if (this.dataKey) return;
    if (!passphrase) {
      throw new ServiceError('加密已开启。请输入口令解锁后再同步。', 'encryption-locked');
    }
    try {
      this.dataKey = unwrapForPassphrase(passphrase, this.config.encryption.wrap);
    } catch (error) {
      throw normalizeError(error);
    }
  }

  async unlock(input = {}) {
    const passphrase = String(input.passphrase ?? '');
    if (!passphrase) throw new ServiceError('请输入口令', 'passphrase-required');
    if (this.config.encryption?.enabled) {
      this.requireUnlocked(passphrase);
      await this.save();
      return this.publicState();
    }
    if (!this.token) throw new ServiceError('请先重新登录账号', 'login-required');
    const client = this.client();
    const head = await this.readHead(client);
    if (!head?.encrypted) return this.publicState();
    const wrap = head.encryption?.wrap;
    if (!wrap) throw new ServiceError('仓库中的加密快照没有可用的口令包装信息', 'encryption-locked');
    try {
      this.dataKey = unwrapForPassphrase(passphrase, wrap);
    } catch (error) {
      throw normalizeError(error);
    }
    const recovery = await client.readJson(`${this.userBase()}/recovery.json`).catch(() => null);
    this.config.encryption = {
      enabled: true,
      algorithm: 'AES-256-GCM',
      wrap,
      recovery: recovery || null,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    this.setError(null);
    await this.save();
    return this.publicState();
  }

  async configureEncryption(input = {}) {
    const enabled = Boolean(input.enabled);
    if (!enabled) {
      const warning = this.config.remoteHead?.encrypted
        ? '本机加密已关闭，但仓库最新快照仍是加密包；为避免明文降级，提交会被拒绝。'
        : null;
      this.config.encryption = null;
      this.dataKey = null;
      await this.save();
      return { state: this.publicState(), warning };
    }
    this.requireAccount();
    const passphrase = validatePassphrase(input.passphrase, input.confirm);
    const dataKey = newDataKey();
    const wrap = wrapForPassphrase(passphrase, dataKey);
    const recovery = wrapForAccount(this.config.account, dataKey);
    this.config.encryption = {
      enabled: true,
      algorithm: 'AES-256-GCM',
      wrap,
      recovery,
      createdAt: this.config.encryption?.createdAt || nowIso(),
      updatedAt: nowIso(),
    };
    this.dataKey = dataKey;
    this.setError(null);
    let warning = null;
    if (this.token) {
      try {
        await this.client().putJson(
          `${this.userBase()}/recovery.json`,
          { schema: SCHEMA_VERSION, ...recovery, createdAt: nowIso() },
          '保存账号恢复文件',
        );
      } catch (error) {
        warning = `恢复文件暂未写入仓库：${errorMessage(error)}；下次提交会重试。`;
      }
    }
    await this.save();
    return { state: this.publicState(), warning };
  }

  async changePassphrase(input = {}) {
    this.requireAccount();
    if (!this.config.encryption?.enabled) {
      throw new ServiceError('当前没有开启加密', 'encryption-off');
    }
    const oldPassphrase = String(input.oldPassphrase ?? '');
    if (!this.dataKey) this.requireUnlocked(oldPassphrase);
    const next = validatePassphrase(input.passphrase, input.confirm);
    const wrap = wrapForPassphrase(next, this.dataKey);
    const recovery = wrapForAccount(this.config.account, this.dataKey);
    this.config.encryption = {
      ...this.config.encryption,
      wrap,
      recovery,
      updatedAt: nowIso(),
    };
    this.setError(null);
    let warning = null;
    if (this.token) {
      try {
        await this.client().putJson(
          `${this.userBase()}/recovery.json`,
          { schema: SCHEMA_VERSION, ...recovery, createdAt: nowIso() },
          '刷新账号恢复文件',
        );
      } catch (error) {
        warning = `恢复文件暂未更新：${errorMessage(error)}`;
      }
    }
    await this.save();
    return { state: this.publicState(), warning };
  }

  async recoverPassphrase(input = {}) {
    this.requireAccount();
    if (!this.token) throw new ServiceError('请先重新登录账号', 'login-required');
    const client = this.client();
    const recovery = await client.readJson(`${this.userBase()}/recovery.json`).catch(() => null);
    if (!recovery) throw new ServiceError('仓库中没有恢复文件，无法通过账号找回口令', 'no-recovery');
    let dataKey;
    try {
      dataKey = unwrapForAccount(this.config.account, recovery);
    } catch (error) {
      throw normalizeError(error);
    }
    const next = validatePassphrase(input.passphrase, input.confirm);
    this.dataKey = dataKey;
    this.config.encryption = {
      enabled: true,
      algorithm: 'AES-256-GCM',
      wrap: wrapForPassphrase(next, dataKey),
      recovery: wrapForAccount(this.config.account, dataKey),
      createdAt: this.config.encryption?.createdAt || nowIso(),
      updatedAt: nowIso(),
    };
    this.setError(null);
    await this.save();
    return { state: this.publicState() };
  }

  // ---------------------------------------------------------------------
  // Check, push, pull
  // ---------------------------------------------------------------------

  async readHead(client = this.client()) {
    const file = await client.getFile(`${this.userBase()}/common/HEAD.json`);
    if (!file) return null;
    let head;
    try {
      head = JSON.parse(file.buffer.toString('utf8'));
    } catch {
      throw new ServiceError('仓库中的 HEAD.json 不是合法 JSON', 'head-format');
    }
    if (!head || typeof head !== 'object' || typeof head.revision !== 'string') {
      throw new ServiceError('仓库中的 HEAD.json 缺少版本标识', 'head-format');
    }
    if (typeof head.dataFile !== 'string' || !head.dataFile.startsWith('users/') || head.dataFile.includes('..')) {
      throw new ServiceError('仓库中的 HEAD.json 指向了不安全的文件', 'head-format');
    }
    return head;
  }

  /**
   * The live workspace registry, when this profile has one.
   *
   * The plugin treats it as optional: headless and SDK profiles run without a
   * sidebar, and a plugin that hard-depended on the registry would fail to load
   * there.
   */
  workspaceRegistry() {
    const registry = this.getService('workspaceRegistry');
    if (!registry || typeof registry.create !== 'function') return null;
    return registry;
  }

  async runWorkspaceReconcile(entries) {
    const registry = this.workspaceRegistry();
    if (!registry) return null;
    try {
      return await reconcileWorkspaces({
        registry,
        entries,
        createDirectories: this.config?.autoCreateWorkspaceDirs !== false,
      });
    } catch (error) {
      /* A sidebar that cannot be repaired must never fail the pull itself. */
      return {
        available: true,
        attached: 0,
        already: 0,
        missing: [],
        failed: [],
        unreadable: 0,
        error: messageOf(error),
      };
    }
  }

  /**
   * Place every restored session in the workspace its header names, so a pull
   * is visible in the sidebar without a registry rebuild.
   */
  async reconcilePulledWorkspaces(files) {
    const entries = [];
    let unreadable = 0;
    for (const [relPath, data] of files) {
      if (!relPath.startsWith('sessions/')) continue;
      const header = parseSessionHeader(data);
      if (!header) {
        unreadable += 1;
        continue;
      }
      entries.push({ sessionId: header.id, cwd: header.cwd });
    }
    const report = await this.runWorkspaceReconcile(entries);
    if (!report) return null;
    report.unreadable = unreadable;
    return report;
  }

  /**
   * Retry the sessions a previous pull could not place, typically after the
   * user created the missing workspace folders.
   */
  async repairWorkspaces() {
    const pending = Array.isArray(this.config.pendingWorkspaces) ? this.config.pendingWorkspaces : [];
    const report = await this.runWorkspaceReconcile(pending);
    if (!report) {
      return { ok: true, workspace: null, state: this.publicState() };
    }
    this.config.pendingWorkspaces = pendingEntries(report);
    await this.save();
    return { ok: true, workspace: publicWorkspaceReport(report), state: this.publicState() };
  }

  async check(options = {}) {
    try {
      return await this.checkInternal(options);
    } catch (error) {
      this.setError(error);
      await this.save();
      throw normalizeError(error);
    }
  }

  async assertRepoPrivate(client = this.client()) {
    const info = await client.getRepo(this.config.account.login, this.config.repo.name);
    if (!info) {
      throw new ServiceError('找不到同步仓库，请检查令牌权限或仓库是否被删除', 'repo-missing');
    }
    if (!info.private) {
      throw new ServiceError(
        '当前同步仓库不是私有仓库，已拒绝同步。请先在 Gitee/GitHub 仓库设置中把仓库改为私有，再重试。',
        'repo-public',
      );
    }
    this.config.repo = {
      ...this.config.repo,
      fullName: info.fullName || this.config.repo.fullName,
      private: true,
      defaultBranch: info.defaultBranch || this.config.repo.defaultBranch,
      htmlUrl: info.htmlUrl || this.config.repo.htmlUrl,
    };
    return info;
  }

  async checkInternal(options = {}) {
    this.requireAuth();
    const client = options.client || this.client();
    await this.assertRepoPrivate(client);
    const head = await this.readHead(client);
    this.config.lastCheckAt = nowIso();
    if (!head) {
      this.config.remoteHead = null;
      this.config.lastRelation = 'same';
      this.setError(null);
      await this.save();
      return {
        ok: true,
        empty: true,
        available: false,
        upToDate: true,
        relation: 'same',
        head: null,
        localRevision: this.config.lastSeenRevision,
        state: this.publicState(),
      };
    }
    const scanned = await scanSessions(this.sessionsRoot);
    const localSetHash = sha256Object(
      scanned.records
        .map((record) => ({ relPath: record.relPath, sha256: record.sha256, size: record.size }))
        .sort((left, right) => left.relPath.localeCompare(right.relPath)),
    );
    const localUpdatedAt = scanned.records.reduce((latest, record) => Math.max(latest, Number(record.mtimeMs) || 0), 0)
      || Date.parse(this.config.lastPushAt || '') || 0;
    const remoteUpdatedAt = Date.parse(head.updatedAt || '') || 0;
    const remoteChanged = head.revision !== this.config.lastSeenRevision;
    const sameContent = Boolean(head.sessionSetHash) && head.sessionSetHash === localSetHash;
    let relation = 'same';
    if (!sameContent) {
      if (remoteChanged) {
        relation = localUpdatedAt > remoteUpdatedAt + 1000 ? 'diverged' : 'remote-newer';
      } else {
        relation = 'local-newer';
      }
    }
    const available = relation === 'remote-newer' || relation === 'diverged';
    this.config.lastRelation = relation;
    this.config.remoteHead = publicHead(head);
    this.setError(null);
    await this.save();
    return {
      ok: true,
      empty: false,
      available,
      upToDate: relation === 'same',
      relation,
      localSetHash,
      remoteSetHash: head.sessionSetHash || null,
      localChangedAt: localUpdatedAt ? new Date(localUpdatedAt).toISOString() : null,
      remoteChangedAt: remoteUpdatedAt ? new Date(remoteUpdatedAt).toISOString() : null,
      head: publicHead(head),
      localRevision: this.config.lastSeenRevision,
      remoteRevision: head.revision,
      firstCheck: options.firstCheck === true,
      state: this.publicState(),
    };
  }

  async commitHistory(limit = 20) {
    this.requireAuth();
    const commits = await this.client().listCommits(limit);
    return { ok: true, commits };
  }

  async collectBackupFiles(root, current = root, output = []) {
    let entries;
    try {
      entries = await readdir(current, { withFileTypes: true });
    } catch {
      return output;
    }
    for (const entry of entries) {
      const absolute = path.join(current, entry.name);
      if (entry.isDirectory()) {
        await this.collectBackupFiles(root, absolute, output);
      } else if (entry.isFile()) {
        const info = await stat(absolute).catch(() => null);
        if (info) {
          output.push({
            absolute,
            relPath: path.relative(root, absolute).split(path.sep).join('/'),
            size: info.size,
            mtimeMs: info.mtimeMs,
          });
        }
      }
    }
    return output;
  }

  async listBackups() {
    this.requireAccount();
    const backups = [];
    let entries;
    try {
      entries = await readdir(this.backupRoot, { withFileTypes: true });
    } catch {
      entries = [];
    }
    for (const entry of entries) {
      if (!entry.isDirectory() || !/^[0-9A-Za-z._-]+$/.test(entry.name)) continue;
      const root = path.join(this.backupRoot, entry.name);
      const files = await this.collectBackupFiles(root);
      if (files.length === 0) continue;
      const info = await stat(root).catch(() => null);
      backups.push({
        id: entry.name,
        createdAt: info?.mtime ? info.mtime.toISOString() : null,
        count: files.length,
        bytes: files.reduce((sum, file) => sum + file.size, 0),
        files: files.map((file) => ({ relPath: file.relPath, size: file.size })),
      });
    }
    backups.sort((left, right) => String(right.id).localeCompare(String(left.id)));
    return { ok: true, backups: backups.slice(0, 20) };
  }

  async restoreBackup(input = {}) {
    this.requireAccount();
    const backupId = String(input.id ?? '');
    if (!/^[0-9A-Za-z._-]+$/.test(backupId)) throw new ServiceError('备份标识无效', 'backup-id');
    const root = path.join(this.backupRoot, backupId);
    const files = await this.collectBackupFiles(root);
    if (files.length === 0) throw new ServiceError('备份不存在或为空', 'backup-empty');
    const live = this.getService('sessions');
    const liveIds = new Set();
    if (live && typeof live.list === 'function') {
      for (const session of live.list()) {
        if (session?.id) liveIds.add(String(session.id));
      }
    }
    let restored = 0;
    let skipped = 0;
    const conflicts = [];
    for (const file of files) {
      const parts = file.relPath.split('/');
      if (parts.length !== 3) continue;
      const [project, id, name] = parts;
      if (liveIds.has(id)) {
        skipped += 1;
        conflicts.push({ path: file.relPath, reason: 'session is open in this DSH instance' });
        continue;
      }
      let target;
      try {
        target = path.resolve(this.sessionsRoot, project, id, name);
        if (!target.startsWith(`${path.resolve(this.sessionsRoot)}${path.sep}`)) throw new Error('outside sessions root');
      } catch {
        skipped += 1;
        conflicts.push({ path: file.relPath, reason: 'unsafe backup path' });
        continue;
      }
      await ensureDir(path.dirname(target));
      await copyFile(file.absolute, target);
      restored += 1;
    }
    return { ok: true, id: backupId, restored, skipped, conflicts, requiresReload: restored > 0 };
  }

  memoLocalPath() {
    this.requireAccount();
    return path.join(this.usersDir, this.config.userKey, 'memo', 'memo.json');
  }

  memoRemotePath() {
    this.requireAccount();
    return `${this.userBase()}/memo/memo.json`;
  }

  async readMemoEntries(client = null) {
    const localFile = this.memoLocalPath();
    const local = await readJson(localFile, { entries: [] }).catch(() => ({ entries: [] }));
    let entries = Array.isArray(local?.entries) ? local.entries : [];
    if (client) {
      try {
        const remote = await client.readJson(this.memoRemotePath());
        if (remote && Array.isArray(remote.entries)) {
          const byId = new Map(entries.map((entry) => [entry.id, entry]));
          for (const entry of remote.entries) {
            if (!entry || typeof entry.id !== 'string') continue;
            const existing = byId.get(entry.id);
            if (!existing || String(entry.updatedAt || '') >= String(existing.updatedAt || '')) {
              byId.set(entry.id, entry);
            }
          }
          entries = [...byId.values()];
        }
      } catch {
        /* Use local memories when the remote file is unavailable. */
      }
    }
    await ensureDir(path.dirname(localFile));
    await writeJson(localFile, { schema: SCHEMA_VERSION, entries }, { mode: 0o600 });
    return entries;
  }

  async writeMemoEntries(entries, message) {
    const localFile = this.memoLocalPath();
    await ensureDir(path.dirname(localFile));
    await writeJson(localFile, { schema: SCHEMA_VERSION, entries }, { mode: 0o600 });
    try {
      await this.client().putJson(this.memoRemotePath(), { schema: SCHEMA_VERSION, entries }, message);
    } catch (error) {
      throw new ServiceError(`备忘录已保存到本机，但写入仓库失败：${errorMessage(error)}`, 'memo-remote');
    }
    return entries;
  }

  async memoList() {
    this.requireAccount();
    const entries = await this.readMemoEntries(this.token ? this.client() : null);
    return { ok: true, entries };
  }

  async memoAdd(input = {}) {
    this.requireAccount();
    this.requireAgreement();
    const text = clampText(String(input.text ?? '').trim(), 4000);
    if (!text) throw new ServiceError('备忘录内容不能为空', 'memo-empty');
    const entries = await this.readMemoEntries(this.client());
    const entry = {
      id: randomId('memo-'),
      text,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      withdrawn: false,
      author: this.config.device?.name || '',
      dshUser: this.config.device?.username || '',
    };
    entries.push(entry);
    await this.writeMemoEntries(entries, '新增备忘录');
    return { ok: true, entry, entries };
  }

  async memoUpdate(input = {}) {
    this.requireAccount();
    this.requireAgreement();
    const id = String(input.id ?? '');
    const text = clampText(String(input.text ?? '').trim(), 4000);
    if (!text) throw new ServiceError('备忘录内容不能为空', 'memo-empty');
    const entries = await this.readMemoEntries(this.client());
    const entry = entries.find((item) => item.id === id);
    if (!entry) throw new ServiceError('找不到这条备忘录', 'memo-not-found');
    entry.text = text;
    entry.updatedAt = nowIso();
    await this.writeMemoEntries(entries, '编辑备忘录');
    return { ok: true, entry, entries };
  }

  async memoDelete(input = {}) {
    this.requireAccount();
    this.requireAgreement();
    const ids = new Set((Array.isArray(input.ids) ? input.ids : [input.id]).map(String));
    const entries = (await this.readMemoEntries(this.client())).filter((entry) => !ids.has(entry.id));
    await this.writeMemoEntries(entries, '删除备忘录');
    return { ok: true, entries };
  }

  async memoWithdraw(input = {}) {
    this.requireAccount();
    this.requireAgreement();
    const id = String(input.id ?? '');
    const entries = await this.readMemoEntries(this.client());
    const entry = entries.find((item) => item.id === id);
    if (!entry) throw new ServiceError('找不到这条备忘录', 'memo-not-found');
    entry.withdrawn = !entry.withdrawn;
    entry.withdrawnAt = entry.withdrawn ? nowIso() : null;
    entry.updatedAt = nowIso();
    await this.writeMemoEntries(entries, entry.withdrawn ? '撤回备忘录' : '恢复备忘录');
    return { ok: true, entry, entries };
  }

  async memoClear() {
    this.requireAccount();
    this.requireAgreement();
    await this.writeMemoEntries([], '清空备忘录');
    return { ok: true, entries: [] };
  }

  async listSessions() {
    this.requireAccount();    const scanned = await scanSessions(this.sessionsRoot);
    const live = this.getService('sessions');
    const liveIds = new Set();
    if (live && typeof live.list === 'function') {
      for (const session of live.list()) {
        if (session?.id) liveIds.add(String(session.id));
      }
    }
    return {
      ok: true,
      sessions: scanned.records.map((record) => ({
        project: record.project,
        id: record.id,
        file: record.file,
        relPath: record.relPath,
        size: record.size,
        updatedAt: record.updatedAt,
        live: liveIds.has(record.id),
      })),
      totalBytes: scanned.totalBytes,
      workspaces: scanned.workspaces,
    };
  }

  async flushSessions() {
    const persistence = this.getService('sessionPersistence');
    if (persistence && typeof persistence.flushAll === 'function') {
      await persistence.flushAll();
      return;
    }
    const sessions = this.getService('sessions');
    if (sessions && typeof sessions.list === 'function' && typeof sessions.flush === 'function') {
      const live = sessions.list();
      for (const session of live) {
        try {
          await sessions.flush(session);
        } catch {
          /* A closing session may race the flush; its last committed events are still useful. */
        }
      }
    }
  }

  buildProfile() {
    return {
      schema: SCHEMA_VERSION,
      provider: this.config.provider,
      account: this.config.account,
      repo: this.config.repo,
      userKey: this.config.userKey,
      displayName: this.config.displayName,
      agreement: this.config.agreement,
      device: this.config.device,
      exportedAt: nowIso(),
    };
  }

  async push(options = {}) {
    if (this.pushInFlight) {
      return this.pushInFlight;
    }
    this.pushInFlight = this.pushInternal(options).finally(() => {
      this.pushInFlight = null;
    });
    return this.pushInFlight;
  }

  async pushInternal(options = {}) {
    /* The push mode is per call, not a global switch:
     * - all sessions selected -> "force" replaces the shared snapshot (default);
     * - a partial selection can only merge, so it is switched to "incremental". */
    const requested = options.mode === 'incremental' || options.mode === 'force'
      ? options.mode
      : options.force === true ? 'force' : null;
    const partial = options.allSelected === false;
    let mode = requested || 'incremental';
    const modeAdjusted = partial && mode === 'force';
    if (modeAdjusted) mode = 'incremental';
    const force = mode === 'force';
    const reason = options.reason === 'auto' ? 'auto' : options.reason === 'scheduled' ? 'scheduled' : 'manual';
    try {
      this.requireAuth();
      this.requireAgreement();
      if (this.config.encryption?.enabled && !this.dataKey) {
        this.requireUnlocked(options.passphrase);
      }
      const client = this.client();
      await this.assertRepoPrivate(client);
      const remoteHead = await this.readHead(client);
      if (remoteHead?.encrypted && !this.dataKey) {
        const wrap = remoteHead.encryption?.wrap;
        if (options.passphrase && wrap) {
          try {
            this.dataKey = unwrapForPassphrase(options.passphrase, wrap);
          } catch (error) {
            throw normalizeError(error);
          }
          this.config.encryption = {
            enabled: true,
            algorithm: 'AES-256-GCM',
            wrap,
            recovery: this.config.encryption?.recovery || null,
            createdAt: this.config.encryption?.createdAt || nowIso(),
            updatedAt: nowIso(),
          };
        } else {
          throw new ServiceError(
            '仓库中的最新快照已加密。请输入口令解锁，或先在“加密扩展”中解锁后再提交。',
            'encryption-locked',
          );
        }
      }
      if (remoteHead?.encrypted && !this.config.encryption?.enabled && !force) {
        throw new ServiceError(
          '仓库中的最新快照已加密。请先解锁/开启加密后再提交，避免把明文上传到同一仓库。',
          'encryption-downgrade',
        );
      }
      /* An incremental push downloads the remote package and merges it, so a
       * remote-ahead revision is not a reason to block it. Replacing the shared
       * snapshot is different: that discards whatever other devices wrote, so
       * only a forced push has to be up to date first. */
      if (mode === 'force' && remoteHead && remoteHead.revision !== this.config.lastSeenRevision) {
        throw new ServiceError(
          '强制覆盖提交会替换云端快照，需要先拉取到最新版本；改用「增量合并」则可以直接推送。',
          'pull-required',
          { head: publicHead(remoteHead) },
        );
      }

      await this.flushSessions();

      let extraFiles = null;
      let extraRecords = [];
      let extraAttachments = null;
      if (mode === 'incremental' && remoteHead) {
        const remoteFile = await client.getFile(remoteHead.dataFile);
        if (!remoteFile) throw new ServiceError('仓库中找不到上一版快照包', 'package-missing');
        if (remoteHead.dataSha256
          && `sha256:${sha256(remoteFile.buffer)}` !== `sha256:${remoteHead.dataSha256}`) {
          throw new ServiceError('仓库上一版快照包校验失败', 'package-corrupt');
        }
        const parsedRemote = parseBundle(remoteFile.buffer, {
          dataKey: this.dataKey,
          passphrase: options.passphrase || '',
        });
        extraFiles = new Map(
          [...parsedRemote.files.entries()].filter(([filePath]) => filePath.startsWith('sessions/')),
        );
        extraAttachments = new Map(
          [...parsedRemote.files.entries()]
            .filter(([filePath]) => filePath.startsWith('attachments/'))
            .map(([filePath, data]) => [`sha256:${filePath.slice('attachments/'.length)}`, data]),
        );
        extraRecords = parsedRemote.manifest.sessions.filter(
          (record) => record && typeof record.relPath === 'string' && record.relPath.startsWith('sessions/'),
        );
      }

      const encrypted = Boolean(this.config.encryption?.enabled);
      const bundle = await buildBundle({
        sessionsRoot: this.sessionsRoot,
        attachmentsRoot: this.attachmentsRoot,
        user: {
          ...this.config.account,
          provider: this.config.provider,
          displayName: this.config.displayName,
          userKey: this.config.userKey,
        },
        device: this.config.device,
        agreement: this.config.agreement,
        purpose: 'sync',
        encrypt: encrypted,
        dataKey: encrypted ? this.dataKey : null,
        passphrase: options.passphrase || '',
        sessionRelPaths: Array.isArray(options.sessionRelPaths) ? options.sessionRelPaths : undefined,
        extraFiles,
        extraRecords,
        extraAttachments,
      });

      /* Identical content is a no-op in both modes: "force" describes what a push
       * replaces, not a reason to rewrite an unchanged snapshot. */
      const unchanged = Boolean(remoteHead)
        && Boolean(remoteHead.encrypted) === bundle.encrypted
        && (
          Boolean(remoteHead.sessionSetHash)
          && remoteHead.sessionSetHash === bundle.sessionSetHash
          || (
            bundle.manifestHash === this.config.lastPushedManifestHash
            && remoteHead.revision === this.config.lastPushRevision
          )
        );
      if (unchanged) {
        this.setError(null);
        await this.save();
        return {
          ok: true,
          noop: true,
          mode,
          modeAdjusted,
          partial,
          state: this.publicState(),
          revision: this.config.lastPushRevision,
        };
      }

      const base = this.userBase();
      const dataPath = `${base}/common/data/${bundle.fileName}`;
      const previousDataPath = remoteHead?.dataFile && remoteHead.dataFile.startsWith(`${base}/common/data/`)
        ? remoteHead.dataFile
        : null;
      const headPath = `${base}/common/HEAD.json`;
      const manifestPath = `${base}/common/manifest.json`;
      const deviceBase = `${base}/devices/${this.config.device.id}`;
      const devicePath = `${deviceBase}/device.json`;
      const deviceManifestPath = `${deviceBase}/manifest.json`;
      const recoveryPath = `${base}/recovery.json`;

      await client.putFile(dataPath, bundle.bytes, `同步快照 ${shortRevision(bundle.revision)}`);
      if (!bundle.encrypted) {
        await client.putJson(manifestPath, bundle.manifest, '更新会话清单');
      } else {
        await client.deleteFile(manifestPath, '移除明文会话清单');
      }
      await this.writeRemoteAccount(client);
      if (isValidAgreement(this.config.agreement)) await this.writeRemoteAgreement(client);

      const deviceDocument = {
        schema: SCHEMA_VERSION,
        id: this.config.device.id,
        name: this.config.device.name,
        platform: this.config.device.platform,
        arch: this.config.device.arch,
        os: this.config.device.os,
        osVersion: this.config.device.osVersion,
        mac: this.config.device.mac,
        uniqueId: this.config.device.uniqueId,
        fingerprint: this.config.device.fingerprint,
        createdAt: this.config.device.createdAt,
        updatedAt: nowIso(),
        lastPushRevision: bundle.revision,
        lastPushAt: nowIso(),
        sessionCount: bundle.sessionCount,
        workspaceCount: bundle.workspaceCount,
        encrypted: bundle.encrypted,
      };
      await client.putJson(devicePath, deviceDocument, '更新设备信息');
      await client.putJson(
        deviceManifestPath,
        bundle.encrypted
          ? {
            schema: SCHEMA_VERSION,
            encrypted: true,
            revision: bundle.revision,
            sessionCount: bundle.sessionCount,
            workspaceCount: bundle.workspaceCount,
            updatedAt: nowIso(),
          }
          : bundle.manifest,
        '更新设备清单',
      );

      if (bundle.encrypted && this.config.encryption?.recovery) {
        await client.putJson(
          recoveryPath,
          {
            schema: SCHEMA_VERSION,
            ...this.config.encryption.recovery,
            createdAt: this.config.encryption.createdAt,
            updatedAt: nowIso(),
          },
          '更新口令恢复文件',
        );
      }

      const head = {
        schema: SCHEMA_VERSION,
        revision: bundle.revision,
        dataFile: dataPath,
        dataSha256: bundle.dataSha256,
        bytes: bundle.bytes.length,
        encrypted: bundle.encrypted,
        encryption: {
          enabled: bundle.encrypted,
          algorithm: bundle.encrypted ? 'AES-256-GCM' : null,
          /**
           * A passphrase-wrapped copy of the package data key. This is what
           * lets a second device decrypt with only the passphrase; the wrapper
           * is metadata, not plaintext session content.
           */
          wrap: bundle.encrypted ? (this.config.encryption?.wrap ?? null) : null,
        },
        manifestHash: bundle.manifestHash,
        sessionSetHash: bundle.sessionSetHash,
        sessionCount: bundle.sessionCount,
        workspaceCount: bundle.workspaceCount,
        updatedAt: nowIso(),
        updatedBy: {
          userKey: this.config.userKey,
          login: this.config.account.login,
          deviceId: this.config.device.id,
          deviceName: this.config.device.name,
        },
        user: {
          provider: this.config.provider,
          login: this.config.account.login,
          id: this.config.account.id,
          displayName: this.config.displayName,
        },
        agreement: this.config.agreement
          ? {
            version: this.config.agreement.version,
            hash: this.config.agreement.hash,
            acceptedAt: this.config.agreement.acceptedAt,
          }
          : null,
      };
      await client.putJson(headPath, head, `发布同步值 ${shortRevision(head.revision)}`);

      /* Now that HEAD points at the new immutable package, old trees can be
       * pruned. A failed HEAD write leaves the previous package untouched. */
      for (const stale of [
        previousDataPath,
        `${base}/common/data/latest.dsync`,
        `${base}/common/data/latest.dsync.enc`,
      ]) {
        if (!stale || stale === dataPath) continue;
        await client.deleteFile(stale, '移除旧同步包').catch(() => {});
      }

      this.config.lastPushRevision = bundle.revision;
      this.config.lastSeenRevision = bundle.revision;
      this.config.lastPushedManifestHash = bundle.manifestHash;
      this.config.lastRelation = 'same';
      this.config.scheduledPaused = false;
      this.config.unchangedScheduledCount = 0;
      this.config.lastPushAt = head.updatedAt;
      this.config.remoteHead = publicHead(head);
      this.config.stats = {
        sessions: bundle.sessionCount,
        workspaces: bundle.workspaceCount,
        bytes: bundle.totalBytes,
        packageBytes: bundle.bytes.length,
      };
      this.setError(null);
      await this.save();
      return {
        ok: true,
        noop: false,
        state: this.publicState(),
        revision: bundle.revision,
        head: publicHead(head),
        sessionCount: bundle.sessionCount,
        workspaceCount: bundle.workspaceCount,
        bytes: bundle.bytes.length,
        encrypted: bundle.encrypted,
        reason,
        mode,
        modeAdjusted,
        partial,
      };
    } catch (error) {
      this.setError(error);
      await this.save();
      throw normalizeError(error);
    }
  }

  async pull(options = {}) {
    try {
      return await this.pullInternal(options);
    } catch (error) {
      this.setError(error);
      await this.save();
      throw normalizeError(error);
    }
  }

  async pullInternal(options = {}) {
    /* Incremental is the default: add missing sessions and refresh the ones the
     * repository updated, never clobber a newer local log. "force" is the explicit
     * download-everything choice and overwrites same-path local sessions. */
    const mode = options.mode === 'force' || options.force === true ? 'force' : 'incremental';
    const forceOverwrite = mode === 'force';
    this.requireAuth();
    const client = this.client();
    await this.assertRepoPrivate(client);
    const head = await this.readHead(client);
    if (!head) {
      return { ok: true, empty: true, applied: false, mode, state: this.publicState() };
    }
    if (head.revision === this.config.lastSeenRevision && !forceOverwrite) {
      return {
        ok: true,
        upToDate: true,
        applied: false,
        head: publicHead(head),
        state: this.publicState(),
      };
    }
    if (head.encrypted && !this.dataKey) {
      const wrap = head.encryption?.wrap;
      if (options.passphrase && wrap) {
        try {
          this.dataKey = unwrapForPassphrase(options.passphrase, wrap);
        } catch (error) {
          throw normalizeError(error);
        }
      } else {
        this.requireUnlocked(options.passphrase);
      }
    }
    if (head.encrypted && !this.dataKey) {
      throw new ServiceError('这个快照已加密，需要口令才能解密', 'encryption-locked');
    }
    if (head.encrypted && !this.config.encryption?.enabled) {
      this.config.encryption = {
        enabled: true,
        algorithm: 'AES-256-GCM',
        wrap: head.encryption?.wrap || null,
        recovery: null,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      const recovery = await client.readJson(`${this.userBase()}/recovery.json`).catch(() => null);
      if (recovery) this.config.encryption.recovery = recovery;
    } else if (head.encrypted && !this.config.encryption?.recovery) {
      const recovery = await client.readJson(`${this.userBase()}/recovery.json`).catch(() => null);
      if (recovery) this.config.encryption.recovery = recovery;
    }
    const file = await client.getFile(head.dataFile);
    if (!file) throw new ServiceError('仓库中找不到快照包', 'package-missing');
    if (file.buffer.length > MAX_IMPORT_BYTES) throw new ServiceError('快照包超过大小限制', 'too-large');
    const digest = `sha256:${sha256(file.buffer)}`;
    if (head.dataSha256 && digest !== `sha256:${head.dataSha256}`) {
      throw new ServiceError('快照包校验失败（sha256 不一致）', 'package-corrupt');
    }
    let parsed;
    try {
      parsed = parseBundle(file.buffer, {
        passphrase: options.passphrase || '',
        dataKey: this.dataKey,
      });
    } catch (error) {
      const normalized = normalizeError(error);
      const canRetry = head.encrypted
        && options.passphrase
        && head.encryption?.wrap
        && (normalized.code === 'bad-key' || normalized.code === 'bad-passphrase');
      if (!canRetry) throw normalized;
      try {
        this.dataKey = unwrapForPassphrase(options.passphrase, head.encryption.wrap);
        parsed = parseBundle(file.buffer, { dataKey: this.dataKey });
      } catch (retryError) {
        throw normalizeError(retryError);
      }
    }
    if (head.encrypted && head.encryption?.wrap) {
      this.config.encryption = {
        enabled: true,
        algorithm: 'AES-256-GCM',
        wrap: head.encryption.wrap,
        recovery: this.config.encryption?.recovery || null,
        createdAt: this.config.encryption?.createdAt || nowIso(),
        updatedAt: nowIso(),
      };
    }
    if (parsed.manifest?.user?.userKey && parsed.manifest.user.userKey !== this.config.userKey) {
      throw new ServiceError('这个快照属于另一个用户目录，已拒绝导入', 'user-mismatch');
    }

    const live = this.getService('sessions');
    const liveIds = new Set();
    if (live && typeof live.list === 'function') {
      for (const session of live.list()) {
        if (session?.id) liveIds.add(String(session.id));
      }
    }
    /* A download may be limited to the sessions the user picked. Attachments
     * always travel: a selected session may reference any of them. */
    const selection = Array.isArray(options.sessionRelPaths) && options.sessionRelPaths.length
      ? new Set(options.sessionRelPaths.map(String))
      : null;
    const selectedFiles = selection
      ? new Map([...parsed.files].filter(([filePath]) => filePath.startsWith('attachments/')
        || (filePath.startsWith('sessions/') && selection.has(filePath))))
      : parsed.files;
    const selectedManifest = selection
      ? {
        ...parsed.manifest,
        sessions: (parsed.manifest.sessions || []).filter((record) => record && selection.has(String(record.relPath))),
      }
      : parsed.manifest;
    const result = await applySessionFiles({
      sessionsRoot: this.sessionsRoot,
      files: selectedFiles,
      manifest: selectedManifest,
      liveIds,
      backupRoot: this.backupRoot,
      allowOverwrite: true,
      forceOverwrite,
    });

    /* Attachments travel in the package. Anything the sender itself was missing
     * is filled in locally with a text placeholder, so a restored conversation
     * stays usable instead of failing every request that replays its history. */
    const bundledAttachments = new Map();
    for (const [filePath, data] of parsed.files) {
      if (!filePath.startsWith('attachments/')) continue;
      bundledAttachments.set(`sha256:${filePath.slice('attachments/'.length)}`, data);
    }
    const attachmentsResult = await applyAttachments({
      objectsRoot: this.attachmentsRoot,
      attachments: bundledAttachments,
    });
    const attachmentRepair = await repairSessionAttachments({
      sessionsRoot: this.sessionsRoot,
      objectsRoot: this.attachmentsRoot,
      backupRoot: this.backupRoot,
      relativePaths: (parsed.manifest.sessions || [])
        .map((record) => record && record.relPath)
        .filter((relPath) => typeof relPath === 'string' && relPath.startsWith('sessions/')),
      availableIds: new Set(bundledAttachments.keys()),
    });

    const workspaceReport = await this.reconcilePulledWorkspaces(parsed.files);
    this.config.pendingWorkspaces = pendingEntries(workspaceReport);

    const changed = result.added + result.updated;
    /* A pull acknowledges the revision it merged, even when some sessions were
     * skipped on purpose: "local is newer" and "open in this DSH instance" are
     * expected outcomes, and refusing to acknowledge them deadlocks the flow —
     * push keeps answering "pull first" while every pull keeps skipping them.
     * Only a conflict that means the package could not be placed (unsafe path,
     * non-regular target) leaves the revision unacknowledged. */
    const BENIGN_CONFLICT = /newer|open in this DSH instance|overwrite disabled/i;
    const benign = result.conflicts.every((item) => BENIGN_CONFLICT.test(String(item?.reason || '')));
    const ack = result.conflicts.length === 0 || benign;
    if (ack) {
      this.config.lastSeenRevision = head.revision;
      this.config.lastPushedManifestHash = parsed.manifest.contentHash || head.manifestHash || '';
      this.config.lastRelation = 'same';
    }
    this.config.lastCheckAt = nowIso();
    this.config.remoteHead = publicHead(head);
    this.config.stats = {
      sessions: parsed.manifest.totals?.sessions ?? parsed.manifest.sessions.length,
      workspaces: parsed.manifest.totals?.workspaces ?? 0,
      bytes: parsed.manifest.totals?.bytes ?? 0,
      packageBytes: file.buffer.length,
    };
    this.setError(null);
    await this.save();
    return {
      ok: true,
      applied: changed > 0,
      requiresReload: changed > 0,
      added: result.added,
      updated: result.updated,
      unchanged: result.unchanged,
      skipped: result.skipped,
      conflicts: result.conflicts,
      backups: result.backups,
      bytes: result.bytes,
      mode,
      attachments: attachmentsResult,
      repairedAttachments: attachmentRepair.replaced,
      attachmentRepair,
      ack,
      workspace: publicWorkspaceReport(workspaceReport),
      head: publicHead(head),
      state: this.publicState(),
    };
  }

  // ---------------------------------------------------------------------
  // User data management
  // ---------------------------------------------------------------------

  /**
   * Maintenance: repair sessions that were downloaded before attachments were
   * part of the package. Missing image references become placeholders; the
   * original log is copied under the backup root first.
   */
  async repairAttachments(options = {}) {
    const report = await repairSessionAttachments({
      sessionsRoot: this.sessionsRoot,
      objectsRoot: this.attachmentsRoot,
      backupRoot: this.backupRoot,
      dryRun: options.dryRun === true,
    });
    this.setError(null);
    await this.save();
    return { ok: true, ...report, state: this.publicState() };
  }

  /**
   * Sessions whose log exists on disk but that the workspace registry does not
   * list never reach the sidebar; a projection cache written while the log was
   * unreadable keeps showing an empty conversation even after a repair. This
   * action re-attaches them through the live registry and drops those caches.
   */
  async repairRegistrations(options = {}) {
    const homeDir = path.dirname(this.dataDir);
    const scanned = await scanSessions(this.sessionsRoot);
    const entries = [];
    let unreadable = 0;
    for (const record of scanned.records) {
      let data;
      try {
        data = await readSessionRecord(this.sessionsRoot, record);
      } catch {
        unreadable += 1;
        continue;
      }
      const header = parseSessionHeader(data);
      if (!header) { unreadable += 1; continue; }
      entries.push({ sessionId: header.id, cwd: header.cwd });
    }
    const snapshot = await registrySnapshot(homeDir);
    const unregistered = [];
    const missingWorkspace = [];
    for (const entry of entries) {
      const key = path.resolve(entry.cwd).toLowerCase();
      const ids = snapshot ? snapshot.get(key) : null;
      if (!ids) missingWorkspace.push({ sessionId: entry.sessionId, cwd: entry.cwd });
      else if (!ids.has(entry.sessionId)) unregistered.push({ sessionId: entry.sessionId, cwd: entry.cwd });
    }
    const report = {
      ok: true,
      available: snapshot !== null,
      dryRun: options.dryRun === true,
      sessions: entries.length,
      unreadable,
      unregistered: unregistered.length,
      missingWorkspace: missingWorkspace.length,
      items: [...unregistered, ...missingWorkspace].slice(0, 50),
    };
    if (options.dryRun) return { ...report, state: this.publicState() };

    const registry = this.workspaceRegistry();
    const reconcile = registry
      ? await this.runWorkspaceReconcile(entries.map(({ sessionId, cwd }) => ({ sessionId, cwd })))
      : null;
    const targets = [...new Set([...unregistered, ...missingWorkspace].map((item) => item.sessionId))];
    const cache = await clearProjectionCache(homeDir, targets);
    this.setError(null);
    await this.save();
    return {
      ...report,
      reconcile,
      cache,
      repaired: reconcile?.attached ?? 0,
      cacheCleared: cache.cleared.length,
      state: this.publicState(),
    };
  }

  /**   * The sessions inside the repository's latest manifest, grouped by workspace.
   * An encrypted package hides its manifest, so the caller falls back to
   * “everything in the package”.
   */
  async listRemoteSessions(input = {}) {
    this.requireAuth();
    const client = this.client();
    await this.assertRepoPrivate(client);
    const sha = String(input.sha || '').trim();
    const ref = sha || client.branch;
    const manifest = await client.readJson(`${this.userBase()}/common/manifest.json`, ref).catch(() => null);
    if (!manifest || !Array.isArray(manifest.sessions)) {
      return { ok: true, encrypted: true, sha, groups: [], state: this.publicState() };
    }
    const groups = new Map();
    for (const record of manifest.sessions) {
      const relPath = String(record?.relPath || '');
      if (!relPath.startsWith('sessions/')) continue;
      const parts = relPath.split('/');
      if (parts.length !== 4) continue;
      const project = parts[1];
      if (!groups.has(project)) groups.set(project, []);
      groups.get(project).push({
        relPath,
        project,
        id: parts[2],
        file: parts[3],
        size: Number(record.size) || 0,
        updatedAt: String(record.updatedAt || ''),
      });
    }
    return {
      ok: true,
      encrypted: false,
      sha,
      total: [...groups.values()].reduce((sum, list) => sum + list.length, 0),
      groups: [...groups.entries()].map(([project, sessions]) => ({ project, sessions })),
      state: this.publicState(),
    };
  }

  /**   * The last few snapshots are still reachable through Git even though the
   * working tree keeps only the latest package. Each version is the HEAD.json
   * as it stood in that commit.
   */
  async listVersions(input = {}) {
    this.requireAuth();
    const limit = Math.max(1, Math.min(10, Number(input.limit) || 3));
    const client = this.client();
    await this.assertRepoPrivate(client);
    const headPath = `${this.userBase()}/common/HEAD.json`;
    const commits = await client.listCommits(20, headPath);
    const versions = [];
    for (const commit of commits) {
      if (versions.length >= limit) break;
      if (!commit.sha) continue;
      const head = await client.readJson(headPath, commit.sha).catch(() => null);
      if (!head || !head.revision || !head.dataFile) continue;
      versions.push({
        sha: commit.sha,
        shortSha: commit.shortSha,
        message: commit.message,
        author: commit.author,
        date: commit.date,
        htmlUrl: commit.htmlUrl,
        revision: String(head.revision),
        updatedAt: String(head.updatedAt || ''),
        deviceName: String(head.updatedBy?.deviceName || ''),
        sessionCount: Number(head.sessionCount) || 0,
        workspaceCount: Number(head.workspaceCount) || 0,
        encrypted: Boolean(head.encrypted),
        bytes: Number(head.bytes) || 0,
        current: String(head.revision) === String(this.config.lastSeenRevision || ''),
      });
    }
    return { ok: true, versions, limit, state: this.publicState() };
  }

  /**
   * Download one historical snapshot by commit. The sync pointer is left alone:
   * importing an older revision is a recovery action, not a new sync position.
   */
  async pullVersion(input = {}) {
    this.requireAuth();
    const sha = String(input.sha || '').trim();
    if (!/^[0-9a-f]{7,40}$/i.test(sha)) throw new ServiceError('版本标识不合法', 'version');
    const mode = input.mode === 'force' ? 'force' : 'incremental';
    const client = this.client();
    await this.assertRepoPrivate(client);
    const headPath = `${this.userBase()}/common/HEAD.json`;
    const head = await client.readJson(headPath, sha).catch(() => null);
    if (!head || !head.dataFile) throw new ServiceError('这个版本没有可下载的快照', 'version-missing');
    const file = await client.getFile(head.dataFile, sha);
    if (!file) throw new ServiceError('仓库里找不到这个版本的快照包', 'package-missing');
    if (file.buffer.length > MAX_IMPORT_BYTES) throw new ServiceError('快照包超过大小限制', 'too-large');
    const digest = `sha256:${sha256(file.buffer)}`;
    if (head.dataSha256 && digest !== `sha256:${head.dataSha256}`) {
      throw new ServiceError('快照包校验失败（sha256 不一致）', 'package-corrupt');
    }
    const parsed = parseBundle(file.buffer, { passphrase: input.passphrase || '', dataKey: this.dataKey });
    if (parsed.manifest?.user?.userKey && parsed.manifest.user.userKey !== this.config.userKey) {
      throw new ServiceError('这个快照属于另一个用户目录，已拒绝导入', 'user-mismatch');
    }
    const live = this.getService('sessions');
    const liveIds = new Set();
    if (live && typeof live.list === 'function') {
      for (const session of live.list()) if (session?.id) liveIds.add(String(session.id));
    }
    const selection = Array.isArray(input.sessionRelPaths) && input.sessionRelPaths.length
      ? new Set(input.sessionRelPaths.map(String))
      : null;
    const selectedFiles = selection
      ? new Map([...parsed.files].filter(([filePath]) => filePath.startsWith('attachments/')
        || (filePath.startsWith('sessions/') && selection.has(filePath))))
      : parsed.files;
    const selectedManifest = selection
      ? {
        ...parsed.manifest,
        sessions: (parsed.manifest.sessions || []).filter((record) => record && selection.has(String(record.relPath))),
      }
      : parsed.manifest;
    const result = await applySessionFiles({
      sessionsRoot: this.sessionsRoot,
      files: selectedFiles,
      manifest: selectedManifest,
      liveIds,
      backupRoot: this.backupRoot,
      allowOverwrite: true,
      forceOverwrite: mode === 'force',
    });
    const bundledAttachments = new Map();
    for (const [filePath, data] of parsed.files) {
      if (!filePath.startsWith('attachments/')) continue;
      bundledAttachments.set(`sha256:${filePath.slice('attachments/'.length)}`, data);
    }
    const attachmentsResult = await applyAttachments({
      objectsRoot: this.attachmentsRoot,
      attachments: bundledAttachments,
    });
    const attachmentRepair = await repairSessionAttachments({
      sessionsRoot: this.sessionsRoot,
      objectsRoot: this.attachmentsRoot,
      backupRoot: this.backupRoot,
      relativePaths: (parsed.manifest.sessions || [])
        .map((record) => record && record.relPath)
        .filter((relPath) => typeof relPath === 'string' && relPath.startsWith('sessions/')),
      availableIds: new Set(bundledAttachments.keys()),
    });
    this.config.lastRelation = 'diverged';
    this.setError(null);
    await this.save();
    return {
      ok: true,
      mode,
      sha,
      revision: String(head.revision),
      updatedAt: String(head.updatedAt || ''),
      applied: result.added + result.updated > 0,
      added: result.added,
      updated: result.updated,
      unchanged: result.unchanged,
      skipped: result.skipped,
      conflicts: result.conflicts,
      backups: result.backups,
      attachments: attachmentsResult,
      repairedAttachments: attachmentRepair.replaced,
      attachmentRepair,
      requiresReload: true,
      state: this.publicState(),
    };
  }

  async rename(input = {}) {
    const displayName = clampText(input.displayName, 60);
    if (!displayName) throw new ServiceError('名称不能为空', 'name-required');
    this.config.displayName = displayName;
    if (this.config.account) this.config.account.displayName = displayName;
    await this.ensureLocalUser().catch(() => {});
    let warning = null;
    if (this.token) {
      try {
        await this.writeRemoteAccount();
      } catch (error) {
        warning = `本机名称已更新，但仓库中的账号信息暂未更新：${errorMessage(error)}`;
      }
    }
    await this.save();
    return { state: this.publicState(), warning };
  }

  async exportData(input = {}) {
    this.requireAccount();
    const passphrase = validatePassphrase(input.passphrase);
    const bundle = await buildBundle({
      sessionsRoot: this.sessionsRoot,
      user: {
        ...this.config.account,
        provider: this.config.provider,
        displayName: this.config.displayName,
        userKey: this.config.userKey,
      },
      device: this.config.device,
      agreement: this.config.agreement,
      purpose: 'export',
      profile: this.buildProfile(),
      encrypt: true,
      passphrase,
    });
    const stamp = new Date().toISOString().slice(0, 10);
    return {
      ok: true,
      fileName: `dsh-chat-syncer-${this.config.userKey}-${stamp}.dsync.enc`,
      bytes: bundle.bytes.length,
      encrypted: true,
      sessionCount: bundle.sessionCount,
      data: bundle.bytes.toString('base64'),
    };
  }

  async importData(input = {}) {
    const raw = String(input.data ?? '');
    if (!raw) throw new ServiceError('没有收到导入文件', 'empty-import');
    const passphrase = String(input.passphrase ?? '');
    if (!passphrase) throw new ServiceError('导入加密包需要输入导出口令', 'passphrase-required');
    const bytes = Buffer.from(raw.replace(/^data:[^,]+,/, ''), 'base64');
    if (bytes.length === 0) throw new ServiceError('导入文件为空', 'empty-import');
    if (bytes.length > MAX_IMPORT_BYTES) throw new ServiceError('导入文件超过大小限制', 'too-large');
    let parsed;
    try {
      parsed = parseBundle(bytes, {
        passphrase,
        dataKey: this.dataKey,
      });
    } catch (error) {
      throw normalizeError(error);
    }
    const live = this.getService('sessions');
    const liveIds = new Set();
    if (live && typeof live.list === 'function') {
      for (const session of live.list()) if (session?.id) liveIds.add(String(session.id));
    }
    const result = await applySessionFiles({
      sessionsRoot: this.sessionsRoot,
      files: parsed.files,
      manifest: parsed.manifest,
      liveIds,
      backupRoot: this.backupRoot,
      allowOverwrite: input.overwrite !== false,
      forceOverwrite: this.config.syncMode !== 'incremental',
    });

    let profileImported = false;
    let warning = null;
    const profile = parsed.profile;
    if (profile && typeof profile === 'object' && typeof profile.userKey === 'string') {
      const key = safeSegment(profile.userKey, 'user');
      const directory = path.join(this.usersDir, key);
      await ensureDir(directory);
      await writeJson(path.join(directory, 'profile.json'), profile, { mode: 0o600 });
      if (isValidAgreement(profile.agreement)) {
        await writeJson(path.join(directory, 'agreement.json'), profile.agreement, { mode: 0o600 });
      }
      profileImported = true;
      if (this.config.userKey === key && isValidAgreement(profile.agreement) && !isValidAgreement(this.config.agreement)) {
        this.config.agreement = profile.agreement;
      } else if (this.config.userKey !== key) {
        warning = '会话已导入；账号资料保存在本机用户目录。登录该账号后可继续同步。';
      }
    }

    const changed = result.added + result.updated;
    this.config.lastCheckAt = nowIso();
    await this.save();
    return {
      ok: true,
      applied: changed > 0,
      requiresReload: changed > 0,
      added: result.added,
      updated: result.updated,
      unchanged: result.unchanged,
      skipped: result.skipped,
      conflicts: result.conflicts,
      profileImported,
      warning,
      state: this.publicState(),
    };
  }

  async deleteData(input = {}) {
    this.requireAccount();
    const scope = String(input.scope ?? 'local');
    if (!['local', 'remote', 'both'].includes(scope)) {
      throw new ServiceError('未知的删除范围', 'delete-scope');
    }
    const confirmation = String(input.confirmation ?? '').trim();
    if (confirmation !== '删除' && confirmation.toUpperCase() !== 'DELETE') {
      throw new ServiceError('请输入“删除”或 DELETE 以确认此操作', 'confirmation');
    }
    let remote = null;
    if (scope === 'remote' || scope === 'both') {
      if (this.token) {
        remote = await this.client().deletePrefix(this.userBase(), '删除用户同步数据');
      }
    }
    if (scope === 'local' || scope === 'both') {
      const key = this.config.userKey;
      await rm(path.join(this.usersDir, key), { recursive: true, force: true }).catch(() => {});
      if (key && this.config.users) delete this.config.users[key];
      await this.clearToken();
      this.config.account = null;
      this.config.repo = null;
      this.config.userKey = null;
      this.config.displayName = '';
      this.config.agreement = null;
      this.config.encryption = null;
      this.config.lastSeenRevision = '';
      this.config.lastPushRevision = '';
      this.config.lastPushedManifestHash = '';
      this.config.remoteHead = null;
      this.config.stats = null;
      this.dataKey = null;
      this.setError(null);
    } else {
      this.config.lastSeenRevision = '';
      this.config.remoteHead = null;
    }
    await this.save();
    return { ok: true, scope, remote, state: this.publicState() };
  }

  // ---------------------------------------------------------------------
  // Session completion → debounced auto push
  // ---------------------------------------------------------------------

  handleSessionEvent(session, event) {
    if (!event || event.type !== 'turn/end') return;
    this.config.lastCompletedAt = nowIso();
    if (this.config.scheduledPaused) {
      this.config.scheduledPaused = false;
      this.config.unchangedScheduledCount = 0;
      this.scheduleTimedSync();
      this.save().catch(() => {});
    }
    if (this.config.autoSync === false) return;
    if (!this.config.account || !this.config.repo || !this.token) return;
    if (!isValidAgreement(this.config.agreement)) return;
    if ((this.config.encryption?.enabled || this.config.remoteHead?.encrypted) && !this.dataKey) {
      this.config.lastError = '加密已开启但尚未解锁，自动同步已暂停';
      this.save().catch(() => {});
      return;
    }
    this.scheduleAutoPush();
  }

  scheduleAutoPush() {
    if (this.autoTimer) clearTimeout(this.autoTimer);
    this.autoTimer = setTimeout(() => {
      this.autoTimer = null;
      if (this.config.autoSync === false) return;
      if (!isValidAgreement(this.config.agreement)) return;
      if (this.pushInFlight) return;
      if (Date.now() - this.lastAutoAt < 3000) return;
      this.lastAutoAt = Date.now();
      this.push({ reason: 'auto' }).catch(async (error) => {
        this.setError(error);
        await this.save().catch(() => {});
      });
    }, AUTO_PUSH_DELAY_MS);
    if (typeof this.autoTimer.unref === 'function') this.autoTimer.unref();
  }

  dispose() {
    if (this.autoTimer) clearTimeout(this.autoTimer);
    this.autoTimer = null;
    if (this.scheduleTimer) clearTimeout(this.scheduleTimer);
    this.scheduleTimer = null;
  }
}

export { AGREEMENT_TEXT, AGREEMENT_VERSION, AGREEMENT_HASH };


