---
name: feature
description: Manage feature, bugfix, hotfix, and chore branches in two Git workflows: branches created from trunk with optional release backports, or branches created from an explicitly selected base branch. Use for loading work, starting from a freshly synchronized base, testing, reviewing, publishing to origin, cherry-picking merged work to a release branch, and completing the workflow after a GitHub merge.
---

# Feature Workflow

Manage one work item from description through GitHub merge and optional release backport.

## State file

Use @context/current-feature.md. Keep these fields current:

- Status: Not Started, In Progress, Published, Merged, or Completed
- Workflow: trunk or branch
- Work Type: feature, bugfix, hotfix, or chore
- Base Branch: trunk or an explicit branch
- Work Branch: generated during start
- Source Spec: repository-relative Markdown path or inline
- Backport: release branch and commit SHA when applicable

Never infer an unspecified base branch, release branch, or commit SHA.

## Base synchronization invariant

Before creating any work or backport branch:

1. Require a clean working tree except for context/current-feature.md and the exact Markdown Source Spec recorded in it.
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
| backport | backport <release-branch> <commit-sha> | Synchronize release, then cherry-pick merged work |
| complete | complete | Verify merge, clean up locally, and reset state |

Read and execute only the matching file under actions/. If no action is provided, show the action table and examples. Do not commit, push, merge, cherry-pick, delete a branch, or reset state unless the matching action explicitly authorizes it.
