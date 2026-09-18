# Action: `load`

`load <work-type> <number>-<name> [--system <system>]`

Loads a finalized spec as the active work item for a system.

1. Resolve `System` (default `ai-os`) and its repo mode per [`_common.md`](_common.md). Own-repo
   mode with no `origin` remote: refuse immediately — do not scaffold anything for this system.
2. Refuses if `context/<system>/current-feature.md` already has an active item for this
   system (any Status other than absent/Idle) — report what's active and that
   `clear`/`complete`/`abandon` (whichever applies) needs to free that system's slot first. Other
   systems' slots are unaffected.
3. Reads `context/<system>/<features|fixes>/<number>-<name>.md` (fails clearly if
   missing).
4. Writes `context/<system>/current-feature.md`: System `<system>`, Workflow/Work
   Type/Base Branch copied from the spec's Git Workflow section, Source Spec set to the spec's
   path, Status `Not Started`. For an own-repo system, also copies `Context Base Branch` from the
   spec (defaulting to `main` if the spec omits it).
5. Creates `context/<system>/project-overview.md` if it doesn't exist yet for this system:
   - `ai-os`: thin pointer to root `CLAUDE.md`/`README.md`.
   - `projects/<name>`: authored directly — what the project is, its stack, structure, and
     commands. Projects don't carry their own `CLAUDE.md`; this file is the sole place that
     overview content lives, ask the user for the specifics if they aren't already known.
6. For a `projects/<name>` system, also creates `context/<system>/coding-standards.md` if it
   doesn't exist yet — that project's coding conventions, kept separate from
   `project-overview.md` (one file answers "what is this project," the other "how do we write
   code in it"). `project-overview.md` links to it. `ai-os` has no equivalent file — its
   conventions live in `.claude/GUIDELINES.md`/`context/stack-and-conventions.md`.
7. For a `projects/<name>` system, also creates `context/<system>/project-config.md` if it
   doesn't exist yet: ask once whether the project uses a ticket system today (currently only
   Jira is meaningful, so frame it as a yes/no — "does this project use Jira?"), then ask once
   whether this project cuts release branches that `backport` should be able to target (frame it
   as a yes/no — "does this project use release branches you'd want fixes backported onto?
   default: no"), then write both answers, one field per line: `**Ticket System:** none` or
   `**Ticket System:** jira`, and `**Backport:** disabled` or `**Backport:** enabled` (defaulting
   to `disabled` on a no or a blank answer). This same branch covers both a brand-new project's
   first `load` and an existing `projects/<name>` system that predates this file — either way,
   "doesn't exist yet" (the file, as a whole) is the trigger. `ai-os` has no equivalent file and is
   never asked either question.

   The trigger is the file's existence, not any individual field's: an already-existing
   `project-config.md` that predates the `Backport` field (e.g. one scaffolded before this field
   was added, holding only `Ticket System`) is **not** backfilled, re-asked about, or touched in any
   way by `load` — it's left exactly as it is, missing field and all. This is deliberately safe
   because a missing `Backport` field already has a defined meaning everywhere it's read
   (`actions/backport.md` treats it identically to an explicit `disabled`): the project simply
   hasn't opted in yet. If that project later wants `backport` enabled, edit `project-config.md`
   directly and add the line — there's no dedicated action for editing an existing
   `project-config.md`, same as there isn't one for `Ticket System` today.
8. Leaves the new `project-overview.md`/`coding-standards.md`/`project-config.md` uncommitted, for
   every system — same as `plan done`'s spec file (see `actions/plan.md`). For own-repo, they ride
   along on the context branch `start` creates; there is no immediate commit to `main` for any
   system. `current-feature.md` itself is gitignored either way, so it's never committed at all.
