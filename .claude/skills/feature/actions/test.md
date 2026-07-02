# Test Action

1. Read Goals and Base Branch from the state file and inspect the diff against origin/<base-branch> with read-only Git commands. Do not fetch here when a fetch already ran earlier in the current action chain (for example when test runs inside publish); otherwise run git fetch origin --prune without asking.
2. Delegate check discovery and execution to the test subagent: spawn it with the Agent tool using subagent_type "test", passing the Goals and the changed files. Both a standalone `/feature test` call and test running inside publish request the same scoped run — changed-file-targeted tests only, never the entire suite. A full, whole-repository run is CI's responsibility (for example a GitHub Actions workflow triggered by the push), not something `/feature test` or `/feature publish` reproduce locally. The agent discovers available checks from project files (never assuming npm or Vitest) and reports every command with its result.
3. If no test subagent is installed, run the same scoped discovery and execution inline and note that the delegation was skipped.
4. Add tests for changed logic when the repository patterns and work goals require them. Writing tests happens in the main conversation, never inside the subagent.
5. Relay every command and result, including which files were mapped to which tests. Stop publishing or backporting if a required check fails.

Running discovered checks never requires permission — executing them is the purpose of this action. Do not install dependencies or modify test configuration without permission. Prefer this scoped `/feature test` over manually running the full suite or full build at any point in the workflow, including right before publishing — CI runs the complete pass after push.
