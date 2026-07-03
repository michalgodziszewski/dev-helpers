# Safety and Recovery

The skill is conservative by design. It prioritizes correct branch ancestry, explicit user intent, and preservation of unrelated work.

## Safety principles

1. Never guess a critical branch or SHA.
2. Never branch from stale local state.
3. Never hide dirty work through automatic stashing.
4. Never rewrite history automatically.
5. Never use a GitHub merge commit as an atomic backport commit.
6. Never stage local context.
7. Never delete remote branches or pull requests.
8. Never clear unrelated active, pending, or historical state.
9. Ask the user only at the defined confirmation boundaries: the single combined publish approval (commit message + atomic commit list + push), and one explicit confirmation per destructive operation — the combined backport cherry-pick + push, local branch deletion, and destructive abandon. Read-only Git commands (status, fetch, diff, log, show, rev-list, rev-parse, merge-base, check-ref-format) never ask a question or wait for acknowledgement.

## Operation matrix

| Operation | Read-only | Asks the user | Remote effect |
|---|---:|---:|---:|
| `plan` | Yes for Git (never fetches, branches, commits, or pushes); writes context/plans/ and target folder only | Only targeted questions for missing required planning inputs | None |
| `load` | Mostly; writes local context | Only missing/conflicting required metadata | None |
| `start` | No | Never | Fetch/pull only |
| `test` | Usually | Never (dependency/config changes still require permission) | None |
| `review` | Yes except fetch | Never | Fetch only |
| `explain` | Yes | Never | None |
| `publish` | No | Once: combined commit message + atomic list + push | Push work branch |
| `clear` | Local state | Never | Fetch only |
| `backport` | No | Once: combined cherry-pick list + push | Push backport branch |
| `complete` | Local state | One confirmation per local branch deletion | Fetch only |
| `abandon` | No | One confirmation per local branch deletion | Never deletes remote |
| `abandon --discard` | Destructive | One explicit consequence confirmation | Never deletes remote |

## Autonomous run (--yolo) safety

`--yolo` removes the manual pauses between actions; it removes no safety gate. The run applies each action's own procedure and stops at the same boundaries a manual run would.

- The combined publish approval is preserved exactly. `--yolo` never commits or pushes without it, and never pre-answers or suppresses it. Destructive operations are never part of the run. The only other prompt that can appear is the pre-existing `test` gate: a check needing a dependency install or test-config change stops and asks, exactly as a manual run would — `--yolo` grants no permission to install dependencies or change configuration.
- The failure response is deliberately split:
  - failing tests or required checks, and `Needs changes` review verdicts or high-severity findings, are treated as work — fixed, re-run, and re-reviewed until they pass, bounded to about 2–3 attempts on the same failure before stopping with a report;
  - infrastructure and safety failures stop the run immediately with an exact report and are never auto-resolved: a base that cannot fast-forward, a local base that differs from origin, a disallowed dirty working tree, or a work-branch collision.
- The run never auto-stashes, resets, rebases, force-pulls, or force-pushes to get past a stop. Recovery from an infrastructure stop is the same manual process as for a stopped `start` (see Base synchronization and the Recovery checklist).

## Working-tree cleanliness

`start` and `backport` inspect all paths outside `context/`.

Allowed before start:

- ignored `context/` files;
- the exact recorded Source Spec when it is a repository-relative Markdown file outside context.

Not allowed:

- unrelated tracked modifications;
- unrelated untracked files;
- staged changes;
- unresolved conflicts;
- wildcard or directory Source Spec;
- Source Spec outside the repository.

Why: switching and pulling with unrelated changes risks overwriting work or mixing scopes. The skill reports the paths and stops instead of stashing.

## Base synchronization

The skill uses `git pull --ff-only`. This distinguishes three cases.

### Local behind remote

Fast-forward succeeds. Branch creation continues after SHA equality.

### Local equal remote

No update is necessary. Branch creation continues.

### Diverged

Fast-forward fails. The skill stops.

Recovery is intentionally manual because the correct choice depends on ownership of local commits:

- preserve them on another branch;
- push them if they are legitimate;
- rebase or merge according to team policy;
- delete/reset only with explicit understanding and authority.

The feature skill does not choose among these options.

## Missing remote base

If `origin/<base-branch>` is absent, `start` or `backport` stops before branch creation.

Check:

```text
git fetch origin --prune
git branch -r --list origin/<base-branch>
```

Do not replace the base with main or trunk unless the work requirement changes.

## Publish safety

`publish` stages only files belonging to the work item and excludes context completely.

Before push it verifies:

- current branch identity;
- tests;
- review verdict;
- Jira branch and commit policy;
- remote base existence;
- ordered atomic commit list;
- absence of merge commits in that list.

After push it verifies:

```text
origin/<work-branch> == local <work-branch>
```

If commit succeeds but push fails, inspect the error and branch status. Fix authentication, remote, or connectivity, then rerun publication. Do not create duplicate commits blindly.

## Pull request base safety

The recorded Base Branch is the only valid primary PR target. The selected release branch is the only valid backport PR target.

The skill produces an explicit compare URL:

```text
https://github.com/<owner>/<repository>/compare/<base>...<head>?expand=1
```

When GitHub CLI is available:

```text
gh pr create --base <base> --head <head>
```

If an existing PR targets another base, retarget it before merge.

## Atomic backport safety

Published Commits are selected from the work branch relative to the remote base. Backport uses those exact SHAs, in order.

Never cherry-pick a GitHub merge commit. Merge and squash SHAs are verification evidence only.

Why not the GitHub merge commit:

- it may include more than the intended atomic changes;
- it may include synchronization history;
- it makes release review less precise;
- it can pull unrelated changes into an environment.

Every cherry-pick uses `-x` for traceability.

## Backport conflict state

On conflict, the action deliberately preserves:

- `CHERRY_PICK_HEAD`;
- conflict markers;
- current backport branch;
- already-recorded Backport Commits;
- release and branch metadata.

It deliberately does not:

- choose ours or theirs;
- skip the commit;
- resolve files;
- stage a resolution;
- continue;
- abort;
- delete the branch.

### Continue after manual resolution

Resolve according to product intent and release compatibility, stage the resolved paths, and continue the current cherry-pick. Re-run relevant checks before push. Do not lose the order of remaining Published Commits.

### Abandon the selected work

Active item:

```text
/feature abandon --discard
```

Pending item:

```text
/feature abandon --discard <work-branch>
```

After confirmation, the action aborts the cherry-pick first, verifies operation state is gone, discards listed paths, switches away, and deletes only related local branches.

## Safe versus destructive abandon

### Plain abandon

Use when the tree is clean. It preserves uncommitted data by refusing to proceed when changes exist.

### Destructive abandon

Use only when the selected work should be destroyed. The confirmation must enumerate:

- cherry-pick abort when present;
- every tracked, staged, and untracked path to discard;
- related local branches to delete;
- commits that may become reachable only through deleted local refs.

`git clean` preview uses `-nd`. Actual cleanup uses `-fd`, never `-x` or `-X`, so ignored context remains protected.

## Local and remote branch deletion

Local branch deletion is allowed only after:

- showing unmerged commits;
- receiving confirmation;
- switching away from the branch.

Remote deletion is never automatic. A cancelled remote branch or PR must be handled separately through team-approved GitHub operations.

## Pending state isolation

Every pending operation selects an exact Work Branch. The action must preserve:

- another active item;
- all non-matching pending entries;
- all non-matching History entries;
- branches unrelated to the selected item.

Partial matching is forbidden because similar work names can coexist.

## Context privacy

The repository ignores `/context/`. Safety checks treat it as personal runtime data.

Never:

- stage context with `git add -f`;
- include specs or screenshots in feature commits;
- use `git clean -x` or `git clean -X` during abandon;
- delete all context while cleaning one item;
- publish personal workflow history.

## Secrets and generated artifacts

`review` checks for secrets, generated artifacts, and debug code in the work diff. If detected, remove them before publication.

Do not place secrets in context templates either. Context is ignored, but local secrecy and machine compromise risks remain.

## Recovery checklist

When an action stops:

1. read the exact reported precondition or Git error;
2. run read-only status and branch checks;
3. confirm the active/pending item identity;
4. fix only the blocking condition;
5. rerun the same action;
6. do not broaden cleanup to unrelated branches or files.

Useful read-only checks:

```text
git status --short --branch
git branch --show-current
git branch -vv
git branch -r
git log --oneline --decorate -10
git diff --stat
git diff --cached --stat
git rev-parse <base>
git rev-parse origin/<base>
git diff --name-only --diff-filter=U
```
