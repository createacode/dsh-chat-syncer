import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {
  decryptWithPassphrase,
  encryptWithPassphrase,
  unwrapForAccount,
  unwrapForPassphrase,
  wrapForAccount,
  wrapForPassphrase,
  newDataKey,
} from '../lib/crypto.js';
import { createTar, readTar } from '../lib/tar.js';
import { buildBundle, parseBundle } from '../lib/bundle.js';
import { DEFAULT_REPO_NAME, createSyncValue } from '../lib/util.js';

assert.equal(DEFAULT_REPO_NAME, 'dsh-chat-syncer-data');
assert.match(createSyncValue(new Date('2026-11-09T14:55:00Z')), /^SYNC-20261109145500-\d{6}$/);

const tmp = await mkdtemp(path.join(os.tmpdir(), 'dshsync-test-'));
try {
  const tar = createTar([
    { path: 'manifest.json', data: Buffer.from('{"a":1}') },
    { path: 'sessions/--p--/s1/session.v4.jsonl.zstd', data: Buffer.from('hello') },
  ]);
  const files = readTar(tar);
  assert.equal(files.get('manifest.json').toString(), '{"a":1}');
  assert.equal(files.get('sessions/--p--/s1/session.v4.jsonl.zstd').toString(), 'hello');

  const pass = 'correct horse battery';
  const dataKey = newDataKey();
  const wrap = wrapForPassphrase(pass, dataKey);
  assert.equal(unwrapForPassphrase(pass, wrap).toString('hex'), dataKey.toString('hex'));
  assert.throws(() => unwrapForPassphrase('wrong passphrase', wrap));

  const account = { provider: 'gitee', id: 42, login: 'alice' };
  const recovery = wrapForAccount(account, dataKey);
  assert.equal(unwrapForAccount(account, recovery).toString('hex'), dataKey.toString('hex'));

  const encrypted = encryptWithPassphrase(pass, Buffer.from('secret payload'));
  assert.equal(decryptWithPassphrase(pass, encrypted.bytes).toString(), 'secret payload');
  assert.throws(() => decryptWithPassphrase('nope', encrypted.bytes));

  const sessionsRoot = path.join(tmp, 'sessions');
  const sessionDir = path.join(sessionsRoot, '--D-Demo--', 'session-1');
  await mkdir(sessionDir, { recursive: true });
  await writeFile(path.join(sessionDir, 'session.v4.jsonl.zstd'), Buffer.from('log bytes'));
  const secondDir = path.join(sessionsRoot, '--D-Other--', 'session-2');
  await mkdir(secondDir, { recursive: true });
  await writeFile(path.join(secondDir, 'session.v4.jsonl.zstd'), Buffer.from('second log'));

  const remoteRecord = {
    project: '--D-Remote--',
    id: 'session-r',
    file: 'session.v4.jsonl.zstd',
    relPath: 'sessions/--D-Remote--/session-r/session.v4.jsonl.zstd',
    size: 6,
    mtimeMs: Date.now(),
    updatedAt: new Date().toISOString(),
    sha256: 'remote',
  };
  const mergedBundle = await buildBundle({
    sessionsRoot,
    user: { provider: 'gitee', id: 42, login: 'alice' },
    device: { id: 'dev-1', name: 'Test', platform: 'win32' },
    sessionRelPaths: ['sessions/--D-Demo--/session-1/session.v4.jsonl.zstd'],
    extraRecords: [remoteRecord],
    extraFiles: new Map([[remoteRecord.relPath, Buffer.from('remote')]]),
  });
  assert.equal(mergedBundle.manifest.totals.sessions, 2);
  const selectedBundle = await buildBundle({
    sessionsRoot,
    user: { provider: 'gitee', id: 42, login: 'alice', displayName: 'Alice' },
    device: { id: 'dev-1', name: 'Test', platform: 'win32' },
    sessionRelPaths: ['sessions/--D-Other--/session-2/session.v4.jsonl.zstd'],
  });
  assert.equal(selectedBundle.manifest.totals.sessions, 1);
  assert.equal(selectedBundle.manifest.sessions[0].project, '--D-Other--');

  const bundle = await buildBundle({
    sessionsRoot,
    user: { provider: 'gitee', id: 42, login: 'alice', displayName: 'Alice' },
    device: { id: 'dev-1', name: 'Test', platform: 'win32' },
    agreement: { accepted: true, version: 'v', hash: 'h', acceptedAt: new Date().toISOString() },
    encrypt: true,
    passphrase: pass,
  });
  assert.equal(bundle.encrypted, true);
  const parsed = parseBundle(bundle.bytes, { passphrase: pass });
  assert.equal(parsed.manifest.user.login, 'alice');
  assert.equal(parsed.files.get('sessions/--D-Demo--/session-1/session.v4.jsonl.zstd').toString(), 'log bytes');
  assert.throws(() => parseBundle(bundle.bytes, { passphrase: 'bad' }));

  const plain = await buildBundle({
    sessionsRoot,
    user: { provider: 'gitee', login: 'alice' },
    device: { id: 'dev-1', name: 'Test', platform: 'win32' },
    passphrase: '',
  });
  const parsedPlain = parseBundle(plain.bytes);
  assert.equal(parsedPlain.manifest.totals.sessions, 2);
  console.log('ok');
} finally {
  await rm(tmp, { recursive: true, force: true });
}
