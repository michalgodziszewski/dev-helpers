---
name: feature
description: Manage feature, bugfix, hotfix, and chore branches in trunk-based and explicit-base Git workflows. Use for loading work, synchronizing the base, implementing, testing, reviewing, publishing, clearing published work into a local pending-review queue, abandoning cancelled work safely, backporting merged work, and completing reviewed branches without blocking the next task.
---

# Feature Workflow

Manage one active work item plus any number of published items awaiting review.

## Local state

Use context/current-feature.md as ignored personal runtime state. If it does not exist, create it from assets/current-feature-template.md.

The state contains:

- One active slot with Status: Idle, Not Started, In Progress, Published, or Merged
- Workflow: trunk or branch
- Work Type: feature, bugfix, hotfix, or chore
- Base Branch, Work Branch, Source Spec, and ordered atomic Published Commits
- Optional release branch, backport branch, and ordered Backport Commits
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

## Documentation

Additional user-facing documentation lives in docs/:

- docs/README.md for the documentation map and quick start
- docs/use-cases.md for practical scenarios and recommended flows
- docs/workflow-guide.md for the full lifecycle
- docs/action-reference.md for command-by-command guidance
- docs/backport.md for detailed backport verification and cherry-pick flow
- docs/safety-rules.md for branch, state, and commit safety rules

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
| abandon | abandon | Abandon active work without discarding local changes |
| abandon | abandon --discard | Explicitly discard active work and delete its local branch |
| abandon | abandon <work-branch> | Remove one exact pending item from local workflow tracking |
| backport | backport <release> [merge-sha] | Atomically backport the active trunk item |
| backport | backport <work-branch> <release> [merge-sha] | Atomically backport a pending trunk item |
| complete | complete | Complete active work using ancestry verification |
| complete | complete active <merge-sha> [backport-merge-sha] | Complete squash-merged active work |
| complete | complete <work-branch> [merge-sha] [backport-merge-sha] | Complete an exact pending item |

Read and execute only the matching file under actions/. If no action is provided, show the action table and examples. Do not commit, push, merge, cherry-pick, delete a branch, or reset state unless the matching action explicitly authorizes it.
