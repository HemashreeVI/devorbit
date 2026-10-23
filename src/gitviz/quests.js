import { ancestors, isAncestor } from './gitEngine';

// Guided levels. check(state, effect) returns true when the goal is met.
export const QUESTS = [
  {
    id: 'liftoff', title: 'Liftoff', badge: 'I',
    story: 'Mission control needs proof of life. Save two snapshots of your project.',
    goal: 'Make 2 commits on main',
    hints: ['git commit -m "Add navbar"', 'git commit -m "Add footer"'],
    check: (s) => ancestors(s, s.branches.main ?? 'c0').size >= 3,
  },
  {
    id: 'parallel', title: 'Parallel universe', badge: 'II',
    story: 'Try a risky idea without touching main. Branches are free — open a new timeline.',
    goal: 'Create a branch named feature and switch to it',
    hints: ['git checkout -b feature'],
    check: (s) => s.HEAD === 'feature',
  },
  {
    id: 'diverge', title: 'Diverge', badge: 'III',
    story: 'Work happens in both universes at once. Commit on feature, then hop back and commit on main.',
    goal: 'feature and main each have a commit the other lacks',
    hints: ['git commit -m "Feature work"', 'git checkout main', 'git commit -m "Hotfix on main"'],
    check: (s) => s.branches.feature && s.branches.main && !isAncestor(s, s.branches.feature, s.branches.main) && !isAncestor(s, s.branches.main, s.branches.feature),
  },
  {
    id: 'rendezvous', title: 'Rendezvous', badge: 'IV',
    story: 'Time to bring the feature home. When histories diverge, git builds a commit with two parents.',
    goal: 'On main, merge feature (creates a merge commit)',
    hints: ['git checkout main', 'git merge feature'],
    check: (s, e) => e?.type === 'merge' && s.HEAD === 'main',
  },
  {
    id: 'fastlane', title: 'Fast lane', badge: 'V',
    story: 'Sometimes one side is simply behind. Then git just slides the label forward — a fast-forward.',
    goal: 'Branch hotfix, commit on it, then fast-forward main to it',
    hints: ['git checkout -b hotfix', 'git commit -m "Fix typo"', 'git checkout main', 'git merge hotfix'],
    check: (s, e) => e?.type === 'ff' && s.branches.hotfix && s.branches.main === s.branches.hotfix,
  },
  {
    id: 'timemachine', title: 'Time machine', badge: 'VI',
    story: 'You committed something embarrassing. Rewind the branch — the old commit fades into the void.',
    goal: 'Commit, then undo it with reset --hard',
    hints: ['git commit -m "oops"', 'git reset --hard HEAD~1'],
    check: (s, e) => e?.type === 'reset' && e.ids?.length > 0,
  },
  {
    id: 'straight', title: 'Straight line', badge: 'VII',
    story: 'Reviewers love a tidy history. Replay your branch on top of main instead of merging.',
    goal: 'Make a topic branch with a commit, add a commit on main, then rebase topic onto main',
    hints: ['git checkout -b topic', 'git commit -m "Topic work"', 'git checkout main', 'git commit -m "Main moves on"', 'git checkout topic', 'git rebase main'],
    check: (s, e) => e?.type === 'rebase',
  },
  {
    id: 'copypaste', title: 'Copy & paste', badge: 'VIII',
    story: 'One fix from another branch is needed right here, right now. Cherry-pick copies a single commit.',
    goal: 'Cherry-pick any commit from another branch',
    hints: ['git log', 'git cherry-pick <id>  (click a dot to grab its id)'],
    check: (s, e) => e?.type === 'pick',
  },
  {
    id: 'bookmark', title: 'Ship it', badge: 'IX',
    story: 'Release day! Tags are permanent bookmarks that never move.',
    goal: 'Tag the current commit as v1.0',
    hints: ['git tag v1.0'],
    check: (s) => !!s.tags['v1.0'],
  },
];
