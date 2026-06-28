# Usage Scenarios

These playbooks show expected commands, state changes, branch names, commit subjects, and stop conditions in different situations.

## Scenario 1: trunk feature with required Jira

Configuration:

```md
- **Mode:** required
- **Project Keys:** LSG, BOL
- **Branch Format:** <type>/<ticket>-<name>
- **Commit Format:** <commit-type>: [<ticket>] - <message>
```

Command:

```text
/feature load trunk feature --ticket LSG-12345 "Add account summary"
```

Expected loaded state:

```text
Status: Not Started
Workflow: trunk
Work Type: feature
Jira Ticket: LSG-12345
Base Branch: trunk
Work Branch: empty
```

Start:

```text
/feature start
```

Expected branch:

```text
feature/LSG-12345-add-account-summary
```

Publish:

```text
/feature test
/feature review
/feature publish
```

Expected subject shape:

```text
feat: [LSG-12345] - add account summary
```

After GitHub merge:

```text
/feature complete
```

## Scenario 2: fix from a release branch

Goal: create a fix directly from `release-1.80.0` and merge it back into that release.

```text
/feature load branch release-1.80.0 fix --ticket BOL-742 "Correct payment timeout"
/feature start
/feature test
/feature review
/feature publish
```

Expected branch:

```text
fix/BOL-742-correct-payment-timeout
```

Expected PR:

```text
head: fix/BOL-742-correct-payment-timeout
base: release-1.80.0
```

Do not call `backport` for this item. It already originates from and returns to the release branch.

## Scenario 3: specification file in context/features

File:

```text
context/features/account-summary.md
```

Contents:

```md
# Account Summary

## Git Workflow

- **Workflow:** trunk
- **Work Type:** feature
- **Jira Ticket:** LSG-12345
- **Base Branch:** trunk

## Goals

- Add a summary query.
- Add an API endpoint.
- Add focused tests.
```

Load by name without extension:

```text
/feature load account-summary
```

The source is stored as `context/features/account-summary.md`. The source file is not modified or moved.

## Scenario 4: inline description without Jira

Configuration:

```md
- **Mode:** disabled
```

Command:

```text
/feature load trunk chore "Refresh generated client"
```

Expected branch:

```text
chore/refresh-generated-client
```

Expected commit:

```text
chore: refresh generated client
```

## Scenario 5: optional Jira mode

Configuration:

```md
- **Mode:** optional
```

With ticket:

```text
/feature load trunk feature --ticket ABC-12 "Add report export"
branch: feature/ABC-12-add-report-export
commit: feat: [ABC-12] - add report export
```

Without ticket:

```text
/feature load trunk feature "Add report export"
branch: feature/add-report-export
commit: feat: add report export
```

## Scenario 6: begin a second task while the first waits for review

Task A is Published:

```text
feature/LSG-100-account-summary
```

Free the active slot:

```text
/feature clear
```

Start task B:

```text
/feature load trunk fix --ticket LSG-101 "Correct account status"
/feature start
```

Task A remains in Pending Reviews. When GitHub merges task A:

```text
/feature complete feature/LSG-100-account-summary
```

The active task B must remain untouched.

## Scenario 7: squash-merged primary PR

The branch contains original commit `abc111`, but GitHub squash-merges it as `def222`. `abc111` is not an ancestor of `origin/trunk`.

Active work:

```text
/feature complete active def222
```

Pending work:

```text
/feature complete feature/LSG-100-account-summary def222
```

The supplied SHA is verification evidence. It does not replace Published Commits.

## Scenario 8: two atomic commits backported to release

Published Commits:

```text
abc111 feat: [LSG-200] - add repository root helper
def222 feat: [LSG-200] - add repository name helper
```

After trunk merge:

```text
/feature backport release-1.79.0
```

Expected cherry-picks:

```text
git cherry-pick -x abc111
git cherry-pick -x def222
```

Forbidden cherry-pick:

```text
git cherry-pick <github-pr-merge-sha>
```

Expected backport branch with default Jira format:

```text
backport/LSG-200-repository-helpers-release-1.79.0
```

## Scenario 9: backport a pending item while another feature is active

Task A was published and cleared. Task B is active. After task A merges to trunk:

```text
/feature backport feature/LSG-200-repository-helpers release-1.79.0
```

The action selects task A by exact Work Branch. It updates only task A's pending metadata and preserves task B's active state.

After the release PR merges:

```text
/feature complete feature/LSG-200-repository-helpers
```

## Scenario 10: cherry-pick conflict during backport

The action stops with:

```text
current branch: backport/LSG-300-conflict-demo-release-1.0.0
CHERRY_PICK_HEAD: <failing-primary-sha>
conflict: src/example.ts
```

Nothing is skipped, resolved, or aborted automatically.

To abandon the whole active item:

```text
/feature abandon --discard
```

The confirmation must explicitly include:

- abort the in-progress cherry-pick;
- discard listed local changes;
- delete related local work and backport branches.

Remote branches remain.

## Scenario 11: dirty tree blocks start

Loaded state allows only:

- ignored files below `context/`;
- the exact recorded Markdown Source Spec outside context.

Suppose `README.md` is modified:

```text
 M README.md
```

`/feature start` stops and lists it. The action does not auto-stash it.

Resolve the file manually by committing it in the correct workflow, moving it out of the way, or intentionally discarding it outside the feature skill.

## Scenario 12: local base is behind origin

```text
local main:  a111111
origin/main: b222222
```

`start` switches to main and runs a fast-forward-only pull. It creates the work branch only after both SHAs equal `b222222`.

## Scenario 13: local base diverged

```text
local release-1.80.0:  a111111
origin/release-1.80.0: b222222
neither is ancestor of the other
```

`start` stops. It does not reset, rebase, merge, or force-pull. The user must decide how to reconcile the local branch.

## Scenario 14: remote base does not exist

```text
/feature load branch test/missing-base feature "Guard demo"
/feature start
```

`load` may succeed because it does not fetch or require the remote ref. `start` fetches, fails to find `origin/test/missing-base`, and stops before creating any branch.

Expected state:

```text
Status: Not Started
Work Branch: empty
current Git branch: unchanged
```

## Scenario 15: invalid Jira project key

Configuration:

```md
- **Mode:** required
- **Project Keys:** LSG, BOL
```

Command:

```text
/feature load trunk feature --ticket ABC-12 "Add export"
```

`load` rejects `ABC` before updating state and reports the allowed keys.

## Scenario 16: conflicting spec metadata

Command:

```text
/feature load trunk feature spec.md
```

But `spec.md` contains:

```md
- **Workflow:** branch
- **Base Branch:** release-1.80.0
```

The explicit command and spec conflict. `load` stops and reports both values. It does not silently prefer trunk.

## Scenario 17: pre-existing non-compliant commit

Jira mode is required. The branch has:

```text
abc111 feat: add account summary
```

`publish` detects that the ticket is missing and stops before push. It reports the SHA and expected shape:

```text
feat: [LSG-12345] - <message>
```

History rewriting remains a manual, team-policy decision.

## Scenario 18: PR points to the wrong base

Recorded Base Branch:

```text
release-1.80.0
```

Existing PR base:

```text
main
```

`publish` must stop and require retargeting. The generic URL printed by `git push` is not accepted as proof of the correct base.

## Scenario 19: cancel before start

State is Not Started and no Work Branch exists:

```text
/feature abandon
```

The active slot returns to Idle. No branch deletion is needed.

## Scenario 20: cancel dirty implementation

State is In Progress and uncommitted files exist:

```text
/feature abandon
```

Plain abandon stops because the tree is dirty. If the work should truly be destroyed:

```text
/feature abandon --discard
```

Review the preview and confirm explicitly.

## Scenario 21: abandon published work

A published branch is cancelled after push:

```text
/feature abandon
```

The skill may remove local workflow state and a confirmed local branch, but it reports the remote branch. It never deletes `origin/<work-branch>` and never closes the PR.

## Scenario 22: complete fails because merge is not visible

```text
/feature complete
```

If Published Commits are not ancestors of the remote base and no valid merge result SHA is supplied, completion stops. State remains unchanged. Wait for GitHub, fetch again, or provide the correct squash/rebase SHA.

## Scenario 23: work type fix versus bugfix

Both are supported branch prefixes:

```text
fix/LSG-500-payment-timeout
bugfix/LSG-501-empty-state
```

Both map to conventional commit type `fix`:

```text
fix: [LSG-500] - correct payment timeout
fix: [LSG-501] - handle empty state
```
