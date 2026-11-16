import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { RepoClient } from '../lib/provider.js';
import { FolderStore, RestWriter, buildManifest, diffSessions } from '../lib/storage.js';

function json(status, value) {
  return new Response(JSON.stringify(value), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

/** A tiny commit-aware contents API: reads can be pinned to an earlier commit. */
function installMockFetch() {
  const state = { files: new Map(), seq: 0, writes: [] };
  const original = globalThis.fetch;
  const commitSha = (index) => `c${String(index).padStart(4, '0')}`;
  const repo = {
    name: 'repo',
    full_name: 'alice/repo',
    owner: { login: 'alice' },
    namespace: { path: 'alice' },
    private: true,
    default_branch: 'master',
    html_url: 'https://gitee.com/alice/repo',
  };

  globalThis.fetch = async (input, init = {}) => {
    const url = input instanceof URL ? input : new URL(input.url ?? input);
    const method = (init.method || 'GET').toUpperCase();
    if (url.pathname === '/api/v5/user') return json(200, { id: 1, login: 'alice', name: 'Alice' });
    if (url.pathname === '/api/v5/repos/alice/repo' && method === 'GET') return json(200, repo);
    const match = url.pathname.match(/^\/api\/v5\/repos\/alice\/repo\/contents\/(.+)$/);
    if (!match) return json(404, { message: `unhandled ${method} ${url.pathname}` });
    const filePath = match[1].split('/').map(decodeURIComponent).join('/');
    const ref = url.searchParams.get('ref');

    if (method === 'GET') {
      const versions = state.files.get(filePath);
      if (!versions || versions.length === 0) return json(404, { message: 'Not Found' });
      let entry = versions[versions.length - 1];
      if (ref && /^c\d+$/.test(ref)) {
        const index = Number(ref.slice(1));
        const found = [...versions].reverse().find((version) => version.index <= index);
        if (!found) return json(404, { message: 'Not Found' });
        entry = found;
      }
      return json(200, {
        type: 'file',
        encoding: 'base64',
        size: entry.buffer.length,
        sha: entry.blob,
        path: filePath,
        content: entry.buffer.toString('base64'),
      });
    }

    if (method === 'POST' || method === 'PUT') {
      const body = JSON.parse(init.body || '{}');
      const buffer = Buffer.from(String(body.content || ''), 'base64');
      state.seq += 1;
      const entry = { index: state.seq, buffer, blob: `blob-${state.seq}` };
      const versions = state.files.get(filePath) || [];
      versions.push(entry);
      state.files.set(filePath, versions);
      state.writes.push({ method, path: filePath, bytes: buffer.length, commit: commitSha(state.seq) });
      return json(200, {
        content: { sha: entry.blob, size: buffer.length, path: filePath },
        commit: { sha: commitSha(state.seq) },
      });
    }

    if (method === 'DELETE') {
      state.seq += 1;
      state.writes.push({ method, path: filePath, bytes: 0, commit: commitSha(state.seq) });
      return json(200, { commit: { sha: commitSha(state.seq) } });
    }
    return json(404, { message: 'unhandled' });
  };

  return {
    state,
    restore: () => { globalThis.fetch = original; },
    commitSha,
  };
}

const tmp = await mkdtemp(path.join(os.tmpdir(), 'dshsync-store-'));
const mock = installMockFetch();
try {
  const sessionsRoot = path.join(tmp, 'sessions');
  const dirA = path.join(sessionsRoot, '--D-Demo--', 'session-a');
  const dirB = path.join(sessionsRoot, '--D-Demo--', 'session-b');
  await mkdir(dirA, { recursive: true });
  await mkdir(dirB, { recursive: true });
  await writeFile(path.join(dirA, 'session.v4.jsonl.zstd'), Buffer.from('session-a-v1'));
  await writeFile(path.join(dirB, 'session.v4.jsonl.zstd'), Buffer.from('session-b-v1'));

  const client = new RepoClient({ provider: 'gitee', token: 'token', owner: 'alice', repo: 'repo', branch: 'master' });
  const writer = new RestWriter({ client });
  const store = new FolderStore({
    client,
    userKey: 'gitee-alice',
    sessionsRoot,
    device: { id: 'dev-1', name: 'test' },
    provider: 'gitee',
    writer,
  });

  const first = await store.push({ revision: 'SYNC-20260101000000-000001' });
  assert.equal(first.uploaded.sessions, 2);
  assert.equal(first.head.schema, 3);
  assert.equal(first.head.storage, 'folders');
  assert.match(first.manifestCommit, /^c\d+$/);

  const headPath = 'users/gitee-alice/common/HEAD.json';
  assert.ok(mock.state.files.has(headPath), 'HEAD must exist');
  const headWritten = mock.state.writes.filter((entry) => entry.path === headPath).pop();
  const manifestWritten = mock.state.writes.filter((entry) => entry.path.includes('/common/manifests/')).pop();
  assert.ok(manifestWritten && headWritten && headWritten.commit > manifestWritten.commit,
    'HEAD must be published after the manifest');

  /* Second push only touches the session that changed. */
  await writeFile(path.join(dirA, 'session.v4.jsonl.zstd'), Buffer.from('session-a-v2-with-more'));
  const before = mock.state.writes.length;
  const second = await store.push({ revision: 'SYNC-20260101000000-000002' });
  const touched = mock.state.writes.slice(before);
  const sessionWrites = touched.filter((entry) => entry.path.startsWith('users/gitee-alice/sessions/'));
  assert.equal(sessionWrites.length, 1, 'only the changed session is rewritten');
  assert.equal(second.uploaded.sessions, 1);
  assert.equal(second.manifest.totals.sessions, 2);

  /* Reads pinned to the first manifest commit still see the old content. */
  const firstManifestWrite = mock.state.writes.find((entry) => entry.path.includes('manifests/SYNC-20260101000000-000001'));
  assert.ok(firstManifestWrite, 'first manifest was written');
  const pinned = await client.getFile('users/gitee-alice/common/manifests/SYNC-20260101000000-000001.json', firstManifestWrite.commit);
  assert.ok(pinned, 'pinned manifest read works');
  assert.equal(JSON.parse(pinned.buffer.toString('utf8')).revision, 'SYNC-20260101000000-000001');

  /* Pull into a fresh device restores both sessions. */
  const pullRoot = path.join(tmp, 'pull');
  await mkdir(pullRoot, { recursive: true });
  const pullStore = new FolderStore({
    client,
    userKey: 'gitee-alice',
    sessionsRoot: pullRoot,
    device: { id: 'dev-2', name: 'pull' },
    provider: 'gitee',
    writer: new RestWriter({ client }),
  });
  const pulled = await pullStore.pull({ backupRoot: path.join(tmp, 'backups') });
  assert.equal(pulled.downloaded, 2);
  assert.equal((await readFile(path.join(pullRoot, '--D-Demo--', 'session-a', 'session.v4.jsonl.zstd'), 'utf8')), 'session-a-v2-with-more');
  assert.equal((await readFile(path.join(pullRoot, '--D-Demo--', 'session-b', 'session.v4.jsonl.zstd'), 'utf8')), 'session-b-v1');

  /* Manifest diffing is content based, not mtime based. */
  const manifest = buildManifest({
    userKey: 'gitee-alice',
    provider: 'gitee',
    device: { id: 'dev-1' },
    revision: 'SYNC-1',
    records: [
      { relPath: 'sessions/p/s/a', sha256: 'aa', size: 1, mtimeMs: 1, project: 'p' },
      { relPath: 'sessions/p/s/b', sha256: 'bb', size: 1, mtimeMs: 1, project: 'p' },
    ],
  });
  const next = buildManifest({
    userKey: 'gitee-alice',
    provider: 'gitee',
    device: { id: 'dev-1' },
    revision: 'SYNC-2',
    records: [
      { relPath: 'sessions/p/s/a', sha256: 'aa', size: 1, mtimeMs: 2, project: 'p' },
      { relPath: 'sessions/p/s/b', sha256: 'cc', size: 2, mtimeMs: 2, project: 'p' },
    ],
  });
  const diff = diffSessions(manifest, next);
  assert.equal(diff.updated.length, 1);
  assert.equal(diff.unchanged.length, 1);

  console.log('storage test ok', mock.state.writes.length, 'writes');
} finally {
  mock.restore();
}
