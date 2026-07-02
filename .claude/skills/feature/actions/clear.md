# Clear Action

Free the active slot after publication without waiting for review or merge.

1. Require active Status Published or Merged and populated Work Branch, Base Branch, Work Type, Workflow, and work name.
2. Run git fetch origin --prune without asking.
3. Verify origin/<work-branch> exists and equals the local Work Branch commit.
4. Require Published Commits from publish.
5. For backward compatibility only, when Published Commits is absent:
   - Compute git rev-list --reverse --no-merges <work-branch> --not origin/<base-branch>.
   - Show the exact computed list and record it without asking; any later backport shows this list again in its own destructive confirmation.
6. Append one Pending Reviews entry containing:
   - Work name and Status Awaiting Review
   - Workflow, Work Type, and Jira Ticket
   - Base Branch and Work Branch
   - Ordered Published Commits
   - Backport Release Branch, ordered Backport Commits, and Backport Branch when populated
7. Reset only the active slot to Idle, including Jira Ticket, Published Commits, and all backport fields.
8. Preserve all existing Pending Reviews and History entries.
9. Do not switch or delete branches.

Never require merge verification for clear. Never stage or commit context/.
