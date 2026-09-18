# Plan Resume & Status Overhaul

## Git Workflow
- **Workflow:** trunk
- **Work Type:** feature
- **Jira Ticket:**
- **Base Branch:** main

## Description
Today's `plan` action (`.claude/skills/feature/actions/plan.md`) keeps only one staged preview
alive at a time per conversation, and worse, conflates "session in progress" with "file on disk":
step 1 auto-resumes directly whenever the conversation is mid-draft, and step 7 makes bare `plan`
with no name silently reattach to whatever's already under some system's `plans/` if exactly one
file exists there (or lists-and-asks if several do) — there's no way to explicitly start a second
preview alongside a first, and no dedicated command to jump back to one specific staged item by
name. This blocks planning many features ahead of time and working through them cyclically (stage
a dozen or so smaller pieces from one planning pass, then implement them one at a time later).

This phase redesigns `plan` so many staged previews can coexist under `context/<system>/plans/`
per system: `plan` always starts a brand-new session (or continues whatever's already live in
*this* conversation) instead of ever silently reattaching to a file on disk; a new `plan resume
<name>` subcommand explicitly reattaches to one named staged preview; and `plan status` becomes
the actual discovery point, listing every staged preview across every system when no session is
tracked, instead of only reporting a binary active/not-active state. Applies to both `ai-os` and
`projects/<name>` (own-repo and tracked-in-`ai-os` alike) — this is a change to the shared `plan`
action, not a per-system carve-out.

Modeled on `michalgodziszewski/dev-helpers`'s `skills/feature/actions/plan.md`, which already
solves the same problem there (always-new `plan`, a separate `plan resume <file>` subcommand,
`plan status` as the listing/discovery point, outright-rejected slug collisions) — used here as
design inspiration only. This repo's own spec template (Git Workflow/Description/Goals/
Constraints/References/Acceptance Criteria, no Scope section) and multi-system/repo-mode/
delegated-`feature-planner`-agent shape are unique to this repo and are not being replaced;
dev-helpers has no equivalent to either. Continues the phased build tracked in
`context/feature-skill-plan.md` (Phases 0–9 done) as a new phase.

## Goals
- `plan [--system <system>] [<work-type>] [<name-or-description>]` always starts a **new** session,
  or continues the session already tracked live in *this* conversation — remove today's step 7
  entirely (the "no session active and no name given resumes the most recently edited file, or
  lists-and-asks if several exist" behavior). `plan` never scans disk to auto-pick a file to resume
  just because exactly one (or a most-recent one) happens to exist.
- Reject slug collisions outright: starting a new session under a `<name>` that already has a file
  at `context/<system>/plans/<name>.md` is refused — never silently overwritten, never
  auto-suffixed. Report the collision and point at `plan resume <name>` (to continue that one) or a
  different name.
- New subcommand `plan resume <name> [--system <system>]`: explicitly reattaches this
  conversation's active session to one named staged preview.
  - Required argument — no argument shows a "nothing to resume, see `plan status`" message instead
    of guessing.
  - Resolution: if `--system` is given, resolve `<name>` only against
    `context/<system>/plans/<name>.md` (trying the literal value and a `.md`-appended variant, same
    tolerance `load` gives its own arguments). If `--system` is omitted, search every system's
    `plans/` folder for a matching name; exactly one match resumes it directly, several matches list
    them (with System) and ask which, and zero matches shows the same "nothing to resume, see `plan
    status`" message `plan resume` with no argument shows.
  - Reattaching follows the existing spawn-once/continue-via-`SendMessage` rule unchanged: if this
    conversation already has a live `feature-planner` instance tracked for that session, continue it;
    otherwise spawn a fresh one as a catch-up, handing it the file's existing content exactly as
    today's catch-up path already does (`actions/plan.md` step 5, `feature-planner`'s "Continuation
    turn"/"Spawning turn" split) — `plan resume` is a new *trigger* for that existing catch-up
    behavior, not a new drafting contract for `feature-planner` itself.
- `plan status`:
  - No session tracked: list every file under every system's `context/<system>/plans/` — path,
    title/name, work type, and which required fields (Description, at least one Goal, Work Type,
    Base Branch) are still missing — across `ai-os` and every `projects/<name>` that has any staged
    previews. This becomes the actual discovery point for "what's currently staged," replacing the
    old implicit single-file-resume behavior.
  - Session tracked: unchanged from today — show that session's own filled vs. missing sections.
- `plan cancel`/`plan done`: keep requiring an actively tracked session and refusing otherwise
  (already true today), but point the refusal message at `plan status` and `plan resume <name>`
  explicitly, since there's no longer a single obvious file to imply.
- Update `.claude/skills/feature/SKILL.md`'s action table: add a `plan resume` row, and adjust the
  `plan`/`plan status` row descriptions to match the new always-new / discovery-point behavior.
- Update `wiki/notes/skills/feature/index.md` (action index), `state-model.md`, and `scenarios.md`
  to reflect the new `plan resume` subcommand and `plan status`'s discovery role — no step-by-step
  procedure duplicated outside `actions/plan.md`, matching the doc-location convention already
  described in `context/feature-skill-plan.md`'s header note.
- Add a new phase section to `context/feature-skill-plan.md` (Phase 10, following the Phase 9
  write-up style in that file) once this ships, marking it done.

## Constraints
- Do not copy dev-helpers' template shape (its `Scope` section, its preview-marker-comment
  mechanism) — this repo's template stays Git Workflow/Description/Goals/Constraints/References/
  Acceptance Criteria as-is. Dev-helpers needs an internal marker to distinguish an in-progress
  preview from a finalized spec because both can live in the same folder there; this repo already
  gets that distinction for free from `plans/` vs. `features|fixes/` being separate folders, with
  `plan done` doing the move — no marker needed here.
- No change to `feature-planner.md`'s own contract (spawning-turn/continuation-turn shapes, what it
  reads/returns) — `plan resume` only changes *when* the existing catch-up-spawn path is triggered
  (explicitly by name, instead of implicitly by "exactly one file exists"), not what that path does.
  Don't conflate `feature-planner` with dev-helpers' `plan-research` agent — that's a different
  sub-purpose (research delegation) with no equivalent here.
- Still only one live planning session tracked per conversation at a time — this phase is about
  many previews coexisting *on disk* and being able to explicitly switch which one a conversation is
  working on, not about running multiple concurrent sessions within a single conversation.
- No change to `plan done`'s numbering/move logic, the spec template fields themselves, or the
  Jira-ticket gating rule (`actions/plan.md` step 6 / `feature-planner`'s Jira-ticket rule) — none of
  that is in scope for this phase.
- Must work identically for `ai-os` and both `projects/<name>` repo modes (own-repo and
  tracked-in-`ai-os`) — repo-mode/system resolution stays re-derived per system exactly as every
  other action already does; this phase doesn't add any dev-helpers-style single-repo shortcut.

## References
- `.claude/skills/feature/actions/plan.md` (current step 1, step 7 to remove, `plan status`/
  `plan cancel`/`plan done` sections to adjust)
- `.claude/agents/feature-planner.md` (spawning-turn/continuation-turn contract, unchanged but
  re-triggered by `plan resume`)
- `.claude/skills/feature/SKILL.md` (action table rows to update/add)
- `context/feature-skill-plan.md` (Phase 9 section as precedent for write-up style; new Phase 10
  section to add)
- `context/ai-os/features/0009-feature-planner.md` (precedent spec shape for this kind of
  plan-action-internal change)
- `wiki/notes/skills/feature/index.md`, `state-model.md`, `scenarios.md` (doc updates)
- `michalgodziszewski/dev-helpers` repo, `skills/feature/actions/plan.md` — external design
  inspiration only, not copied verbatim

## Acceptance Criteria
- `/feature plan` (bare or with any argument) always starts a new session, or continues the session
  already tracked live in this conversation — it never silently reattaches to an existing `plans/`
  file just because exactly one exists on disk; today's step-7 auto-resume behavior is gone.
- Starting a new session under a name colliding with an existing `context/<system>/plans/<name>.md`
  is rejected with a clear message, never silently overwritten or auto-suffixed.
- `/feature plan resume <name> [--system <system>]` exists and works: reattaches this conversation
  to the named staged preview, spawning a catch-up `feature-planner` instance if none is live for it
  in this conversation. No argument shows "nothing to resume, see `plan status`" instead of
  guessing.
- `/feature plan status` with no session tracked lists every staged file across every system's
  `plans/` folder (path, name, work type, missing required fields); with a session tracked, it still
  reports that session's own filled/missing fields, unchanged from today.
- `plan done`/`plan cancel` still refuse when no session is tracked, now pointing at `plan status`
  and `plan resume <name>` explicitly.
- `SKILL.md`'s action table and `wiki/notes/skills/feature/*.md` reflect the new `plan resume`
  subcommand and `plan status`'s discovery role; no step-by-step procedure duplicated outside
  `actions/plan.md`.
- `context/feature-skill-plan.md` gains a Phase 10 section marked done once this ships.
- Verified live for both `ai-os` and at least one `projects/<name>` system: multiple `plans/` files
  coexist simultaneously, `plan status` lists staged previews across systems, and `plan resume
  <name>` correctly reattaches to a specific one by name in each system.
