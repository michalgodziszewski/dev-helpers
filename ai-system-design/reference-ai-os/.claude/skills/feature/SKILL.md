---
name: feature
description: Use for the Git workflow lifecycle of a piece of work in this repo — planning a spec, loading it as the active work item, implementing it on a branch, and publishing it. Triggers on "/feature", "plan a feature", "load the feature", "start the feature", "publish the feature", or requests to track work-in-progress state for a change to AI_System.
---

# `feature` skill

Orchestrator-led Git workflow for a single work item at a time **per system**. `System` resolves
to `ai-os` (default, this repo's root) or `projects/<name>` (a project under `projects/`, repo
mode auto-detected). The skill itself owns every state-mutating step directly — git branch
creation, commits, pushes, and every write under `context/<system>/` — and is the only
thing that ever writes that state.

Each action's step-by-step procedure lives in its own file under
[`actions/`](actions/) — read the matching file before running that action for the first time in a
session.

All actions below are implemented and available; `plan`/`start`/`test`/`review` delegate to
[`.claude/agents/`](../../agents/) (`feature-planner`/`feature-implementer`/`feature-tester`/
`feature-reviewer`), which ship with this repo and are always installed — an action reports and
stops if its agent file is missing rather than running a second inline path. `feature-planner` is
spawned once per planning session and continued via `SendMessage` for later turns, rather than
respawned every turn. `plan` always starts a new session (or continues the one tracked live in the
current conversation) and `plan resume <name>` explicitly reattaches to a specific staged preview
by name — many previews can coexist under `context/<system>/plans/` at once. Own-repo systems get
two branches (code in the nested repo, context in the
`ai-os` repo); every other system stays single-branch, always.

## Actions

Every action below accepts an optional `--system <system>` argument (`ai-os` is the default when
omitted).

| Action | What it does | Procedure | Status |
|---|---|---|---|
| `plan [--system <system>] [<work-type>] [<name-or-description>]` | Start a new staged spec preview, or continue the session tracked live in this conversation | [`actions/plan.md`](actions/plan.md) | Available |
| `plan resume <name> [--system <system>]` | Explicitly reattach this conversation to one named staged preview | [`actions/plan.md`](actions/plan.md) | Available |
| `plan status` | Show the tracked session's missing fields, or (discovery point) list every staged preview across every system | [`actions/plan.md`](actions/plan.md) | Available |
| `plan cancel` | Cancel the active planning session, optionally delete its preview file | [`actions/plan.md`](actions/plan.md) | Available |
| `plan done` | Finalize the active preview into a numbered spec under `features/` or `fixes/` | [`actions/plan.md`](actions/plan.md) | Available |
| `load <work-type> <number>-<name> [--system <system>]` | Load a finalized spec as the active work item | [`actions/load.md`](actions/load.md) | Available |
| `start [--system <system>]` | Create the work branch and implement the spec's Goals | [`actions/start.md`](actions/start.md) | Available |
| `publish [--system <system>]` | Commit and push the work branch (single combined approval) | [`actions/publish.md`](actions/publish.md) | Available |
| `clear [--system <system>]` | Park a `Published` active item in Pending Reviews, freeing the slot | [`actions/clear.md`](actions/clear.md) | Available |
| `complete [<work-branch>] [--system <system>]` | Verify merge (and backport merge, when present), discard the entry, free the slot | [`actions/complete.md`](actions/complete.md) | Available |
| `abandon [--discard] [<work-branch>] [--system <system>]` | Reset a not-yet-published/backported active slot to Idle, or remove one exact Pending Reviews entry, optionally deleting branches | [`actions/abandon.md`](actions/abandon.md) | Available |
| `backport <release-branch> [<work-branch>] [--system <system>]` | Cherry-pick a merged fix's commits onto an already-cut release branch via an intermediate branch | [`actions/backport.md`](actions/backport.md) | Available |
| `test [--system <system>]` | Run the system's real lint/type-check/test/build checks | [`actions/test.md`](actions/test.md) | Available |
| `review [--system <system>]` | Code-quality pass against the loaded Goals | [`actions/review.md`](actions/review.md) | Available |
| `status [--system <system>]` | Read-only overview across every system: each active slot, all Pending Reviews, all staged previews | [`actions/status.md`](actions/status.md) | Available |

Only one work item can be active at a time **per system** (`context/<system>/current-feature.md`).
Use `clear`/`complete`/`abandon` to free that system's slot — see the matching `actions/*.md` for
which one applies. A busy `ai-os` slot never blocks a `projects/<name>` item and vice versa.
