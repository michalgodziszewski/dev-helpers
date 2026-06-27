# Complete Action

Mark reviewed work complete without disrupting another active feature.

## Select work

1. Accept:
   - complete for the active Published or Merged item.
   - complete active <merge-sha> [backport-merge-sha] for the active item after squash or rebase merge.
   - complete <work-branch> [merge-sha] [backport-merge-sha] for an item in Pending Reviews.
2. For a pending item, require an exact Work Branch match. Never guess between entries.
3. Read Base Branch, Published Commit SHA, and optional backport metadata from the selected item.

## Verify merge

1. Run git fetch origin --prune. This is allowed while another feature is active.
2. Verify origin/<base-branch> exists.
3. Accept the primary merge when either:
   - Published Commit SHA is an ancestor of origin/<base-branch>, or
   - the supplied GitHub merge or squash SHA resolves and is contained in origin/<base-branch>.
4. If backport metadata is populated, accept the backport merge when either:
   - Backport Commit SHA is an ancestor of origin/<release-branch>, or
   - the supplied backport merge or squash SHA resolves and is contained in origin/<release-branch>.
5. If verification fails, keep the item unchanged and report the missing evidence. This must not block loading or working on another active item.

## Update local state

1. Append a dated History entry with work name, type, Work Branch, Base Branch, and verified completion.
2. When completing a pending item, remove only its Pending Reviews entry and preserve the active slot and all other pending entries.
3. When completing the active item, reset only the active slot and set Status to Idle.
4. Do not switch branches or pull a local base because another feature may currently be in progress.
5. Offer deletion of the completed local branch only when it is not currently checked out. Ask separately before deletion.
6. Never delete a remote branch.

Never stage or commit context/. Completion updates local state only.
