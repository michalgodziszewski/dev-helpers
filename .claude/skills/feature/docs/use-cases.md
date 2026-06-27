# Use Cases

Use the `feature` skill when a task needs explicit Git workflow management, branch safety, or local tracking across review cycles.

## New trunk-based feature

Use this when the work should branch from `trunk` and later merge back into `trunk`.

Typical flow:

1. `load trunk feature <spec-file-or-description>`
2. `start`
3. Implement the feature.
4. `test`
5. `review`
6. `publish`
7. `clear` if you need to start another task while the pull request is awaiting review.
8. `complete` after merge verification succeeds.

## Bugfix, hotfix, or chore from trunk

Use the same trunk flow when the work type is not a feature but still targets `trunk`.

Examples:

- `load trunk bugfix "Fix incorrect validation message"`
- `load trunk hotfix context/fixes/production-timeout.md`
- `load trunk chore "Refresh generated CLI documentation"`

The work type becomes part of the branch name, for example `bugfix/fix-incorrect-validation-message`.

## Work against an explicit base branch

Use this when work must target a branch other than `trunk`, such as a release stabilization branch or a long-lived integration branch.

Typical flow:

1. `load branch <base-branch> <type> <spec-file-or-description>`
2. `start`
3. Implement, test, review, and publish normally.
4. Verify completion against the same explicit base branch.

The skill never guesses the base branch. If the base is not provided by the command or specification metadata, it must be supplied explicitly.

## Keep working while a pull request is under review

Use `clear` after `publish` when the current pull request is open and you want to free the active slot for another task.

`clear` moves the published work into the local Pending Reviews queue and preserves the ordered Published Commits. This lets you load and start new work without losing the ability to later complete the original branch safely.

## Backport merged trunk work

Use `backport` when trunk work has been merged and the same atomic commits must be applied to a release branch.

Typical flow:

1. Ensure the trunk item is Published or in Pending Reviews with recorded Published Commits.
2. Run `backport <release-branch> [primary-merge-sha]` for active work, or `backport <work-branch> <release-branch> [primary-merge-sha]` for pending work.
3. Review the ordered commits before cherry-picking.
4. Let the skill create a backport branch and push it for review.
5. Complete the original item only after both primary and backport merge verification succeeds.

## Abandon cancelled work

Use `abandon` when a task is cancelled before completion.

- `abandon` safely removes active state only when the working tree is clean outside `context/`.
- `abandon --discard` is destructive and requires explicit confirmation because it discards local work and deletes the local work branch.
- `abandon <work-branch>` removes exactly one pending review entry by exact branch name.

## Explain or audit a branch

Use `explain` to summarize changed files and data flow. Use `review` to validate readiness before publication, including scope, security, tests, generated files, and branch hygiene.
