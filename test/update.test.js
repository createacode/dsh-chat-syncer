import assert from 'node:assert/strict';
import { compareVersions, GITEE_REPO_URL } from '../lib/update.js';

assert.equal(compareVersions('0.2.0', '0.1.9'), 1);
assert.equal(compareVersions('0.1.0', '0.1.0'), 0);
assert.equal(compareVersions('0.1.0', '0.2.0'), -1);
assert.equal(compareVersions('v1.0.0', '1.0.0'), 0);
assert.equal(GITEE_REPO_URL, 'https://gitee.com/user_gitee/dsh-chat-sync');
console.log('update test ok');
