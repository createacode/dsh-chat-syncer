import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import zlib from 'node:zlib';
import { repairSessionAttachments } from '../lib/sessions.js';

const MISSING = `sha256:${'c'.repeat(64)}`;

function zstd(text) {
  return zlib.zstdCompressSync(Buffer.from(text, 'utf8'), {
    params: { [zlib.constants.ZSTD_c_checksumFlag]: 1 },
  });
}

function frameCount(buffer) {
  const magic = Buffer.from([0x28, 0xb5, 0x2f, 0xfd]);
  let count = 0;
  let position = 0;
  while (position + 4 <= buffer.length) {
    const index = buffer.indexOf(magic, position);
    if (index < 0) break;
    count += 1;
    position = index + 1;
  }
  return count;
}

function recordCount(buffer) {
  const magic = Buffer.from([0x28, 0xb5, 0x2f, 0xfd]);
  let records = 0;
  let position = 0;
  while (position + 4 <= buffer.length) {
    const index = buffer.indexOf(magic, position);
    if (index < 0) break;
    const next = buffer.indexOf(magic, index + 1);
    const end = next < 0 ? buffer.length : next;
    const text = zlib.zstdDecompressSync(buffer.subarray(index, end)).toString('utf8');
    records += text.split('\n').filter(Boolean).length;
    position = index + 1;
  }
  return records;
}

test('repair rewrites a zstd log frame by frame and keeps its records', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'dsh-syncer-frames-'));
  try {
    const sessionsRoot = path.join(root, 'sessions');
    const sessionDir = path.join(sessionsRoot, '--D-A--', 'session-1');
    await mkdir(sessionDir, { recursive: true });
    const objectsRoot = path.join(root, 'objects');
    const backupRoot = path.join(root, 'backups');

    const firstFrame = [
      { type: 'session', id: 'session-1', cwd: 'D:/A' },
      {
        type: 'user/message',
        data: { content: [{ type: 'image', attachment: { attachmentId: MISSING, mediaType: 'image/png' } }] },
      },
    ].map((record) => JSON.stringify(record)).join('\n') + '\n';
    const secondFrame = [
      { type: 'assistant/message', data: { turn: 1 } },
      { type: 'turn/end', data: { turn: 1 } },
    ].map((record) => JSON.stringify(record)).join('\n') + '\n';

    const target = path.join(sessionDir, 'session.v4.jsonl.zstd');
    const original = Buffer.concat([zstd(firstFrame), zstd(secondFrame)]);
    await writeFile(target, original);

    const report = await repairSessionAttachments({
      sessionsRoot,
      objectsRoot,
      backupRoot,
      availableIds: new Set(),
    });
    assert.equal(report.repaired, 1);
    assert.equal(report.replaced, 1);

    const repaired = await readFile(target);
    assert.equal(frameCount(repaired), frameCount(original), 'frame layout is preserved');
    assert.equal(recordCount(repaired), 4, 'no record is dropped');
    const text = zlib.zstdDecompressSync(repaired).toString('utf8');
    assert.match(text, /附件缺失/);
    assert.equal(text.includes(MISSING), false);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
