# Abandon Action

Remove one cancelled work item from local workflow state. Never clear all Pending Reviews or History.

## Accepted forms

- abandon
- abandon --discard
- abandon <work-branch>

Use the active item for the first two forms. Use an exact Pending Reviews Work Branch match for the third form. Never guess by partial branch name.

## Select one item

1. For active work, require Status Not Started, In Progress, Published, or Merged.
2. For pending work, require exactly one entry whose Work Branch equals the supplied value.
3. Use Work Branch as the stable identity. When active Not Started work has no Work Branch yet, use its exact work name only within the active slot.
4. Show the selected work name, status, base branch, work branch, remote branch presence, and matching local-state entries.
5. Never select or modify any other active, pending, or historical item.

## Inspect Git state

When the selected item has a Work Branch:

1. Show the current branch.
2. Show git status --short outside context/.
3. Show staged and unstaged diff summaries.
4. Show commits in <work-branch> that are not in origin/<base-branch>.
5. Report whether origin/<work-branch> exists.

Never modify or delete context/ or any ignored file.

## Safe active abandon

For abandon without --discard:

1. Require a clean working tree outside context/.
2. If local changes exist, stop and instruct the user to preserve them manually or invoke abandon --discard.
3. Ask for confirmation to abandon the selected active item.
4. Run git fetch origin --prune.
5. Synchronize the local base using the standard base synchronization invariant.
6. If Work Branch exists locally, show its unmerged commits and ask separately before deleting it.
7. Delete the confirmed local Work Branch with git branch -D only after switching to Base Branch.
8. Never delete origin/<work-branch>. When it exists, report that its pull request or remote branch must be handled separately.
9. Remove only entries whose recorded Work Branch exactly equals the selected Work Branch from Pending Reviews and structured History.
10. Reset the active slot and set Status to Idle. Preserve all non-matching Pending Reviews and History entries.

Do not append an Abandoned history entry.

## Destructive active abandon

For abandon --discard:

1. Require Work Branch to be populated and require the current branch to equal Work Branch. Stop otherwise.
2. Show every tracked, staged, and untracked path outside context/ that will be discarded.
3. Run git clean -nd to preview untracked deletion. Do not use -x; ignored context/ must remain protected.
4. Show commits that will become reachable only from the local Work Branch.
5. Ask for explicit confirmation that states both consequences:
   - Discard all shown uncommitted changes outside context/.
   - Delete the local Work Branch after switching to Base Branch.
6. Without that confirmation, stop without changing files, branches, or local state.
7. After confirmation:
   - Run git restore --staged --worktree -- . to discard tracked and staged changes.
   - Run git clean -fd to delete only the previewed untracked files. Never add -x or -X.
   - Verify context/ still exists when it existed before cleanup.
   - Verify the working tree outside context/ is clean.
   - Run git fetch origin --prune.
   - Switch to Base Branch, creating its tracking branch when absent.
   - Run git pull --ff-only origin <base-branch>.
   - Verify local Base Branch equals origin/<base-branch>.
   - Delete the local Work Branch with git branch -D.
8. Never delete origin/<work-branch>. Report it when present.
9. Remove only entries whose recorded Work Branch exactly equals the selected Work Branch from Pending Reviews and structured History.
10. Reset the active slot and set Status to Idle. Preserve all non-matching Pending Reviews and History entries.

Do not append an Abandoned history entry.

## Abandon pending work

For abandon <work-branch>:

1. Select only the exact matching Pending Reviews entry.
2. Ask for confirmation to remove that item from local workflow tracking.
3. Remove only that exact Pending Reviews entry and structured History entries with the same recorded Work Branch.
4. Preserve the active slot, all other Pending Reviews entries, and all non-matching History entries.
5. If its local branch exists and is not currently checked out, show unmerged commits and ask separately before deleting it with git branch -D.
6. If it is currently checked out or deletion would disturb active work, keep the local branch and report why.
7. Never delete the remote branch or close its pull request automatically.

## Legacy history

Do not automatically delete name-only legacy History lines that lack Work Branch. Report them as unverifiable. Remove one only after the user explicitly confirms the exact line.

## Reset active slot

Restore the generic H1, clear active Workflow, Work Type, Base Branch, Work Branch, Source Spec, backport fields, Goals, and Notes. Never stage or commit context/.
