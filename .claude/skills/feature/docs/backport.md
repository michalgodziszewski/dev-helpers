# Backport Guide

Backporting copies already-published trunk work onto a release branch while preserving the original atomic commit history.

## When to use backport

Use `backport` when all of these are true:

- The original item used the trunk workflow.
- The original work has been published and has recorded Published Commits.
- The change must also be delivered to a release branch.
- The release branch already exists on `origin`.

Do not use `backport` for work that originally targeted a non-trunk base branch. Do not use it to move arbitrary local changes between branches.

## Accepted commands

Use one of these forms:

- `backport <release-branch> [primary-merge-sha]` for the active trunk item.
- `backport <work-branch> <release-branch> [primary-merge-sha]` for an exact item from Pending Reviews.

The optional `primary-merge-sha` is verification evidence for squash or rebase merge policies. It is not cherry-picked.

## What the skill verifies first

Before creating a backport branch, the skill verifies that:

1. The selected item is a trunk workflow item with Base Branch `trunk`.
2. The item has an ordered Published Commits list.
3. Every Published Commit resolves and is not a merge commit.
4. The primary work is already represented in `origin/trunk`:
   - either every Published Commit is an ancestor of `origin/trunk`, or
   - `primary-merge-sha` is provided and is contained in `origin/trunk`.
5. The working tree is clean outside `context/`.
6. The selected release branch exists on `origin`.

If any verification fails, the skill stops without creating the backport branch.

## How the backport branch is created

After verification, the skill:

1. Fetches `origin` with pruning.
2. Switches to the release branch, creating a tracking branch when needed.
3. Pulls the release branch with `--ff-only`.
4. Verifies the local release branch equals `origin/<release-branch>`.
5. Creates `backport/<work-name>-<release-branch>` from that synchronized release branch.

This guarantees the backport starts from the current remote release branch, not from stale local state.

## How commits are copied

The skill cherry-picks each recorded Published Commit separately and in order:

```bash
git cherry-pick -x <published-commit>
```

The `-x` flag records the original commit SHA in the new backport commit message. This makes the relationship between trunk commits and backport commits auditable.

The skill records each newly-created backport commit SHA in the ordered Backport Commits list. If a cherry-pick conflicts, the skill stops at the failing commit and reports completed commits, remaining commits, and conflict files. It does not skip, abort, or resolve conflicts automatically.

## What is never cherry-picked

The skill never cherry-picks:

- GitHub merge commits.
- Squash merge SHAs.
- Rebase merge evidence SHAs.
- Combined diffs.
- Unrecorded local commits.

Merge SHAs are used only to prove that the primary work reached `origin/trunk` when the original atomic commits are not direct ancestors.

## Pull request target

The backport pull request must target the release branch supplied to the command.

The skill generates a compare URL in this form:

```text
https://github.com/<owner>/<repository>/compare/<release-branch>...<backport-branch>?expand=1
```

With GitHub CLI, the equivalent command is:

```bash
gh pr create --base <release-branch> --head <backport-branch>
```

If an existing backport pull request targets `trunk`, `main`, or any branch other than the selected release branch, the skill stops and requires retargeting before merge.

## Example

Assume `feature/payment-timeout` was published from trunk and must be included in `release/2026.06`.

For active work:

```text
backport release/2026.06
```

For pending work:

```text
backport feature/payment-timeout release/2026.06
```

If the primary pull request was squash-merged and the original Published Commits are not ancestors of `origin/trunk`, provide the squash merge SHA:

```text
backport feature/payment-timeout release/2026.06 <primary-merge-sha>
```

## Completion after backport

After the primary pull request and the backport pull request are merged, use `complete` with any required merge SHAs. Completion verifies both the primary target and the release target before moving the item into local History.
