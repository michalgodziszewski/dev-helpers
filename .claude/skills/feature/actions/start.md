# Start Action

1. Read context/current-feature.md. Require populated Goals, Workflow, Work Type, and Base Branch.
2. Inspect git status before changing branches.
3. Allow dirty state only for:
   - context/current-feature.md, which load has updated.
   - The exact Source Spec recorded in current-feature.md when it is a repository-relative Markdown file.
4. Require Source Spec to resolve inside the repository and end with .md. Do not allow a directory, wildcard, or path outside the repository.
5. If any other tracked, untracked, staged, or conflicted file is present, stop and list it. Do not stash automatically.
6. Run git fetch origin --prune.
7. Verify origin/<base-branch> exists.
8. Synchronize the local base:
   - If the local base exists, run git switch <base-branch>.
   - Otherwise, run git switch --track -c <base-branch> origin/<base-branch>.
   - Run git pull --ff-only origin <base-branch>.
   - Verify git rev-parse <base-branch> equals git rev-parse origin/<base-branch>.
9. Stop if switching or pulling would overwrite the Source Spec, or if the base is divergent, cannot fast-forward, or does not match origin.
10. Create <work-type>/<kebab-case-name> with git switch -c.
11. Verify the Source Spec is still present and unchanged.
12. Update Status to In Progress and save Work Branch.
13. Show the Goals, then implement them one by one.

Never create a work branch before base synchronization succeeds. Keep the local Source Spec with the work so it can be committed on the feature branch. Never auto-stash, reset, rebase, or force-pull the base.
