/**
 * The registration repair scans session headers, compares them with the durable
 * workspace registry and clears stale projection caches. It is the code path
 * that surfaced a missing import only at runtime ("registrySnapshot is not
 * defined"), so it is exercised end to end here.
 */
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { SyncService } from '../lib/service.js';

function fakeCtx() {
  return {
    get(name) {
      if (name === 'sessions') return { list: () => [], flush: async () => {} };
      return null;
    },
    on() { return () => {}; },
    effect() {},
    logger: { warn() {}, error() {} },
  };
}

test('repairRegistrations scans, reports and clears the stale cache', async () => {
  const home = await mkdtemp(path.join(os.tmpdir(), 'dsh-syncer-reg-'));
  try {
    const workspacePath = path.join(home, 'demo14');
    await mkdir(workspacePath, { recursive: true });
    const sessionDir = path.join(home, 'sessions', '--D-Demo-demo14--', 'session-1');
    await mkdir(sessionDir, { recursive: true });
    await writeFile(path.join(sessionDir, 'session.v4.jsonl'), [
      JSON.stringify({ type: 'session', version: 4, id: 'session-1', cwd: workspacePath }),
      JSON.stringify({ type: 'user/message', data: { content: [] } }),
    ].join('\n') + '\n', 'utf8');

    await mkdir(path.join(home, 'storages'), { recursive: true });
    await writeFile(path.join(home, 'storages', 'workspace.json'), JSON.stringify({
      unit: { name: 'workspace', version: 2 },
      global: { workspaceIds: ['w1'] },
      tables: {},
    }), 'utf8');
    // A workspace exists for the path but does not list the session yet.
    const registryFile = path.join(home, 'storages', 'workspace.json');
    const registry = JSON.parse(await (await import('node:fs/promises')).readFile(registryFile, 'utf8'));
    registry.tables.workspaces = {
      w1: { path: workspacePath, title: 'demo14', sessionIds: [] },
    };
    await writeFile(registryFile, JSON.stringify(registry, null, 2), 'utf8');

    const cacheDir = path.join(home, 'storages', 'session_projcache', 'sessions');
    await mkdir(cacheDir, { recursive: true });
    await writeFile(path.join(cacheDir, 'session-1.json'), '{"stale":true}', 'utf8');

    const service = new SyncService({
      ctx: fakeCtx(),
      dataDir: path.join(home, 'dsh-chat-syncer'),
      sessionsRoot: path.join(home, 'sessions'),
    });
    await service.init();

    const scan = await service.repairRegistrations({ dryRun: true });
    assert.equal(scan.ok, true);
    assert.equal(scan.available, true);
    assert.equal(scan.sessions, 1);
    assert.equal(scan.unregistered, 1);
    assert.equal(scan.missingWorkspace, 0);

    const repaired = await service.repairRegistrations({});
    assert.equal(repaired.ok, true);
    assert.equal(typeof repaired.repaired, 'number');
    assert.equal(repaired.cacheCleared, 1, 'the stale projection cache is moved aside');
    const left = await readdir(cacheDir);
    assert.equal(left.includes('session-1.json'), false);
    assert.equal(left.some((name) => name.startsWith('session-1.json.stale-')), true);
  } finally {
    await rm(home, { recursive: true, force: true });
  }
});
