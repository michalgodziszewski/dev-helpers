# Clear Action

Free the active slot after publication without waiting for GitHub review or merge.

1. Read context/current-feature.md and require active Status Published or Merged.
2. Require Work Branch, Base Branch, Work Type, Workflow, and the work name.
3. Run git fetch origin --prune.
4. Verify origin/<work-branch> exists.
5. Verify the local Work Branch commit equals origin/<work-branch>. Stop if commits remain unpublished.
6. Append a Pending Reviews entry containing:
   - Work name
   - Status: Awaiting Review
   - Workflow and Work Type
   - Base Branch and Work Branch
   - Published Commit SHA
   - Backport Release Branch, Backport Commit SHA, and Backport Branch when populated
7. Reset only the active slot:
   - Restore the generic H1.
   - Set Status to Idle.
   - Clear Workflow, Work Type, Base Branch, Work Branch, Source Spec, and backport fields.
   - Clear Goals and Notes.
8. Preserve all existing Pending Reviews and History entries.
9. Do not switch branches and do not delete local or remote branches.

Never require merge verification for clear. Never stage or commit context/.
