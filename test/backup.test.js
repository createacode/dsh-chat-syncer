import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import {
  createEncryptedBackup,
  listEncryptedBackups,
  readEncryptedBackup,
} from '../lib/backup.js';

const tmp = await mkdtemp(path.join(os.tmpdir(), 'dshsync-backup-'));
const sessionsRoot = path.join(tmp, 'sessions');
const attachmentsRoot = path.join(tmp, 'attachments');
const backupDir = path.join(tmp, 'backups');
await mkdir(path.join(sessionsRoot, '--D-Demo--', 'session-1'), { recursive: true });
await mkdir(path.join(attachmentsRoot, 'ab'), { recursive: true });
await writeFile(path.join(sessionsRoot, '--D-Demo--', 'session-1', 'session.v4.jsonl.zstd'), Buffer.from('session payload'));
await writeFile(path.join(attachmentsRoot, 'ab', 'abcdef'), Buffer.from('attachment payload'));

const key = 'test-backup-key-0123456789abcdef';
const report = await createEncryptedBackup({
  sessionsRoot,
  attachmentsRoot,
  dir: backupDir,
  key,
});
assert.match(report.name, /^backup-.*\.dsyncbak\.enc$/);
assert.equal(report.sessions, 1);
assert.equal(report.attachments, 1);
assert.ok(report.bytes > 0);
assert.match(report.sha256, /^[0-9a-f]{64}$/);

const encrypted = await readFile(report.file);
assert.equal(encrypted.includes(Buffer.from('session payload')), false, 'backup must not contain plaintext');

const files = await readEncryptedBackup(report.file, key);
assert.equal(files.get('sessions/--D-Demo--/session-1/session.v4.jsonl.zstd').toString(), 'session payload');
assert.equal(files.get('attachments/ab/abcdef').toString(), 'attachment payload');

let wrongKeyError = null;
try {
  await readEncryptedBackup(report.file, 'wrong-key');
} catch (error) {
  wrongKeyError = error;
}
assert.ok(wrongKeyError, 'wrong key must fail');
assert.equal(wrongKeyError.code, 'bad-key');

const items = await listEncryptedBackups(backupDir);
assert.equal(items.length, 1);
assert.equal(items[0].name, report.name);

console.log('backup test ok', report.bytes, 'bytes');
