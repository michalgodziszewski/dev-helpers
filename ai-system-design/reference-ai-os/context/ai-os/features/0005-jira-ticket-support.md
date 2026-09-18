# Jira Ticket Support

## Git Workflow
- **Workflow:** trunk
- **Work Type:** feature
- **Jira Ticket:**
- **Base Branch:** main

## Description
The spec template (`wiki/notes/skills/feature/state-model.md`) already carries a `Jira Ticket`
field — "stays empty for ai-os (no ticket system today) — the field exists for a future project
that has one" — but nothing reads it yet. `actions/start.md` names branches purely
`<work-type>/<name>`, and `actions/publish.md` builds commit messages with no notion of a ticket
at all. This closes that gap: when a `projects/<name>` spec has `Jira Ticket` filled in, `start`
and `publish` fold it into branch and commit naming; when it's left blank (the default, and
always the case for `ai-os`), naming is byte-identical to today.

Scope decision: Jira support is for `projects/<name>` systems only. `ai-os` itself never carries a
ticket — `.claude/GUIDELINES.md` already states "AI_System repos are trunk-based on `main` — no
Jira..." for this repo's own work, and that stays true and unmodified in meaning; this work adds a
cross-reference there so the split (no Jira for `ai-os`, optional Jira for projects) isn't a
surprise when someone reads it next to a `projects/<name>` item that does have one.

Commit prefix uses this repo's actual conventional-commit types, not the work-type word: existing
history uses `feat:`/`fix:`/`chore:` (e.g. `feat: resolve dual-branch base handling...`), never
`feature:` — that word is the *branch* prefix only. This work formalizes the work-type → commit
prefix mapping (`feature` → `feat`, `fix`/`bugfix`/`hotfix` → `fix`, `chore` → `chore`) as part of
wiring in the ticket, since `publish.md` needs it explicitly to build `<type>: [<TICKET>] -
<message>`.

## Goals
- `actions/plan.md`: for `System: projects/<name>` only (never `ai-os`), add `Jira Ticket` to the
  set of things a planning session asks about — one focused, explicitly optional question ("does
  this item have a Jira ticket? leave blank to skip"), asked once per session, same interactive
  cadence as `Description`/`Goals`/etc. Skipping leaves it blank, same as today. This is the actual
  gap: the field already exists in the template, but nothing currently prompts for it, so it would
  otherwise only ever get filled if the user volunteers it unprompted.
- `actions/start.md`: when building the work branch name (and, for own-repo, the code branch and
  context branch names), read `Jira Ticket` from the loaded spec. If set, branch names become
  `<work-type>/<TICKET>-<name>` (code branch) and `<work-type>/<TICKET>-<name>-context` (context
  branch, own-repo only) instead of `<work-type>/<name>` / `<work-type>/<name>-context`. If blank,
  naming is unchanged from today.
- `actions/publish.md`: when proposing/building commit messages for a branch whose spec has `Jira
  Ticket` set, use `<type>: [<TICKET>] - <rest of message>`, where `<type>` is the work-type's
  conventional-commit abbreviation (`feature`→`feat`, `fix`/`bugfix`/`hotfix`→`fix`, `chore`→
  `chore`). Applies to every commit on every branch touched by that publish (both code and context
  branches for own-repo, same ticket). If `Jira Ticket` is blank, commit messages are built exactly
  as today (no `[TICKET]` infix).
- Document the work-type → conventional-commit-type mapping explicitly (it's inferred from history
  today, not written anywhere) — add it to `wiki/notes/skills/feature/state-model.md` next to the
  spec template, since `publish.md` now depends on it directly rather than each publish improvising
  it.
- Update `wiki/notes/skills/feature/state-model.md`'s `Jira Ticket` field description: replace
  "exists for a future project" with how it actually drives `start`/`publish` once a project sets
  one, and that it stays blank (never asked, never required) for `ai-os`.
- Add a short cross-reference in `.claude/GUIDELINES.md`'s Git workflow section: the "no Jira"
  statement is about `ai-os`'s own work items specifically; `projects/<name>` items may optionally
  carry one via the spec's `Jira Ticket` field, which changes branch/commit naming — see the
  `feature` skill docs.

## Constraints
- `ai-os` work items never populate `Jira Ticket` — the field stays blank for `ai-os`, no
  exceptions, matching `.claude/GUIDELINES.md`'s existing "no Jira" statement for this repo.
- `Jira Ticket` stays optional at `plan done` — it is not added to the set of fields required to
  finalize a spec (`Description`, at least one `Goal`, `Base Branch`, `Work Type`). Omitting it
  must reproduce today's branch/commit naming exactly.
- No real Jira integration — no API calls, no ticket-existence validation, no status sync. The
  field is a free-form string typed into the spec, used only for branch/commit string
  construction.
- The work-type → branch-prefix mapping (`feature/`, `fix/`, `bugfix/`, `hotfix/`, `chore/`)
  is unchanged; only the separate conventional-commit-type mapping used for the *commit* prefix is
  newly formalized.
- Own-repo's context branch gets the same ticket infix as its code branch (one ticket governs both
  halves of a single work item) — not treated as an independent per-branch choice.

## References
- wiki/notes/skills/feature/state-model.md (spec template's `Jira Ticket` field, currently
  undocumented behavior)
- .claude/skills/feature/actions/start.md (branch creation steps 3 and 4)
- .claude/skills/feature/actions/publish.md (commit message construction, step 2)
- .claude/GUIDELINES.md (Git workflow, Commits and pushes sections)
- context/ai-os/features/0004-dual-branch-base-resolution.md (precedent for own-repo's two-branch
  naming this extends)

## Acceptance Criteria
- Starting a `plan` for a `projects/<name>` item prompts, once, whether it has a Jira ticket
  (skippable); starting a `plan` for `ai-os` never asks.
- A `projects/<name>` spec with `Jira Ticket: JIRA-123` produces work branch
  `feature/JIRA-123-<name>` at `start` (and, for own-repo, code branch
  `feature/JIRA-123-<name>` + context branch `feature/JIRA-123-<name>-context`).
- `publish` for that item proposes/commits messages formatted `feat: [JIRA-123] - <message>` (or
  `fix:`/`chore:` per work type) for every commit on every branch touched.
- A spec with `Jira Ticket` left blank produces branch/commit naming identical to today's
  behavior — verified against an existing spec (e.g. re-reasoning through
  0004-dual-branch-base-resolution's own branch/commit names, unaffected by this change).
- `ai-os` specs never populate `Jira Ticket`; `.claude/GUIDELINES.md`'s "no Jira" line for `ai-os`
  remains accurate.
- `wiki/notes/skills/feature/state-model.md` documents the field's real behavior and the work-type
  → commit-prefix mapping; `.claude/GUIDELINES.md` cross-references the projects-only exception —
  no stale "future project" wording left anywhere.
