# Multi-System Resolution

## Git Workflow
- **Workflow:** trunk
- **Work Type:** feature
- **Jira Ticket:**
- **Base Branch:** main

## Description
The `feature` skill currently hardcodes `System: ai-os` everywhere (Phase 2/3). Per
`context/feature-skill-plan.md`'s "Multi-system targeting" section, every action should resolve
an explicit `System` argument — `ai-os` (default, the repo root) or `projects/<name>` — so the
skill can manage work in any project under `projects/`, not just the root repo itself. Repo mode
(tracked-in-`ai-os` vs. the project's own separate git repo) must be auto-detected by checking for
`projects/<name>/.git`, never asked or guessed.

Doing this work surfaced a filing problem: the per-action step-by-step procedures had nowhere
proper to live. They started out in the wiki doc (following the Phase 2/3 precedent), but that
conflates two different things the wiki is supposed to keep separate: documentation of how the
skill works vs. the operational procedure an agent actually executes. This spec now also splits
those apart: each action's step-by-step procedure moves into its own file under
`.claude/skills/feature/actions/`, `SKILL.md` stays a lean index pointing into that folder, and
the wiki doc holds pure documentation (concepts, state model, scenarios, troubleshooting — no
step-by-step procedures), itself split across a few topic files under
`wiki/notes/skills/feature/` rather than one long one. This is filing, not delegation — actions
still run inline in the same session; wiring these files up to dedicated sub-agents is still
Phase 5.

## Goals
- Every action (`plan`, `load`, `start`, `publish`, `clear`, `complete`, `abandon`) accepts/
  resolves an explicit `System` argument: `ai-os` (default when omitted at the repo root) or
  `projects/<name>`.
- Repo-mode detection: no `projects/<name>/.git` → git operations run against the `ai-os` repo
  root, scoped to files under `projects/<name>/` (same as `System: ai-os` today). `projects/
  <name>/.git` present → git operations run against that nested repo (`git -C projects/<name>`);
  `load` fails clearly (does not scaffold) if that repo has no `origin` remote.
- State paths become system-scoped: `context/features/projects/<name>/{project-overview.md,
  plans/,features/,fixes/}` tracked in the `ai-os` repo either way; `current-feature.md` gitignored
  either way, per Phase 3.
- `project-overview.md` scaffolding happens per system on first `load` for that system — for a
  project repo this should hold real content (stack, structure, commands, conventions), not the
  `ai-os` thin-pointer shape.
- All git operations (fetch/checkout/pull/branch/commit/push) run against the resolved repo root
  for that system's repo mode, never an assumed cwd.
- Split each action's step-by-step procedure out of the wiki doc into its own file under
  `.claude/skills/feature/actions/` (`plan.md` covering `plan`/`plan status`/`plan cancel`/
  `plan done`, then `load.md`, `start.md`, `publish.md`, `clear.md`, `complete.md`, `abandon.md`).
  `SKILL.md` becomes a lean index (name/description/action table pointing into `actions/`).
- Rewrite `wiki/notes/skills/feature/` as pure documentation, split across topic files rather than
  one long doc: `index.md` (overview, how it's wired, action index), `state-model.md` (state file
  shapes, spec template), `system-resolution.md` (system resolution/repo mode concepts),
  `scenarios.md` (worked examples), `troubleshooting.md` — with no step-by-step procedures
  duplicated from `actions/`.

## Constraints
- `System: ai-os` behavior must not change/regress — it's the first row of the same table, not a
  special case.
- This is file-level separation only — no actual sub-agent delegation (Task-based hand-off) yet;
  `actions/*.md` still run inline in the orchestrating session. Real sub-agents, `test`, `review`,
  `backport` stay Phase 5/6.
- No ticket/config system — still out of scope (Phase 7).

## References
- context/feature-skill-plan.md (Architecture > Multi-system targeting, Repo mode sections; Phase
  4 build notes; "Documentation location once built" note — now superseded by this spec's Goals)
- wiki/notes/skills/feature/index.md
- .claude/skills/feature/SKILL.md
- projects/.gitignore

## Acceptance Criteria
- `.claude/skills/feature/actions/{plan,load,start,publish,clear,complete,abandon}.md` exist, each
  holding that action's step-by-step procedure; `SKILL.md` is a lean index with no step-by-step
  detail of its own; `wiki/notes/skills/feature/` is split into `index.md`, `state-model.md`,
  `system-resolution.md`, `scenarios.md`, `troubleshooting.md`, none of which contain a
  step-by-step procedure duplicated from `actions/`.
- `System: ai-os` (default) behaves identically to Phase 3 — no regression.
- A throwaway placeholder, `projects/_test-project/` (tracked-in-`ai-os` mode, no nested `.git`),
  is scaffolded to verify the `projects/<name>` path for real: `load feature <spec> --system
  projects/_test-project` creates `context/features/projects/_test-project/` correctly, `start`
  creates a branch and scopes work under `projects/_test-project/`, `publish` pushes/commits
  correctly scoped to the `ai-os` repo. Removed (both the placeholder and its
  `context/features/projects/_test-project/` state) once verified — this spec's own work item
  does not use it as its real deliverable.
- The own-repo branch (`projects/<name>/.git` present, `origin` validation) is verified by
  code-review/dry-run reasoning only — actually cloning a second real git repo under `projects/`
  just for this test is out of scope; defer live verification of that branch to whenever the
  first real own-repo project shows up.
