# Abandon Action

Remove one cancelled work item from local workflow state. Never clear all Pending Reviews or History.

## Accepted forms

- abandon
- abandon --discard
- abandon <work-branch>
- abandon --discard <work-branch>

Use the active item when no work branch is supplied. Use an exact Pending Reviews Work Branch match when a work branch is supplied. Never guess by partial branch name.

## Select one item

1. For active work, require Status Not Started, In Progress, Published, or Merged.
2. For pending work, require exactly one entry whose Work Branch equals the supplied value.
3. Use Work Branch as the stable identity. When active Not Started work has no Work Branch yet, use its exact work name only within the active slot.
4. Treat the selected Work Branch and its recorded Backport Branch as the only related branches. Never infer an unrecorded branch by naming convention.
5. Show the selected work name, status, base branch, work branch, backport branch, remote branch presence, and matching local-state entries.
6. Never select or modify any other active, pending, or historical item.

## Inspect Git state

When the selected item has a Work Branch:

1. Show the current branch.
2. Show git status --short outside context/.
3. Show staged and unstaged diff summaries.
4. Show commits in <work-branch> that are not in origin/<base-branch>.
5. When Backport Branch is recorded, show its commits over origin/<release-branch>.
6. Report whether each related local and remote branch exists.
7. Detect CHERRY_PICK_HEAD. If it exists, require the current branch to equal the selected item's recorded Backport Branch; otherwise stop without changing anything.

Never modify or delete context/ or any ignored file.

## Safe active abandon

For abandon without --discard:

1. Require a clean working tree outside context/.
2. If local changes exist, stop and instruct the user to preserve them manually or invoke abandon --discard.
3. Ask for confirmation to abandon the selected active item.
4. Run git fetch origin --prune.
5. Synchronize the local base using the standard base synchronization invariant.
6. If a related local branch exists, show its unmerged commits and ask separately before deleting it.
7. Delete only the confirmed related local branches with git branch -D after switching away from them.
8. Never delete a related remote branch. Report every one that exists so its pull request or remote branch can be handled separately.
9. Remove only entries whose recorded Work Branch exactly equals the selected Work Branch from Pending Reviews and structured History.
10. Reset the active slot and set Status to Idle. Preserve all non-matching Pending Reviews and History entries.

Do not append an Abandoned history entry.

## Destructive abandon

For abandon --discard and abandon --discard <work-branch>:

1. Require Work Branch to be populated.
2. Require the current branch to equal the selected Work Branch or its recorded Backport Branch. Stop otherwise.
3. If CHERRY_PICK_HEAD exists:
   - Require the current branch to equal the recorded Backport Branch.
   - Show the failing commit and conflicted paths.
   - Include `Abort the in-progress cherry-pick` in the confirmation consequences.
   - Never run git cherry-pick --abort before explicit confirmation.
4. Show every tracked, staged, and untracked path outside context/ that will be discarded.
5. Run git clean -nd to preview untracked deletion. Do not use -x; ignored context/ must remain protected.
6. Show commits that will become reachable only from each related local branch.
7. Ask for explicit confirmation that states all applicable consequences:
   - Abort the in-progress cherry-pick when present.
   - Discard all shown uncommitted changes outside context/.
   - Delete the selected item's related local Work Branch and Backport Branch after switching away.
8. Without that confirmation, stop without changing files, branches, or local state.
9. After confirmation:
   - If CHERRY_PICK_HEAD exists, run git cherry-pick --abort first and verify CHERRY_PICK_HEAD is gone.
   - Run git restore --staged --worktree -- . to discard tracked and staged changes.
   - Run git clean -fd to delete only the previewed untracked files. Never add -x or -X.
   - Verify context/ still exists when it existed before cleanup.
   - Verify the working tree outside context/ is clean.
   - Run git fetch origin --prune.
   - For active work, switch to Base Branch, synchronize it with origin using the base synchronization invariant, and verify equality.
   - For pending work, switch back to the populated active Work Branch when it exists locally and is unrelated to the selected item; otherwise switch to and synchronize the selected Base Branch.
   - Delete only the selected item's related local Work Branch and Backport Branch with git branch -D.
10. Never delete a related remote branch. Report every one that exists.
11. Remove only entries whose recorded Work Branch exactly equals the selected Work Branch from Pending Reviews and structured History.
12. For active work reset the active slot and set Status to Idle. For pending work preserve the active slot. Preserve all non-matching Pending Reviews and History entries.

Do not append an Abandoned history entry.

## Safe abandon pending work

For abandon <work-branch>:

1. Select only the exact matching Pending Reviews entry.
2. Ask for confirmation to remove that item from local workflow tracking.
3. Remove only that exact Pending Reviews entry and structured History entries with the same recorded Work Branch.
4. Preserve the active slot, all other Pending Reviews entries, and all non-matching History entries.
5. For each related local branch that is not checked out, show unmerged commits and ask separately before deleting it with git branch -D.
6. If a related branch is currently checked out or deletion would disturb active work, keep it and report why.
7. Never delete a related remote branch or close its pull request automatically.

When pending work has uncommitted changes or an in-progress cherry-pick on its recorded Backport Branch, stop and instruct the user to use abandon --discard <work-branch>.

## Legacy history

Do not automatically delete name-only legacy History lines that lack Work Branch. Report them as unverifiable. Remove one only after the user explicitly confirms the exact line.

## Reset active slot

Restore the generic H1, clear active Workflow, Work Type, Jira Ticket, Base Branch, Work Branch, Source Spec, Published Commits, backport fields, Goals, and Notes. Never stage or commit context/.
