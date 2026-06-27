# Complete Action

Mark reviewed work complete without disrupting another active feature.

## Select work

Accept:

- complete for active Published or Merged work
- complete active <primary-merge-sha> [backport-merge-sha]
- complete <work-branch> [primary-merge-sha] [backport-merge-sha] for exact pending work

Read Base Branch, ordered Published Commits, and optional backport metadata from the selected item. Accept legacy singular commit fields only after confirmation.

## Verify primary merge

1. Run git fetch origin --prune.
2. Verify origin/<base-branch> exists.
3. Accept when every Published Commit is an ancestor of origin/<base-branch>.
4. Otherwise require primary-merge-sha and verify it is contained in origin/<base-branch>.
5. Never treat primary-merge-sha as an atomic Published Commit.

## Verify backport merge

When backport metadata exists:

1. Require ordered Backport Commits and origin/<release-branch>.
2. Accept when every Backport Commit is an ancestor of origin/<release-branch>.
3. Otherwise require backport-merge-sha and verify it is contained in origin/<release-branch>.
4. Never infer completion from PR existence alone.

If verification fails, keep the item unchanged. This must not block other active work.

## Update local state

1. Append a dated History entry with work name, type, Work Branch, Base Branch, and verified completion.
2. Remove only the selected pending entry, or reset only the selected active slot to Idle.
3. Preserve all other pending, active, and history data.
4. Do not switch branches or pull a local base.
5. Offer local branch deletion only when it is not checked out, and ask separately.
6. Never delete a remote branch.

Never stage or commit context/.
