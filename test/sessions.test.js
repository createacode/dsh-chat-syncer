import assert from 'node:assert/strict';
import test from 'node:test';
import zlib from 'node:zlib';
import { parseSessionHeader } from '../lib/sessions.js';

const header = {
  type: 'session',
  version: 4,
  id: 'session-1111',
  createdAt: 1793865550875,
  cwd: 'D:\\Demo\\demo1',
};

test('reads the header of a plain JSONL session log', () => {
  const data = Buffer.from(`${JSON.stringify(header)}\n{"type":"message"}\n`, 'utf8');
  assert.deepEqual(parseSessionHeader(data), {
    id: 'session-1111',
    cwd: 'D:\\Demo\\demo1',
    createdAt: 1793865550875,
  });
});

test('reads the header of a Zstandard session log', { skip: typeof zlib.zstdCompressSync !== 'function' }, () => {
  const plain = Buffer.from(`${JSON.stringify(header)}\n{"type":"message"}\n`, 'utf8');
  const compressed = zlib.zstdCompressSync(plain);
  assert.equal(compressed.readUInt32LE(0), 0xfd2fb528);
  assert.deepEqual(parseSessionHeader(compressed), {
    id: 'session-1111',
    cwd: 'D:\\Demo\\demo1',
    createdAt: 1793865550875,
  });
});

test('tolerates a header without a trailing newline or timestamp', () => {
  const data = Buffer.from(JSON.stringify({ id: 'session-2', cwd: 'D:\\Demo\\demo2' }), 'utf8');
  assert.deepEqual(parseSessionHeader(data), { id: 'session-2', cwd: 'D:\\Demo\\demo2', createdAt: null });
});

test('returns null for anything it cannot trust', () => {
  assert.equal(parseSessionHeader(Buffer.alloc(0)), null);
  assert.equal(parseSessionHeader(null), null);
  assert.equal(parseSessionHeader('not a buffer'), null);
  assert.equal(parseSessionHeader(Buffer.from('not json\n')), null);
  assert.equal(parseSessionHeader(Buffer.from('{"id":"only-id"}\n')), null);
  assert.equal(parseSessionHeader(Buffer.from('{"cwd":"D:\\\\x"}\n')), null);
  /* A Zstandard frame that does not decompress. */
  const broken = Buffer.concat([Buffer.from([0x28, 0xb5, 0x2f, 0xfd]), Buffer.from('garbage')]);
  assert.equal(parseSessionHeader(broken), null);
});
