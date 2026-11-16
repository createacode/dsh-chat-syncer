import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { SyncService } from '../lib/service.js';

function json(status, value) {
  return new Response(JSON.stringify(value), { status, headers: { 'content-type': 'application/json' } });
}

function installMockFetch() {
  const state = { files: new Map(), seq: 0, writes: [] };
  const original = globalThis.fetch;
  const repoFor = (name) => ({
    id: 1,
    name,
    full_name: `alice/${name}`,
    owner: { login: 'alice' },
    namespace: { path: 'alice' },
    private: true,
    default_branch: 'master',
    html_url: `https://gitee.com/alice/${name}`,
  });
  const key = (repo, filePath) => `${repo}:${filePath}`;

  globalThis.fetch = async (input, init = {}) => {
    const url = input instanceof URL ? input : new URL(input.url ?? input);
    const method = (init.method || 'GET').toUpperCase();
    const pathname = url.pathname;
    if (pathname === '/api/v5/user') return json(200, { id: 1, login: 'alice', name: 'Alice' });
    if (pathname === '/api/v5/user/repos' && method === 'POST') {
      const body = JSON.parse(init.body || '{}');
      return json(200, repoFor(body.name || 'repo'));
    }
    const repoMatch = pathname.match(/^\/api\/v5\/repos\/alice\/([^/]+)$/);
    if (repoMatch && method === 'GET') return json(200, repoFor(decodeURIComponent(repoMatch[1])));
    const contents = pathname.match(/^\/api\/v5\/repos\/alice\/([^/]+)\/contents\/(.+)$/);
    if (!contents) return json(404, { message: `unhandled ${method} ${pathname}` });
    const repo = decodeURIComponent(contents[1]);
    const filePath = contents[2].split('/').map(decodeURIComponent).join('/');
    const id = key(repo, filePath);
    if (method === 'GET') {
      const entry = state.files.get(id);
      if (!entry) return json(404, { message: 'Not Found' });
      return json(200, {
        type: 'file',
        encoding: 'base64',
        size: entry.length,
        sha: `blob-${id}`,
        path: filePath,
        content: entry.toString('base64'),
      });
    }
    if (method === 'POST' || method === 'PUT') {
      const body = JSON.parse(init.body || '{}');
      const buffer = Buffer.from(String(body.content || ''), 'base64');
      state.seq += 1;
      state.files.set(id, buffer);
      state.writes.push({ method, repo, path: filePath, bytes: buffer.length });
      return json(200, {
        content: { sha: `blob-${id}`, size: buffer.length, path: filePath },
        commit: { sha: `c${String(state.seq).padStart(4, '0')}` },
      });
    }
    if (method === 'DELETE') {
      state.seq += 1;
      state.writes.push({ method, repo, path: filePath, bytes: 0 });
      return json(200, { commit: { sha: `c${String(state.seq).padStart(4, '0')}` } });
    }
    return json(404, { message: 'unhandled' });
  };
  return { state, restore: () => { globalThis.fetch = original; } };
}

function fakeCtx() {
  return {
    get() { return null; },
    on() {},
    effect() {},
    logger: { warn() {}, error() {} },
  };
}

const tmp = await mkdtemp(path.join(os.tmpdir(), 'dshsync-folders-'));
const mock = installMockFetch();
try {
  const rootA = path.join(tmp, 'a');
  const sessionDir = path.join(rootA, '--D-Demo--', 'session-1');
  await mkdir(sessionDir, { recursive: true });
  await writeFile(path.join(sessionDir, 'session.v4.jsonl.zstd'), Buffer.from('hello-folders'));

  const service = new SyncService({ ctx: fakeCtx(), dataDir: path.join(tmp, 'data-a'), sessionsRoot: rootA });
  await service.init();
  service.config.storageVersion = 3;
  service.config.transport = 'rest';
  const login = await service.login({ provider: 'gitee', token: 'token', repoName: 'dsh-chat-syncer-data' });
  assert.equal(login.state.loggedIn, true);

  await service.acceptAgreement({ version: login.state.agreement.version });
  const pushed = await service.push({ reason: 'manual' });
  assert.equal(pushed.ok, true);
  assert.equal(pushed.mode, 'folders');
  assert.equal(pushed.sessionCount, 1);

  const headRaw = mock.state.files.get('dsh-chat-syncer-data:users/gitee-alice/common/HEAD.json');
  assert.ok(headRaw, 'folder head exists');
  const head = JSON.parse(headRaw.toString('utf8'));
  assert.equal(head.schema, 3);
  assert.equal(head.storage, 'folders');
  assert.match(head.manifestCommit, /^c\d+$/);
  assert.ok(mock.state.files.has('dsh-chat-syncer-data:users/gitee-alice/sessions/--D-Demo--/session-1/session.v4.jsonl.zstd'));

  /* Only the changed session is rewritten on the next push. */
  await writeFile(path.join(sessionDir, 'session.v4.jsonl.zstd'), Buffer.from('hello-folders-v2'));
  const before = mock.state.writes.filter((entry) => entry.repo === 'dsh-chat-syncer-data' && entry.path.startsWith('users/gitee-alice/sessions/')).length;
  const second = await service.push({ reason: 'manual' });
  assert.equal(second.ok, true);
  const after = mock.state.writes.filter((entry) => entry.repo === 'dsh-chat-syncer-data' && entry.path.startsWith('users/gitee-alice/sessions/')).length;
  assert.equal(after - before, 1, 'exactly one session write');

  /* A fresh device pulls the same session back. */
  const rootB = path.join(tmp, 'b');
  const deviceB = new SyncService({ ctx: fakeCtx(), dataDir: path.join(tmp, 'data-b'), sessionsRoot: rootB });
  await deviceB.init();
  deviceB.config.storageVersion = 3;
  deviceB.config.transport = 'rest';
  await deviceB.login({ provider: 'gitee', token: 'token', repoName: 'dsh-chat-syncer-data' });
  const pulled = await deviceB.pull({ mode: 'force' });
  assert.equal(pulled.downloaded >= 1, true);
  const restored = await readFile(path.join(rootB, '--D-Demo--', 'session-1', 'session.v4.jsonl.zstd'), 'utf8');
  assert.equal(restored, 'hello-folders-v2');

  const check = await service.check({});
  assert.equal(check.ok, true);
  assert.equal(check.relation, 'same');

  /* Encrypted local backup: key generated once, visible after login. */
  const backup = await service.backupNow({ reason: 'manual' });
  assert.match(backup.name, /^backup-.*\.dsyncbak\.enc$/);
  assert.ok(backup.bytes > 0);
  assert.equal(service.backupKeyInfo().hasKey, true);
  const revealed = await service.revealBackupKey();
  assert.ok(revealed.key && revealed.key.length >= 20);
  assert.equal(revealed.fingerprint, service.backupKeyInfo().fingerprint);
  const listed = await service.listLocalBackups();
  assert.equal(listed.items.length >= 1, true);
  assert.equal(mock.state.files.has('dsh-chat-syncer-data:users/gitee-alice/common/backup-key.json'), true);

  /* A manual push must stop when the remote already has a newer revision, and
   * continue only when the caller explicitly accepts the merge. */
  const rootC = path.join(tmp, 'c');
  await mkdir(path.join(rootC, '--D-Demo--', 'session-c'), { recursive: true });
  await writeFile(path.join(rootC, '--D-Demo--', 'session-c', 'session.v4.jsonl.zstd'), Buffer.from('device-c'));
  const deviceC = new SyncService({ ctx: fakeCtx(), dataDir: path.join(tmp, 'data-c'), sessionsRoot: rootC });
  await deviceC.init();
  deviceC.config.storageVersion = 3;
  deviceC.config.transport = 'rest';
  const loginC = await deviceC.login({ provider: 'gitee', token: 'token', repoName: 'dsh-chat-syncer-data' });
  await deviceC.acceptAgreement({ version: loginC.state.agreement.version });
  let aheadError = null;
  try {
    await deviceC.push({ reason: 'manual' });
  } catch (error) {
    aheadError = error;
  }
  assert.ok(aheadError, 'push must be blocked while the remote revision is ahead');
  assert.equal(aheadError.code, 'remote-ahead');
  const merged = await deviceC.push({ reason: 'manual', allowRemoteAhead: true });
  assert.equal(merged.ok, true);
  assert.equal(merged.sessionCount >= 2, true, 'merge keeps remote sessions');
  console.log('folders integration ok', mock.state.writes.length, 'writes');
} finally {
  mock.restore();
}
