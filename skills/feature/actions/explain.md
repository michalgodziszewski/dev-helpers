# Explain Action

1. Read the state file to identify Base Branch and Work Branch.
2. Run git diff origin/<base-branch>...<work-branch> --name-status.
3. For every changed file, explain in one or two sentences what changed and identify key functions or components.
4. Summarize the data or control flow between files.
5. State the source and target branches explicitly.

Use the merge-base diff (...) so the explanation excludes unrelated changes already on the base branch.
