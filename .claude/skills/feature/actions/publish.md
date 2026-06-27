# Publish Action

1. Read the state file and require Status In Progress.
2. Verify the current branch equals Work Branch and is not Base Branch.
3. Run the checks defined by test.md. Stop on failure.
4. Run the checks defined by review.md. Stop if the verdict is not ready.
5. Show git status --short and a concise diff summary.
6. When Source Spec is a local Markdown file and is changed or untracked, include it in the proposed feature commit.
7. Propose a conventional commit message matching Work Type.
8. Ask for permission before committing and pushing.
9. After permission:
   - Stage only files belonging to the work item. Do not use git add -A when unrelated files exist.
   - Commit once with the approved message.
   - Run git push -u origin <work-branch>.
10. Set Status to Published.
11. Report that the GitHub pull request target must be Base Branch.

Do not merge locally. GitHub is the merge point.
