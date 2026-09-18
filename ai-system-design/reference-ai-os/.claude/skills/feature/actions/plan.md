# Action: `plan` / `plan resume` / `plan status` / `plan cancel` / `plan done`

Procedure for drafting and finalizing a spec, delegating the turn-by-turn drafting itself to the
`feature-planner` agent when installed. Many staged previews can coexist under
`context/<system>/plans/` at once, across every system — `plan` always starts a new one (or
continues whatever's already live in *this* conversation), and `plan resume <name>` is the only way
to explicitly reattach to one already on disk.

## `plan [--system <system>] [<work-type>] [<name-or-description>]`

Starts a new staged preview, or continues the single planning session already tracked live in this
conversation. Never reattaches to a file on disk just because one happens to exist — that's
`plan resume`'s job (see below).

1. If a planning session is already tracked live in this conversation — this conversation is
   mid-draft, having already resolved that session's System/Work Type/Name and, per step 6, spawned
   or continued a `feature-planner` instance for it — continue it directly: never re-ask System,
   Work Type, or Name. Once chosen for a session, all three are fixed for its lifetime.
2. For a **new** session (no session tracked live in this conversation), resolve System, Work Type,
   and Name in that order, asking one question at a time and only for whatever wasn't supplied
   inline — bare `/feature plan` with nothing supplied asks all three in turn, one at a time:
   1. **System**: use `--system` if given. Otherwise ask explicitly, before anything else —
      "which system is this for — `ai-os`, or a project under `projects/`?" System gates
      repo-mode resolution and everything handed to `feature-planner` below, so it has to be
      settled first. (This previously defaulted silently to `ai-os` when `--system` was omitted;
      it no longer does.)
   2. **Work Type**: use the argument if given (`feature | bugfix | fix | hotfix | chore`).
      Otherwise ask.
   3. **Name**: a short kebab-case name. Use the argument if given (derived from it if a
      name-or-description argument was supplied instead of a bare name). Otherwise ask.
3. **Collision check** (new sessions only): once Name is resolved, check whether
   `context/<system>/plans/<name>.md` already exists. If it does, refuse outright — report the
   collision and point at `plan resume <name>` (to continue that existing preview) or a different
   Name. Never silently overwrite or auto-suffix the name. Nothing is created or written until this
   check passes.
4. Resolve repo mode for the chosen System (checking `projects/<name>/.git`, per
   [`_common.md`](_common.md)) — exactly as `start`/`test`/`review` already do, before delegating
   anything. This determines the repo root(s) `feature-planner` gets handed in step 6.
5. Create `context/<system>/plans/<name>.md` from the spec template (the literal structure is in
   [Spec template](#spec-template) below), empty, for a brand-new session (guaranteed not to already
   exist, per step 3's collision check). For a session continued via step 1, the file already exists
   and holds whatever's been drafted so far — open it, don't recreate it.
6. Drafting: delegate each turn to the `feature-planner` agent (`.claude/agents/feature-planner.md`
   — see step 7 if it's missing). Track, for the lifetime of this conversation
   only (never written to any file — pure in-conversation bookkeeping), whether a live
   `feature-planner` instance is already running for this session:
   - **No live instance tracked yet** (the first turn of a brand-new session, or a session reattached
     this conversation — via step 1 continuing it further, or via `plan resume` below — with nothing
     live for it yet, e.g. a new conversation after `/clear`): spawn one, handing it — the resolved
     System; the draft file's current content (empty for brand-new, or its actual existing content
     for a catch-up resume, so it can catch up on everything already accepted); the repo root(s) to
     read from (one root for `ai-os`/tracked-in-`ai-os`; both the AI_System repo root and the
     nested `projects/<name>/` root for own-repo — never let it assume or guess); the user's raw
     input for this turn; and, for `projects/<name>` only, whether `project-config.md` says
     `Ticket System: jira` (a resolved fact — read `project-config.md` yourself first, passing that
     `jira`-or-not fact through to `feature-planner`; omit this fact entirely for `ai-os`). When the
     ticket is asked, its expected shape is a bare key like `JIRA-123` (see the `Jira Ticket` field
     note under [Spec template](#spec-template)). Track the spawned instance as this session's live
     one.
   - **Live instance already tracked**: `SendMessage` it with only the user's raw input for this
     turn — never spawn a fresh instance just because another turn happened.
   - Either way, read back its response: the full updated draft text, plus either exactly one
     next question or a statement that the draft is ready for `plan done`. Write the draft text to
     `context/<system>/plans/<name>.md` yourself — `feature-planner` never writes this file
     itself, it only ever returns content — then relay the question (or readiness statement) to
     the user.
7. If `.claude/agents/feature-planner.md` is missing, report that the required `feature-planner`
   agent is not installed and stop — there is no inline drafting path. The agent ships with this
   repo and is always installed, so this is an error condition, not a routine branch.

Only one planning session is tracked live at a time, across all systems and across everything on
disk — the session's own `System` is fixed by whichever `--system` it started with, so
`plan status`/`plan cancel`/`plan done` never need `--system` repeated.

## `plan resume <name> [--system <system>]`

Explicitly reattaches this conversation's planning session to one named staged preview under
`plans/`. This is the *only* way to pick up a session for a file already on disk — `plan` (step 1
above) only ever continues a session already tracked live in *this* conversation, it never scans
disk to guess one.

1. No `<name>` argument: show "nothing to resume, see `plan status`" and stop — never guess.
2. Resolve `<name>` to exactly one file:
   - `--system <system>` given: resolve only against `context/<system>/plans/<name>.md`, trying the
     literal value first, then a `.md`-appended variant if the literal value doesn't exist.
   - `--system` omitted: search every system's `context/<system>/plans/` for a file matching
     `<name>` (same literal-then-`.md`-appended tolerance, applied per system).
     - Exactly one match across every system: resume it directly.
     - Several matches (same name staged under more than one system): list them, each with its
       System, and ask which one to resume.
     - Zero matches: show the same "nothing to resume, see `plan status`" message step 1 shows for
       a missing argument.
3. Once resolved to one file, this becomes the conversation's tracked planning session — its
   System, Work Type, and Name are fixed from the file's own Git Workflow section /
   filename, exactly as if `plan` had continued it (step 1 of the section above); resolve repo mode
   for its System the same way (step 4 above).
4. Reattach drafting via the same spawn-once/continue-via-`SendMessage`/catch-up-spawn machinery as
   `plan`'s own step 6, unchanged: if this conversation already has a live `feature-planner`
   instance tracked for this session, continue it via `SendMessage`; otherwise spawn a fresh one as
   a catch-up, handing it the file's existing content exactly as step 6's "no live instance tracked
   yet" branch already does. `plan resume` is a new *trigger* for that existing catch-up path, not a
   new drafting contract — `feature-planner`'s spawning-turn/continuation-turn shapes are unchanged
   (see `.claude/agents/feature-planner.md`).

## `plan status`

- If a planning session is tracked live in this conversation: show the current draft's filled vs.
  missing sections (Description, at least one Goal, Work Type, Base Branch) — unchanged from
  before this phase.
- If none is tracked: this is the discovery point. List every file under every system's
  `context/<system>/plans/` — across `ai-os` and every `projects/<name>` that has any staged
  previews — each with its path, title/name, Work Type, and which required fields (Description, at
  least one Goal, Work Type, Base Branch) are still missing. If nothing is staged anywhere, say so
  plainly. This replaces any implicit single-file-resume behavior — nothing here reattaches a
  session; use `plan resume <name>` for that.

This never delegates to `feature-planner` — it's read-only file bookkeeping, not drafting.

## `plan cancel`

Cancels the planning session tracked live in this conversation. Requires one to be tracked — refuse
otherwise, pointing at `plan status` (to see what's staged) and `plan resume <name>` (to reattach to
one of them) rather than implying any automatic recovery. Ask once whether to also delete the
preview file (destructive — matches the `.claude/GUIDELINES.md` confirmation rule for deletions) or
leave it under `plans/` for later. Also drops this conversation's tracked `feature-planner` instance
(if any) for that session — in-conversation bookkeeping only, nothing to write anywhere. This action
itself is always inline, never delegated.

## `plan done`

1. Requires a planning session tracked live in this conversation, with every required section
   filled (Description, at least one Goal, Base Branch, Work Type). Refuses and reports what's
   missing otherwise; if no session is tracked at all, point at `plan status` and
   `plan resume <name>` instead of implying any automatic recovery.
2. Assigns the next sequence number for this work type: scan `features/` (work types
   `feature`/`chore`) or `fixes/` (work types `fix`/`bugfix`/`hotfix`) for the highest existing
   `<number>-*.md`, increment, zero-pad to 4 digits (`0001`, `0002`, ...).
3. Moves the file from `plans/<name>.md` to `<features|fixes>/<number>-<name>.md`.
4. Leave the file uncommitted, for every system — `ai-os`, tracked-in-`ai-os`, and own-repo alike.
   It rides along on that item's own branch at `publish`: the shared work branch for `ai-os`/
   tracked-in-`ai-os`, or the *context* branch (created at `start`) for own-repo — see
   `actions/start.md`. Nothing ever commits directly to `main` here, for any system.
5. Ends the planning session (dropping this conversation's tracked `feature-planner` instance for
   it, if any) and suggests the exact next command:
   `/feature load <work-type> <number>-<name> [--system <system>]`.

This action itself is always inline, never delegated.

## Spec template

The literal structure `plan` (step 5) creates and `feature-planner` fills in — every spec finalized
by `plan done` under `features/` or `fixes/` follows it exactly:

```markdown
# <Feature Title>

## Git Workflow
- **Workflow:** <trunk | branch>
- **Work Type:** <feature | bugfix | fix | hotfix | chore>
- **Jira Ticket:** <ticket or empty>
- **Base Branch:** <explicit base branch — this system's own; for own-repo, the code branch's base>
- **Context Base Branch:** <own-repo only; the ai-os repo's base for the context branch — omit to default to `main`>

## Description
<Describe the problem, current behavior, and intended outcome.>

## Goals
- <Concrete implementation goal>
- <Required behavior>
- <Required tests or verification>

## Constraints
- <Technical or architectural constraint>
- <Behavior that must not change>
- <Explicitly excluded work>

## References
- <Path to a specific file relevant to this feature>
- <Another relevant file or doc>

## Acceptance Criteria
- <Observable condition proving the feature works>
- <Required command or test passes>
- <Failure and edge-case behavior is verified>
```

Field notes (the field-shape contract; the *effects* of these fields live with the actions that act
on them, not restated here):

- **`Jira Ticket`** is optional and free-form — a bare ticket key like `JIRA-123` is the expected
  shape. It is spliced verbatim into branch names at `start` and into commit prefixes at `publish`,
  so it must avoid spaces and slashes; it is never validated, and there is no real Jira integration
  (no API calls, no status sync). Leaving it blank produces byte-identical branch/commit naming to
  a spec without the field. It is only ever asked for `projects/<name>` sessions whose
  `project-config.md` says `Ticket System: jira`, never for `ai-os`. See `actions/start.md`
  (branch naming) and `actions/publish.md` (commit prefix + Work Type → conventional-commit-type
  mapping) for what it drives.
- **`Base Branch`** is never a hardcoded assumption for any system, `ai-os` included — `main` is
  only the *default* when the field is omitted; a work item may declare any base explicitly.
  **`Context Base Branch`** follows the same rule for own-repo systems, also defaulting to `main`.
