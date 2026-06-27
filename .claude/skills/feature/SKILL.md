---
name: feature
description: Manage feature, bugfix, hotfix, and chore branches in trunk-based and explicit-base Git workflows. Use for loading work, synchronizing the base, implementing, testing, reviewing, publishing, clearing published work into a local pending-review queue, backporting merged work, and completing reviewed branches without blocking the next task.
---

# Feature Workflow

Manage one active work item plus any number of published items awaiting review.

## Local state

Use context/current-feature.md as ignored personal runtime state. If it does not exist, create it from assets/current-feature-template.md.

The state contains:

- One active slot with Status: Idle, Not Started, In Progress, Published, or Merged
- Workflow: trunk or branch
- Work Type: feature, bugfix, hotfix, or chore
- Base Branch, Work Branch, and Source Spec
- Optional backport metadata
- Pending Reviews entries for published work no longer occupying the active slot
- Local completed History

Never stage or commit anything under context/. Never overwrite an active item with load. Never infer an unspecified base branch, release branch, or commit SHA.

## Base synchronization invariant

Before creating any work or backport branch:

1. Ignore context/ completely. Outside it, require a clean working tree except for an explicitly recorded Source Spec outside context/.
2. Run git fetch origin --prune.
3. Switch to the selected local base, creating it as a tracking branch when absent.
4. Run git pull --ff-only origin <base-branch>.
5. Verify the local base SHA equals origin/<base-branch>.
6. Create the new branch only after synchronization succeeds.

Stop if synchronization cannot be completed. Never branch from a stale base, auto-stash, force-pull, reset, or silently resolve divergence.

## Actions

| Action | Usage | Purpose |
|---|---|---|
| load | load <spec-file-or-name> | Load a Markdown spec and resolve its Git metadata |
| load | load trunk <type> <spec-file-or-description> | Prepare work based on trunk |
| load | load branch <base> <type> <spec-file-or-description> | Prepare work based on a specific branch |
| start | start | Synchronize the base and create the work branch |
| test | test | Run relevant tests and build checks |
| review | review | Review goals, diff, and branch safety |
| explain | explain | Explain changed files and flow |
| publish | publish | Commit with permission and push to origin |
| clear | clear | Move published work to Pending Reviews and free the active slot |
| backport | backport <release> <sha> | Backport the active trunk item |
| backport | backport <work-branch> <release> <sha> | Backport a pending trunk item |
| complete | complete | Complete active work using ancestry verification |
| complete | complete active <merge-sha> [backport-merge-sha] | Complete squash-merged active work |
| complete | complete <work-branch> [merge-sha] [backport-merge-sha] | Complete an exact pending item |

Read and execute only the matching file under actions/. If no action is provided, show the action table and examples. Do not commit, push, merge, cherry-pick, delete a branch, or reset state unless the matching action explicitly authorizes it.
