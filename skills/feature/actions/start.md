# Start Action

1. Read context/current-feature.md. Require populated Goals, Workflow, Work Type, and Base Branch.
2. Read context/feature-config.md using the exact Jira fields defined by load.md.
3. Resolve the expected Work Branch before changing Git state:
   - When Jira Mode is required, require a populated valid Jira Ticket.
   - When Jira Mode is optional and Jira Ticket is populated, validate it.
   - For optional or required Jira work with a ticket, render Branch Format with Work Type, normalized Jira Ticket, and work name.
   - Otherwise use <work-type>/<kebab-case-name>.
   - Require the rendered branch to pass git check-ref-format --branch.
4. Inspect git status before changing branches. Run independent read-only checks (status, rev-parse, check-ref-format) in parallel; none of them asks a question.
5. Ignore context/ when evaluating working-tree cleanliness because it is personal runtime state excluded by .gitignore.
6. Outside context/, allow dirty state only for the exact Source Spec recorded in current-feature.md when it is a repository-relative Markdown file.
7. Require Source Spec to resolve inside the repository and end with .md. Do not allow a directory, wildcard, or path outside the repository.
8. If any other tracked, untracked, staged, or conflicted file is present, stop and list it. Do not stash automatically.
9. Run git fetch origin --prune.
10. Verify origin/<base-branch> exists.
11. Synchronize the local base:
   - If the local base exists, run git switch <base-branch>.
   - Otherwise, run git switch --track -c <base-branch> origin/<base-branch>.
   - Run git pull --ff-only origin <base-branch>.
   - Verify git rev-parse <base-branch> equals git rev-parse origin/<base-branch>.
12. Stop if switching or pulling would overwrite a Source Spec outside context/, or if the base is divergent, cannot fast-forward, or does not match origin.
13. Create the exact rendered Work Branch with git switch -c.
14. Verify the Source Spec is still present and unchanged.
15. Update Status to In Progress and save the exact Work Branch. A confirmed successful write needs no re-read verification loop.
16. Show the Goals, then implement them one by one, tracked as a visible checklist:
   - Before starting implementation, add one checklist entry per concrete Goal (or per concrete step within a Goal when a Goal spans multiple distinct pieces of work), so the user sees the full checklist up front. On Claude Code, use TaskCreate for this. On Kiro (no equivalent tool), render the checklist as plain Markdown `- [ ]` items directly in the response.
   - Mark an entry in-progress immediately before starting it, and completed immediately after finishing it — never batch status updates at the end. On Claude Code, use TaskUpdate; on Kiro, update the rendered `- [ ]`/`- [x]` list in the response.
   - Keep the checklist scoped to this work item's Goals; do not fold in unrelated repository maintenance as tasks.

start asks no questions: it either proceeds through synchronization or stops with an exact report of what blocked it. Never create a work branch before base synchronization succeeds. Never stage context/ or include it in the feature branch. Never auto-stash, reset, rebase, or force-pull the base.
