import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { RepoClient } from '../lib/provider.js';
import { FolderStore, RestWriter } from '../lib/storage.js';

const json = (status, value) => new Response(JSON.stringify(value), {
  status,
  headers: { 'content-type': 'application/json' },
});

function installMockFetch() {
  const state = { files: new Map(), seq: 0, writes: [] };
  const original = globalThis.fetch;
  const repo = {
    name: 'repo',
    full_name: 'alice/repo',
    owner: { login: 'alice' },
    private: true,
    default_branch: 'master',
  };
  globalThis.fetch = async (input, init = {}) => {
    const url = input instanceof URL ? input : new URL(input.url ?? input);
    const method = (init.method || 'GET').toUpperCase();
    if (url.pathname === '/api/v5/repos/alice/repo' && method === 'GET') return json(200, repo);
    const match = url.pathname.match(/^\/api\/v5\/repos\/alice\/repo\/contents\/(.+)$/);
    if (!match) return json(404, { message: 'unhandled' });
    const filePath = match[1].split('/').map(decodeURIComponent).join('/');
    if (method === 'GET') {
      const entry = state.files.get(filePath);
      if (!entry) return json(404, { message: 'Not Found' });
      return json(200, {
        type: 'file', encoding: 'base64', size: entry.length,
        sha: `blob-${filePath}`, path: filePath, content: entry.toString('base64'),
      });
    }
    if (method === 'POST' || method === 'PUT') {
      const body = JSON.parse(init.body || '{}');
      const buffer = Buffer.from(String(body.content || ''), 'base64');
      state.seq += 1;
      state.files.set(filePath, buffer);
      state.writes.push({ method, path: filePath, bytes: buffer.length, message: String(body.message || '') });
      return json(200, { content: { sha: `blob-${filePath}` }, commit: { sha: `c${state.seq}` } });
    }
    return json(404, { message: 'unhandled' });
  };
  return { state, restore: () => { globalThis.fetch = original; } };
}

const attachment = 'a'.repeat(64);
const tmp = await mkdtemp(path.join(os.tmpdir(), 'dshsync-att-'));
const mock = installMockFetch();
try {
  const sessionsRoot = path.join(tmp, 'sessions');
  const attachmentsRoot = path.join(tmp, 'attachments');
  const sessionDir = path.join(sessionsRoot, '--D-Demo--', 'session-1');
  await mkdir(sessionDir, { recursive: true });
  await mkdir(path.join(attachmentsRoot, attachment.slice(0, 2)), { recursive: true });
  await writeFile(path.join(attachmentsRoot, attachment.slice(0, 2), attachment), Buffer.from('image-bytes'));
  await writeFile(
    path.join(sessionDir, 'session.v4.jsonl.zstd'),
    `${JSON.stringify({ type: 'image', attachmentId: `sha256:${attachment}` })}\n`,
  );

  const client = new RepoClient({ provider: 'gitee', token: 't', owner: 'alice', repo: 'repo', branch: 'master' });
  const store = new FolderStore({
    client,
    userKey: 'gitee-alice',
    sessionsRoot,
    attachmentsRoot,
    device: { id: 'dev-1', name: 'test' },
    provider: 'gitee',
    writer: new RestWriter({ client }),
  });

  const localInfo = { deviceName: 'Test Device', deviceId: 'dev-1', user: 'alice', provider: 'gitee', hostname: 'test-host', app: '0.16.2' };
  const result = await store.push({ revision: 'SYNC-20260101000000-000001', includeLocalInfo: true, localInfo, author: { name: 'Alice', email: 'alice@test-host' } });
  assert.equal(result.uploaded.sessions, 1);
  assert.equal(result.uploaded.attachments, 1, 'referenced attachment must be uploaded');
  assert.equal(result.manifest.attachments.length, 1);
  assert.equal(result.manifest.attachments[0].id, `sha256:${attachment}`);
  assert.ok(
    mock.state.files.has(`users/gitee-alice/attachments/${attachment.slice(0, 2)}/${attachment}`),
    'attachment written at the content-addressed path',
  );

  /* A second push with no changes must not rewrite anything. */
  const before = mock.state.writes.length;
  const second = await store.push({ revision: 'SYNC-20260101000000-000002', includeLocalInfo: true, localInfo });
  assert.equal(second.uploaded.attachments, 0);
  assert.equal(second.uploaded.sessions, 0);
  assert.equal(mock.state.writes.length - before, 2, 'only manifest and HEAD are written');

  const lastMessages = mock.state.writes.map((entry) => entry.message).join('\n');
  assert.match(lastMessages, /DSH-Device:/, 'commit messages carry local info by default');
  assert.match(lastMessages, /DSH-Sessions: 1/);

  const plain = await store.push({
    revision: 'SYNC-20260101000000-000003',
    includeLocalInfo: false,
  });
  assert.equal(plain.commitMessage.includes('DSH-'), false, 'local info can be turned off');

  console.log('attachments sync test ok');
} finally {
  mock.restore();
}
