# Publish Action

1. Read local state and require Status In Progress.
2. Verify the current branch equals Work Branch and is not Base Branch.
3. Run test.md and review.md. Stop on any failure or non-ready verdict.
4. Show git status --short and a concise diff summary.
5. Exclude context/ completely from staging.
6. Propose a conventional commit message and ask before committing and pushing.
7. After permission:
   - Stage only work-item files outside context/.
   - Commit once with the approved message when uncommitted work exists.
   - Run git fetch origin --prune.
   - Verify origin/<base-branch> exists.

## Capture atomic commits

1. Compute the ordered feature-only commit list:

   git rev-list --reverse --no-merges <work-branch> --not origin/<base-branch>

2. Never use a merge commit, GitHub merge SHA, or combined diff as a Published Commit.
3. The --not origin/<base-branch> exclusion must remove commits introduced by syncing or merging the base branch into the work branch.
4. Require at least one atomic commit.
5. For every selected SHA:
   - Verify it resolves.
   - Verify it is not a merge commit.
   - Show SHA and subject.
6. Also show ignored merge commits on the work branch so synchronization merges are visible.
7. Ask the user to confirm the exact ordered commit list before push.
8. Store the ordered SHAs as Published Commits in local state.
9. Run git push -u origin <work-branch>.
10. Verify origin/<work-branch> equals the local Work Branch commit.
11. Set Status to Published.

## Pull request target

1. Base Branch from local state is the only valid PR target.
2. Never use the generic Create pull request URL printed by git push.
3. Normalize origin to a GitHub <owner>/<repository> path.
4. Produce:

   https://github.com/<owner>/<repository>/compare/<base-branch>...<work-branch>?expand=1

5. Display Head and Base explicitly.
6. With GitHub CLI, always use:

   gh pr create --base <base-branch> --head <work-branch>

7. If an existing PR targets another branch, stop and require retargeting before merge.

Do not merge locally. Never stage or commit context/.
