# Delegated Agents

## Git Workflow
- **Workflow:** trunk
- **Work Type:** feature
- **Jira Ticket:**
- **Base Branch:** main

## Description
Phase 5 of `context/feature-skill-plan.md`: replace the `feature` skill's inline
implementation/test/review steps with real delegation to dedicated sub-agents —
`feature-implementer`, `feature-tester`, `feature-reviewer` under `.claude/agents/`. Every
delegation degrades gracefully to the current inline procedure if the matching agent isn't
installed, so the orchestrator never fails because a sub-agent is missing.

Alongside this, scaffold two durable reference template projects under `projects/` —
`projects/angular-template` and `projects/nestjs-template` — as real, working application
skeletons (`ng new` / `nest new`, installed dependencies, working lint/test/build). Real scaffolds
so `feature-tester` has actual checks to discover and run, not just a placeholder. These give
`project-overview.md` (built in Phase 4) real stack-specific content to read for the first time,
and let this phase be verified live: does `feature-implementer` actually pick up and follow
Angular conventions on one project and NestJS conventions on the other, using the same generic
agent both times, and does `feature-tester` actually run each project's real lint/test/build? Per
the "Sub-agent granularity" question already flagged in `feature-skill-plan.md`, the default is
one stack-agnostic agent per role, not per-stack variants — these two projects are the test of
whether that holds up. Node.js/npm (via `nvm`) is installed as a prerequisite for this spec, since
neither `ng new` nor `nest new` work without it.

Doing this surfaced a second design correction: Phase 4 had `project-overview.md` for a project
read its stack/coding-standards content *from* that project's own `CLAUDE.md`, meaning every
managed project would need its own `CLAUDE.md` — a duplicate-content problem, and a departure from
"the system manages projects centrally, projects don't need to know about the system." This spec
also corrects that: no per-project `CLAUDE.md`; the content is authored directly instead (for
`ai-os` itself `project-overview.md` stays a thin pointer to the root `CLAUDE.md`, unchanged —
that case doesn't have this duplication problem since the root `CLAUDE.md` isn't per-project).
Root `CLAUDE.md` gains a Projects table replacing the old "each project has its own
CLAUDE.md/README" line. And since `context/features/` was originally just the `feature` skill's
own state, but this directly-authored content now carries general project knowledge beyond
feature-skill bookkeeping, the wrapping folder is flattened: `context/features/<system>/` becomes
`context/<system>/` (e.g. `context/ai-os/`, `context/projects/<name>/`) — this is a rename of
Phase 4's already-merged layout, touching every file that referenced the old path.

A third correction landed during review of the first two: that directly-authored content isn't
one file, it's two — `project-overview.md` ("what is this project" — stack, structure, commands)
and a separate `coding-standards.md` ("how do we write code in it"), with the former linking to
the latter. `ai-os` only gets `project-overview.md` (thin pointer); it has no
`coding-standards.md`, since its conventions already live in `.claude/GUIDELINES.md`/
`context/stack-and-conventions.md`.

## Goals
- Flatten `context/features/<system>/` to `context/<system>/` across the repo: the actual
  directories/files (`git mv`), `.gitignore`'s `current-feature.md` pattern, every `actions/*.md`
  procedure, `SKILL.md`, every `wiki/notes/skills/feature/*.md` file, and
  `context/feature-skill-plan.md`. No behavior change beyond the path — same file shapes, same
  per-system slot semantics.
- Drop the per-project `CLAUDE.md` pattern from Phase 4's `load` procedure: a `projects/<name>`
  system now gets `project-overview.md` and `coding-standards.md` written and maintained directly
  as two separate files, not derived from a `projects/<name>/CLAUDE.md` that doesn't exist. `ai-os`
  itself is unchanged — its `project-overview.md` stays a thin pointer to the root `CLAUDE.md`, and
  it has no `coding-standards.md`.
- Update root `CLAUDE.md`: replace "each project has its own CLAUDE.md/README" with a Projects
  table (project → its `project-overview.md` and `coding-standards.md`).
- Build `.claude/agents/feature-implementer.md`: receives the resolved System's repo path, the
  loaded spec's Goals, and that system's `project-overview.md`/`coding-standards.md` content as
  its brief; implements the Goals on the branch the orchestrator already created; never commits,
  pushes, or writes `context/**` — that stays with the orchestrator.
- Build `.claude/agents/feature-tester.md`: discovers and runs the resolved system's checks
  (test/lint/type-check/build), reports pass/fail and what it ran.
- Build `.claude/agents/feature-reviewer.md`: code-quality pass over the diff against the loaded
  spec's Goals, pinned to `model: sonnet` rather than inheriting the orchestrator's model — a
  review pass doesn't need to run on whatever model the rest of the session happens to be using.
- Give each of the three agents a distinct `color` in its frontmatter so they're visually
  distinguishable when they run.
- Wire `actions/start.md` to delegate implementation to `feature-implementer`, with graceful
  inline fallback if the agent isn't available.
- Add `actions/test.md` and `actions/review.md`, delegating to `feature-tester`/
  `feature-reviewer` respectively, same graceful-fallback rule. Update `SKILL.md`'s action table:
  `test`/`review` move from "Not yet — Phase 5" to "Available".
- Scaffold `projects/angular-template` as a real, working Angular app (`ng new`, standalone,
  installed dependencies, working `lint`/`test`/`build`), no `CLAUDE.md` — its
  `context/projects/angular-template/coding-standards.md` holds the Angular coding standards
  supplied for this spec, verbatim.
- Scaffold `projects/nestjs-template` as a real, working NestJS app (`nest new`, installed
  dependencies, working `lint`/`test`/`build`), no `CLAUDE.md` — its
  `context/projects/nestjs-template/coding-standards.md` holds NestJS-appropriate coding
  standards written for this spec (the user will adjust/replace the specifics later).
- Live-verify against at least one of the two template projects: `load`/`start` (delegating to
  `feature-implementer`), `test` (delegating to `feature-tester`, running that project's real
  lint/test/build), `review`, `publish` for one small real change, confirming
  `coding-standards.md`'s stack-specific content actually shapes the agent's behavior.

## Constraints
- One stack-agnostic agent per role (`feature-implementer`/`feature-tester`/`feature-reviewer`),
  not per-stack variants — stack-specific behavior comes entirely from `coding-standards.md` at
  runtime, per the already-resolved default in `feature-skill-plan.md`.
- `backport` stays out of scope (Phase 6); ticket/config system stays out of scope (Phase 7).
- Both template projects are tracked-in-`ai-os` (no nested `.git`) and are **durable**, not
  throwaway — unlike Phase 4's `_test-project`, they are not deleted after verification; they're
  meant to keep serving as Phase 5+ reference fixtures.
- `System: ai-os` and existing Phase 2–4 behavior must not regress when no agent is installed for
  a system — inline fallback must match today's behavior exactly, aside from the `context/`
  path rename itself.
- Projects themselves stay unaware of the system managing them — no back-reference from a project
  to `context/` or to the `feature` skill; management is entirely one-directional, from the system
  down into the project.

## References
- context/feature-skill-plan.md (Phase 5 section; "Orchestrator + delegated agents" architecture;
  "Sub-agent granularity" deferred question; "Tracked context" section, now superseded by this
  spec's path rename)
- .claude/skills/feature/actions/start.md, load.md
- wiki/notes/skills/feature/system-resolution.md
- wiki/notes/skills/feature/state-model.md
- CLAUDE.md (root)

## Acceptance Criteria
- `context/<system>/` replaces `context/features/<system>/` everywhere — no remaining reference to
  the old path in tracked files, `.gitignore` matches the new depth.
- No `CLAUDE.md` under any `projects/<name>/`; each project's overview lives in
  `context/projects/<name>/project-overview.md` and its coding standards in the separate
  `context/projects/<name>/coding-standards.md`, the former linking to the latter. Root `CLAUDE.md`
  has a Projects table (linking both files per project) instead of the old "each project has its
  own CLAUDE.md" line.
- `.claude/agents/feature-implementer.md`, `feature-tester.md`, `feature-reviewer.md` exist, each
  with a distinct `color`; `feature-reviewer` is pinned to `model: sonnet` rather than inheriting.
- `actions/start.md` delegates to `feature-implementer` with the inline-fallback rule documented;
  `actions/test.md` and `actions/review.md` exist with the same delegation/fallback shape.
- `SKILL.md`'s `test`/`review` rows show `Available`, pointing at their `actions/*.md`.
- `projects/angular-template` is a real Angular app (`ng new` output, dependencies installed,
  `npm run lint`/`test`/`build` all work); `context/projects/angular-template/coding-standards.md`
  holds the Angular standards supplied for this spec, verbatim.
- `projects/nestjs-template` is a real NestJS app (`nest new` output, dependencies installed,
  `npm run lint`/`test`/`build` all work); `context/projects/nestjs-template/coding-standards.md`
  holds NestJS-appropriate coding standards written for this spec.
- All three agents verified via **real `Agent`-tool delegation** (not just the inline fallback),
  against both template projects:
  - `feature-tester` ran real `lint`/`test`/`build` against `angular-template` and reported
    accurate per-check pass/fail plus an overall verdict.
  - `feature-implementer` added a real, kept `HealthModule`/`HealthController`/`HealthService`/
    `HealthStatusDto` (`GET /health`) to `nestjs-template`, correctly following
    `coding-standards.md` (thin controller, DTO instead of a bare object literal, constructor
    injection, correct file/naming conventions) and reasoning sensibly about an edge case
    (`class-validator` not installed — correctly judged unnecessary for a body-less `GET`).
  - `feature-reviewer` reviewed that diff against Goals/`coding-standards.md`, found no
    correctness bugs or standards violations, and surfaced one well-calibrated, appropriately
    non-blocking style nit (`HealthStatusDto.status` typed as the literal `'ok'` rather than
    `string`, worth reconsidering only if health checks are later extended to report failure
    states).
  - Also separately verified the documented inline-fallback path for `feature-implementer`/
    `feature-tester`/`feature-reviewer` (a `StatusBadgeComponent` added to `angular-template`),
    confirming both the delegated and fallback paths work and produce comparable results.
  - **Harness timing note**: newly created `.claude/agents/*.md` files were not immediately
    invocable via the `Agent` tool right after creation earlier in this same session, but became
    invocable later in the same session without a restart — a registration delay, not a hard
    session-start-only limitation. Not a blocker; noted in `feature-skill-plan.md` for future
    agent-building work.
  - One real gap found and fixed during this verification: `feature-reviewer.md` relied on
    `git diff` alone, which doesn't show brand-new untracked files (as in these template
    projects, not yet committed) — fixed to read named files directly when `git diff` won't show
    them.
