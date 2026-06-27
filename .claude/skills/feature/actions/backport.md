# Backport Action

Use only after the primary pull request has been merged on GitHub.

## Select work

Accept:

- backport <release-branch> <commit-sha> for the active trunk item.
- backport <work-branch> <release-branch> <commit-sha> for an exact Pending Reviews item.

Require Workflow trunk. Never infer the work item, release branch, or commit SHA.

## Create backport

1. Require a clean working tree outside context/.
2. Run git fetch origin --prune.
3. Verify origin/<release-branch> exists, <commit-sha> resolves, and the commit is contained in origin/trunk.
4. Synchronize the local release branch:
   - If it exists, run git switch <release-branch>.
   - Otherwise, run git switch --track -c <release-branch> origin/<release-branch>.
   - Run git pull --ff-only origin <release-branch>.
   - Verify local and remote release SHAs are equal.
5. Stop if synchronization fails or the release branch is divergent.
6. Create backport/<work-name>-<release-branch> from the freshly synchronized release branch.
7. Show the commit subject and changed files, then ask for permission to cherry-pick and push.
8. After permission:
   - Run git cherry-pick -x <commit-sha>.
   - On conflict, stop and list conflicts. Never abort or resolve automatically.
   - Run relevant tests and build checks.
   - Run git push -u origin <backport-branch>.
9. After the cherry-pick commit is created, store its new SHA as Backport Commit SHA together with Backport Release Branch and Backport Branch on the selected active or Pending Reviews item. Do not store the original trunk SHA as Backport Commit SHA.
10. For a pending item, set its Status to Backport Awaiting Review without changing the active slot.
11. For an active item, set Status to Merged so clear can move it to Pending Reviews.
12. Report that the backport pull request target must be the release branch.

Never create a backport from a stale release branch, push directly to release, or force-push.
