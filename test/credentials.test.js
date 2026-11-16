import assert from 'node:assert/strict';
import { mkdtemp, readFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { SyncService } from '../lib/service.js';

const tmp = await mkdtemp(path.join(os.tmpdir(), 'dshsync-credentials-'));
const deleted = [];
const ctx = {
  get(name) {
    if (name === 'credentials') {
      return {
        readRecord: async () => null,
        modifyRecord: async () => {},
        deleteRecord: async (key) => { deleted.push(key); },
      };
    }
    return null;
  },
  on() {},
  effect() {},
  logger: { warn() {}, error() {} },
};

const service = new SyncService({
  ctx,
  dataDir: path.join(tmp, 'data'),
  sessionsRoot: path.join(tmp, 'sessions'),
});
await service.init();
service.config.userKey = 'gitee-alice';
service.config.users = { 'gitee-alice': { account: { login: 'alice' }, repo: { name: 'repo' } } };
service.token = 'secret-token';

await service.clearAllTokens();

const recordId = service.tokenRecordId('gitee-alice');
assert.ok(deleted.includes(`dsh-chat-syncer/${recordId}`), 'current token record removed');
assert.ok(deleted.includes(`dsh-chat-sync/${recordId}`), 'legacy plugin token record removed');
assert.ok(deleted.includes('dsh-chat-syncer/account'), 'legacy active token removed');
assert.ok(deleted.includes('dsh-chat-sync/account'), 'legacy renamed active token removed');
assert.equal(service.token, null);

const secrets = JSON.parse(await readFile(path.join(tmp, 'data', 'secrets.json'), 'utf8'));
assert.deepEqual(secrets, { tokens: {} }, 'fallback secrets file is emptied');

console.log('credentials cleanup test ok', deleted.length, 'records');
