import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';
import {
  directoryExists,
  groupByWorkspace,
  isCreatableWorkspacePath,
  pendingEntries,
  publicWorkspaceReport,
  reconcileWorkspaces,
} from '../lib/workspaces.js';

/** Minimal stand-in for the DSH workspace registry. */
function fakeRegistry(failOn = new Set()) {
  const workspaces = new Map();
  return {
    workspaces,
    async create(cwd) {
      if (failOn.has(cwd)) throw new Error(`cannot create workspace at ${cwd}`);
      if (!workspaces.has(cwd)) {
        workspaces.set(cwd, {
          path: cwd,
          sessionIds: [],
          async attachSession(sessionId) {
            this.sessionIds.push(sessionId);
          },
        });
      }
      return workspaces.get(cwd);
    },
  };
}

const present = (list) => async (target) => list.includes(target);

test('groupByWorkspace groups by cwd and drops incomplete entries', () => {
  const groups = groupByWorkspace([
    { sessionId: 'a', cwd: 'D:\\Demo\\demo1' },
    { sessionId: 'b', cwd: 'D:\\Demo\\demo1' },
    { sessionId: 'a', cwd: 'D:\\Demo\\demo1' },
    { sessionId: 'c', cwd: 'D:\\Demo\\demo2' },
    { sessionId: '', cwd: 'D:\\Demo\\demo3' },
    { sessionId: 'd', cwd: '' },
    null,
  ]);
  assert.deepEqual([...groups.keys()], ['D:\\Demo\\demo1', 'D:\\Demo\\demo2']);
  assert.deepEqual(groups.get('D:\\Demo\\demo1'), ['a', 'b']);
  assert.deepEqual(groups.get('D:\\Demo\\demo2'), ['c']);
});

test('reconcile attaches sessions whose workspace folder exists', async () => {
  const registry = fakeRegistry();
  const report = await reconcileWorkspaces({
    registry,
    entries: [
      { sessionId: 's-1', cwd: 'D:\\Demo\\demo1' },
      { sessionId: 's-2', cwd: 'D:\\Demo\\demo1' },
      { sessionId: 's-3', cwd: 'D:\\Demo\\demo2' },
    ],
    checkDirectory: present(['D:\\Demo\\demo1', 'D:\\Demo\\demo2']),
  });
  assert.equal(report.available, true);
  assert.equal(report.attached, 3);
  assert.deepEqual(report.created, []);
  assert.deepEqual(report.missing, []);
  assert.deepEqual(registry.workspaces.get('D:\\Demo\\demo1').sessionIds, ['s-1', 's-2']);
  assert.deepEqual(registry.workspaces.get('D:\\Demo\\demo2').sessionIds, ['s-3']);
});

test('a missing workspace folder is created before attaching', async () => {
  const registry = fakeRegistry();
  const made = [];
  const report = await reconcileWorkspaces({
    registry,
    entries: [
      { sessionId: 's-1', cwd: 'D:\\Demo\\demo1' },
      { sessionId: 's-2', cwd: 'D:\\Demo\\demo1' },
    ],
    checkDirectory: present([]),
    makeDirectory: async (target) => {
      made.push(target);
      return true;
    },
  });
  assert.deepEqual(made, ['D:\\Demo\\demo1']);
  assert.deepEqual(report.created, [{ path: 'D:\\Demo\\demo1', sessionIds: ['s-1', 's-2'] }]);
  assert.equal(report.attached, 2);
  assert.deepEqual(report.missing, []);
  assert.deepEqual(registry.workspaces.get('D:\\Demo\\demo1').sessionIds, ['s-1', 's-2']);
});

test('creation can be turned off, then the session is reported missing', async () => {
  const registry = fakeRegistry();
  let made = 0;
  const report = await reconcileWorkspaces({
    registry,
    entries: [
      { sessionId: 's-1', cwd: 'D:\\Demo\\gone1' },
      { sessionId: 's-2', cwd: 'D:\\Demo\\gone1' },
    ],
    createDirectories: false,
    checkDirectory: present([]),
    makeDirectory: async () => {
      made += 1;
      return true;
    },
  });
  assert.equal(made, 0);
  assert.equal(report.attached, 0);
  assert.deepEqual(report.created, []);
  assert.deepEqual(report.missing, [{ path: 'D:\\Demo\\gone1', sessionIds: ['s-1', 's-2'] }]);
  assert.deepEqual(pendingEntries(report), [
    { sessionId: 's-1', cwd: 'D:\\Demo\\gone1' },
    { sessionId: 's-2', cwd: 'D:\\Demo\\gone1' },
  ]);
});

test('protected and malformed paths are never created', async () => {
  const windows = process.env.SystemRoot || 'C:\\Windows';
  for (const cwd of [path.parse(windows).root, windows, path.join(windows, 'System32'), 'relative\\folder']) {
    const registry = fakeRegistry();
    let made = 0;
    const report = await reconcileWorkspaces({
      registry,
      entries: [{ sessionId: 's-1', cwd }],
      checkDirectory: present([]),
      makeDirectory: async () => {
        made += 1;
        return true;
      },
    });
    assert.equal(made, 0, `${cwd} must not be created`);
    assert.equal(report.missing.length, 1, `${cwd} must be reported missing`);
  }
});

test('isCreatableWorkspacePath accepts ordinary folders only', () => {
  const windows = process.env.SystemRoot || 'C:\\Windows';
  assert.equal(isCreatableWorkspacePath('D:\\Demo\\demo1'), true);
  assert.equal(isCreatableWorkspacePath('\\\\server\\share\\proj'), true);
  assert.equal(isCreatableWorkspacePath(''), false);
  assert.equal(isCreatableWorkspacePath('demo1'), false);
  assert.equal(isCreatableWorkspacePath('D:\\'), false);
  assert.equal(isCreatableWorkspacePath(windows), false);
  assert.equal(isCreatableWorkspacePath(path.join(windows, 'System32')), false);
});

test('a failing mkdir becomes a per-session failure, not a crash', async () => {
  const registry = fakeRegistry();
  const report = await reconcileWorkspaces({
    registry,
    entries: [{ sessionId: 's-1', cwd: 'D:\\Demo\\locked' }],
    checkDirectory: present([]),
    makeDirectory: async () => {
      throw new Error('EPERM: access denied');
    },
  });
  assert.equal(report.attached, 0);
  assert.deepEqual(report.created, []);
  assert.equal(report.failed.length, 1);
  assert.equal(report.failed[0].sessionId, 's-1');
  assert.match(report.failed[0].reason, /EPERM/);
  assert.deepEqual(pendingEntries(report), [{ sessionId: 's-1', cwd: 'D:\\Demo\\locked' }]);
});

test('an already attached session is counted, not duplicated', async () => {
  const registry = fakeRegistry();
  const workspace = await registry.create('D:\\Demo\\demo1');
  workspace.sessionIds.push('s-1');
  const report = await reconcileWorkspaces({
    registry,
    entries: [{ sessionId: 's-1', cwd: 'D:\\Demo\\demo1' }, { sessionId: 's-2', cwd: 'D:\\Demo\\demo1' }],
    checkDirectory: present(['D:\\Demo\\demo1']),
  });
  assert.equal(report.already, 1);
  assert.equal(report.attached, 1);
  assert.deepEqual(workspace.sessionIds, ['s-1', 's-2']);
});

test('one failing workspace never blocks the others', async () => {
  const registry = fakeRegistry(new Set(['D:\\Demo\\broken']));
  const report = await reconcileWorkspaces({
    registry,
    entries: [
      { sessionId: 's-1', cwd: 'D:\\Demo\\broken' },
      { sessionId: 's-2', cwd: 'D:\\Demo\\ok' },
    ],
    checkDirectory: present(['D:\\Demo\\broken', 'D:\\Demo\\ok']),
  });
  assert.equal(report.attached, 1);
  assert.equal(report.failed.length, 1);
  assert.equal(report.failed[0].sessionId, 's-1');
  assert.match(report.failed[0].reason, /cannot create workspace/);
  assert.deepEqual(pendingEntries(report), [{ sessionId: 's-1', cwd: 'D:\\Demo\\broken' }]);
});

test('attach failures are reported per session', async () => {
  const registry = fakeRegistry();
  const workspace = await registry.create('D:\\Demo\\demo1');
  workspace.attachSession = async () => {
    throw new Error('its cwd does not resolve');
  };
  const report = await reconcileWorkspaces({
    registry,
    entries: [{ sessionId: 's-1', cwd: 'D:\\Demo\\demo1' }],
    checkDirectory: present(['D:\\Demo\\demo1']),
  });
  assert.equal(report.attached, 0);
  assert.deepEqual(report.failed, [
    { path: 'D:\\Demo\\demo1', sessionId: 's-1', reason: 'its cwd does not resolve' },
  ]);
});

test('a profile without a workspace registry degrades quietly', async () => {
  for (const registry of [null, undefined, {}]) {
    const report = await reconcileWorkspaces({ registry, entries: [{ sessionId: 's-1', cwd: 'D:\\Demo\\demo1' }] });
    assert.equal(report.available, false);
    assert.equal(report.attached, 0);
    assert.deepEqual(report.created, []);
    assert.deepEqual(report.missing, []);
    assert.deepEqual(pendingEntries(report), []);
    assert.equal(publicWorkspaceReport(report).available, false);
  }
  assert.equal(publicWorkspaceReport(null), null);
});

test('publicWorkspaceReport exposes counts and paths only', async () => {
  const registry = fakeRegistry();
  const report = await reconcileWorkspaces({
    registry,
    entries: [
      { sessionId: 's-1', cwd: 'D:\\Demo\\here' },
      { sessionId: 's-2', cwd: 'D:\\Demo\\fresh' },
      { sessionId: 's-3', cwd: 'D:\\Demo\\gone' },
    ],
    checkDirectory: present(['D:\\Demo\\here']),
    makeDirectory: async (target) => {
      if (target === 'D:\\Demo\\gone') throw new Error('EPERM: access denied');
      return true;
    },
  });
  /* `fresh` is created and attached; `gone` fails creation and stays pending. */
  report.unreadable = 2;
  const published = publicWorkspaceReport(report);
  assert.deepEqual(published, {
    available: true,
    attached: 2,
    already: 0,
    unreadable: 2,
    created: [{ path: 'D:\\Demo\\fresh', sessions: 1 }],
    missing: [],
    failed: [{ path: 'D:\\Demo\\gone', sessionId: 's-3', reason: '无法创建工作区目录：EPERM: access denied' }],
  });
});

test('directoryExists only accepts folders', async () => {
  assert.equal(await directoryExists('.'), true);
  assert.equal(await directoryExists('.\\does-not-exist-8f2a'), false);
});
