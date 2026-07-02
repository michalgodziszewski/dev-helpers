# Workflows

This document describes complete operational flows. See [Action reference](action-reference.md) for command-level details and [Scenarios](scenarios.md) for more copyable examples.

## Shared invariant: synchronize before branching

Every work branch and backport branch follows the same base synchronization rule:

1. ignore local `context/` files when checking cleanliness;
2. require every other path to be clean, except an explicitly recorded Markdown Source Spec outside `context/`;
3. run `git fetch origin --prune`;
4. switch to the exact local base, creating a tracking branch when necessary;
5. run `git pull --ff-only origin <base-branch>`;
6. verify local and remote base SHAs are equal;
7. create the new branch only after verification.

If any step fails, branch creation stops. The skill does not stash, reset, rebase, force-pull, or guess another base.

## Workflow A: trunk-based development

Use this workflow when primary work starts from `trunk` and merges back into `trunk`.

### 1. Load

From an inline description:

```text
/feature load trunk feature --ticket LSG-12345 "Add account summary"
```

From a Markdown specification:

```text
/feature load account-summary
```

The specification must resolve to `Workflow: trunk` and `Base Branch: trunk`, unless those values came explicitly from the command. Conflicting spec metadata stops loading.

### 2. Start

```text
/feature start
```

`start` fetches and fast-forwards `trunk`, verifies `trunk == origin/trunk`, renders the work branch, and creates it.

Example with Jira:

```text
feature/LSG-12345-add-account-summary
```

Example with Jira disabled:

```text
feature/add-account-summary
```

### 3. Implement, test, and review

```text
/feature test
/feature review
/feature explain
```

`test` discovers repository-specific checks. `review` compares the work branch against `origin/trunk` with a merge-base diff. `explain` describes changed files and control flow.

### 4. Publish

```text
/feature publish
```

Publication has exactly one confirmation boundary: a single combined approval showing the proposed commit message, the exact ordered atomic commit list selected for publication, ignored merge commits, and the push target together. Everything before it (fetch, tests, review, commit-list validation) runs without questions.

The work branch is pushed to origin. The pull request base is explicitly `trunk`.

### 5. Merge on GitHub

The skill never performs the primary merge locally. Merge the pull request on GitHub using the team's merge policy.

### 6. Complete

For a normal merge commit that preserves the published atomic commits:

```text
/feature complete
```

For squash or rebase policies where the original commits are not ancestors of `origin/trunk`, supply the resulting GitHub SHA:

```text
/feature complete active <primary-merge-sha>
```

Completion fetches origin and verifies ancestry before updating local History.

## Workflow B: work from an explicit base

Use this when work starts from a release, integration, customer, or other named branch and should merge back into the same branch.

```text
/feature load branch release-1.80.0 fix --ticket BOL-742 payment-timeout
/feature start
/feature test
/feature review
/feature publish
```

Important differences from trunk workflow:

- `Base Branch` is exactly `release-1.80.0`;
- `start` synchronizes that branch, not trunk;
- the primary PR must target `release-1.80.0`;
- standard `backport` is unavailable because the item is not a trunk item;
- `complete` verifies against `origin/release-1.80.0`.

After a GitHub merge:

```text
/feature complete
```

If the team squash-merges:

```text
/feature complete active <release-merge-sha>
```

## Workflow C: free the active slot while review is pending

Use `clear` when a published branch is waiting for review and you need to begin another task.

```text
/feature publish
/feature clear
```

`clear` verifies the remote work branch exists and matches local HEAD. It moves all structured metadata into Pending Reviews and resets only the active slot.

Now load another item:

```text
/feature load trunk fix --ticket LSG-12346 "Correct account status"
/feature start
```

After the first PR merges, complete it by exact branch name without disrupting the second item:

```text
/feature complete feature/LSG-12345-add-account-summary
```

For a squash merge:

```text
/feature complete feature/LSG-12345-add-account-summary <primary-merge-sha>
```

## Workflow D: backport merged trunk work

Use `backport` only when:

- the selected item has `Workflow: trunk`;
- its `Base Branch` is `trunk`;
- Published Commits are recorded;
- the primary change is verified in `origin/trunk`;
- a real remote release branch exists.

### Active item

```text
/feature backport release-1.79.0
```

### Pending item

```text
/feature backport feature/LSG-12345-add-account-summary release-1.79.0
```

### Squash or rebase primary merge

If original Published Commits are not ancestors of trunk, provide the GitHub result as verification evidence:

```text
/feature backport release-1.79.0 <primary-merge-sha>
```

The merge SHA is never cherry-picked.

### Backport execution

The action:

1. fetches origin;
2. verifies the primary merge;
3. synchronizes the exact release branch;
4. creates a backport branch;
5. stores release and branch metadata before cherry-picking;
6. displays the exact ordered Published Commits;
7. asks one combined destructive confirmation covering the cherry-picks and the backport branch push;
8. cherry-picks each commit separately with `-x`;
9. records each resulting Backport Commit immediately;
10. runs relevant checks;
11. pushes the backport branch;
12. provides a PR target whose base is the selected release branch.

With Jira active, the default branch may be:

```text
backport/LSG-12345-add-account-summary-release-1.79.0
```

With Jira disabled:

```text
backport/add-account-summary-release-1.79.0
```

### Complete after both merges

After primary and backport PRs merge:

```text
/feature complete
```

If either merge used squash/rebase, provide evidence in order:

```text
/feature complete active <primary-merge-sha> <backport-merge-sha>
```

For pending work:

```text
/feature complete <work-branch> <primary-merge-sha> <backport-merge-sha>
```

## Workflow E: atomic multi-commit backport

Suppose a feature contains two intended commits:

```text
a111111 feat: [LSG-400] - add repository root helper
b222222 feat: [LSG-400] - add repository name helper
```

`publish` records them in that order. `backport` does not cherry-pick the GitHub PR merge commit. It runs the equivalent of:

```text
git cherry-pick -x a111111
git cherry-pick -x b222222
```

This prevents unrelated synchronization commits from entering the release and preserves atomic review history.

## Workflow F: backport conflict

If the second cherry-pick conflicts:

- the first Backport Commit remains recorded;
- `CHERRY_PICK_HEAD` remains active;
- conflicted paths are listed;
- the failing and remaining commits are reported;
- the skill does not skip, resolve, restore, or abort automatically.

You may resolve the conflict and continue the current operation, or abandon the selected item.

For active work:

```text
/feature abandon --discard
```

For an exact pending item:

```text
/feature abandon --discard feature/LSG-400-repository-helpers
```

After explicit confirmation, destructive abandon aborts the cherry-pick, discards shown changes, switches away, deletes only related local branches, and preserves remote branches.

## Workflow G: cancelled work

### Not started or clean active work

```text
/feature abandon
```

Plain abandon requires a clean tree outside `context/`.

### Dirty active work that must be discarded

```text
/feature abandon --discard
```

The command previews tracked, staged, and untracked paths and requires explicit confirmation.

### Exact pending item

```text
/feature abandon feature/LSG-900-cancelled-experiment
```

This removes only the matching local workflow entry. Remote branches and PRs remain.

## Workflow decision guide

| Situation | Workflow or command |
|---|---|
| Start ordinary work from trunk | `load trunk <type> ...` |
| Start work from a release branch and merge back there | `load branch <release> <type> ...` |
| Apply already-merged trunk commits to a release | `backport <release>` |
| Begin another task while PR waits | `clear` then `load` |
| Mark merge-commit PR complete | `complete` |
| Mark squash/rebase PR complete | `complete ... <merge-sha>` |
| Cancel clean active work | `abandon` |
| Destroy dirty active work | `abandon --discard` |
| Remove one pending entry | `abandon <work-branch>` |
