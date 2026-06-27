# Workflow Guide

The `feature` skill manages one active work item and any number of published items waiting for review.

## 1. Load work

Start with `load` to create or update the local runtime state in `context/current-feature.md`.

Supported forms:

- `load <spec-file-or-name>`
- `load trunk <type> <spec-file-or-description>`
- `load branch <base-branch> <type> <spec-file-or-description>`

A specification can be a Markdown file or an inline description. Markdown specifications may provide Git metadata with exact list fields for workflow, work type, and base branch.

## 2. Start the branch

Run `start` only after loading work. The skill verifies that the active item has goals, workflow, work type, and base branch.

Before creating the work branch, `start` synchronizes the selected base with `origin/<base-branch>` using a fast-forward-only pull. The work branch is created only after the local base matches the remote base.

## 3. Implement the change

After `start`, implement the goals recorded in the local state. Keep the change scoped to the loaded work item and do not commit anything under `context/`.

## 4. Test and review

Run `test` to discover and execute the narrowest relevant checks first, followed by required lint, type-check, and build commands when available.

Run `review` before publication. The review compares the work branch against the remote base using a merge-base diff and returns either `Ready to publish` or `Needs changes`.

## 5. Publish

Run `publish` when the active item is ready. The skill verifies the current branch, runs testing and review instructions, stages only work-item files outside `context/`, commits with an approved message, records ordered atomic Published Commits, and pushes the work branch.

The pull request target is always the recorded Base Branch. The skill must not use generic push output if that output targets the wrong branch.

## 6. Clear the active slot

Run `clear` after publication when you want to begin another task before the pull request is merged. This moves the item into Pending Reviews and resets only the active slot.

Clearing does not verify merge status and does not delete or switch branches.

## 7. Backport when needed

Run `backport` only for trunk work that has recorded Published Commits and has been verified as merged or otherwise represented in `origin/trunk` with an explicit merge SHA.

The skill cherry-picks each recorded atomic commit separately with `-x`, records the resulting Backport Commits, pushes a backport branch, and builds a pull request URL targeting the selected release branch.

For a detailed step-by-step explanation, see [Backport guide](backport.md).

## 8. Complete reviewed work

Run `complete` after the primary work, and any backport, have been merged. The skill verifies ancestry or explicit merge SHAs before moving the item into local History and removing only the selected active or pending entry.
