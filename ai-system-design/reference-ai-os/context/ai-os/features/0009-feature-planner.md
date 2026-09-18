# Feature Planner Agent

## Git Workflow
- **Workflow:** trunk
- **Work Type:** feature
- **Jira Ticket:**
- **Base Branch:** main

## Description
Phase 9 of `context/feature-skill-plan.md`: delegate the `plan` action's drafting step to a
dedicated `feature-planner` sub-agent, matching the Phase 5 pattern already used for
`feature-implementer`/`feature-tester`/`feature-reviewer` (built in
`context/ai-os/features/0003-delegated-agents.md`). Unlike those three, which are invoked once per
action call and report back a single summary, `plan` is inherently a multi-turn conversation (ask
one question at a time, redraft on feedback, resume later). Design decision (revised after the
first pass — spawning a brand-new agent every single turn was flagged as wasteful, re-deriving
context it had already read/discussed moments earlier): the orchestrator spawns **one**
`feature-planner` instance at the start of a planning session and keeps talking to that same
instance via `SendMessage` for every subsequent `/feature plan` turn in the same conversation,
rather than spawning fresh each time. The draft file (`context/<system>/plans/<name>.md`) is still
what the orchestrator writes after every turn and still the thing that makes a session resumable
at all — but within one continuous conversation, the running agent instance also carries its own
memory of the exchange, so it isn't re-reading `project-overview.md`/`coding-standards.md`/the
project source from zero on every turn. If a session is picked back up with no live instance to
resume (a new conversation, e.g. after `/clear`, since a spawned agent can't outlive the
conversation holding its handle), the orchestrator spawns a fresh `feature-planner`, hands it the
existing draft file content to catch up from, and that new instance becomes the one continued for
the rest of *this* conversation. The action set and spec template from Phase 2 don't otherwise
change — only who executes the
drafting: `plan status`, `plan cancel`, and `plan done` stay entirely inline (file bookkeeping —
listing, deleting, finalizing/renumbering) since none of that is "drafting." One small behavior
change rides along regardless (see below): System resolution for a *new* session now asks
explicitly instead of silently defaulting.

**Also folded into this phase:** a related gap in today's `plan` action — if `--system` is
omitted when starting a *new* planning session, the orchestrator currently defaults to `ai-os`
silently, without ever asking. Given how much correctly targeting the right project/repo matters
here, this phase closes that gap too: the orchestrator now asks explicitly ("which system is this
for — `ai-os`, or a project under `projects/`?") before doing anything else, whenever a new session
starts with no `--system` given. Once System is settled (explicit flag, or answered), everything
else about filling the spec (Description, Goals, Constraints, References, Acceptance Criteria,
Work Type, Jira ticket if applicable) is asked one question at a time as before, now via
`feature-planner` instead of inline.

**Most important design point of this phase:** `feature-planner` must work correctly for both
repo shapes a System can resolve to (`wiki/notes/skills/feature/system-resolution.md`) — not just
the simple case. For `ai-os` and tracked-in-`ai-os` projects, everything (the draft, the spec
template, `project-overview.md`/`coding-standards.md`, and the actual project source) lives in one
repo, the `ai-os` root. For an **own-repo** project, drafting a good spec means reading from *two*
separate repos at once: `context/projects/<name>/` (the draft itself, `project-overview.md`,
`coding-standards.md`, `project-config.md`) always lives in the `ai-os` repo, while the actual
project source the spec needs to reference/reason about lives in the nested repo at
`projects/<name>/`. `feature-planner` never does git operations itself either way (it has no
`Bash`) — this is purely about which filesystem roots it's given to `Read`/`Grep`/`Glob` against,
not about git/branch handling, which stays the orchestrator's job untouched.

## Goals
- Amend `actions/plan.md` step 1: when a **new** planning session starts (no active session), the
  orchestrator walks through every argument that wasn't supplied on the command line, one question
  at a time, in this order — System (new: asks `ai-os` vs. a `projects/<name>`, instead of
  silently defaulting to `ai-os`, since System gates repo-mode resolution, which gates what gets
  handed to `feature-planner`), then Work Type, then Name (both already ask-if-missing since Phase
  2 — unchanged, just now sequenced after System instead of before it). Firing bare `/feature plan`
  with nothing supplied asks all three in turn; supplying any of `--system`/work-type/name inline
  skips just that one question. Resuming an existing session never re-asks any of them — once
  chosen for a session, System/Work Type/Name are fixed for its lifetime.
- Build `.claude/agents/feature-planner.md`. On the **spawning turn** (first turn of a new
  session, or the first turn after a catch-up spawn), it's given: the resolved System, the current
  draft content of `context/<system>/plans/<name>.md` (empty for a brand-new session, populated
  for a catch-up spawn), the repo root(s) to read from, the raw user input for this turn, and —
  for `projects/<name>` only — whether `project-config.md` says `Ticket System: jira` (so it knows
  whether the Jira-ticket question is even in scope). On every **continuation turn**
  (`SendMessage` to the already-running instance), it's given only the raw user input for this
  turn — everything else is already in its own conversation memory, that's the entire point of not
  respawning. Either way, it produces an updated full draft (all sections, filled where known) plus
  exactly one next question to ask the user, or a statement that the draft is complete and ready
  for `plan done`.
- **Two-repo awareness (the most important goal here):** the orchestrator resolves repo mode
  (`projects/<name>/.git` present or not, per `system-resolution.md`) *before* delegating, exactly
  as it already does for `start`/`test`/`review`, and passes `feature-planner` the concrete
  filesystem root(s) to read from:
  - `ai-os` / tracked-in-`ai-os`: one root, the `ai-os` repo, doing double duty for both the draft
    state and the actual project source.
  - own-repo `projects/<name>`: **two** roots explicitly — the `ai-os` repo root (for
    `context/projects/<name>/plans|features|fixes/`, `project-overview.md`, `coding-standards.md`,
    `project-config.md`) and the nested repo root at `projects/<name>/` (for the actual project
    source the spec's Goals/References/Acceptance Criteria should ground themselves in). The agent
    must never assume both live under one root when own-repo mode is in play, and never guess the
    nested path — it's told explicitly, same as `feature-implementer` already is for `start`.
- Tools: `Read, Grep, Glob` only — no `Write`/`Edit`/`Bash`. The agent never writes `context/**`
  itself (matches the existing invariant that only the orchestrator writes state); it returns the
  full updated draft text, and the orchestrator is what writes it to `plans/<name>.md`.
- `model: inherit`, matching `feature-implementer`/`feature-tester` — planning quality should track
  whatever model the session is actually running, not get pinned down (unlike `feature-reviewer`,
  pinned to `sonnet` because a review pass doesn't need to move with the session).
- `color: yellow` — the one still-unused color among the four agents (`blue`/`green`/`purple`
  already taken by `feature-implementer`/`feature-tester`/`feature-reviewer`).
- Wire `actions/plan.md`'s drafting step (the `plan [<work-type>] [<name-or-description>]`
  procedure) to delegate each turn to `feature-planner`, with the existing graceful
  inline-fallback rule (run the current inline procedure directly if the agent isn't
  installed/available for this session) — matching Phase 5's delegation pattern exactly.
- Leave `plan status`, `plan cancel`, `plan done` unchanged and inline — no delegation, since
  they're file bookkeeping, not drafting.
- Update `context/feature-skill-plan.md` (mark Phase 9 done, matching the other phase sections'
  write-up style) and `SKILL.md`'s header note ("`plan` still always runs inline (no
  `feature-planner` yet — Phase 9)" — stale once this ships).
- Live-verify: run at least one real `/feature plan` session end-to-end through real `Agent`-tool
  delegation (not just inline fallback) for an `ai-os` item, confirming the spawn-once/continue-via-
  `SendMessage` handoff actually preserves continuity correctly across at least 3 turns, including
  one user correction to an earlier answer — and separately verify the catch-up path (simulate
  resuming the session with no live instance, e.g. a new conversation) correctly spawns a fresh
  instance that picks up the existing draft file without losing or contradicting anything already
  accepted.

## Constraints
- The new "which system?" question, and the reordering that puts it first, only apply to a
  session starting fresh — it never re-asks for a resumed session, never fires for an argument
  supplied inline, and doesn't change System resolution for any other action (`load`, `start`,
  etc. already require/default `--system` the same way they do today; this only touches `plan`'s
  own new-session bootstrap).
- No new state file or section — `plans/<name>.md` keeps today's Phase 2 template and location
  exactly; this phase only changes who drafts its contents.
- The orchestrator remains the sole writer under `context/**`, including
  `context/<system>/plans/*.md` — `feature-planner` returns content, never writes it directly. This
  is a hard carry-over of the same invariant already documented for
  `feature-implementer`/`feature-tester`/`feature-reviewer`.
- No turn-by-turn history/log is kept anywhere — the draft file holds only the current accepted
  state, same reasoning as `current-feature.md` having no separate History section (the
  orchestrator's own visible conversation already has that).
- Jira-ticket gating logic (`actions/plan.md` step 4) stays the orchestrator's job to resolve (read
  `project-config.md`, decide whether the question is in scope) — it's passed to `feature-planner`
  as a resolved fact for this turn, not something the agent reads `context/**` to figure out itself,
  mirroring how `project-overview.md`/`coding-standards.md` content is handed to
  `feature-implementer` rather than read by it directly.
- `feature-planner` is spawned once per planning session and continued via `SendMessage` for every
  subsequent turn in the same conversation — never respawned fresh just because another turn
  happened. A fresh spawn only ever happens at the start of a session, or as the catch-up path
  when no live instance exists to resume (new conversation picking up an existing draft file).
- The orchestrator must still be able to track which running `feature-planner` instance (if any)
  belongs to the active planning session, for the lifetime of one conversation, so it knows
  whether to `SendMessage` an existing instance or spawn a catch-up one. This tracking is ephemeral
  in-conversation bookkeeping only — it is never written into `plans/<name>.md` or any other
  tracked/gitignored file; the draft file's job is staying sufficient on its own for a cross-session
  resume, not for carrying an agent handle.
- Repo-mode resolution (checking `projects/<name>/.git`) stays the orchestrator's job, re-derived
  the same way it already is for every other action — `feature-planner` is handed the result
  (one root, or two), it never re-derives repo mode itself.
- For own-repo systems, `feature-planner` only ever reads the nested repo (`projects/<name>/`) —
  it never writes there, and never touches `context/**` in the `ai-os` repo either (per the
  orchestrator-writes-state invariant above). Both roots are read-only from the agent's
  perspective, regardless of repo mode.

## References
- context/feature-skill-plan.md (Phase 9 section)
- .claude/skills/feature/actions/plan.md
- .claude/agents/feature-implementer.md, feature-tester.md, feature-reviewer.md (existing
  delegation pattern to mirror)
- context/ai-os/features/0003-delegated-agents.md (Phase 5 spec, precedent for building agents +
  inline-fallback wiring)
- wiki/notes/skills/feature/index.md

## Acceptance Criteria
- Firing bare `/feature plan` (no arguments at all) with no active session prompts, one at a
  time and in order: which system this is for, then work type, then name — before moving on to
  Description/Goals/Constraints/etc. Supplying `--system`, work type, and/or name inline skips
  only the corresponding question(s); resuming an existing session skips all of them.
- `.claude/agents/feature-planner.md` exists: `model: inherit`, `color: yellow`,
  `tools: Read, Grep, Glob`.
- `actions/plan.md`'s drafting steps delegate to `feature-planner` per turn, with the same
  graceful inline-fallback rule as `start`/`test`/`review`; `plan status`/`plan cancel`/`plan done`
  are unchanged and stay inline.
- `SKILL.md`'s status note and `context/feature-skill-plan.md`'s Phase 9 section both reflect
  "done."
- A real end-to-end `/feature plan` session for an `ai-os` item, run via actual `Agent`-tool
  delegation with one instance spawned once and continued via `SendMessage` (not respawned per
  turn, not inline fallback), across at least 3 turns including one user correction, produces a
  spec finalized via `plan done` indistinguishable in quality/shape from one drafted inline.
- A real end-to-end `/feature plan` session for an **own-repo** `projects/<name>` item (e.g. one
  of the template projects, if either ever gains its own `.git`, or reasoned through dry-run if
  neither does by the time this ships) confirms `feature-planner` is actually handed both roots
  and correctly grounds a Reference/Goal in a real file from the nested repo, not just from the
  `ai-os` repo.
