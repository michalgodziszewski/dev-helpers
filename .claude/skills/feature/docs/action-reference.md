# Action Reference

## `load`

Loads a Markdown specification or inline description into local state. Use it before starting work. It resolves workflow, work type, base branch, source spec, goals, and notes without running Git commands or changing branches.

## `start`

Synchronizes the base branch with origin and creates the work branch. Use it after `load` and before implementation. It refuses to branch from stale or divergent base state.

## `test`

Discovers and runs relevant project checks. Use it during implementation and before publication. It should start with narrow tests and then run required lint, type-check, and build commands when available.

## `review`

Reviews the diff against the remote base branch. Use it before `publish` to check goal coverage, scope, security, validation, tests, generated artifacts, secrets, and branch hygiene.

## `explain`

Explains the changed files and the data or control flow between them. Use it when you need a concise technical summary of a work branch.

## `publish`

Commits and pushes active work after successful testing and review. Use it when the active item is `In Progress` and ready for a pull request. It records ordered atomic Published Commits for later completion or backporting.

## `clear`

Moves published active work to Pending Reviews and frees the active slot. Use it when the pull request is waiting for review and you need to start another task.

## `abandon`

Removes cancelled work from local workflow tracking. Use plain `abandon` for safe cleanup, `abandon --discard` only when local changes should be destroyed, and `abandon <work-branch>` for an exact pending item.

## `backport`

Creates a backport branch from recorded atomic Published Commits. Use it for merged trunk work that must also target a release branch. It never cherry-picks a GitHub merge commit.

## `complete`

Marks reviewed work complete after merge verification. Use it for active or pending work once the primary branch, and any backport branch, has been merged into the expected targets.
