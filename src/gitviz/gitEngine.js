// gitEngine.js — a tiny, pure git simulator.
// It knows nothing about React: run(state, input) -> { state, output, explanation, effect } | { error }.
// Every function returns a NEW state object; nothing is mutated in place.

export const LANE_COLORS = 4;

export function createRepo() {
  return {
    commits: {
      c0: { id: 'c0', parents: [], message: 'Initial commit', lane: 0, gen: 0 },
    },
    branches: { main: 'c0' },
    tags: {},
    lanes: { main: 0 },
    HEAD: 'main', // a branch name, or a commit id when detached
    nextId: 1,
  };
}

/* ---------- helpers ---------- */

const clone = (s) => ({
  ...s,
  commits: { ...s.commits },
  branches: { ...s.branches },
  tags: { ...s.tags },
  lanes: { ...s.lanes },
});

export const isDetached = (s) => !(s.HEAD in s.branches);
export const headCommit = (s) => (isDetached(s) ? s.HEAD : s.branches[s.HEAD]);

const validName = (n) => /^[A-Za-z0-9._/-]+$/.test(n) && !/^c\d+$/.test(n) && n !== 'HEAD';

export function tokenize(input) {
  const out = [];
  const re = /"([^"]*)"|'([^']*)'|(\S+)/g;
  let m;
  while ((m = re.exec(input))) out.push(m[1] ?? m[2] ?? m[3]);
  return out;
}

/** Resolve a ref like main, c3, HEAD, HEAD~2, feature^, v1.0 to a commit id. */
export function resolve(s, ref) {
  if (!ref) return null;
  const m = ref.match(/^(.+?)((?:[~^]\d*)*)$/);
  let base = m[1];
  let id =
    base === 'HEAD' ? headCommit(s)
    : s.branches[base] ?? s.tags[base] ?? (s.commits[base] ? base : null);
  if (!id) return null;
  const moves = m[2].match(/[~^]\d*/g) || [];
  for (const mv of moves) {
    const n = mv.length > 1 ? parseInt(mv.slice(1), 10) : 1;
    for (let i = 0; i < n; i++) {
      id = s.commits[id]?.parents[0];
      if (!id) return null;
    }
  }
  return id;
}

/** All commit ids reachable from id (including itself). */
export function ancestors(s, id) {
  const seen = new Set();
  const stack = [id];
  while (stack.length) {
    const c = stack.pop();
    if (!c || seen.has(c)) continue;
    seen.add(c);
    stack.push(...s.commits[c].parents);
  }
  return seen;
}

export const isAncestor = (s, a, b) => ancestors(s, b).has(a);

/** Commits not reachable from any branch, tag or HEAD (drawn faded). */
export function orphans(s) {
  const live = new Set();
  [...Object.values(s.branches), ...Object.values(s.tags), headCommit(s)].forEach((id) =>
    ancestors(s, id).forEach((c) => live.add(c))
  );
  return new Set(Object.keys(s.commits).filter((c) => !live.has(c)));
}

function freeLane(s) {
  const used = new Set(Object.values(s.lanes));
  let i = 0;
  while (used.has(i)) i++;
  return i;
}

function addCommit(s, parents, message, lane) {
  const id = 'c' + s.nextId;
  const gen = Math.max(...parents.map((p) => s.commits[p].gen)) + 1;
  s.commits[id] = { id, parents, message, lane, gen, ts: Date.now() };
  s.nextId += 1;
  return id;
}

function currentLane(s) {
  if (!isDetached(s)) return s.lanes[s.HEAD] ?? 0;
  return s.commits[s.HEAD].lane;
}

function moveHead(s, id) {
  if (isDetached(s)) s.HEAD = id;
  else s.branches[s.HEAD] = id;
}

const ok = (state, explanation, output = [], effect = null) => ({ state, explanation, output, effect });
const fail = (error) => ({ error });

/* ---------- commands ---------- */

function commit(s, args) {
  const mi = args.findIndex((a) => a === '-m' || a === '--message');
  const amend = args.includes('--amend');
  const message = mi >= 0 && args[mi + 1] ? args[mi + 1] : amend ? null : `Commit ${s.nextId}`;
  const n = clone(s);
  const parent = headCommit(s);
  if (amend) {
    const old = s.commits[parent];
    if (!old.parents.length) return fail('Cannot amend the initial commit in this simulator.');
    const id = addCommit(n, old.parents, message ?? old.message, old.lane);
    moveHead(n, id);
    return ok(n, `--amend made a brand-new commit ${id} replacing ${parent}. The old one is now unreachable (faded).`, [], { type: 'commit', ids: [id] });
  }
  const id = addCommit(n, [parent], message, currentLane(s));
  moveHead(n, id);
  const where = isDetached(s) ? 'HEAD (detached)' : `branch "${s.HEAD}"`;
  return ok(n, `Saved a snapshot as ${id} on top of ${parent}, and moved ${where} forward to it.`, [`[${isDetached(s) ? 'detached' : s.HEAD} ${id}] ${message}`], { type: 'commit', ids: [id] });
}

function branch(s, args) {
  if (!args.length) {
    const lines = Object.keys(s.branches).map((b) => `${b === s.HEAD ? '*' : ' '} ${b}  → ${s.branches[b]}`);
    return ok(s, 'Listed every branch. The * marks the one HEAD points to.', lines);
  }
  if (args[0] === '-d' || args[0] === '-D') {
    const name = args[1];
    if (!(name in s.branches)) return fail(`error: branch '${name}' not found.`);
    if (name === s.HEAD) return fail(`error: cannot delete branch '${name}' — you are on it. Checkout another branch first.`);
    const n = clone(s);
    delete n.branches[name];
    delete n.lanes[name];
    return ok(n, `Deleted the label "${name}". Commits stay in history until nothing points to them.`, [], { type: 'branch' });
  }
  const name = args[0];
  if (!validName(name)) return fail(`fatal: '${name}' is not a valid branch name.`);
  if (name in s.branches) return fail(`fatal: a branch named '${name}' already exists.`);
  const at = args[1] ? resolve(s, args[1]) : headCommit(s);
  if (!at) return fail(`fatal: not a valid object name: '${args[1]}'.`);
  const n = clone(s);
  n.branches[name] = at;
  n.lanes[name] = freeLane(s);
  return ok(n, `Created branch "${name}" — just a lightweight label pointing at ${at}. HEAD did not move.`, [], { type: 'branch', ids: [at] });
}

function checkout(s, args) {
  if (args[0] === '-b' || args[0] === '-c') {
    const r = branch(s, args.slice(1));
    if (r.error) return r;
    r.state.HEAD = args[1];
    return ok(r.state, `Created "${args[1]}" and switched to it in one step. New commits will now grow this branch.`, [`Switched to a new branch '${args[1]}'`], { type: 'checkout' });
  }
  const target = args[0];
  if (!target) return fail('usage: git checkout <branch | commit>');
  const n = clone(s);
  if (target in s.branches) {
    if (target === s.HEAD) return ok(s, `Already on "${target}".`, [`Already on '${target}'`]);
    n.HEAD = target;
    return ok(n, `HEAD now points to "${target}" (${s.branches[target]}). Your working files would change to that snapshot.`, [`Switched to branch '${target}'`], { type: 'checkout', ids: [s.branches[target]] });
  }
  const id = resolve(s, target);
  if (!id) return fail(`error: pathspec '${target}' did not match any branch or commit.`);
  n.HEAD = id;
  return ok(n, `Detached HEAD at ${id}. You're looking at an old snapshot — commits made here belong to no branch unless you create one.`, [`HEAD is now at ${id} ${s.commits[id].message}`], { type: 'checkout', ids: [id] });
}

function merge(s, args) {
  const name = args.find((a) => !a.startsWith('-'));
  const noFF = args.includes('--no-ff');
  if (!name) return fail('usage: git merge <branch>');
  const theirs = resolve(s, name);
  if (!theirs) return fail(`merge: ${name} - not something we can merge.`);
  const ours = headCommit(s);
  if (isAncestor(s, theirs, ours)) return ok(s, `Nothing to do: everything in "${name}" is already part of your history.`, ['Already up to date.']);
  const n = clone(s);
  if (isAncestor(s, ours, theirs) && !noFF) {
    moveHead(n, theirs);
    return ok(n, `Fast-forward! Your branch was directly behind "${name}", so git simply slid the label forward to ${theirs}. No new commit needed.`, [`Updating ${ours}..${theirs}`, 'Fast-forward'], { type: 'ff', ids: [theirs] });
  }
  const label = isDetached(s) ? 'HEAD' : s.HEAD;
  const id = addCommit(n, [ours, theirs], `Merge ${name} into ${label}`, currentLane(s));
  moveHead(n, id);
  return ok(n, `The histories had diverged, so git created merge commit ${id} with TWO parents (${ours} and ${theirs}), joining both lines of work.`, [`Merge made by the 'ort' strategy. → ${id}`], { type: 'merge', ids: [id] });
}

function reset(s, args) {
  const ref = args.find((a) => !a.startsWith('--'));
  const id = resolve(s, ref || 'HEAD');
  if (!id) return fail(`fatal: ambiguous argument '${ref}': unknown revision.`);
  const n = clone(s);
  const before = headCommit(s);
  moveHead(n, id);
  const lost = [...orphans(n)].filter((c) => !orphans(s).has(c));
  const mode = args.find((a) => a.startsWith('--')) || '--mixed';
  return ok(n, `${mode} reset moved ${isDetached(s) ? 'HEAD' : `"${s.HEAD}"`} back from ${before} to ${id}.${lost.length ? ` ${lost.join(', ')} ${lost.length > 1 ? 'are' : 'is'} now unreachable (faded) — recoverable only through the reflog.` : ''}`, [`HEAD is now at ${id} ${s.commits[id].message}`], { type: 'reset', ids: lost });
}

function cherryPick(s, args) {
  const id = resolve(s, args[0]);
  if (!id) return fail(`fatal: bad revision '${args[0]}'.`);
  const src = s.commits[id];
  if (src.parents.length > 1) return fail(`error: commit ${id} is a merge — cherry-picking merges needs -m, which this simulator skips.`);
  if (isAncestor(s, id, headCommit(s))) return fail(`The changes from ${id} are already in your history.`);
  const n = clone(s);
  const nid = addCommit(n, [headCommit(s)], src.message, currentLane(s));
  moveHead(n, nid);
  return ok(n, `Copied the changes of ${id} ("${src.message}") into a NEW commit ${nid} on your branch. Same change, different id.`, [`[${s.HEAD} ${nid}] ${src.message}`], { type: 'pick', ids: [nid] });
}

function rebase(s, args) {
  if (isDetached(s)) return fail('Checkout a branch before rebasing (HEAD is detached).');
  const onto = resolve(s, args[0]);
  if (!onto) return fail(`fatal: invalid upstream '${args[0]}'.`);
  const ours = headCommit(s);
  if (isAncestor(s, ours, onto)) {
    const n = clone(s);
    moveHead(n, onto);
    return ok(n, `Your branch had no unique commits, so rebase just fast-forwarded "${s.HEAD}" to ${onto}.`, [`Successfully rebased and updated refs/heads/${s.HEAD}.`], { type: 'ff', ids: [onto] });
  }
  const base = ancestors(s, onto);
  if (base.has(ours)) return ok(s, 'Current branch is up to date.', ['Current branch is up to date.']);
  // walk first-parent chain back to the merge base, collecting commits to replay
  const toReplay = [];
  let c = ours;
  while (c && !base.has(c)) {
    if (s.commits[c].parents.length <= 1) toReplay.unshift(c);
    c = s.commits[c].parents[0];
  }
  const n = clone(s);
  let tip = onto;
  const fresh = [];
  for (const old of toReplay) {
    tip = addCommit(n, [tip], s.commits[old].message, currentLane(s));
    fresh.push(tip);
  }
  n.branches[s.HEAD] = tip;
  return ok(n, `Replayed ${toReplay.length} commit${toReplay.length > 1 ? 's' : ''} (${toReplay.join(', ')}) on top of ${onto} as new commits ${fresh.join(', ')}. History is now a straight line; the originals fade away.`, [`Successfully rebased and updated refs/heads/${s.HEAD}.`], { type: 'rebase', ids: fresh });
}

function tag(s, args) {
  if (!args.length) return ok(s, 'Listed tags — permanent bookmarks that never move.', Object.keys(s.tags).map((t) => `${t} → ${s.tags[t]}`));
  const name = args[0];
  if (!validName(name)) return fail(`fatal: '${name}' is not a valid tag name.`);
  if (name in s.tags) return fail(`fatal: tag '${name}' already exists.`);
  const id = args[1] ? resolve(s, args[1]) : headCommit(s);
  if (!id) return fail(`fatal: Failed to resolve '${args[1]}'.`);
  const n = clone(s);
  n.tags[name] = id;
  return ok(n, `Tagged ${id} as "${name}". Unlike branches, tags stay put forever — perfect for releases.`, [], { type: 'tag', ids: [id] });
}

function log(s) {
  const lines = [];
  let c = headCommit(s);
  const labels = (id) => {
    const l = Object.keys(s.branches).filter((b) => s.branches[b] === id);
    const t = Object.keys(s.tags).filter((x) => s.tags[x] === id).map((x) => `tag: ${x}`);
    const all = [...l.map((b) => (b === s.HEAD ? `HEAD -> ${b}` : b)), ...t];
    if (isDetached(s) && s.HEAD === id) all.unshift('HEAD');
    return all.length ? ` (${all.join(', ')})` : '';
  };
  while (c) {
    lines.push(`* ${c}${labels(c)} ${s.commits[c].message}`);
    c = s.commits[c].parents[0];
  }
  return ok(s, 'Walked backwards from HEAD through first parents — that is your history.', lines);
}

function status(s) {
  return ok(s, 'Status tells you where HEAD is.', [
    isDetached(s) ? `HEAD detached at ${s.HEAD}` : `On branch ${s.HEAD}`,
    `HEAD → ${headCommit(s)} "${s.commits[headCommit(s)].message}"`,
    'nothing to commit, working tree clean',
  ]);
}

export const HELP = [
  'git commit -m "msg"      save a snapshot',
  'git commit --amend       rewrite the last commit',
  'git branch [name]        list / create a branch',
  'git branch -d <name>     delete a branch label',
  'git checkout <ref>       move HEAD (branch or commit)',
  'git checkout -b <name>   create + switch  (also: git switch -c)',
  'git merge <branch>       join histories (--no-ff forces a merge commit)',
  'git rebase <branch>      replay your commits on top of another',
  'git cherry-pick <id>     copy one commit here',
  'git reset --hard <ref>   move the branch back (HEAD~1 works)',
  'git tag <name>           bookmark the current commit',
  'git log | git status     inspect',
  'undo | redo | clear      simulator controls',
];

/** Main entry: run one command string against a state. */
export function run(state, input) {
  const t = tokenize(input.trim());
  if (!t.length) return fail('Type a command — try "help".');
  if (t[0] === 'help') return ok(state, 'Here is everything this simulator understands.', HELP);
  if (t[0] === 'clear' || (t[0] === 'reset' && t.length === 1)) return ok(createRepo(), 'Fresh start: one initial commit on main.', [], { type: 'clear' });
  if (t[0] !== 'git') return fail(`command not found: ${t[0]} — commands start with "git" (try "help").`);
  const [, cmd, ...args] = t;
  switch (cmd) {
    case 'commit': return commit(state, args);
    case 'branch': return branch(state, args);
    case 'checkout': return checkout(state, args);
    case 'switch': return checkout(state, args[0] === '-c' || args[0] === '--create' ? ['-b', ...args.slice(1)] : args);
    case 'merge': return merge(state, args);
    case 'reset': return reset(state, args);
    case 'cherry-pick': return cherryPick(state, args);
    case 'rebase': return rebase(state, args);
    case 'tag': return tag(state, args);
    case 'log': return log(state);
    case 'status': return status(state);
    case undefined: return ok(state, 'git needs a sub-command.', HELP);
    default: return fail(`git: '${cmd}' is not supported here yet. Type "help" for the list.`);
  }
}

/* ---------- layout for drawing ---------- */

/** Positions every commit: x = generation, y = lane. Returns nodes + edges. */
export function layout(s) {
  const dead = orphans(s);
  const nodes = Object.values(s.commits).map((c) => ({ ...c, x: c.gen, y: c.lane, dead: dead.has(c.id) }));
  const edges = [];
  for (const c of nodes) for (const p of c.parents) edges.push({ from: p, to: c.id, dead: c.dead || dead.has(p) });
  const maxX = Math.max(...nodes.map((n) => n.x));
  const maxY = Math.max(...nodes.map((n) => n.y));
  return { nodes, edges, maxX, maxY };
}

/* ---------- sharing ---------- */

export const encodeState = (s) => btoa(unescape(encodeURIComponent(JSON.stringify(s))));
export function decodeState(str) {
  try {
    const s = JSON.parse(decodeURIComponent(escape(atob(str))));
    if (s && s.commits && s.branches && s.HEAD) return s;
  } catch {
    /* ignore bad links */
  }
  return null;
}
