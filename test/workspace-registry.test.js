import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { clearProjectionCache, registrySnapshot } from '../lib/workspaces.js';

test('registrySnapshot maps a workspace path to its registered sessions', async () => {
  const home = await mkdtemp(path.join(os.tmpdir(), 'dsh-syncer-registry-'));
  try {
    await mkdir(path.join(home, 'storages'), { recursive: true });
    await writeFile(path.join(home, 'storages', 'workspace.json'), JSON.stringify({
      unit: { name: 'workspace', version: 2 },
      global: { workspaceIds: ['w1'] },
      tables: {
        workspaces: {
          w1: { path: 'D:\\Demo\\demo14', title: 'demo14', sessionIds: ['session-a'] },
          w2: { path: 'D:\\Demo\\demo50', title: 'demo50', sessionIds: ['session-b', 'session-c'] },
        },
      },
    }, null, 2), 'utf8');

    const snapshot = await registrySnapshot(home);
    assert.ok(snapshot instanceof Map);
    const demo14 = snapshot.get(path.resolve('D:\\Demo\\demo14').toLowerCase());
    assert.deepEqual([...demo14], ['session-a']);
    const demo50 = snapshot.get(path.resolve('D:\\Demo\\demo50').toLowerCase());
    assert.deepEqual([...demo50].sort(), ['session-b', 'session-c']);
  } finally {
    await rm(home, { recursive: true, force: true });
  }
});

test('a missing registry is reported as null instead of throwing', async () => {
  const home = await mkdtemp(path.join(os.tmpdir(), 'dsh-syncer-registry-'));
  try {
    assert.equal(await registrySnapshot(home), null);
    assert.equal(await registrySnapshot(''), null);
  } finally {
    await rm(home, { recursive: true, force: true });
  }
});

test('clearProjectionCache moves the stale cache aside and reports the rest', async () => {
  const home = await mkdtemp(path.join(os.tmpdir(), 'dsh-syncer-registry-'));
  try {
    const dir = path.join(home, 'storages', 'session_projcache', 'sessions');
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, 'session-a.json'), '{"stale":true}', 'utf8');

    const result = await clearProjectionCache(home, ['session-a', 'session-missing']);
    assert.deepEqual(result.cleared, ['session-a']);
    assert.deepEqual(result.missing, ['session-missing']);

    const left = await readdir(dir);
    assert.equal(left.includes('session-a.json'), false, 'the cache file is no longer at its live name');
    assert.equal(left.some((name) => name.startsWith('session-a.json.stale-')), true);
  } finally {
    await rm(home, { recursive: true, force: true });
  }
});
