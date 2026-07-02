# Complete Action

Mark reviewed work complete without disrupting another active feature.

## Select work

Accept:

- complete for active Published or Merged work
- complete active <primary-merge-sha> [backport-merge-sha]
- complete <work-branch> [primary-merge-sha] [backport-merge-sha] for exact pending work

Read Base Branch, Jira Ticket, ordered Published Commits, and optional backport metadata from the selected item. Accept legacy singular commit fields as one-item lists, reporting the migration without asking.

## Verify merges

1. Run git fetch origin --prune without asking and verify origin/<base-branch> exists.
2. Delegate verification to the git-verify subagent (Agent tool, subagent_type "git-verify"); verify inline with the same read-only commands when the agent is not installed. Verification never asks a question.
3. Primary merge:
   - Accept when every Published Commit is an ancestor of origin/<base-branch>.
   - Otherwise require primary-merge-sha and verify it is contained in origin/<base-branch>.
   - Never treat primary-merge-sha as an atomic Published Commit.
4. Backport merge, when backport metadata exists:
   - Require ordered Backport Commits and origin/<release-branch>.
   - Accept when every Backport Commit is an ancestor of origin/<release-branch>.
   - Otherwise require backport-merge-sha and verify it is contained in origin/<release-branch>.
   - Never infer completion from PR existence alone.

If verification fails, keep the item unchanged. This must not block other active work.

## Update local state

1. Append a dated History entry with work name, type, Jira Ticket when populated, Work Branch, Base Branch, and verified completion.
2. Remove only the selected pending entry, or reset only the selected active slot to Idle.
3. Preserve all other pending, active, and history data.
4. Do not switch branches or pull a local base.
5. Offer local branch deletion only when the branch is not checked out. Branch deletion is destructive: ask exactly one explicit confirmation naming the branch before git branch -D. Everything else in complete runs without questions.
6. Never delete a remote branch.

Never stage or commit context/.
