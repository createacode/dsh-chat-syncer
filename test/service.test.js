import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { SyncService } from '../lib/service.js';
import { parseBundle } from '../lib/bundle.js';
import { AGREEMENT_VERSION } from '../lib/agreement.js';

function json(status, value) {
  return new Response(JSON.stringify(value), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function installMockFetch() {
  const state = {
    created: false,
    private: true,
    files: new Map(),
    calls: [],
  };
  const original = globalThis.fetch;
  globalThis.fetch = async (input, init = {}) => {
    const url = input instanceof URL ? input : new URL(typeof input === 'string' ? input : input.url);
    const method = (init.method || 'GET').toUpperCase();
    const pathName = url.pathname;
    state.calls.push({ method, path: pathName });
    if (pathName === '/api/v5/user') {
      return json(200, { id: 42, login: 'alice', name: 'Alice', avatar_url: '', html_url: 'https://gitee.com/alice' });
    }
    if (pathName === '/api/v5/repos/alice/dsh-chat-sync-data' && method === 'GET') {
      if (!state.created) return json(404, { message: 'Not Found' });
      return json(200, {
        name: 'dsh-chat-sync-data',
        full_name: 'alice/dsh-chat-sync-data',
        owner: { login: 'alice' },
        private: state.private,
        default_branch: 'master',
        html_url: 'https://gitee.com/alice/dsh-chat-sync-data',
      });
    }
    if (pathName === '/api/v5/user/repos' && method === 'POST') {
      state.created = true;
      return json(200, {
        name: 'dsh-chat-sync-data',
        full_name: 'alice/dsh-chat-sync-data',
        owner: { login: 'alice' },
        private: state.private,
        default_branch: 'master',
        html_url: 'https://gitee.com/alice/dsh-chat-sync-data',
      });
    }
    if (/\/repos\/alice\/dsh-chat-sync-data\/commits$/.test(pathName) && method === 'GET') {
      if (Array.isArray(state.commits)) return json(200, state.commits);
      return json(200, [{
        sha: 'abcdef1234567890',
        commit: { message: 'chore: dsh-chat-syncer snapshot', author: { name: 'Alice', date: '2026-11-09T15:00:00Z' } },
        html_url: 'https://gitee.com/alice/dsh-chat-sync-data/commit/abcdef1234567890',
      }]);
    }
    const contents = pathName.match(/^\/api\/v5\/repos\/alice\/dsh-chat-sync-data\/contents\/(.+)$/);
    if (contents) {
      const filePath = contents[1].split('/').map(decodeURIComponent).join('/');
      const ref = url.searchParams.get('ref');
      if (method === 'GET' && ref && state.refFiles && state.refFiles[ref] instanceof Map && state.refFiles[ref].has(filePath)) {
        const snapshot = state.refFiles[ref].get(filePath);
        return json(200, {
          type: 'file',
          encoding: 'base64',
          size: snapshot.length,
          path: filePath,
          sha: `sha-${ref}-${filePath}`,
          content: snapshot.toString('base64'),
        });
      }
      if (method === 'GET') {
        if (!state.files.has(filePath)) return json(404, { message: 'Not Found' });
        const data = state.files.get(filePath);
        return json(200, {
          type: 'file',
          encoding: 'base64',
          size: data.length,
          path: filePath,
          sha: `sha-${filePath}`,
          content: data.toString('base64'),
        });
      }
      if (method === 'POST' || method === 'PUT') {
        const body = JSON.parse(init.body || '{}');
        state.files.set(filePath, Buffer.from(body.content || '', 'base64'));
        return json(200, { content: { sha: `sha-${filePath}` } });
      }
      if (method === 'DELETE') {
        state.files.delete(filePath);
        return json(200, {});
      }
    }
    if (/\/git\/trees\/master$/.test(pathName) && method === 'GET') {
      return json(200, {
        tree: [...state.files.keys()].map((filePath) => ({ path: filePath, type: 'blob' })),
      });
    }
    return json(404, { message: `unhandled ${method} ${pathName}` });
  };
  return { state, restore: () => { globalThis.fetch = original; } };
}

function fakeCtx(sessions = []) {
  return {
    get(name) {
      if (name === 'sessions') {
        return {
          list: () => sessions,
          flush: async () => {},
        };
      }
      if (name === 'sessionPersistence') return null;
      return null;
    },
    on() {},
    effect() {},
    logger: { warn() {}, error() {} },
  };
}

const tmp = await mkdtemp(path.join(os.tmpdir(), 'dshsync-service-'));
const mock = installMockFetch();
try {
  const sessionsRoot = path.join(tmp, 'sessions');
  const sessionDir = path.join(sessionsRoot, '--D-Demo--', 'session-1');
  await mkdir(sessionDir, { recursive: true });
  await writeFile(path.join(sessionDir, 'session.v4.jsonl.zstd'), Buffer.from('first log'));

  const serviceA = new SyncService({
    ctx: fakeCtx(),
    dataDir: path.join(tmp, 'device-a'),
    sessionsRoot,
  });
  await serviceA.init();serviceA.config.storageVersion = 1;
  const login = await serviceA.login({ provider: 'gitee', token: 'token-123', repoName: 'dsh-chat-sync-data' });
  assert.equal(login.state.loggedIn, true);
  assert.equal(login.repoCreated, true);
  assert.equal(login.update.available, false);
  assert.equal(login.state.scheduledSync, true);
  assert.equal(login.state.syncInterval, '3h');
  assert.equal(mock.state.files.has('users/gitee-alice/account.json'), true);
  assert.equal(mock.state.files.has('README.md'), true);
  assert.match(mock.state.files.get('README.md').toString('utf8'), /多端会话同步助手数据仓库/);
  assert.equal(mock.state.files.has('users/gitee-alice/agreement.json'), false);

  await serviceA.acceptAgreement({ version: login.state.agreement.version });
  assert.equal(mock.state.files.has('users/gitee-alice/agreement.json'), true);

  const pushed = await serviceA.push({ reason: 'manual' });
  assert.equal(pushed.ok, true);
  assert.equal(pushed.encrypted, false);
  assert.equal(mock.state.files.has('users/gitee-alice/common/HEAD.json'), true);
  const noopPush = await serviceA.push({ reason: 'manual' });
  assert.equal(noopPush.noop, true);
  const dataPathA = [...mock.state.files.keys()].find((key) => key.startsWith('users/gitee-alice/common/data/latest-') && key.endsWith('.dsync'));
  assert.ok(dataPathA, 'expected revision-named data package');
  assert.equal(mock.state.files.has('users/gitee-alice/common/data/latest.dsync'), false);
  assert.equal(mock.state.files.has('users/gitee-alice/devices/' + serviceA.config.device.id + '/device.json'), true);
  const head = JSON.parse(mock.state.files.get('users/gitee-alice/common/HEAD.json').toString('utf8'));
  assert.match(head.revision, /^SYNC-\d{14}-\d{6}$/);
  assert.match(head.dataSha256, /^[0-9a-f]{64}$/);
  assert.equal(head.sessionCount, 1);

  mock.state.private = false;
  await assert.rejects(() => serviceA.check(), (error) => error.code === 'repo-public');
  mock.state.private = true;

  const serviceB = new SyncService({
    ctx: fakeCtx(),
    dataDir: path.join(tmp, 'device-b'),
    sessionsRoot: path.join(tmp, 'sessions-b'),
  });
  await serviceB.init();serviceB.config.storageVersion = 1;
  const loginB = await serviceB.login({ provider: 'gitee', token: 'token-123', repoName: 'dsh-chat-sync-data' });
  assert.equal(loginB.repoCreated, false);
  assert.equal(loginB.update.available, true);
  await serviceB.acceptAgreement({ version: loginB.state.agreement.version });
  const pulled = await serviceB.pull({ passphrase: '' });
  assert.equal(pulled.applied, true);
  assert.equal(pulled.added, 1);
  const copied = await readFile(path.join(tmp, 'sessions-b', '--D-Demo--', 'session-1', 'session.v4.jsonl.zstd'), 'utf8');
  assert.equal(copied, 'first log');
  assert.equal(serviceB.config.lastSeenRevision, head.revision);

  await writeFile(path.join(sessionDir, 'session.v4.jsonl.zstd'), Buffer.from('second log, longer'));
  const pushedB = await serviceB.push({ reason: 'manual', force: true });
  assert.equal(pushedB.ok, true);
  const pushedA = await serviceA.push({ reason: 'manual', force: true });
  assert.equal(pushedA.ok, true);

  const encrypted = await serviceA.configureEncryption({ enabled: true, passphrase: 'long-enough-pass', confirm: 'long-enough-pass' });
  assert.equal(encrypted.state.encryption.enabled, true);
  await serviceA.push({ reason: 'manual', force: true });
  const encryptedHead = JSON.parse(mock.state.files.get('users/gitee-alice/common/HEAD.json').toString('utf8'));
  assert.equal(encryptedHead.encrypted, true);
  assert.equal(mock.state.files.has('users/gitee-alice/common/manifest.json'), false);
  const encryptedPackage = [...mock.state.files.entries()]
    .find(([key, value]) => key.startsWith('users/gitee-alice/common/data/latest-') && key.endsWith('.enc') && value.subarray(0, 8).toString() === 'DSHSYNC1');
  assert.ok(encryptedPackage, 'expected an encrypted revision package');

  const serviceC = new SyncService({
    ctx: fakeCtx(),
    dataDir: path.join(tmp, 'device-c'),
    sessionsRoot: path.join(tmp, 'sessions-c'),
  });
  await serviceC.init();serviceC.config.storageVersion = 1;
  const loginC = await serviceC.login({ provider: 'gitee', token: 'token-123', repoName: 'dsh-chat-sync-data' });
  assert.equal(loginC.update.available, true);
  assert.equal(loginC.state.encryption.enabled, true);
  assert.equal(loginC.state.encryption.locked, true);
  await serviceC.acceptAgreement({ version: loginC.state.agreement.version });
  const unlockedC = await serviceC.unlock({ passphrase: 'long-enough-pass' });
  assert.equal(unlockedC.encryption.locked, false);
  const pulledC = await serviceC.pull({});
  assert.equal(pulledC.added, 1);
  assert.equal(serviceC.config.encryption.enabled, true);
  const copiedC = await readFile(path.join(tmp, 'sessions-c', '--D-Demo--', 'session-1', 'session.v4.jsonl.zstd'), 'utf8');
  assert.equal(copiedC, 'second log, longer');

  const recovered = await serviceC.recoverPassphrase({ passphrase: 'recovered-pass', confirm: 'recovered-pass' });
  assert.equal(recovered.state.encryption.enabled, true);
  assert.equal(recovered.state.encryption.locked, false);

  const exported = await serviceC.exportData({ passphrase: 'export-package-pass' });
  assert.equal(exported.encrypted, true);
  assert.ok(exported.fileName.endsWith('.dsync.enc'));
  const exportedBytes = Buffer.from(exported.data, 'base64');
  const parsedExport = parseBundle(exportedBytes, { passphrase: 'export-package-pass' });
  assert.equal(parsedExport.files.size > 0, true);
  assert.throws(() => parseBundle(exportedBytes, { passphrase: 'wrong-export-pass' }));

  const serviceD = new SyncService({
    ctx: fakeCtx(),
    dataDir: path.join(tmp, 'device-d'),
    sessionsRoot: path.join(tmp, 'sessions-d'),
  });
  await serviceD.init();serviceD.config.storageVersion = 1;
  await assert.rejects(() => serviceD.importData({ data: exported.data }), /口令/);
  const imported = await serviceD.importData({ data: exported.data, passphrase: 'export-package-pass' });
  assert.equal(imported.added, 1);
  assert.equal(imported.profileImported, true);

  const incrementalDir = path.join(tmp, 'sessions-c', '--D-Incremental--', 'session-inc');
  await mkdir(incrementalDir, { recursive: true });
  await writeFile(path.join(incrementalDir, 'session.v4.jsonl.zstd'), Buffer.from('incremental log'));
  await serviceC.updateSettings({ syncMode: 'incremental' });
  const incrementalPush = await serviceC.push({
    sessionRelPaths: ['sessions/--D-Incremental--/session-inc/session.v4.jsonl.zstd'],
  });
  assert.equal(incrementalPush.sessionCount, 2);

  const addedMemo = await serviceC.memoAdd({ text: 'first memo' });
  assert.equal(addedMemo.entries.length, 1);
  const editedMemo = await serviceC.memoUpdate({ id: addedMemo.entry.id, text: 'edited memo' });
  assert.equal(editedMemo.entry.text, 'edited memo');
  const withdrawnMemo = await serviceC.memoWithdraw({ id: addedMemo.entry.id });
  assert.equal(withdrawnMemo.entry.withdrawn, true);
  const clearedMemo = await serviceC.memoClear();
  assert.equal(clearedMemo.entries.length, 0);

  const history = await serviceC.commitHistory();
  assert.equal(history.commits[0].shortSha, 'abcdef12');
  const backupDir = path.join(serviceC.backupRoot, '2026-11-09T15-00-00-000Z', '--D-Backup--', 'session-b');
  await mkdir(backupDir, { recursive: true });
  await writeFile(path.join(backupDir, 'session.v4.jsonl.zstd'), Buffer.from('backup log'));
  const backups = await serviceC.listBackups();
  assert.equal(backups.backups.length > 0, true);
  const targetBackup = backups.backups.find((item) => item.id === '2026-11-09T15-00-00-000Z');
  const restored = await serviceC.restoreBackup({ id: targetBackup.id });
  assert.equal(restored.restored, 1);
  assert.equal((await readFile(path.join(tmp, 'sessions-c', '--D-Backup--', 'session-b', 'session.v4.jsonl.zstd'))).toString(), 'backup log');

  const serviceAKey = serviceA.config.userKey;
  await serviceA.logout();
  const relogin = await serviceA.login({ provider: 'gitee', token: 'token-123', repoName: 'dsh-chat-sync-data' });
  assert.equal(relogin.state.agreement.accepted, true);
  assert.equal(serviceA.config.userKey, serviceAKey);
  const withdrawnAgreement = await serviceA.withdrawAgreement();
  assert.equal(withdrawnAgreement.loggedIn, false);
  assert.equal(withdrawnAgreement.agreement.accepted, false);

  const accountKey = serviceC.config.userKey;
  const loggedOut = await serviceC.logout();
  assert.equal(loggedOut.loggedIn, false);
  assert.ok(loggedOut.accounts.some((account) => account.userKey === accountKey));
  const switchedBack = await serviceC.switchUser({ userKey: accountKey });
  assert.equal(switchedBack.state.loggedIn, true);
  const removedAccount = await serviceC.deleteAccount({ userKey: accountKey });
  assert.equal(removedAccount.state.loggedIn, false);
  assert.equal(removedAccount.state.accounts.some((account) => account.userKey === accountKey), false);

  const serviceMaintenance = new SyncService({ ctx: fakeCtx(), dataDir: path.join(tmp, 'device-maint'), sessionsRoot: path.join(tmp, 'sessions-maint') });
  await serviceMaintenance.init();serviceMaintenance.config.storageVersion = 1;
  await serviceMaintenance.login({ provider: 'gitee', token: 'token-123', repoName: 'dsh-chat-sync-data' });
  await serviceMaintenance.acceptAgreement({ version: AGREEMENT_VERSION });
  const initialized = await serviceMaintenance.initializePlugin();
  assert.equal(initialized.loggedIn, true);
  assert.equal(initialized.agreement.accepted, true);
  const cleared = await serviceMaintenance.clearAllData();
  assert.equal(cleared.loggedIn, false);

  const smart = new SyncService({ ctx: fakeCtx(), dataDir: path.join(tmp, 'device-smart'), sessionsRoot: path.join(tmp, 'sessions-smart') });
  await smart.init();smart.config.storageVersion = 1;
  await smart.login({ provider: 'gitee', token: 'token-123', repoName: 'dsh-chat-sync-data' });
  await smart.acceptAgreement({ version: AGREEMENT_VERSION });
  smart.config.remoteHead = null;
  smart.config.encryption = null;
  smart.push = async () => ({ noop: true });
  await smart.runScheduledPush();
  assert.equal(smart.publicState().sync.scheduledPaused, false);
  await smart.runScheduledPush();
  assert.equal(smart.publicState().sync.scheduledPaused, true);
  smart.handleSessionEvent(null, { type: 'turn/end' });
  assert.equal(smart.publicState().sync.scheduledPaused, false);
  smart.dispose();

  /* --- a fresh repository exercising the 0.9.1 push/pull rules --- */
  const mock2 = installMockFetch();
  try {
    const rootD = path.join(tmp, 'mode-d', 'sessions');
    const rootE = path.join(tmp, 'mode-e', 'sessions');
    const relA = 'sessions/--D-A--/session-1/session.v4.jsonl.zstd';
    const relB = 'sessions/--D-B--/session-2/session.v4.jsonl.zstd';
    await mkdir(path.join(rootD, '--D-A--', 'session-1'), { recursive: true });
    await writeFile(path.join(rootD, '--D-A--', 'session-1', 'session.v4.jsonl.zstd'), Buffer.from('d1'));
    await mkdir(path.join(rootE, '--D-B--', 'session-2'), { recursive: true });
    await writeFile(path.join(rootE, '--D-B--', 'session-2', 'session.v4.jsonl.zstd'), Buffer.from('e1'));

    const deviceD = new SyncService({ ctx: fakeCtx(), dataDir: path.join(tmp, 'mode-d', 'data'), sessionsRoot: rootD });
    await deviceD.init();deviceD.config.storageVersion = 1;
    await deviceD.login({ provider: 'gitee', token: 'token-123', repoName: 'dsh-chat-sync-data' });
    await deviceD.acceptAgreement({ version: AGREEMENT_VERSION });
    const firstPush = await deviceD.push({ reason: 'manual', mode: 'force', allSelected: true, sessionRelPaths: [relA] });
    assert.equal(firstPush.ok, true);
    assert.equal(firstPush.mode, 'force');

    const deviceE = new SyncService({ ctx: fakeCtx(), dataDir: path.join(tmp, 'mode-e', 'data'), sessionsRoot: rootE });
    await deviceE.init();deviceE.config.storageVersion = 1;
    await deviceE.login({ provider: 'gitee', token: 'token-123', repoName: 'dsh-chat-sync-data' });
    await deviceE.acceptAgreement({ version: AGREEMENT_VERSION });
    await deviceE.pull({});
    const pushE = await deviceE.push({ reason: 'manual', mode: 'force', allSelected: true, sessionRelPaths: [relA, relB] });
    assert.equal(pushE.ok, true);

    /* Both sides moved: pushing first is refused even for a forced snapshot. */
    await writeFile(path.join(rootD, '--D-A--', 'session-1', 'session.v4.jsonl.zstd'), Buffer.from('d2, newer'));
    await assert.rejects(
      () => deviceD.push({ reason: 'manual', mode: 'force', allSelected: true, sessionRelPaths: [relA] }),
      (error) => error.code === 'pull-required',
    );

    /* The pull is incremental: it takes the remote-only session and keeps the newer local log. */
    const pullD = await deviceD.pull({ mode: 'incremental' });
    assert.equal(pullD.mode, 'incremental');
    assert.equal(pullD.added, 1);
    assert.equal(
      (await readFile(path.join(rootD, '--D-A--', 'session-1', 'session.v4.jsonl.zstd'))).toString(),
      'd2, newer',
    );

    /* A partial selection cannot replace the shared snapshot, so force degrades to incremental. */
    const partialPush = await deviceD.push({ reason: 'manual', mode: 'force', allSelected: false, sessionRelPaths: [relA] });
    assert.equal(partialPush.mode, 'incremental');
    assert.equal(partialPush.modeAdjusted, true);
    const modeHead = JSON.parse(mock2.state.files.get('users/gitee-alice/common/HEAD.json').toString('utf8'));
    assert.equal(modeHead.sessionCount, 2, 'incremental merge keeps the other device session');
  } finally {
    mock2.restore();
  }

  /* --- a pre-0.9.3 account keeps its existing data repository --- */
  const mock3 = installMockFetch();
  try {
    mock3.state.created = true; // alice already has dsh-chat-sync-data
    const legacyService = new SyncService({
      ctx: fakeCtx(),
      dataDir: path.join(tmp, 'legacy', 'data'),
      sessionsRoot: path.join(tmp, 'legacy', 'sessions'),
    });
    await legacyService.init();legacyService.config.storageVersion = 1;
    const legacyLogin = await legacyService.login({ provider: 'gitee', token: 'token-123' });
    assert.equal(legacyService.config.repo.name, 'dsh-chat-sync-data');
    assert.equal(legacyLogin.repoCreated, false);
  } finally {
    mock3.restore();
  }

  /* --- attachments travel with the package; a missing one becomes a placeholder --- */
  const mock4 = installMockFetch();
  try {
    const rootA = path.join(tmp, 'att-a', 'sessions');
    const objectsA = path.join(tmp, 'att-a', 'objects');
    const rootB = path.join(tmp, 'att-b', 'sessions');
    const objectsB = path.join(tmp, 'att-b', 'objects');
    const presentId = `sha256:${'a'.repeat(64)}`;
    const missingId = `sha256:${'b'.repeat(64)}`;
    const sessionDir = path.join(rootA, '--D-A--', 'session-1');
    await mkdir(sessionDir, { recursive: true });
    const imageRecord = (attachmentId) => JSON.stringify({
      type: 'user/message',
      data: { content: [{ type: 'image', attachment: { attachmentId, mediaType: 'image/png' } }] },
    });
    await writeFile(path.join(sessionDir, 'session.v4.jsonl'), [
      JSON.stringify({ type: 'session', id: 'session-1', cwd: 'D:/A' }),
      imageRecord(presentId),
      imageRecord(missingId),
    ].join('\n') + '\n');
    const objectFile = path.join(objectsA, 'aa', 'a'.repeat(64));
    await mkdir(path.dirname(objectFile), { recursive: true });
    await writeFile(objectFile, Buffer.from('fake-image-bytes'));

    const deviceA = new SyncService({
      ctx: fakeCtx(),
      dataDir: path.join(tmp, 'att-a', 'data'),
      sessionsRoot: rootA,
      attachmentsRoot: objectsA,
    });
    await deviceA.init();deviceA.config.storageVersion = 1;
    await deviceA.login({ provider: 'gitee', token: 'token-123' });
    await deviceA.acceptAgreement({ version: AGREEMENT_VERSION });
    const pushed = await deviceA.push({ reason: 'manual', mode: 'incremental' });
    assert.equal(pushed.ok, true);

    const deviceB = new SyncService({
      ctx: fakeCtx(),
      dataDir: path.join(tmp, 'att-b', 'data'),
      sessionsRoot: rootB,
      attachmentsRoot: objectsB,
    });
    await deviceB.init();deviceB.config.storageVersion = 1;
    await deviceB.login({ provider: 'gitee', token: 'token-123' });
    await deviceB.acceptAgreement({ version: AGREEMENT_VERSION });
    const pulled = await deviceB.pull({});
    assert.equal(pulled.added, 1);
    assert.equal(
      (await readFile(path.join(objectsB, 'aa', 'a'.repeat(64)))).toString(),
      'fake-image-bytes',
      'the bundled attachment is written into the local object store',
    );
    const restoredSession = await readFile(path.join(rootB, '--D-A--', 'session-1', 'session.v4.jsonl'), 'utf8');
    assert.match(restoredSession, /附件缺失/, 'the missing reference is replaced with a placeholder');
    assert.equal(restoredSession.includes(missingId), false);
    assert.equal(restoredSession.includes(presentId), true, 'an available attachment keeps its reference');
  } finally {
    mock4.restore();
  }

  /* --- earlier versions are read from Git commits, not from the working tree --- */
  const mock5 = installMockFetch();
  try {
    const svc = new SyncService({
      ctx: fakeCtx(),
      dataDir: path.join(tmp, 'versions', 'data'),
      sessionsRoot: path.join(tmp, 'versions', 'sessions'),
    });
    await svc.init();svc.config.storageVersion = 1;
    await svc.login({ provider: 'gitee', token: 'token-123' });
    await svc.acceptAgreement({ version: AGREEMENT_VERSION });
    const headPath = 'users/gitee-alice/common/HEAD.json';
    const headAt = (revision, file, at) => Buffer.from(JSON.stringify({
      revision,
      updatedAt: at,
      dataFile: file,
      dataSha256: '',
      sessionCount: 3,
      workspaceCount: 1,
      encrypted: false,
      updatedBy: { deviceName: 'alice@dev' },
    }));
    const shaA = 'a'.repeat(40);
    const shaB = 'b'.repeat(40);
    mock5.state.commits = [
      { sha: shaA, commit: { message: 'sync 3', author: { name: 'alice', date: '2026-11-14T10:00:00Z' } }, html_url: 'u3' },
      { sha: shaB, commit: { message: 'sync 2', author: { name: 'alice', date: '2026-11-14T09:00:00Z' } }, html_url: 'u2' },
    ];
    mock5.state.refFiles = {
      [shaA]: new Map([[headPath, headAt('SYNC-3', 'users/gitee-alice/common/data/latest-3.dsync', '2026-11-14T10:00:00.000Z')]]),
      [shaB]: new Map([[headPath, headAt('SYNC-2', 'users/gitee-alice/common/data/latest-2.dsync', '2026-11-14T09:00:00.000Z')]]),
    };
    const versions = await svc.listVersions({ limit: 3 });
    assert.equal(versions.versions.length, 2);
    assert.equal(versions.versions[0].revision, 'SYNC-3');
    assert.equal(versions.versions[1].revision, 'SYNC-2');
    assert.equal(versions.versions[0].sessionCount, 3);
    assert.equal(versions.versions[0].deviceName, 'alice@dev');
  } finally {
    mock5.restore();
  }

  /* --- a pull that skips newer local sessions still acknowledges the revision --- */
  const mock6 = installMockFetch();
  try {
    const rootA = path.join(tmp, 'ack-a', 'sessions');
    const rootB = path.join(tmp, 'ack-b', 'sessions');
    const sessionRel = path.join('--D-A--', 'session-1', 'session.v4.jsonl.zstd');
    await mkdir(path.join(rootA, '--D-A--', 'session-1'), { recursive: true });
    await writeFile(path.join(rootA, sessionRel), Buffer.from('a1'));

    const deviceA = new SyncService({ ctx: fakeCtx(), dataDir: path.join(tmp, 'ack-a', 'data'), sessionsRoot: rootA });
    await deviceA.init();deviceA.config.storageVersion = 1;
    await deviceA.login({ provider: 'gitee', token: 'token-123' });
    await deviceA.acceptAgreement({ version: AGREEMENT_VERSION });
    const firstPush = await deviceA.push({ mode: 'incremental', allSelected: true });
    assert.equal(firstPush.ok, true);

    const deviceB = new SyncService({ ctx: fakeCtx(), dataDir: path.join(tmp, 'ack-b', 'data'), sessionsRoot: rootB });
    await deviceB.init();deviceB.config.storageVersion = 1;
    await deviceB.login({ provider: 'gitee', token: 'token-123' });
    await deviceB.acceptAgreement({ version: AGREEMENT_VERSION });
    await deviceB.pull({});
    await writeFile(path.join(rootB, sessionRel), Buffer.from('b-newer-and-longer'));
    const secondPush = await deviceB.push({ mode: 'incremental', allSelected: true });
    assert.equal(secondPush.ok, true);

    /* A is behind by one revision and has its own newer copy of the session. */
    await new Promise((resolve) => setTimeout(resolve, 25));
    await writeFile(path.join(rootA, sessionRel), Buffer.from('a-newest-and-longest'));
    const pulled = await deviceA.pull({ mode: 'incremental' });
    assert.equal(pulled.ack, true, 'benign conflicts must not block the acknowledgement');
    assert.ok(pulled.conflicts.length >= 1, 'the newer local copy is still reported');
    assert.equal(deviceA.config.lastSeenRevision, secondPush.revision);

    /* And therefore push is allowed again instead of deadlocking on pull-required. */
    const thirdPush = await deviceA.push({ mode: 'incremental', allSelected: true });
    assert.equal(thirdPush.ok, true);
  } finally {
    mock6.restore();
  }

  /* --- incremental push merges without a prior pull; force push still needs one --- */
  const mock7 = installMockFetch();
  try {
    const attA = `sha256:${'a'.repeat(64)}`;
    const attB = `sha256:${'b'.repeat(64)}`;
    const relA = 'sessions/--D-A--/session-a/session.v4.jsonl';
    const relB = 'sessions/--D-B--/session-b/session.v4.jsonl';
    const sessionLog = (id, cwd, attachmentId) => [
      JSON.stringify({ type: 'session', version: 4, id, cwd }),
      JSON.stringify({ type: 'user/message', data: { content: [{ type: 'image', attachment: { attachmentId } }] } }),
    ].join('\n') + '\n';

    const rootA = path.join(tmp, 'merge-a', 'sessions');
    const objectsA = path.join(tmp, 'merge-a', 'objects');
    await mkdir(path.join(rootA, '--D-A--', 'session-a'), { recursive: true });
    await writeFile(path.join(rootA, '--D-A--', 'session-a', 'session.v4.jsonl'), sessionLog('session-a', 'D:/A', attA));
    await mkdir(path.join(objectsA, 'aa'), { recursive: true });
    await writeFile(path.join(objectsA, 'aa', 'a'.repeat(64)), Buffer.from('image-a'));

    const device = new SyncService({ ctx: fakeCtx(), dataDir: path.join(tmp, 'merge-a', 'data'), sessionsRoot: rootA, attachmentsRoot: objectsA });
    await device.init();device.config.storageVersion = 1;
    await device.login({ provider: 'gitee', token: 'token-123' });
    await device.acceptAgreement({ version: AGREEMENT_VERSION });
    const first = await device.push({ mode: 'incremental', allSelected: true });
    assert.equal(first.ok, true);

    const rootB = path.join(tmp, 'merge-b', 'sessions');
    const objectsB = path.join(tmp, 'merge-b', 'objects');
    const deviceB = new SyncService({ ctx: fakeCtx(), dataDir: path.join(tmp, 'merge-b', 'data'), sessionsRoot: rootB, attachmentsRoot: objectsB });
    await deviceB.init();deviceB.config.storageVersion = 1;
    await deviceB.login({ provider: 'gitee', token: 'token-123' });
    await deviceB.acceptAgreement({ version: AGREEMENT_VERSION });
    await deviceB.pull({});
    await mkdir(path.join(rootB, '--D-B--', 'session-b'), { recursive: true });
    await writeFile(path.join(rootB, '--D-B--', 'session-b', 'session.v4.jsonl'), sessionLog('session-b', 'D:/B', attB));
    await mkdir(path.join(objectsB, 'bb'), { recursive: true });
    await writeFile(path.join(objectsB, 'bb', 'b'.repeat(64)), Buffer.from('image-b'));
    const fromB = await deviceB.push({ mode: 'force', allSelected: true });
    assert.equal(fromB.ok, true);

    /* A is now behind rev2, yet an incremental push must merge instead of demanding a pull. */
    await new Promise((resolve) => setTimeout(resolve, 25));
    await writeFile(path.join(rootA, '--D-A--', 'session-a', 'session.v4.jsonl'), `${sessionLog('session-a', 'D:/A', attA)}${JSON.stringify({ type: 'assistant/message', data: { turn: 1 } })}\n`);
    const merged = await device.push({ mode: 'incremental', allSelected: true });
    assert.equal(merged.ok, true, 'incremental push works while the repository is ahead');
    assert.equal(merged.noop, false);
    assert.equal(merged.sessionCount, 2, 'the remote-only session is kept');

    /* The remote-only session's attachment travels with the merged package. */
    const rootC = path.join(tmp, 'merge-c', 'sessions');
    const objectsC = path.join(tmp, 'merge-c', 'objects');
    const deviceC = new SyncService({ ctx: fakeCtx(), dataDir: path.join(tmp, 'merge-c', 'data'), sessionsRoot: rootC, attachmentsRoot: objectsC });
    await deviceC.init();deviceC.config.storageVersion = 1;
    await deviceC.login({ provider: 'gitee', token: 'token-123' });
    await deviceC.acceptAgreement({ version: AGREEMENT_VERSION });
    const pulledC = await deviceC.pull({});
    assert.equal(pulledC.added, 2);
    assert.equal((await readFile(path.join(objectsC, 'bb', 'b'.repeat(64)))).toString(), 'image-b');

    /* Force still refuses while this device is behind. */
    await deviceB.pull({});
    await new Promise((resolve) => setTimeout(resolve, 25));
    await writeFile(
      path.join(rootB, '--D-B--', 'session-b', 'session.v4.jsonl'),
      `${sessionLog('session-b', 'D:/B', attB)}${JSON.stringify({ type: 'assistant/message', data: { turn: 2 } })}\n`,
    );
    const fromB2 = await deviceB.push({ mode: 'force', allSelected: true });
    assert.equal(fromB2.ok, true);
    await assert.rejects(
      () => device.push({ mode: 'force', allSelected: true }),
      (error) => error.code === 'pull-required',
    );
  } finally {
    mock7.restore();
  }

  console.log('service test ok', mock.state.calls.length, 'calls');
} finally {
  mock.restore();
  await rm(tmp, { recursive: true, force: true });
}
