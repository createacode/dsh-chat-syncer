import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { UPDATE_FILES } from '../lib/update.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const libFiles = (await readdir(path.join(root, 'lib')))
  .filter((name) => name.endsWith('.js'))
  .map((name) => `lib/${name}`);

for (const file of libFiles) {
  assert.ok(UPDATE_FILES.includes(file), `online update list is missing ${file}`);
}

for (const required of ['index.js', 'client.js']) {
  assert.ok(UPDATE_FILES.includes(required), `online update list is missing ${required}`);
}

/* package.json stays under plugin-manager control: rewriting its version here
 * desynchronises pnpm's lockfile and makes the profile prune the bundle. */
assert.equal(UPDATE_FILES.includes('package.json'), false, 'package.json must not be self-updated');

/* A module imported by any runtime file must also ship in the update set. */
for (const file of [...libFiles, 'index.js', 'client.js']) {
  const source = await readFile(path.join(root, file), 'utf8');
  for (const match of source.matchAll(/from\s+'\.\/([^']+\.js)'/g)) {
    const captured = match[1];
    const imported = captured.startsWith('lib/') ? captured : `lib/${captured}`;
    assert.ok(UPDATE_FILES.includes(imported), `${file} imports ${imported} but the updater would not fetch it`);
  }
}

console.log('update file list test ok', UPDATE_FILES.length, 'files');
