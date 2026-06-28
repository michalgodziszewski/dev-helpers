# Start Action

1. Read context/current-feature.md. Require populated Goals, Workflow, Work Type, and Base Branch.
2. Read context/feature-config.md using the exact Jira fields defined by load.md.
3. Resolve the expected Work Branch before changing Git state:
   - When Jira Mode is required, require a populated valid Jira Ticket.
   - When Jira Mode is optional and Jira Ticket is populated, validate it.
   - For optional or required Jira work with a ticket, render Branch Format with Work Type, normalized Jira Ticket, and work name.
   - Otherwise use <work-type>/<kebab-case-name>.
   - Require the rendered branch to pass git check-ref-format --branch.
4. Inspect git status before changing branches.
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
15. Update Status to In Progress and save the exact Work Branch.
16. Re-read local state and verify Jira Ticket and Work Branch were stored unchanged.
17. Show the Goals, then implement them one by one.

Never create a work branch before base synchronization succeeds. Never stage context/ or include it in the feature branch. Never auto-stash, reset, rebase, or force-pull the base.
