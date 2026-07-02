# Explain Action

1. Read the state file to identify Base Branch and Work Branch.
2. Delegate the walkthrough to the explain subagent: spawn it with the Agent tool using subagent_type "explain", passing both branches and asking for the merge-base diff explanation (git diff origin/<base-branch>...<work-branch>) so unrelated changes already on the base are excluded.
3. If no explain subagent is installed, produce the same explanation inline: run git diff origin/<base-branch>...<work-branch> --name-status, explain every changed file in one or two sentences with its key functions or components, and summarize the data or control flow between files.
4. Relay the explanation and state the source and target branches explicitly.

This action is read-only and asks no questions. It never fetches, modifies files, or changes Git state.
