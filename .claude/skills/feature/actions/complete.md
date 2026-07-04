# Complete Action

Mark reviewed work complete without disrupting another active feature.

## Select work

Accept:

- complete for active Published or Merged work
- complete active <primary-merge-sha> [backport-merge-sha]
- complete <work-branch> [primary-merge-sha] [backport-merge-sha] for exact pending work

Read Base Branch, Jira Ticket, ordered Published Commits, and optional backport metadata from the selected item. Accept legacy singular commit fields as one-item lists, reporting the migration without asking.

Parse a pending item using the canonical Pending Reviews structure defined in actions/clear.md step 6. Tolerate legacy entries that predate that structure — read their fields as before — but never rewrite a legacy entry into the canonical layout in place.

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

1. Prepend a dated History entry with work name, type, Jira Ticket when populated, Work Branch, Base Branch, and verified completion. History is newest-first: the new entry goes above all existing entries.
2. Rotate History when it now holds more than 10 entries: keep the 10 most recent (topmost) entries in context/current-feature.md and move the older entries, verbatim and in their existing order, to context/history-archive.md, prepending them above any entries already archived there (archive stays newest-first). Create context/history-archive.md on its first rotation. This is mechanical — never summarize or rewrite an entry. context/history-archive.md is ignored personal state exactly like the rest of context/: never stage, commit, or require it to exist.
3. Remove only the selected pending entry, or reset only the selected active slot to Idle.
4. Preserve all other pending, active, and history data.
5. Do not switch branches or pull a local base.
6. Offer local branch deletion only when the branch is not checked out. Branch deletion is destructive: ask exactly one explicit confirmation naming the branch before git branch -D. Everything else in complete runs without questions.
7. Never delete a remote branch.

Never stage or commit context/.
