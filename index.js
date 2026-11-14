/**
 * Host entry for dsh-chat-syncer.
 *
 * The browser half talks to three authenticated same-origin routes. No route
 * accepts a token or a local path from the browser, and no session body is ever
 * returned to the client except as an explicitly requested export download.
 */
import { existsSync, renameSync } from 'node:fs';
import { createRequire } from 'node:module';
import { homedir } from 'node:os';
import path from 'node:path';
import { SyncService } from './lib/service.js';

export const name = 'dsh-chat-syncer';
export const inject = ['webServer'];

const PLUGIN_ID = 'dsh-chat-syncer';
/** Published as dsh-chat-sync before 0.9.0; that data directory is adopted once. */
const LEGACY_PLUGIN_ID = 'dsh-chat-sync';
const ROUTE_PREFIX = `/${PLUGIN_ID}/api`;
const MAX_REQUEST_BYTES = 180 * 1024 * 1024;

function messageOf(error) {
  return error instanceof Error ? error.message : String(error);
}

function isLoopback(req) {
  const address = req.socket?.remoteAddress;
  return address === '127.0.0.1'
    || address === '::1'
    || address === '::ffff:127.0.0.1';
}

function sendJson(res, status, payload) {
  const body = JSON.stringify(payload);
  res.statusCode = status;
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.setHeader('cache-control', 'no-store');
  res.setHeader('x-content-type-options', 'nosniff');
  res.end(body);
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_REQUEST_BYTES) {
        reject(new Error('请求体超过 180 MB 上限'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('error', reject);
    req.on('end', () => {
      if (chunks.length === 0) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
      } catch {
        reject(new Error('请求体不是合法 JSON'));
      }
    });
  });
}

function publicError(error) {
  const code = error && typeof error === 'object' && 'code' in error ? error.code : 'internal';
  return {
    ok: false,
    code: code || 'internal',
    error: messageOf(error),
    details: error && typeof error === 'object' && 'details' in error ? error.details : undefined,
  };
}

function actionName(body) {
  return String(body?.action ?? '').trim();
}

/**
 * The plugin was called dsh-chat-sync before 0.9.0. Move that data directory into
 * place on first start, so tokens, settings, backups and the device identity follow
 * the rename. A failure here must never block startup: the plugin then starts empty.
 */
export function adoptLegacyDataDir(legacyDir, targetDir) {
  try {
    if (existsSync(targetDir) || !existsSync(legacyDir)) return;
    renameSync(legacyDir, targetDir);
  } catch {
    /* Starting empty is recoverable (the user signs in again); failing to boot is not. */
  }
}

/**
 * Relaunch DSH from a host plugin.
 *
 * `app.relaunch()` is scheduled *before* the process exits, so a failure to
 * obtain the Electron handle leaves the running app untouched. When DSH runs
 * the host outside the Electron main process the call reports
 * `restart-unsupported` and the UI falls back to the manual instruction.
 */
function restartAppHost() {
  try {
    const electron = createRequire(import.meta.url)('electron');
    const app = electron?.app || electron?.remote?.app;
    if (!app || typeof app.relaunch !== 'function' || typeof app.exit !== 'function') {
      return { ok: false, code: 'restart-unsupported', error: '当前宿主没有 Electron app 句柄' };
    }
    app.relaunch();
    setTimeout(() => { try { app.exit(0); } catch { /* already exiting */ } }, 400);
    return { ok: true, restarting: true };
  } catch (error) {
    return { ok: false, code: 'restart-unsupported', error: messageOf(error) };
  }
}

export function apply(ctx) {
  const dshHome = process.env.DSH_HOME && process.env.DSH_HOME.trim()
    ? process.env.DSH_HOME
    : path.join(homedir(), '.dsh');
  const dataDir = path.join(dshHome, PLUGIN_ID);
  adoptLegacyDataDir(path.join(dshHome, LEGACY_PLUGIN_ID), dataDir);
  const sessionsRoot = path.join(dshHome, 'sessions');
  const attachmentsRoot = path.join(dshHome, 'attachments', 'v1', 'objects');
  const service = new SyncService({ ctx, dataDir, sessionsRoot, attachmentsRoot });
  const ready = service.init().catch((error) => {
    try {
      ctx.logger?.error?.(`${PLUGIN_ID}: init failed: ${messageOf(error)}`);
    } catch {
      /* logging is optional */
    }
    throw error;
  });

  const connection = () => {
    try {
      return ctx.get('connection') || null;
    } catch {
      return null;
    }
  };

  const authorized = (req, res) => {
    const link = connection();
    if (link && typeof link.requestRejection === 'function') {
      try {
        const rejection = link.requestRejection({ headers: req.headers });
        if (rejection) {
          sendJson(res, Number(rejection) || 401, { ok: false, code: 'unauthorized', error: '未授权的本机连接' });
          return false;
        }
        return true;
      } catch {
        /* Fall through to the loopback fence. */
      }
    }
    if (!isLoopback(req)) {
      sendJson(res, 403, { ok: false, code: 'forbidden', error: '只允许本机访问同步接口' });
      return false;
    }
    return true;
  };

  const waitReady = async () => {
    await ready;
  };

  const stateHandler = async (req, res) => {
    if (!authorized(req, res)) return;
    if (req.method !== 'GET') {
      sendJson(res, 405, { ok: false, code: 'method', error: 'GET only' });
      return;
    }
    try {
      await waitReady();
      sendJson(res, 200, { ok: true, state: service.publicState() });
    } catch (error) {
      sendJson(res, 500, publicError(error));
    }
  };

  const actionHandler = async (req, res) => {
    if (!authorized(req, res)) return;
    if (req.method !== 'POST') {
      sendJson(res, 405, { ok: false, code: 'method', error: 'POST only' });
      return;
    }
    let body;
    try {
      body = await readJsonBody(req);
    } catch (error) {
      sendJson(res, 413, { ok: false, code: 'body', error: messageOf(error) });
      return;
    }
    const action = actionName(body);
    try {
      await waitReady();
      let result;
      switch (action) {
        case 'state':
          result = { ok: true, state: service.publicState() };
          break;
        case 'login':
          result = await service.login(body);
          break;
        case 'check-token':
          result = await service.checkTokenPermissions(body);
          break;
        case 'logout':
          result = { ok: true, state: await service.logout() };
          break;
        case 'switch-user':
          result = await service.switchUser(body);
          break;
        case 'delete-account':
          result = await service.deleteAccount(body);
          break;
        case 'clear-data':
          result = { ok: true, state: await service.clearAllData() };
          break;
        case 'initialize':
          result = { ok: true, state: await service.initializePlugin() };
          break;
        case 'uninstall-cleanup':
          result = await service.uninstallCleanup();
          break;
        case 'withdraw-agreement':
          result = { ok: true, state: await service.withdrawAgreement() };
          break;
        case 'check':
          result = await service.check({ manual: true });
          break;
        case 'sessions':
          result = await service.listSessions();
          break;
        case 'history':
          result = await service.commitHistory(body.limit);
          break;
        case 'backups':
          result = await service.listBackups();
          break;
        case 'restore-backup':
          result = await service.restoreBackup(body);
          break;
        case 'memo-list':
          result = await service.memoList();
          break;
        case 'memo-add':
          result = await service.memoAdd(body);
          break;
        case 'memo-update':
          result = await service.memoUpdate(body);
          break;
        case 'memo-delete':
          result = await service.memoDelete(body);
          break;
        case 'memo-withdraw':
          result = await service.memoWithdraw(body);
          break;
        case 'memo-clear':
          result = await service.memoClear();
          break;
        case 'push':
          result = await service.push({
            force: Boolean(body.force),
            mode: body.mode,
            allSelected: body.allSelected,
            passphrase: body.passphrase,
            sessionRelPaths: Array.isArray(body.sessionRelPaths) ? body.sessionRelPaths : undefined,
            reason: 'manual',
          });
          break;
        case 'remote-sessions':
          result = await service.listRemoteSessions({ sha: body.sha });
          break;
        case 'versions':
          result = await service.listVersions({ limit: body.limit });
          break;
        case 'pull-version':
          result = await service.pullVersion({
            sha: body.sha,
            mode: body.mode,
            passphrase: body.passphrase,
            sessionRelPaths: Array.isArray(body.sessionRelPaths) ? body.sessionRelPaths : undefined,
          });
          break;
        case 'restart-host':
          result = restartAppHost();
          break;
        case 'repair-registrations':
          result = await service.repairRegistrations({ dryRun: Boolean(body.dryRun) });
          break;
        case 'repair-attachments':
          result = await service.repairAttachments({ dryRun: Boolean(body.dryRun) });
          break;
        case 'pull':
          result = await service.pull({
            force: Boolean(body.force),
            mode: body.mode,
            passphrase: body.passphrase,
            sessionRelPaths: Array.isArray(body.sessionRelPaths) ? body.sessionRelPaths : undefined,
          });
          break;
        case 'workspace-repair':
          result = await service.repairWorkspaces();
          break;
        case 'accept-agreement':
          result = await service.acceptAgreement(body);
          break;
        case 'settings':
          result = await service.updateSettings(body);
          break;
        case 'update-check':
          result = await service.updateCheck();
          break;
        case 'update-apply':
          result = await service.updateApply(body.version);
          break;
        case 'rename':
          result = await service.rename(body);
          break;
        case 'encryption':
          result = await service.configureEncryption(body);
          break;
        case 'unlock':
          result = { ok: true, state: await service.unlock(body) };
          break;
        case 'recover':
          result = await service.recoverPassphrase(body);
          break;
        case 'change-passphrase':
          result = await service.changePassphrase(body);
          break;
        case 'export':
          result = await service.exportData(body);
          break;
        case 'import':
          result = await service.importData(body);
          break;
        case 'delete':
          result = await service.deleteData(body);
          break;
        default:
          sendJson(res, 400, { ok: false, code: 'unknown-action', error: `未知操作：${action || '(empty)'}` });
          return;
      }
      if (result && typeof result === 'object' && result.ok === undefined) {
        result = { ok: true, ...result };
      }
      sendJson(res, 200, result);
    } catch (error) {
      const normalized = error && typeof error === 'object' ? error : new Error(messageOf(error));
      try {
        ctx.logger?.warn?.(`${PLUGIN_ID}: action "${action}" failed: ${messageOf(normalized)}`);
      } catch {
        /* logging is optional */
      }
      const status = normalized.code === 'login-required' || normalized.code === 'unauthorized' ? 401 : 200;
      sendJson(res, status, publicError(normalized));
    }
  };

  const healthHandler = async (req, res) => {
    if (!authorized(req, res)) return;
    try {
      await waitReady();
      sendJson(res, 200, { ok: true, plugin: PLUGIN_ID, version: service.publicState().version });
    } catch (error) {
      sendJson(res, 500, publicError(error));
    }
  };

  const register = (routePath, handler, label) => ctx.effect(() => {
    const webServer = ctx.get('webServer');
    if (!webServer || typeof webServer.register !== 'function') return () => {};
    return webServer.register({
      kind: 'exact',
      path: routePath,
      handler,
    });
  }, `${PLUGIN_ID}: ${label}`);

  register(`${ROUTE_PREFIX}/state`, stateHandler, 'state route');
  register(`${ROUTE_PREFIX}/action`, actionHandler, 'action route');
  register(`${ROUTE_PREFIX}/health`, healthHandler, 'health route');

  ctx.effect(() => {
    const off = ctx.on('session/event', (session, event) => {
      try {
        service.handleSessionEvent(session, event);
      } catch (error) {
        try {
          ctx.logger?.warn?.(`${PLUGIN_ID}: session event hook failed: ${messageOf(error)}`);
        } catch {
          /* logging is optional */
        }
      }
    });
    return () => {
      if (typeof off === 'function') off();
    };
  }, `${PLUGIN_ID}: session event hook`);

  ctx.effect(() => () => service.dispose(), `${PLUGIN_ID}: dispose`);
}

