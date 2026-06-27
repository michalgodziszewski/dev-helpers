# Start Action

1. Read context/current-feature.md. Require populated Goals, Workflow, Work Type, and Base Branch.
2. Require a clean working tree except for context/current-feature.md, which load has updated. If other files are dirty, stop and list them; do not stash automatically.
3. Run git fetch origin --prune.
4. Verify origin/<base-branch> exists.
5. Synchronize the local base:
   - If the local base exists, run git switch <base-branch>.
   - Otherwise, run git switch --track -c <base-branch> origin/<base-branch>.
   - Run git pull --ff-only origin <base-branch>.
   - Verify git rev-parse <base-branch> equals git rev-parse origin/<base-branch>.
6. Stop if the base is divergent, cannot fast-forward, or does not match origin.
7. Create <work-type>/<kebab-case-name> with git switch -c.
8. Update Status to In Progress and save Work Branch.
9. Show the Goals, then implement them one by one.

Never create a work branch before base synchronization succeeds. Never auto-stash, reset, rebase, or force-pull the base.
