# Feature Skill Consolidation

## Git Workflow
- **Workflow:** trunk
- **Work Type:** feature
- **Jira Ticket:**
- **Base Branch:** main

## Description
Roadmap item 1 (`context/roadmap.md`, "Must land first") — a maintenance-cost cleanup of the
`feature` skill that deliberately adds **no** new lifecycle functionality. The skill shipped its
build (Phases 0-10) as ~690 lines of prose procedure across
`.claude/skills/feature/SKILL.md` and ten `actions/*.md` files, four always-installed agents under
`.claude/agents/feature-*.md`, and a parallel documentation set under `wiki/notes/skills/feature/`.
That structure carries three recurring maintenance taxes plus some drift outside the skill:

1. Documentation lives in two places (`actions/*.md` and `wiki/notes/skills/feature/`) that have
   already drifted apart once (`context/ai-os/fixes/0002-remove-wiki-references-from-feature-skill.md`).
2. `plan`/`start`/`test`/`review` each specify a full inline fallback "for when the agent isn't
   installed" — but all four agents (`feature-planner`/`feature-implementer`/`feature-tester`/
   `feature-reviewer`) are part of this repo and always installed, so every fallback is a dead
   branch that still has to be kept in sync (e.g. the Jira-question logic is duplicated in both
   `actions/plan.md` step 7 and `feature-planner.md`).
3. The "resolve System (default `ai-os`) and its repo mode" preamble is restated in ~10 files
   instead of referenced from one place.

It also folds in three unrelated doc-drift fixes outside the skill (README/wiki claims that no
longer match reality) and adds one genuinely new but read-only action, `status`, that aggregates
in-flight workflow state across every system. This must land before any later skill change
(roadmap items 2-7), since each of those is cheaper to build on the consolidated base.

## Goals
1. **Single source of truth for skill documentation.** Contracts and step-by-step procedures live
   *only* in `.claude/skills/feature/actions/`. Delete `wiki/notes/skills/feature/` entirely — all
   six files (`index.md`, `state-model.md`, `system-resolution.md`, `scenarios.md`,
   `troubleshooting.md`, `testing-checklist.md`) — committing fully to a single source of truth
   rather than a slimmed-down parallel set that could drift again. Remove `wiki/index.md`'s
   "Skills (reference)" entry (line 37) outright rather than repointing it, and drop its stale
   "Phases 0-9 complete" wording. Any genuinely conceptual/rationale content worth keeping is
   folded into `SKILL.md` or the relevant `actions/*.md`, not left in a separate notes folder.
2. **Remove the inline fallbacks.** Cut the `**Fallback**` branches from `actions/plan.md` (step 7),
   `actions/start.md` (step 8), `actions/test.md` (step 4), and `actions/review.md` (step 4). Since
   the agents are always installed, replace each with: if the agent file under `.claude/agents/` is
   missing, the action reports that and stops — no second execution path to keep in sync. Remove the
   "graceful inline fallback otherwise" language from `SKILL.md` (lines 18-19) accordingly.
3. **Shared System/repo-mode preamble.** Extract the repeated "resolve System (default `ai-os`) and
   its repo mode" procedure into one new file, `.claude/skills/feature/actions/_common.md`, that
   every action references (e.g. "first resolve System/repo mode per `_common.md`") instead of
   restating it. The `_` prefix marks it as a shared include, not an action — it stays out of
   `SKILL.md`'s action table, and `SKILL.md` remains the lean scan-time router. It grounds against
   the current per-system rules previously in `system-resolution.md` (repo-mode detection via
   `projects/<name>/.git`, own-repo two-branch model), which move to live here as part of Goal 1's
   consolidation.
4. **New read-only `status` action.** Add `status [--system <system>]` (procedure in a new
   `actions/status.md`, plus a `SKILL.md` action-table row). It aggregates, across *every* system:
   the active slot from each `context/<system>/current-feature.md` (status, work branch, source
   spec), every `## Pending Reviews` entry, and every staged preview under `context/<system>/plans/`.
   It is strictly read-only — no writes, no delegation — and distinct from `plan status`, which only
   covers staged plans.
5. **Fix documentation drift outside the skill:**
   - `README.md` line 14 ("Each project has its own `CLAUDE.md`/`README.md`") — contradicts
     `CLAUDE.md` (projects are managed centrally via `context/projects/<name>/`, carry no own
     CLAUDE.md). Correct it.
   - `README.md` lines 15-20 describe `.claude/memory/` as working auto-accumulated memory — it's
     empty scaffold. Correct the claim (coordinating with the separate single-CLAUDE.md-router idea,
     roadmap item 2, which may delete that scaffold entirely).
   - `wiki/index.md` lines 54-56 link to `wiki/raw/`, which does not exist on disk. Fix or remove
     the dead link.

## Constraints
- **`current-feature.md` stays gitignored, outside the repo — unchanged.** Michal decided
  (2026-07-18) that in-flight workflow state must not live in the repository; the
  single-machine/no-backup risk is accepted. No tracking, no backup mechanism, no change — and the
  new read-only `status` action must not alter that (it only reads those files, never relocates or
  commits them).
- **No new lifecycle capabilities.** No new statuses, flags, or workflow variants; `status` is
  read-only aggregation of existing state, not a new state-mutating step. The spec template fields,
  `plan done` numbering/move logic, and the Jira-ticket gating rule are all untouched.
- **Removing the fallbacks must not change any action's happy-path behavior** when the agent is
  present (which is always, in this repo) — the delegated path stays exactly as-is; only the dead
  second branch is deleted.
- **Don't let the shared-preamble extraction reintroduce drift** — `_common.md` is the single copy;
  actions reference it rather than paraphrasing it back in.
- The `README.md` `.claude/memory/` fix overlaps with roadmap item 2 (single-CLAUDE.md-router);
  keep this phase's change correct on its own but avoid pre-empting that item's scaffold-deletion
  decision.

## References
- `wiki/ideas/feature-skill-consolidation.md` — the accepted idea driving this work (authoritative
  scope).
- `context/roadmap.md` item 1 — sequence position ("must land first").
- `.claude/skills/feature/SKILL.md` — action table (add a `status` row), and the "delegate … with
  graceful inline fallback otherwise" wiring language (lines 18-19) to revise.
- `.claude/skills/feature/actions/plan.md` (step 7), `start.md` (step 8), `test.md` (step 4),
  `review.md` (step 4) — the inline fallbacks to remove.
- `.claude/skills/feature/actions/*.md` — every action file carries the System/repo-mode preamble
  to extract into `_common.md`; all reference the shared copy afterward.
- `.claude/skills/feature/actions/_common.md` — new shared include (`_`-prefixed, not an action)
  holding the single System/repo-mode resolution copy.
- `.claude/agents/feature-planner.md`, `feature-implementer.md`, `feature-tester.md`,
  `feature-reviewer.md` — the always-installed agents that make the fallbacks dead branches.
- `wiki/notes/skills/feature/` (`index.md`, `state-model.md`, `system-resolution.md`,
  `scenarios.md`, `troubleshooting.md`, `testing-checklist.md`) — the parallel doc set to delete
  entirely; `system-resolution.md`'s repo-mode content is the source for `_common.md`.
- `wiki/index.md` (line 37 skill entry to remove; lines 54-56 dead `raw/` link) and `README.md`
  (line 14 per-project CLAUDE.md claim; lines 15-20 `.claude/memory/` claim) — external drift to fix.
- `context/ai-os/fixes/0002-remove-wiki-references-from-feature-skill.md` — the prior drift incident.
- `context/ai-os/features/0010-plan-resume-status.md` — precedent spec shape for a plan-action-
  internal change and for touching `SKILL.md`'s action table.

## Acceptance Criteria
- `.claude/skills/feature/actions/*.md` and `SKILL.md` are the *only* place holding step-by-step
  procedure or field/status contracts; `wiki/notes/skills/feature/` is deleted entirely (all six
  files gone), and `wiki/index.md`'s line-37 skill entry is removed rather than repointed.
- No `actions/*.md` file contains a `**Fallback**` inline-execution branch; each delegating action
  instead reports-and-stops if its agent file is missing, and `SKILL.md` no longer promises a
  graceful inline fallback.
- The System/repo-mode resolution procedure exists in exactly one file,
  `.claude/skills/feature/actions/_common.md`, which is `_`-prefixed and absent from the `SKILL.md`
  action table; every action references it rather than restating it.
- `/feature status [--system <system>]` exists, is read-only, and lists across every system: the
  active slot (status, work branch, source spec), all `## Pending Reviews` entries, and all staged
  `plans/` previews; it is documented with a `SKILL.md` action-table row and an `actions/status.md`
  procedure file, and never writes or relocates `current-feature.md`.
- `README.md` no longer claims per-project `CLAUDE.md`/`README.md`, and no longer describes
  `.claude/memory/` as populated working memory; `wiki/index.md` has no dead `wiki/raw/` link.
- `current-feature.md` remains gitignored and outside the repo; no new statuses/flags/workflow
  variants were added; the spec template, `plan done` logic, and Jira gating are unchanged.
- The delegated happy path for `plan`/`start`/`test`/`review` behaves identically to before for a
  real run in this repo (agents present).
