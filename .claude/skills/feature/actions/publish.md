# Publish Action

1. Read the state file and require Status In Progress.
2. Verify the current branch equals Work Branch and is not Base Branch.
3. Run the checks defined by test.md. Stop on failure.
4. Run the checks defined by review.md. Stop if the verdict is not ready.
5. Show git status --short and a concise diff summary.
6. Exclude context/ completely from staging, including Source Spec and current-feature.md. If Source Spec is outside context/ and changed or untracked, include it in the proposed feature commit.
7. Propose a conventional commit message matching Work Type.
8. Ask for permission before committing and pushing.
9. After permission:
   - Stage only files belonging to the work item and outside context/. Do not use git add -A when unrelated or ignored runtime files exist.
   - Commit once with the approved message.
   - Run git push -u origin <work-branch>.
10. Verify origin/<work-branch> exists and equals the published local commit.
11. Set Status to Published.

## Pull request target

1. Treat Base Branch from local state as the only valid pull request target.
2. Never rely on the generic Create pull request URL printed by git push. GitHub may target the repository default branch instead of Base Branch.
3. Read origin with git remote get-url origin and normalize GitHub SSH or HTTPS URLs to <owner>/<repository>.
4. Produce an explicit compare URL in this form:

   https://github.com/<owner>/<repository>/compare/<base-branch>...<work-branch>?expand=1

5. Display both values clearly:
   - Head: Work Branch
   - Base: Base Branch
6. When GitHub CLI is available and the user asks to create the PR, use explicit arguments:

   gh pr create --base <base-branch> --head <work-branch>

7. Never run gh pr create without both --base and --head.
8. When a PR already exists, verify its base with gh pr view when available. Otherwise instruct the user to confirm the base in GitHub before merge.
9. If the PR base differs from Base Branch, stop the workflow and require retargeting. Never continue to merge or backport from a wrongly targeted PR.

Do not merge locally. GitHub is the merge point.
