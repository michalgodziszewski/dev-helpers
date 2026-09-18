# Ticket Config & Naming Audit

## Git Workflow
- **Workflow:** trunk
- **Work Type:** feature
- **Jira Ticket:**
- **Base Branch:** main

## Description
This is Phase 8 of `context/feature-skill-plan.md` ("Config & naming"), rescoped now that its
first half substantially overlaps with 0005-jira-ticket-support, built ad hoc outside the original
roadmap. 0005 already added an optional `Jira Ticket` field that `plan` asks about — but it asks
**every** `projects/<name>` planning session, skippable each time, regardless of whether that
project even has a ticket system. Phase 8's original wording ("optional per-system config...
defaulted to disabled... door left open for a project that wants one") calls for a real per-project
toggle instead — so a project with no ticket system is never asked at all, not just able to skip
being asked. This spec adds that toggle, then does Phase 8's second half: a one-time audit
confirming `actions/start.md`'s branch-prefix mapping and `actions/publish.md`'s commit-type
mapping match `.claude/GUIDELINES.md` (the declared source of truth) and
`wiki/notes/skills/feature/state-model.md` (the detailed mapping table added in 0005), fixing any
drift found.

The toggle is process/workflow config, not a coding convention — it does not belong in
`coding-standards.md` (which answers "how do we write code in it"). It gets its own file,
`context/<system>/project-config.md`, alongside `project-overview.md`/`coding-standards.md` in that
system's state directory. Named generally (not `ticket-config.md`) since this is the natural place
for other per-project process/policy settings later, not just the ticket toggle — but this spec
only adds the one field it actually needs; it doesn't invent placeholder settings for hypothetical
future config. Only Jira is a real supported ticket system today (0005's scope) — this spec's
toggle is a `{ none, jira }` switch, not a generic multi-tracker config. Generalizing beyond Jira is
explicitly out of scope.

## Goals
- New per-system file `context/projects/<name>/project-config.md` (`projects/<name>` only —
  `ai-os` never gets one, same as it never gets `coding-standards.md`). Content for this spec is a
  single line: `**Ticket System:** none` or `**Ticket System:** jira`. Structured so a future spec
  can add more lines/settings to the same file without introducing a new one.
- `actions/load.md`: when a `projects/<name>` system has no `project-config.md` yet (alongside its
  existing step 5/6 that scaffolds `project-overview.md`/`coding-standards.md` on first load for
  that system), ask once whether the project uses a ticket system today (currently only Jira is
  meaningful — a yes/no is enough) and write the answer into a freshly created
  `project-config.md`. This covers both a brand-new project's first `load` and any existing
  `projects/<name>` system (`angular-template`, `nestjs-template` today) that predates this file —
  `load` is already the point where per-system scaffolding gets lazily filled in if missing, so no
  separate backfill trigger is needed elsewhere.
- `actions/plan.md`: change the Jira-ticket question (added in 0005) to read that project's
  `project-config.md` first. Ask "does this item have a Jira ticket?" only when it says `Ticket
  System: jira`; skip the question entirely — no prompt, not just a skippable one — when it says
  `none`. `ai-os` stays unaffected (no `project-config.md` exists for it, question never asked,
  unchanged from 0005).
- `wiki/notes/skills/feature/state-model.md`: add `project-config.md` to the documented per-system
  state shape (next to `project-overview.md`/`coding-standards.md`), describe its current
  one-line format and `projects/<name>`-only scope (noting it as the general home for future
  per-project process/policy settings, not ticket-specific by design), and update the `Jira
  Ticket` field's own description (written in 0005) to reflect the new gating — it's no longer
  "asked every `projects/<name>` session," it's "asked only when that project's
  `project-config.md` says `Ticket System: jira`."
- Naming audit (one-time, not a new ongoing mechanism): read `actions/start.md`'s branch-prefix
  mapping (`feature/`, `fix/`, `bugfix/`, `hotfix/`, `chore/`), `actions/publish.md`'s
  conventional-commit-type mapping (`feature`→`feat`, `fix`/`bugfix`/`hotfix`→`fix`, `chore`→
  `chore`), `.claude/GUIDELINES.md`'s Git workflow section, and `state-model.md`'s mapping table
  side by side. Fix any drift found. Record the result explicitly (even if the finding is "no
  drift found") rather than silently assuming consistency.

## Constraints
- Ticket-system value set stays `{ none, jira }` — no generic multi-tracker config (Linear, GitHub
  Issues, etc.) in this pass; that's a future extension if it's ever needed.
- `project-config.md` is its own file, never folded into `coding-standards.md` or
  `project-overview.md` — process/workflow config is a distinct concern from "how do we write
  code" or "what is this project." The file's name is general on purpose, but this spec adds only
  the `Ticket System` field to it — no other settings invented now on spec.
- `ai-os` is unaffected by any of this — it never gets a `project-config.md`, the Jira question was
  never asked for it in 0005 and stays that way.
- The naming audit is a one-time check producing fixes if needed, not a new standing mechanism
  (e.g. not added as a permanent `review.md` check) — that was explicitly decided against for this
  pass.

## References
- context/feature-skill-plan.md (Phase 8 definition)
- .claude/skills/feature/actions/load.md (project-overview.md/coding-standards.md scaffold steps,
  the new project-config.md scaffold joins them)
- .claude/skills/feature/actions/plan.md (Jira Ticket question, added in 0005)
- .claude/skills/feature/actions/start.md, .claude/skills/feature/actions/publish.md (naming
  mappings, from 0005)
- wiki/notes/skills/feature/state-model.md (per-system state shape, Jira Ticket field docs, mapping
  table, from 0005)
- .claude/GUIDELINES.md (naming source of truth)
- context/ai-os/features/0005-jira-ticket-support.md (original Jira ticket work this extends)
- context/projects/angular-template/, context/projects/nestjs-template/ (existing projects/<name>
  systems this scaffolds project-config.md for on next `load`)

## Acceptance Criteria
- A `projects/<name>` system with `project-config.md` saying `Ticket System: none` is never asked
  the Jira-ticket question at `plan`.
- A `projects/<name>` system with `project-config.md` saying `Ticket System: jira` is asked exactly
  as 0005 already built.
- `load` for any `projects/<name>` system missing `project-config.md` — new project or existing
  (`angular-template`/`nestjs-template`) — asks the ticket-system question once and creates the
  file with the answer.
- `ai-os` behavior is unchanged — never asked, no `project-config.md` involved.
- `state-model.md` documents `project-config.md` in the per-system state shape and the updated
  `Jira Ticket` gating.
- Naming audit performed and its result explicitly recorded — either "no drift found" or the drift
  that was found and fixed, in `actions/start.md`/`publish.md` vs. `GUIDELINES.md`/
  `state-model.md`.
