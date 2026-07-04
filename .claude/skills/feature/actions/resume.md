# Resume Action

Reattach one Pending Reviews entry to the active slot so `/feature publish` can run its re-publish path against it (see actions/publish.md). Clearing an item with `/feature clear` frees the active slot for other work but leaves the cleared item's Work Branch and Published Commits as text in Pending Reviews, unreachable by publish's re-publish path, which reads only the active slot's Git Workflow fields. Resume is the only supported way back.

## Accepted forms

- resume <work-branch>

Require the explicit `<work-branch>` argument. Never scan Pending Reviews and auto-pick an entry, and never accept a partial or fuzzy branch match — this mirrors `plan resume`'s exact-file requirement and `abandon <work-branch>`'s exact-match requirement.

## Select one entry

1. Parse Pending Reviews using the canonical structure defined in actions/clear.md step 6. Tolerate legacy entries that predate that structure — read their fields as before — but never rewrite a legacy entry into the canonical layout in place.
2. Require exactly one Pending Reviews entry whose Work Branch equals the supplied value. If none matches, stop and list every Work Branch currently in Pending Reviews.
3. Require the active slot to be Idle. If it holds Not Started, In Progress, Published, or Merged work, stop and tell the user to finish, clear, or abandon that item first — resume never displaces active work.

## Verify Git state

1. Run git fetch origin --prune.
2. Require a clean working tree outside context/ before switching branches, exactly as the base synchronization invariant requires elsewhere. Stop and list any dirty file instead of stashing or discarding it.
3. If the local Work Branch exists, require it to equal origin/<work-branch> exactly. On any divergence, stop and report it instead of resolving it — no merge, rebase, reset, or force-push.
4. Switch to the Work Branch: if it exists locally, git switch <work-branch>; otherwise create it as a tracking branch with git switch --track -c <work-branch> origin/<work-branch>. If origin/<work-branch> does not exist either, stop and report that the branch is unavailable.

## Restore active state

1. Copy every field from the selected Pending Reviews entry into the active slot's Git Workflow section: Workflow, Work Type, Jira Ticket, Base Branch, Work Branch, Source Spec, Published Commits, and Backport Release Branch / Backport Commits / Backport Branch when populated.
2. Restore Status from the entry's recorded Status: Awaiting Review maps to Published. (A Merged entry should not normally appear in Pending Reviews — complete removes it on completion — but if one is ever found, restore Status Merged rather than guessing.)
3. Set the H1 to the work name recorded in the entry.
4. Re-resolve Goals and Notes from the recorded Source Spec when it is a populated repository-relative Markdown path: read that file and copy its Goals section verbatim. When Source Spec is empty or unreadable, leave Goals and Notes empty rather than fabricating content, and report that they could not be restored.
5. Remove the selected entry from Pending Reviews only after the active slot write above is confirmed successful.
6. Preserve every other Pending Reviews entry and all History unchanged.

## Report

Show the restored work name, Status, Workflow, Work Type, Base Branch, Work Branch, Published Commits, and whether Goals/Notes were restored from a Source Spec. Point at `/feature publish` as the next step when the user is ready to push follow-up commits.

Resume never fetches beyond the read-only-equivalent check needed to verify the branch, never pushes, never merges, never cherry-picks, and never deletes a branch. It only moves state between Pending Reviews and the active slot and checks out the Work Branch locally.
