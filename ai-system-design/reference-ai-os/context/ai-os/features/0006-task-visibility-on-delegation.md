# Task Visibility on Delegation

## Git Workflow
- **Workflow:** trunk
- **Work Type:** feature
- **Jira Ticket:**
- **Base Branch:** main

## Description
Found live while running `/feature start`/`test`/`review` on 0005-jira-ticket-support: when an
action delegates to its matching agent (`feature-implementer`/`feature-tester`/`feature-reviewer`),
no TaskCreate/TaskUpdate checklist gets built — the delegated agent runs as an opaque black box
until it reports back. Only `actions/start.md`'s step 7 **inline fallback** (agent not installed)
builds a checklist (one task per Goal). That means the user had *more* visibility before agent
delegation existed (Phase 5) than they do now that it's the default path — a real regression, not
a missing nice-to-have. This spec closes it: every delegating step builds/updates a task list
around the delegation, so progress is equally visible whether the agent is installed or the
orchestrator falls back to running inline.

## Goals
- `actions/start.md`: before invoking `feature-implementer` (step 6), build a TaskCreate checklist
  — one task per spec Goal, same shape step 7's fallback already produces. Mark each task
  `in_progress`/`completed` as the agent's returned summary confirms that Goal was addressed
  (agents report a summary per the Agent tool's contract — read it back and reconcile against the
  checklist, don't just mark everything completed on any return).
- `actions/test.md`: before invoking `feature-tester` (step 2), create a task tracking that the
  test pass is running; mark it completed with a short pass/fail summary once the agent reports
  back. One task is enough here — the set of real checks isn't known until the agent discovers
  them, unlike `start`'s Goals which are known upfront from the spec.
- `actions/review.md`: before invoking `feature-reviewer` (step 2), create a task tracking that the
  review pass is running; mark it completed (with finding count) once the agent reports back. Same
  one-task shape as `test`, for the same reason.
- Update `wiki/notes/skills/feature/index.md`'s "How it's wired" section: it currently describes
  delegation without mentioning task-list visibility at all — add a line stating that every
  delegating action builds/updates a task list around the call, matching the fallback path's
  existing visibility, so the doc doesn't undersell what delegation now does.

## Constraints
- Don't change what the fallback paths (`start.md` step 7, `test.md` step 3, `review.md` step 3)
  already do — they already build a checklist; this closes the gap on the delegate path only.
- Tasks are the harness's own TaskCreate/TaskUpdate mechanism — ephemeral to the session, never
  written into `context/<system>/current-feature.md` or any other tracked file. No new state file.
- Applies uniformly to every system (`ai-os` and `projects/<name>`, both repo modes) — no
  system-specific behavior needed here, unlike 0005's Jira scoping.
- Don't add task-list-building to `plan`/`publish`/`clear`/`complete`/`abandon` — none of those
  delegate to an agent today, so they're out of scope; this spec only touches the three actions
  that already delegate.

## References
- .claude/skills/feature/actions/start.md (step 6 delegate / step 7 fallback)
- .claude/skills/feature/actions/test.md (step 2 delegate / step 3 fallback)
- .claude/skills/feature/actions/review.md (step 2 delegate / step 3 fallback)
- wiki/notes/skills/feature/index.md ("How it's wired" section)
- context/ai-os/features/0005-jira-ticket-support.md (the work item during which this gap was
  found live)

## Acceptance Criteria
- `start.md`'s delegate path builds the same one-task-per-Goal checklist shape its fallback
  already produces, updated to reflect the agent's actual reported progress.
- `test.md`'s delegate path builds/updates a task tracking the test run, mirroring the visibility
  its fallback already has.
- `review.md`'s delegate path builds/updates a task tracking the review run, mirroring the
  visibility its fallback already has.
- `wiki/notes/skills/feature/index.md`'s "How it's wired" section documents this — no stale
  implication that only the fallback path surfaces progress.
