import assert from 'node:assert/strict';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { adoptLegacyDataDir } from '../index.js';

async function scratch() {
  const dir = path.join(os.tmpdir(), `dsh-chat-syncer-rename-${process.pid}-${Date.now()}-${Math.random().toString(16).slice(2)}`);
  await mkdir(dir, { recursive: true });
  return dir;
}

test('a legacy data directory is adopted once, keeping its contents', async () => {
  const root = await scratch();
  const legacy = path.join(root, 'dsh-chat-sync');
  const target = path.join(root, 'dsh-chat-syncer');
  await mkdir(legacy, { recursive: true });
  await writeFile(path.join(legacy, 'config.json'), '{"kept":true}', 'utf8');

  adoptLegacyDataDir(legacy, target);

  assert.equal(await readFile(path.join(target, 'config.json'), 'utf8'), '{"kept":true}');
  await assert.rejects(readFile(path.join(legacy, 'config.json'), 'utf8'), { code: 'ENOENT' });
  await rm(root, { recursive: true, force: true });
});

test('an existing data directory is never overwritten by the legacy one', async () => {
  const root = await scratch();
  const legacy = path.join(root, 'dsh-chat-sync');
  const target = path.join(root, 'dsh-chat-syncer');
  await mkdir(legacy, { recursive: true });
  await mkdir(target, { recursive: true });
  await writeFile(path.join(legacy, 'config.json'), 'legacy', 'utf8');
  await writeFile(path.join(target, 'config.json'), 'current', 'utf8');

  adoptLegacyDataDir(legacy, target);

  assert.equal(await readFile(path.join(target, 'config.json'), 'utf8'), 'current');
  assert.equal(await readFile(path.join(legacy, 'config.json'), 'utf8'), 'legacy');
  await rm(root, { recursive: true, force: true });
});

test('a first install without a legacy directory is a no-op', async () => {
  const root = await scratch();
  const legacy = path.join(root, 'dsh-chat-sync');
  const target = path.join(root, 'dsh-chat-syncer');

  adoptLegacyDataDir(legacy, target);

  await assert.rejects(readFile(path.join(target, 'config.json'), 'utf8'), { code: 'ENOENT' });
  await rm(root, { recursive: true, force: true });
});
