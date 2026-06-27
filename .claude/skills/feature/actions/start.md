# Start Action

1. Read context/current-feature.md. Require populated Goals, Workflow, Work Type, and Base Branch.
2. Inspect git status before changing branches.
3. Ignore context/ when evaluating working-tree cleanliness because it is personal runtime state excluded by .gitignore.
4. Outside context/, allow dirty state only for the exact Source Spec recorded in current-feature.md when it is a repository-relative Markdown file.
5. Require Source Spec to resolve inside the repository and end with .md. Do not allow a directory, wildcard, or path outside the repository.
6. If any other tracked, untracked, staged, or conflicted file is present, stop and list it. Do not stash automatically.
7. Run git fetch origin --prune.
8. Verify origin/<base-branch> exists.
9. Synchronize the local base:
   - If the local base exists, run git switch <base-branch>.
   - Otherwise, run git switch --track -c <base-branch> origin/<base-branch>.
   - Run git pull --ff-only origin <base-branch>.
   - Verify git rev-parse <base-branch> equals git rev-parse origin/<base-branch>.
10. Stop if switching or pulling would overwrite a Source Spec outside context/, or if the base is divergent, cannot fast-forward, or does not match origin.
11. Create <work-type>/<kebab-case-name> with git switch -c.
12. Verify the Source Spec is still present and unchanged.
13. Update Status to In Progress and save Work Branch.
14. Show the Goals, then implement them one by one.

Never create a work branch before base synchronization succeeds. Never stage context/ or include it in the feature branch. Never auto-stash, reset, rebase, or force-pull the base.
