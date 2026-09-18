# Idea: `feature` skill — dedicated project-setup action

**Status:** accepted (2026-07-18), not started
**Priority:** its real moment is onboarding the first real project ([[project-pensieve]]), after
the `feature` skill's consolidation and publish-quality-gate work lands.

**Framing decided 2026-07-18:** this is **not** a typical project setup (no code scaffolding, no
framework bootstrap). It is a **context setup** — it builds out the full
`context/projects/<name>/` layer (overview, coding standards, config) on the basis of which the
real project is then built afterwards.

## What

A new `feature` skill action (name TBD, e.g. `setup` or `init-project`) that scaffolds a
**new** `projects/<name>` system's entire context in one guided flow, instead of the fields
trickling in one at a time as side effects of other actions the first time they happen to touch
that system:

- `project-overview.md` — what the project is (today: created empty/thin by `load`'s scaffold
  step, filled in later by hand).
- `coding-standards.md` — how code is written in it.
- `project-config.md` — every process/policy field that's accumulating here: `Ticket System`
  (Phase 8/0007), and now `Backport` (Phase 7, backport support — see
  `context/ai-os/features/0008-backport.md`), with more likely to land over time (e.g. a
  project-level default `Workflow: trunk | branch`, so `plan` doesn't need to ask it fresh for
  every single item once a project has settled on one convention).

## Why

Today, `context/projects/<name>/project-config.md` gets its fields asked one at a time, buried
inside `load`'s scaffold step, only the first time `load` runs against a system that doesn't have
one yet. That made sense when there was exactly one field (`Ticket System`). Now that `Backport`
is landing too, and more config fields are expected to accumulate as the skill grows, onboarding a
genuinely new project has no single discoverable entry point — you only find out what you can
configure by triggering `load` and answering whatever it happens to ask that day, in whatever
order the actions were built. A dedicated setup action makes "I'm bringing a new project under
this skill" an explicit, visible step with its own place to ask every relevant question at once,
rather than an emergent side effect.

## How

Not designed yet — flagged here so it doesn't get lost, to be worked out for real with `/feature
plan` once it's actually prioritized. Rough shape to start from when that happens:

- Runs once per `projects/<name>` system, before (or as an alternative first-touch path to) its
  first `load`.
- Should not duplicate `load`'s own scaffold logic — likely `load` ends up calling the same
  underlying scaffold step this action exposes directly, rather than two separate
  implementations of "create `project-config.md` for a system that doesn't have one."
- Whatever config fields exist by the time this gets built (at minimum `Ticket System` and
  `Backport`, per above) all need a place in this flow — check
  `.claude/skills/feature/actions/load.md`'s `project-config.md` scaffold step (which defines those
  fields, `Backport` added as part of the `backport` phase) for the current field list before
  designing this for real.
