# Action: `review`

`review [--system <system>]`

Code-quality pass over the current work branch's diff against the loaded spec's Goals.

1. Resolve `System` (default `ai-os`) and its repo mode per [`_common.md`](_common.md). Requires
   that system's active slot Status to be `In Progress` or `Published` — there needs to be a diff
   to review. For own-repo (two branches), this always means the **code** branch in the nested repo
   — the context branch is tracking metadata only, nothing there to review against coding standards.
2. Before delegating, create a single TaskCreate task tracking that the review pass is running.
3. Delegate to the `feature-reviewer` agent (`.claude/agents/feature-reviewer.md` — see step 4 if
   it's missing): invoke it with the resolved repo root, the spec's Goals/Constraints/Acceptance
   Criteria, and that system's `project-overview.md`/`coding-standards.md` content (`ai-os` has no
   `coding-standards.md`). Read its findings list back, then TaskUpdate the task from the previous
   step to `completed`, noting the finding count.
4. If `.claude/agents/feature-reviewer.md` is missing, report that the required `feature-reviewer`
   agent is not installed and stop — there is no inline review path. The agent ships with this
   repo and is always installed, so this is an error condition, not a routine branch.
5. Report the findings to the user, most severe first. `review` does not change Status or any
   state field, and never edits code — it's read-only, re-runnable any time the slot is
   `In Progress` or `Published`.
