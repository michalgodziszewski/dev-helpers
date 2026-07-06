# Clear Action

Free the active slot after publication without waiting for review or merge.

1. Require active Status Published or Merged and populated Work Branch, Base Branch, Work Type, Workflow, and work name.
2. Run git fetch origin --prune without asking.
3. Verify origin/<work-branch> exists and equals the local Work Branch commit.
4. Require Published Commits from publish.
5. For backward compatibility only, when Published Commits is absent:
   - Compute git rev-list --reverse --no-merges <work-branch> --not origin/<base-branch>.
   - Show the exact computed list and record it without asking; any later backport shows this list again in its own destructive confirmation.
6. Append one Pending Reviews entry in this exact canonical structure — the single source of truth for the format that `backport`, `complete`, and `abandon` parse back by exact Work Branch match:

   ```md
   - **Work Name:** <work-name>
     - **Status:** Awaiting Review
     - **Workflow:** <trunk|branch>
     - **Work Type:** <feature|bugfix|fix|hotfix|chore>
     - **Jira Ticket:** <ticket-or-empty>
     - **Base Branch:** <base-branch>
     - **Work Branch:** <work-branch>
     - **Source Spec:** <source-spec-or-empty>
     - **Published Commits:** <ordered-sha-list>
     - **Backport Release Branch:** <release-branch>
     - **Backport Commits:** <ordered-sha-list>
     - **Backport Branch:** <backport-branch>
   ```

   Copy Source Spec verbatim from the active slot; render it empty when the active slot's Source Spec is empty. Omit the three Backport fields entirely when no backport metadata exists on the item; include all three, in order, when any is populated. Never invent a different layout or field order.

   Tolerate legacy entries written before Source Spec existed in this structure: they simply have no Source Spec field, and `resume` treats that the same as an explicitly empty one.
7. Reset only the active slot to Idle, including Jira Ticket, Source Spec, Published Commits, and all backport fields.
8. Preserve all existing Pending Reviews and History entries.
9. Do not switch or delete branches.

Never require merge verification for clear. Never stage or commit context/.
