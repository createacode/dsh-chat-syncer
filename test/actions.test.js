/**
 * Smoke test for the host entry: boot the real `index.js` with a fake cordis
 * ctx and drive the route handlers the browser actually calls. This guards the
 * failure that produced “未知操作: repair-attachments” — a client bundle that is
 * newer than the host module it is talking to.
 */
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

const READ_ONLY_ACTIONS = new Set([
  'state', 'sessions', 'backups', 'history', 'memo-list', 'versions',
  'remote-sessions', 'repair-attachments', 'repair-registrations', 'workspace-repair',
  'update-check',
]);

const ACTIONS = [
  'state', 'login', 'check-token', 'logout', 'switch-user', 'delete-account',
  'clear-data', 'initialize', 'uninstall-cleanup', 'withdraw-agreement', 'check',
  'sessions', 'history', 'backups', 'restore-backup', 'memo-list', 'memo-add',
  'memo-update', 'memo-delete', 'memo-withdraw', 'memo-clear', 'push',
  'repair-attachments', 'repair-registrations', 'pull', 'versions', 'pull-version',
  'remote-sessions', 'workspace-repair',
  'accept-agreement', 'settings',
  'update-check', 'update-apply', 'rename', 'encryption', 'unlock', 'recover',
  'change-passphrase', 'export', 'import', 'delete',
];

function fakeRequest(body) {
  const listeners = new Map();
  return {
    method: 'POST',
    headers: {},
    socket: { remoteAddress: '127.0.0.1' },
    on(event, callback) { listeners.set(event, callback); return this; },
    destroy() {},
    start() {
      queueMicrotask(() => {
        listeners.get('data')?.(Buffer.from(JSON.stringify(body), 'utf8'));
        listeners.get('end')?.();
      });
    },
  };
}

function fakeResponse() {
  const res = {
    statusCode: 0,
    headers: {},
    body: null,
    done: null,
    setHeader(name, value) { this.headers[name.toLowerCase()] = value; },
    end(body) {
      this.body = body ? JSON.parse(body) : null;
      this.done?.();
    },
  };
  res.finished = new Promise((resolve) => { res.done = resolve; });
  return res;
}

async function call(handler, body, timeoutMs = 5000) {
  const req = fakeRequest(body);
  const res = fakeResponse();
  const handled = handler(req, res);
  req.start();
  await Promise.race([
    res.finished,
    handled.then(() => undefined),
    new Promise((_, reject) => setTimeout(() => reject(new Error(`no response for ${body.action}`)), timeoutMs)),
  ]);
  return res;
}

/** Boot the real host against a throwaway DSH_HOME and tear it down afterwards. */
async function withApp(fn) {
  const home = await mkdtemp(path.join(os.tmpdir(), 'dsh-syncer-smoke-'));
  const previousHome = process.env.DSH_HOME;
  process.env.DSH_HOME = home;
  const routes = new Map();
  const disposers = [];
  const ctx = {
    effect(effect) {
      const dispose = effect();
      if (typeof dispose === 'function') disposers.push(dispose);
    },
    on() { return () => {}; },
    get(name) {
      if (name === 'webServer') {
        return {
          register({ path: routePath, handler }) {
            routes.set(routePath, handler);
            return () => {};
          },
        };
      }
      if (name === 'sessions') return { list: () => [], flush: async () => {} };
      return null;
    },
    logger: { warn() {}, error() {} },
  };
  try {
    const plugin = await import('../index.js');
    plugin.apply(ctx);
    return await fn(routes);
  } finally {
    for (const dispose of disposers.reverse()) {
      try { dispose(); } catch { /* best effort */ }
    }
    /* Let the service's pending writes settle before the temp home disappears. */
    await new Promise((resolve) => setTimeout(resolve, 250));
    if (previousHome === undefined) delete process.env.DSH_HOME;
    else process.env.DSH_HOME = previousHome;
    await rm(home, { recursive: true, force: true, maxRetries: 5, retryDelay: 50 }).catch(() => {});
  }
}

test('the host registers its browser routes', async () => {
  await withApp(async (routes) => {
    assert.deepEqual([...routes.keys()].sort(), [
      '/dsh-chat-syncer/api/action',
      '/dsh-chat-syncer/api/health',
      '/dsh-chat-syncer/api/state',
    ]);
  });
});

test('every action the client sends is known to the host', async () => {
  await withApp(async (routes) => {
    const action = routes.get('/dsh-chat-syncer/api/action');
    const unknown = [];
    /* Destructive actions (clear-data, uninstall-cleanup) run last so the
     * read-only ones are still exercised against an intact profile. */
    const ordered = [
      ...ACTIONS.filter((name) => READ_ONLY_ACTIONS.has(name)),
      ...ACTIONS.filter((name) => !READ_ONLY_ACTIONS.has(name)),
    ];
    for (const name of ordered) {
      const res = await call(action, { action: name, dryRun: true });
      if (res.body?.code === 'unknown-action') unknown.push(name);
      /* A host-side crash is a bug, not an expected rejection like login-required.
       * Only the read-only actions are held to that bar here; the rest need an
       * authenticated account and fail earlier for unrelated reasons. */
      if (READ_ONLY_ACTIONS.has(name)) {
        assert.notEqual(res.body?.code, 'internal', `action "${name}" threw inside the host`);
      }
    }
    assert.deepEqual(unknown, [], 'no action may fall through to “未知操作”');
  });
});

test('the repair action answers with a scan report', async () => {
  await withApp(async (routes) => {
    const res = await call(routes.get('/dsh-chat-syncer/api/action'), {
      action: 'repair-attachments',
      dryRun: true,
    });
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.ok, true);
    assert.equal(typeof res.body.scanned, 'number');
    assert.equal(Array.isArray(res.body.sessions), true);
  });
});
