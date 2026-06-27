# Test Action

1. Read Goals and inspect the diff against origin/<base-branch>.
2. Discover available checks from project files; do not assume npm or Vitest.
3. Run the narrowest relevant unit or integration tests first.
4. Run the repository's required lint, type-check, and build commands when available.
5. Add tests for changed logic when the repository patterns and work goals require them.
6. Report every command and result. Stop publishing or backporting if a required check fails.

Do not install dependencies or modify test configuration without permission.
