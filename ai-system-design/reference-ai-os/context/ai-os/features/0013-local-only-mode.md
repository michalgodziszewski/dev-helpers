# Local-only mode for ai-os (local bare repo as origin, same lifecycle)

## Git Workflow
- **Workflow:** branch
- **Work Type:** feature
- **Jira Ticket:**
- **Base Branch:** main

## Description
Today the `feature` skill assumes the `ai-os` system's `origin` is a networked
GitHub remote: `start` runs `git fetch origin` / `git pull --ff-only origin
<Base Branch>`, `publish` pushes the work branch and points the user at a GitHub
PR, and `complete` verifies merge ancestry with `git merge-base --is-ancestor
<sha> origin/<Base Branch>`. That is the right default for how Michal runs the
system personally, and it stays the default.

Michal wants to also run `ai-os` as a local "shell/wrapper" around projects —
all skills living together in one place, used to build solutions on top of them
— in contexts (e.g. at work) where the `ai-os` repo must never reach a network
remote. The key realization: this does **not** require the lifecycle to skip git
operations. `ai-os` can still have a perfectly normal `origin` — just a **local
bare git repo on the filesystem** instead of GitHub. `git fetch` / `pull` /
`push` and `git merge-base` against that local `origin` all keep working
byte-for-byte, with no network involved. The projects `ai-os` manages
(`projects/<name>`) keep pushing their feature branches to their organization's
remotes exactly as today.

Which mode `ai-os` is in is read from an **explicit config field** — not
inferred from the `origin` URL. Since `ai-os` currently carries no
`project-config.md` (only `projects/<name>` systems do), this spec introduces
one for the `ai-os` system itself, holding a `Remote:` field (`github` default,
`local` for the bare-repo setup). `_common.md` resolves that field into the
local-vs-networked fact every action reads.

With that fact resolved, the lifecycle stays identical; the only things that
change are the steps that assume GitHub *specifically* — the "open/merge the
PR(s) on GitHub" reminders in `publish` (and `backport`), which have no meaning
against a local bare repo with no PR mechanism. In `local` mode those become a
manual merge reminder — checkout `Base Branch`, merge the work branch, push to
the local `origin` — mirroring today's manual-PR convention. The skill still
never merges `Base Branch` itself; the user keeps control, and `complete`
verifies ancestry against `origin/<Base Branch>` exactly as today.

Two kinds of deliverable are cleanly separated. **Skill behavior** (resolving the
`Remote:` field and the conditional publish/complete/backport reminders) lives in
the skill. The **setup runbook** — the literal how-to for standing local mode up
on a machine — is personal operational reference *for Michal*, not documentation
of how the skill behaves, so per the router principle in `CLAUDE.md` it lives in
`context/` (harness-agnostic curated knowledge), not in the skill and not in
`wiki/`. A `context/roadmap.md` entry rides along, but the substance is the
working feature.

## Goals
- Introduce a `context/ai-os/project-config.md` for the `ai-os` system (mirroring
  the existing `projects/<name>/project-config.md` shape), adding an explicit
  `Remote:` field — `github` (default) or `local` — documented inline in that
  file. This file is committed context and travels with the repo, so its value
  reflects how *this* clone is set up.
- Resolve that explicit `Remote:` field in `_common.md`'s System/repo-mode
  preamble into the local-vs-networked fact every action reads — never inferred
  from the `origin` URL.
- Keep the `ai-os` git lifecycle unchanged in either mode: `start`'s fetch/pull,
  `publish`'s push, and `complete`'s `merge-base --is-ancestor origin/<Base
  Branch>` all run exactly as today; in `local` mode `origin` simply points at a
  local bare repo, so those commands run with no network.
- Make only the GitHub-specific guidance conditional on the resolved mode:
  - `publish` step 5: in `local` mode, replace the "open/merge the PR(s) on
    GitHub" reminder with a manual local-merge reminder — "checkout `<Base
    Branch>`, merge the work branch, push to the local `origin`" — still
    entirely manual, the skill performing no merge itself.
  - `complete` steps 3-4: the ancestry check is unchanged; only the wording is
    reconciled so the durable record is the local `origin`'s `Base Branch`
    (`git log`) rather than a GitHub PR list.
  - `backport` steps 95-96: same treatment — a manual local-merge reminder in
    `local` mode, the GitHub-PR reminder otherwise.
- Ship the setup runbook as a new personal reference doc,
  `context/ai-os/local-mode-setup.md` (not in the skill, not in `wiki/`), with
  the literal recipe:
  1. `git init --bare <path>` — create the local bare repo.
  2. `git remote set-url origin <path>` (or `git remote add origin <path>` if
     none) — point `ai-os`'s `origin` at it.
  3. `git push -u origin main` — seed the bare repo.
  4. set `Remote: local` in `context/ai-os/project-config.md`.
  Call out the one network-touching caveat: obtaining the repo contents at work
  initially (clone-once-then-repoint, or copy files + `git init`) — after that,
  nothing leaves the machine. Include a worked **example flow**: a `local` `ai-os`
  managing an own-repo org project, showing which git operations hit the org
  remote (the code branch) vs. the local bare repo (the context branch), so the
  two-remote split is concrete.
- Point `CLAUDE.md` at the setup runbook (router discovery) and register the new
  `context/ai-os/project-config.md` there, so both are findable.
- Leave `projects/<name>` behavior completely unchanged — projects still
  fetch/push/merge against their own remotes exactly as today.
- Add a `context/roadmap.md` entry for the item.

## Constraints
- Default behavior is unchanged: with `Remote:` absent or `github`, every action
  produces identical git behavior and identical GitHub-PR guidance to today.
- Mode is read from the explicit `Remote:` config field only — never inferred
  from the `origin` URL or any other guessed remote state.
- The setup runbook is personal operational reference and lives in `context/`
  (`context/ai-os/local-mode-setup.md`), reached via `CLAUDE.md` — **not** in the
  feature skill's docs and **not** in `wiki/` (router principle). Skill-behavior
  changes stay in the skill; the two are kept separate.
- The skill **never** auto-merges `Base Branch` in any mode — merging stays a
  manual, user-controlled step (a GitHub PR for `github`, a manual local
  merge+push for `local`). `publish`/`complete`/`backport` add no automated
  merge step.
- `projects/<name>` push/pull/merge behavior must not change at all.
- `context/<system>/current-feature.md` stays gitignored regardless of mode.

## References
- `context/ai-os/project-config.md` — **new** in this spec; the `ai-os` system's
  config file carrying the documented `Remote:` field.
- `context/ai-os/local-mode-setup.md` — **new** in this spec; personal setup
  runbook for standing local mode up (the literal recipe + initial-copy caveat).
- `context/projects/nestjs-template/project-config.md` — existing
  `project-config.md` shape (`Ticket System`, `Backport`) the new config file
  mirrors.
- `.claude/skills/feature/actions/_common.md` — System / repo-mode resolution;
  where the `Remote:` field is resolved into the local-vs-networked fact.
- `.claude/skills/feature/actions/start.md` — steps 3-4 (fetch/pull/branch),
  unchanged against a local bare `origin`.
- `.claude/skills/feature/actions/publish.md` — step 5 (open/merge the PR on
  GitHub) is the main conditional step.
- `.claude/skills/feature/actions/complete.md` — steps 3-4 (`merge-base`
  ancestry + "GitHub PR list is the durable record" wording).
- `.claude/skills/feature/actions/backport.md` — steps 95-96 (manual PR on
  GitHub reminder).
- `CLAUDE.md` — router; links the setup runbook and registers the new `ai-os`
  config file for discovery.
- `context/roadmap.md` — where this item is tracked in the sequence.

## Acceptance Criteria
- Following the `context/ai-os/local-mode-setup.md` recipe from scratch yields a
  working local-mode `ai-os` (`origin` = a local bare repo, `Remote: local`) on
  which `start`/`publish`/`complete` run to completion with no network access.
- With `Remote:` absent or set to `github`, every action produces identical git
  behavior and identical GitHub-PR guidance to today — the absent-field default
  is networked/`github`.
- In `local` mode, `publish` (and `backport`) present a manual local-merge
  reminder (checkout `Base Branch`, merge, push to local `origin`) instead of a
  GitHub-PR reminder, and the skill performs no merge itself.
- `complete`'s ancestry check against `origin/<Base Branch>` is byte-for-byte
  unchanged; only its surrounding wording reflects the resolved mode.
- A `projects/<name>` work item still fetches/pushes/verifies against its own
  remote in both modes.
- The setup runbook exists at `context/ai-os/local-mode-setup.md` and is
  reachable from `CLAUDE.md`, the new `context/ai-os/project-config.md`
  documents the `Remote:` field inline, and `context/roadmap.md` carries the
  entry.
