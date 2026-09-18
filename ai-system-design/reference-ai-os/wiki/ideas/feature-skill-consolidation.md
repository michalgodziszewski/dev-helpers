# Idea: `feature` skill — consolidation phase

**Status:** accepted, not started
**Priority:** before any new `feature`-skill capability — this phase deliberately adds no new
functionality, it only reduces the maintenance cost of what already shipped (Phases 0-10).

## Why

The skill is ~690 lines of prose procedure across [`SKILL.md`](../../.claude/skills/feature/SKILL.md)
and `actions/*.md`, plus four agents, plus a parallel documentation set that used to live under
`wiki/notes/skills/feature/`. Documentation drift between those
two places has already happened once (fix
[`0002-remove-wiki-references-from-feature-skill`](../../context/ai-os/fixes/0002-remove-wiki-references-from-feature-skill.md)).
Every action also carries a fully-specified inline fallback that never runs in this repo (the
agents are always installed), and near-identical "resolve System / repo mode" preamble is repeated
in ~10 files. Each future capability multiplies these costs; consolidating now is cheap, later is
expensive.

## Scope — what's in

1. **Single source of truth for documentation.** Contracts and procedures live *only* in
   `.claude/skills/feature/actions/`. The wiki folder (`wiki/notes/skills/feature/`) either goes
   away or is reduced to purely conceptual/rationale content that can't drift against procedure
   (no restated field lists, status tables, or step semantics).
2. **Remove the inline fallbacks.** `plan`/`start`/`test`/`review` currently specify a full second
   execution path for when their agent isn't installed. Cut them: if the agent file is missing,
   the action reports that and stops. The agents are part of this repo, so the fallback is a
   dead branch that still has to be kept in sync (e.g. the Jira-question logic exists in both
   `actions/plan.md` step 7 and `feature-planner.md`).
3. **Shared preamble.** Extract the repeated "resolve System (default `ai-os`) and its repo mode"
   procedure into one place (e.g. `actions/_common.md` or a `SKILL.md` section) that every action
   references instead of restating.
4. **New read-only `status` action.** One command that aggregates, across every system: the active
   slot (status, work branch, source spec), all `## Pending Reviews` entries, and all staged
   previews under `plans/`. Today this requires manually reading each system's
   `current-feature.md`; `plan status` only covers plans.
5. **Fix documentation drift outside the skill:**
   - `README.md` claims each project has its own `CLAUDE.md`/`README.md` — contradicts
     `CLAUDE.md` (projects are managed centrally via `context/projects/<name>/`).
   - `README.md` describes `.claude/memory/` as working auto-accumulated memory — it's empty
     (see the separate memory-unification idea, when accepted).
   - `wiki/index.md` links to `wiki/raw/`, which doesn't exist on disk.

## Scope — what's explicitly out (decided)

- **`current-feature.md` stays gitignored, outside the repo — as is.** Michal decided
  (2026-07-18) that in-flight workflow state must not live in the repository; the
  single-machine/no-backup risk is accepted. No tracking, no backup mechanism, no change.
- No new lifecycle capabilities (no new statuses, flags, or workflow variants) in this phase.
