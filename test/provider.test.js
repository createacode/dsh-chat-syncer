import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { RepoClient } from '../lib/provider.js';

function response(status, body) {
  return new Response(body === undefined ? '' : JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

const digest = (buffer) => createHash('sha256').update(buffer).digest('hex');
const original = globalThis.fetch;
const calls = [];
const files = new Map();
const blobs = new Map();
const inlineLimits = new Map();
let blobCount = 0;

/** Register a file the fake repository will serve, returning its blob sha. */
function store(filePath, data) {
  blobCount += 1;
  const sha = `blob-${blobCount}`;
  files.set(filePath, { data, sha });
  blobs.set(sha, data);
  return sha;
}

globalThis.fetch = async (input, init = {}) => {
  const url = input instanceof URL ? input : new URL(input.url ?? input);
  const method = (init.method || 'GET').toUpperCase();
  calls.push({ method, url: url.toString(), headers: init.headers || {}, body: init.body });
  if (url.pathname === '/user') {
    return response(200, { id: 7, login: 'octo', name: 'Octo', avatar_url: '', html_url: '' });
  }
  if (url.pathname === '/repos/octo/dsh-chat-sync-data' && method === 'GET') {
    return response(200, {
      name: 'dsh-chat-sync-data',
      full_name: 'octo/dsh-chat-sync-data',
      owner: { login: 'octo' },
      private: true,
      default_branch: 'main',
      html_url: 'https://github.com/octo/dsh-chat-sync-data',
    });
  }
  const blob = url.pathname.match(/^\/repos\/octo\/dsh-chat-sync-data\/git\/blobs\/(.+)$/);
  if (blob) {
    const data = blobs.get(decodeURIComponent(blob[1]));
    if (!data) return response(404, { message: 'Not Found' });
    return response(200, { encoding: 'base64', content: data.toString('base64'), size: data.length });
  }
  const contents = url.pathname.match(/^\/repos\/octo\/dsh-chat-sync-data\/contents\/(.+)$/);
  if (contents) {
    const filePath = contents[1].split('/').map(decodeURIComponent).join('/');
    if (method === 'GET') {
      const entry = files.get(filePath);
      if (!entry) return response(404, { message: 'Not Found' });
      /* Some providers inline only a prefix of the object while still
       * reporting the real size; `inlineLimits` reproduces that. */
      const limit = inlineLimits.has(filePath) ? inlineLimits.get(filePath) : entry.data.length;
      return response(200, {
        type: 'file',
        encoding: 'base64',
        size: entry.data.length,
        path: filePath,
        sha: entry.sha,
        content: entry.data.subarray(0, limit).toString('base64'),
      });
    }
    if (method === 'PUT') {
      const body = JSON.parse(init.body);
      store(filePath, Buffer.from(body.content, 'base64'));
      return response(200, { content: { sha: 'sha2' } });
    }
  }
  return response(404, { message: `unhandled ${method} ${url.pathname}` });
};

try {
  const client = new RepoClient({ provider: 'github', token: 'gh-token', owner: 'octo', repo: 'dsh-chat-sync-data', branch: 'main' });
  const user = await client.getUser();
  assert.equal(user.login, 'octo');
  const repo = await client.ensureRepo('dsh-chat-sync-data');
  assert.equal(repo.private, true);
  assert.equal(repo.defaultBranch, 'main');

  await client.putFile('users/gitee-alice/common/HEAD.json', Buffer.from('{"ok":true}'), 'test');
  assert.equal(files.get('users/gitee-alice/common/HEAD.json').data.toString(), '{"ok":true}');
  const file = await client.getFile('users/gitee-alice/common/HEAD.json');
  assert.equal(file.buffer.toString(), '{"ok":true}');

  const userCall = calls.find((call) => call.url.endsWith('/user'));
  assert.equal(userCall.headers.authorization, 'Bearer gh-token');
  assert.equal(userCall.headers['content-type'], 'application/json');
  const putCall = calls.find((call) => call.method === 'PUT' && call.url.includes('/contents/'));
  assert.equal(putCall.body.includes('"message"'), true);

  /* Gitee caps the inline contents payload at 10 MiB while still reporting the
   * real size. A truncated inline copy must never be returned as the file. */
  const big = Buffer.alloc(2 * 1024 * 1024);
  for (let offset = 0; offset < big.length; offset += 4096) big[offset] = offset % 251;
  store('users/gitee-alice/common/data/latest-abc.dsync', big);
  inlineLimits.set('users/gitee-alice/common/data/latest-abc.dsync', 512 * 1024);
  const beforeBlobCalls = calls.filter((call) => call.url.includes('/git/blobs/')).length;
  const pulled = await client.getFile('users/gitee-alice/common/data/latest-abc.dsync');
  assert.equal(pulled.buffer.length, big.length, 'truncated inline payload must fall back to the blob endpoint');
  assert.equal(digest(pulled.buffer), digest(big), 'blob endpoint must return the whole object');
  const afterBlobCalls = calls.filter((call) => call.url.includes('/git/blobs/')).length;
  assert.equal(afterBlobCalls, beforeBlobCalls + 1, 'expected exactly one blob request');

  /* A complete inline payload still avoids the extra round trip. */
  const small = Buffer.from('hello world');
  store('users/gitee-alice/common/data/small.dsync', small);
  const beforeSmall = calls.filter((call) => call.url.includes('/git/blobs/')).length;
  const smallFile = await client.getFile('users/gitee-alice/common/data/small.dsync');
  assert.equal(smallFile.buffer.toString(), 'hello world');
  assert.equal(calls.filter((call) => call.url.includes('/git/blobs/')).length, beforeSmall);

  console.log('provider test ok', calls.length, 'calls');
} finally {
  globalThis.fetch = original;
}
