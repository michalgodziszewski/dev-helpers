# Action: `test`

`test [--system <system>]`

Runs the resolved system's real checks (lint/type-check/test/build) against the current work
branch.

1. Resolve `System` (default `ai-os`) and its repo mode per [`_common.md`](_common.md). Requires
   that system's active slot Status to be `In Progress` or `Published` — there needs to be a work
   branch to test. For own-repo (two branches), this always means the **code** branch in the nested
   repo — the context branch never has anything to lint/test/build.
2. Before delegating, create a single TaskCreate task tracking that the test pass is running —
   one task total, not one per check, since the actual set of checks isn't known until the agent
   discovers them.
3. Delegate to the `feature-tester` agent (`.claude/agents/feature-tester.md` — see step 4 if it's
   missing): invoke it with the resolved repo root and that system's `project-overview.md` content
   (which documents the real lint/test/build commands). Read its per-check pass/fail report back,
   then TaskUpdate the task from the previous step to `completed`, noting a short pass/fail
   summary.
4. If `.claude/agents/feature-tester.md` is missing, report that the required `feature-tester`
   agent is not installed and stop — there is no inline check-running path. The agent ships with
   this repo and is always installed, so this is an error condition, not a routine branch.
5. Report the result to the user. `test` does not change Status or any state field — it's a
   read-only check, re-runnable any time the slot is `In Progress` or `Published`.
