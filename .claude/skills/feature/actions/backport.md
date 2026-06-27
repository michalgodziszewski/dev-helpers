# Backport Action

Use only after the pull request has been merged on GitHub.

1. Parse backport <release-branch> <commit-sha>. Require both values; never infer them.
2. Require Workflow trunk and Status Published or Merged.
3. Require a clean working tree except for context/current-feature.md.
4. Run git fetch origin --prune.
5. Verify origin/<release-branch> exists, <commit-sha> resolves, and the commit is contained in origin/trunk.
6. Synchronize the local release branch:
   - If it exists, run git switch <release-branch>.
   - Otherwise, run git switch --track -c <release-branch> origin/<release-branch>.
   - Run git pull --ff-only origin <release-branch>.
   - Verify local and remote release SHAs are equal.
7. Stop if synchronization fails or the release branch is divergent.
8. Create backport/<work-name>-<release-branch> from the freshly synchronized local release branch.
9. Show the commit subject and changed files, then ask for permission to cherry-pick and push.
10. After permission:
   - Run git cherry-pick -x <commit-sha>.
   - If conflicts occur, stop, list them, and keep the cherry-pick in progress for deliberate resolution. Never abort or resolve automatically.
   - Run relevant tests and build checks.
   - Run git push -u origin <backport-branch>.
11. Record the release branch, SHA, and backport branch in the state file. Set Status to Merged.
12. Report that the backport pull request target must be the release branch.

Never create the backport branch from a stale release branch. Never push directly to release and never force-push.
