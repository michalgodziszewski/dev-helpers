# Test Action

1. Read Goals and Base Branch from the state file and inspect the diff against origin/<base-branch> with read-only Git commands. Do not fetch here when a fetch already ran earlier in the current action chain (for example when test runs inside publish); otherwise run git fetch origin --prune without asking.
2. Delegate check discovery and execution to the test subagent: spawn it with the Agent tool using subagent_type "test", passing the Goals and the changed files. The agent discovers available checks from project files (never assuming npm or Vitest), runs the narrowest relevant unit or integration tests first, then the repository's required lint, type-check, and build commands, and reports every command with its result.
3. If no test subagent is installed, run the same discovery and execution inline and note that the delegation was skipped.
4. Add tests for changed logic when the repository patterns and work goals require them. Writing tests happens in the main conversation, never inside the subagent.
5. Relay every command and result. Stop publishing or backporting if a required check fails.

Running discovered checks never requires permission — executing them is the purpose of this action. Do not install dependencies or modify test configuration without permission.
