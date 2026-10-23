import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRepo, run, headCommit, orphans, layout, encodeState, decodeState } from '../src/gitviz/gitEngine.js';

const play = (...cmds) => cmds.reduce((s, c) => {
  const r = run(s, c);
  if (r.error) throw new Error(`${c}: ${r.error}`);
  return r.state;
}, createRepo());

test('commit moves the current branch', () => {
  const s = play('git commit -m "a"');
  assert.equal(s.branches.main, 'c1');
  assert.deepEqual(s.commits.c1.parents, ['c0']);
});

test('branch + checkout -b + commit grows the new branch only', () => {
  const s = play('git checkout -b feature', 'git commit -m "f"');
  assert.equal(s.HEAD, 'feature');
  assert.equal(s.branches.feature, 'c1');
  assert.equal(s.branches.main, 'c0');
  assert.equal(s.commits.c1.lane, 1);
});

test('merge fast-forwards when possible', () => {
  const s = play('git branch f', 'git checkout f', 'git commit', 'git checkout main', 'git merge f');
  assert.equal(s.branches.main, s.branches.f);
});

test('merge creates a two-parent commit when diverged', () => {
  const s = play('git checkout -b f', 'git commit', 'git checkout main', 'git commit', 'git merge f');
  const m = s.commits[s.branches.main];
  assert.equal(m.parents.length, 2);
});

test('reset --hard orphans commits', () => {
  const s = play('git commit', 'git commit', 'git reset --hard HEAD~2');
  assert.equal(headCommit(s), 'c0');
  assert.deepEqual([...orphans(s)].sort(), ['c1', 'c2']);
});

test('rebase replays commits onto target', () => {
  const s = play('git checkout -b f', 'git commit -m x', 'git checkout main', 'git commit -m y', 'git checkout f', 'git rebase main');
  const tip = s.commits[s.branches.f];
  assert.equal(tip.message, 'x');
  assert.deepEqual(tip.parents, [s.branches.main]);
  assert.ok(orphans(s).has('c1'));
});

test('cherry-pick copies a commit', () => {
  const s = play('git checkout -b f', 'git commit -m fix', 'git checkout main', 'git cherry-pick c1');
  assert.equal(s.commits[s.branches.main].message, 'fix');
});

test('errors are reported, not thrown', () => {
  assert.ok(run(createRepo(), 'git checkout nope').error);
  assert.ok(run(createRepo(), 'ls').error);
});

test('layout and share round-trip', () => {
  const s = play('git commit', 'git checkout -b f', 'git commit');
  assert.equal(layout(s).nodes.length, 3);
  assert.deepEqual(decodeState(encodeState(s)), s);
});
