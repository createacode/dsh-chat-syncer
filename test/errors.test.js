import assert from 'node:assert/strict';

import { RepoClient } from '../lib/provider.js';

const client = new RepoClient({ provider: 'gitee', token: 'token', owner: 'alice', repo: 'repo' });
const respond = (status, body, headers = {}) => new Response(body, { status, headers });

/* The incident that started this work: a blocked repository used to surface as
 * "token permission denied" and the platform message was lost. */
const blocked = client.errorFor(
  respond(403, JSON.stringify({ message: '该仓库已被屏蔽，如需解封，请联系网站管理员' }), { 'content-type': 'application/json' }),
  '该仓库已被屏蔽，如需解封，请联系网站管理员',
);
assert.equal(blocked.code, 'repo-blocked');
assert.equal(blocked.status, 403);
assert.match(blocked.message, /已被平台屏蔽/);
assert.match(blocked.message, /该仓库已被屏蔽/);
assert.equal(blocked.detail, '该仓库已被屏蔽，如需解封，请联系网站管理员');

const rateLimited = client.errorFor(
  respond(403, '403 Forbidden (Rate Limit Exceeded)', { 'retry-after': '12' }),
  '403 Forbidden (Rate Limit Exceeded)',
);
assert.equal(rateLimited.code, 'rate-limited');
assert.equal(rateLimited.retryAfterMs, 12_000);
assert.equal(rateLimited.retryable, true);
assert.match(rateLimited.message, /请求频率受限/);

const chineseRateLimit = client.errorFor(respond(403, '', {}), '调用频率超出限制');
assert.equal(chineseRateLimit.code, 'rate-limited');

const forbidden = client.errorFor(respond(403, '', {}), 'Forbidden');
assert.equal(forbidden.code, 'forbidden');
assert.match(forbidden.message, /令牌权限不足/);
assert.equal(forbidden.retryable, false);

const unauthorized = client.errorFor(respond(401, '', {}), 'Unauthorized');
assert.equal(unauthorized.code, 'unauthorized');
assert.match(unauthorized.message, /令牌无效或已过期/);

const tooLarge = client.errorFor(respond(413, '', {}), 'payload too large');
assert.equal(tooLarge.code, 'too-large');

const notFound = client.errorFor(respond(404, '', {}), 'Not Found');
assert.equal(notFound.code, 'not-found');

console.log('error mapping test ok');
