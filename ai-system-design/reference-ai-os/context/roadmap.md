# Roadmap — accepted-ideas implementation checklist

Temporary working document (agreed 2026-07-18): the order in which the accepted ideas from
`wiki/ideas/` get implemented, and how each one enters the `feature`-skill workflow. Tick items
off as they ship; retire this file once the whole sequence is done (same as the old
`feature-skill-plan.md` was retired after its last phase).

Strategy behind the order (see `wiki/ideas/` files for full detail): finish the foundation first
(1-3), then a first light real-world pass (4), then the first real project as the full battle
test (5-6), and a second real project (7) once the workflow is proven. Item 4 is the only
flexible one — it can move anywhere after item 3; item 7 is a later, independent project.

Items 8-9 are a separate **local-deployment track** (added 2026-07-25): making `ai-os` runnable
as a purely local "shell/wrapper" around projects (no networked remote for `ai-os` itself), and a
script that stands a clean local instance up. They don't come from `wiki/ideas/`; both are finalized
specs (`0013`, `0014`) under `context/ai-os/features/` and can slot in independently of 3-7.

## The sequence

- [x] **1. Feature skill consolidation** — [`wiki/ideas/feature-skill-consolidation.md`](../wiki/ideas/feature-skill-consolidation.md)
  - Single source of truth for docs (contracts only in `actions/`), remove inline fallbacks,
    shared System-resolution preamble, new read-only `status` action, fix README/wiki drift.
  - Explicitly out (decided): `current-feature.md` stays gitignored, outside the repo.
  - Enter via: `/feature plan feature feature-skill-consolidation` (system: `ai-os`).
  - Must land **first** — every later skill change is cheaper on the consolidated base.

- [x] **2. Single CLAUDE.md router** — [`wiki/ideas/single-claude-md-router.md`](../wiki/ideas/single-claude-md-router.md)
  - One root CLAUDE.md as the only router; delete the unused `.claude/memory/` scaffold; update
    every reference (CLAUDE.md, README.md); fix `wiki/index.md`'s dead `raw/` link.
  - Decided here: the empty `context/decisions.md` was deleted too — its role is covered by
    specs (decisions live in specs, never a separate log).
  - Enter via: `/feature plan chore single-claude-md-router` (system: `ai-os`). Independent of
    item 1 — can run right after it or bundled alongside.

- [ ] **3. Publish quality gate** — [`wiki/ideas/feature-skill-publish-quality-gate.md`](../wiki/ideas/feature-skill-publish-quality-gate.md)
  - `publish` refuses unless agent-run `test` + `review` passed for the work branch's current
    state. After this, the feature skill is functionally complete per Michal's definition.
  - Open decisions to settle at its plan: how "ran and passed" is recorded and invalidated
    (staleness on new commits), what "review OK" means, whether any override exists.
  - Enter via: `/feature plan feature publish-quality-gate` (system: `ai-os`). Requires item 1.

- [ ] **4. `grill-me` skill** — [`wiki/ideas/skill-grill-me.md`](../wiki/ideas/skill-grill-me.md)
  - First full run of the polished workflow (with the quality gate) on something other than the
    feature skill itself. First use: fill the empty `context/about-me.md` and
    `context/stack-and-conventions.md`.
  - Enter via: `/feature plan feature skill-grill-me` (system: `ai-os`). Flexible — may be
    deferred to the very end; nothing depends on it technically.

- [ ] **5. Project context-setup action** — [`wiki/ideas/feature-skill-project-setup-action.md`](../wiki/ideas/feature-skill-project-setup-action.md)
  - The `feature` skill action that scaffolds a new project's whole `context/projects/<name>/`
    layer in one guided flow — a **context** setup, not code scaffolding; the real project is
    built on that context afterwards.
  - Built directly before item 6 — Pensieve's onboarding is its first real client.
  - Overlaps item 9's deferred scope: the local-install feature introduces `assets/` and defers a
    project-context **assembly** script + coding-standards **templates** under
    `assets/coding-standards/` (list-and-pick) to a later feature — reconcile that with this
    action when either is planned, so they don't build two competing context-scaffolders.
  - Enter via: `/feature plan feature project-setup-action` (system: `ai-os`).

- [ ] **6. Myślodsiewnia (Pensieve)** — [`wiki/ideas/project-pensieve.md`](../wiki/ideas/project-pensieve.md)
  - First real project and the skill's full battle test: UI → upload a voice recording →
    transcription → saved note. Teaser scope.
  - Open decisions to settle at its plan: where notes land (Obsidian vault vs. dedicated
    database vs. elsewhere), stack, transcription engine, whether to start from
    `projects/angular-template`/`projects/nestjs-template`.
  - Enter via: item 5's setup action first, then `/feature plan feature <name>`
    (system: `projects/<name>`). Lessons learned feed back into the skill as
    need-driven fixes.

- [ ] **7. Tab Extractor** — [`wiki/ideas/project-tab-extractor.md`](../wiki/ideas/project-tab-extractor.md)
  - Second real project: YouTube guitar-tab video → auto-detect the tab region and scroll
    direction → stitch the scrolling tab into one image (temporal median) → export a PDF. Image
    PDF only, not editable notation. Brainstormed and captured as a seed; no stack chosen yet.
  - Open decisions to settle at its plan: stack (Python + OpenCV + yt-dlp + ffmpeg + img2pdf is
    the likely default), whether it gets a UI, and the confirm/override safety net for hard videos.
  - Enter via: item 5's setup action first, then `/feature plan feature <name>`
    (system: `projects/<name>`). Independent of items 4-6 — a later standalone project once the
    workflow is proven on Pensieve.

- [ ] **8. Local-only mode for ai-os** — [`context/ai-os/features/0013-local-only-mode.md`](ai-os/features/0013-local-only-mode.md)
  - `ai-os`'s `origin` points at a local bare repo instead of GitHub, selected by an explicit
    `Remote: github|local` field in a new `context/ai-os/project-config.md`. Git lifecycle
    unchanged; only the GitHub-PR reminders in `publish`/`backport` become manual local-merge
    reminders. Ships a personal setup runbook at `context/ai-os/local-mode-setup.md` (with a worked
    example of a local `ai-os` managing an own-repo org project).
  - Enter via: `/feature plan feature local-only-mode` (system: `ai-os`). Staged as a `plan`
    preview; finalize with `plan done`. Foundation for item 9.

- [ ] **9. Local install + (future) self-evolving updater** — [`context/ai-os/features/0014-local-install-update.md`](ai-os/features/0014-local-install-update.md)
  - `scripts/install-local.sh <target-dir>` stands up a clean local `ai-os`: empty `projects/`,
    shared "system" surface only (manifest-driven), `local` mode provisioned via item 8's runbook.
    Refactors the Projects table out of `CLAUDE.md` into `context/projects.md` (router references
    it) and introduces an `assets/` templates folder (empty projects-table template seeded on
    install). **Install now; the self-evolving update path and the `assets/coding-standards/`
    assembly work are explicitly deferred** (the latter overlaps item 5).
  - Depends on item 8. Enter via: `/feature plan feature local-install-update` (system: `ai-os`).
    Staged as a `plan` preview; finalize with `plan done`.
