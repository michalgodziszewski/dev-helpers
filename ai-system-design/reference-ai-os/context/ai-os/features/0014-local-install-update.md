# Local install + (future) self-evolving updater for a clean local ai-os

## Git Workflow
- **Workflow:** branch
- **Work Type:** feature
- **Jira Ticket:**
- **Base Branch:** main

## Description
Depends on the `local-only-mode` feature (`context/ai-os/plans/local-only-mode.md`),
which makes `ai-os` runnable with `origin` pointed at a local bare git repo,
selected by an explicit `Remote: github|local` field in a new
`context/ai-os/project-config.md`, and ships the setup runbook
`context/ai-os/local-mode-setup.md`. That feature defines *how a local `ai-os`
behaves*; this feature is the tooling that *stands one up* on another machine
(e.g. a work laptop that must never reach a network remote).

Standing up `ai-os` elsewhere by hand would mean copying files and manually
stripping out everything that shouldn't travel — the user's `projects/`, the secret
`.env`, the ai-os system's own dev history — then manually redoing the
`local-only-mode` bare-repo wiring. Note the target is still HIS install on another
machine: personal identity/preferences (`about-me.md`, `stack-and-conventions.md`)
are intentionally carried; what's stripped is history, secrets, projects, and
personal identity from the *shared system surface*.

**Invocation / path model — CWD is the target.** The user manually creates the
target directory (e.g. `~/elo-os`), `cd`s into it, and runs the installer BY PATH
from the source repo (e.g. `~/src/ai-os/scripts/install-local.sh`). The installer
then:
- treats the CURRENT WORKING DIRECTORY (`$PWD`) as the install TARGET — not a
  positional argument (an optional explicit override may exist, but `$PWD` is the
  default);
- derives the SOURCE from its own script location (`realpath`/`BASH_SOURCE` up to
  the source ai-os repo root), so it knows what to copy FROM.

It then PROMPTS the user to select which skills and which scripts to copy, and
automates the whole `local-only-mode` setup, so the result is a working local
instance with no manual follow-up. If `$PWD` (the target) is non-empty, the
installer refuses and exits non-zero unless an explicit `--force` opt-in is passed
(the user typically pre-creates an empty dir, but the guard stands regardless).

**Automated bare-repo setup.** The installer AUTOMATES the `local-only-mode` runbook
end-to-end: runs `git init --bare` to create the local bare repo, `git remote
set-url origin <bare-path>` (or `add` if none) to wire `origin`, seed-pushes the
initial content, and sets `Remote: local` in the target's
`context/ai-os/project-config.md`. The result is a ready local-mode `ai-os` with no
network access. **Bare-repo location default:** a SIBLING of the working tree
derived from the target's basename — target `~/elo-os` → bare repo `~/elo-os.git`,
kept OUT of the working tree — overridable via flag/prompt but not required.

**Selection model — static core + dynamically-discovered selectable categories.**
- **Always-installed structural core (static):** `CLAUDE.md` (copied verbatim — pure
  router after the refactor below), `.claude/GUIDELINES.md`, the `assets/` templates
  folder, the `context/` structure/scaffolding, and the generated `.env` and
  `.gitignore`. Fixed set.
- **Interactively-selected, dynamically-discovered categories:** **skills**
  (`.claude/skills/*`) and **scripts** (`scripts/*`). At run time the installer LISTS
  the directories' actual contents and lets the user tick which to copy, with an
  `a`/all option (Angular-CLI-installer style). The lists are DISCOVERED by reading
  the directories at run time, NOT hardcoded — a newly-added skill or script is
  offered automatically on the next run with no installer edit. `.claude/agents/` is
  copied to back whichever skills are selected. This is the refined "manifest": a
  small static core plus auto-discovered selectable categories, not a hand-listed
  inventory.

**Projects-table refactor (home repo too).** The live Projects table moves OUT of
`CLAUDE.md` into a new root-level `context/projects.md` (a projects index holding the
table), and `CLAUDE.md` REFERENCES that file instead of inlining it. Reconciled with
spec 0012's single-root-router principle: `CLAUDE.md` stays the sole router; the
table becomes referenced *data*, not a second router. After this refactor (and
de-personalization) `CLAUDE.md` carries no per-machine content, so it is copied
verbatim.

**`assets/` templates folder.** New top-level `assets/` folder holding installer
templates. First inhabitants:
- `assets/projects-table.template.md` — empty projects-table section; the installer
  seeds the target's `context/projects.md` from it (the home machine's populated
  `context/projects.md` is never copied).
- `assets/current-feature.template.md` — blank `current-feature.md`; the installer
  seeds the target's `context/**/current-feature.md` from it rather than copying the
  home machine's live (gitignored) one.

**Feature-spec template — already exists.** No new spec template needed: it's defined
in `.claude/skills/feature/actions/plan.md` and ships with the (selected) `feature`
skill.

**De-personalization (repo-wide).** The repo currently embeds the name "Michal" in
the shared surface (`CLAUDE.md`'s opening line, `README.md`, possibly
skills/agents/`GUIDELINES.md`). Personal identity is stripped from the SHARED system
surface so it is generic/shareable. This does NOT mean identity lives nowhere: it
lives ONLY in `context/about-me.md` (and `context/stack-and-conventions.md` for tech
preferences), which the installer copies 1:1 onto HIS installs. So the model is:
shared surface generic; personal identity concentrated in about-me (+ stack prefs),
carried verbatim. This audit is repo-wide and somewhat installer-independent — it
could reasonably be split into its own chore, but is captured here per the user's
instruction; it is also what makes "copy `CLAUDE.md` verbatim" valid.

**Personal-but-carried set.** `context/about-me.md` and
`context/stack-and-conventions.md` are copied 1:1 — the user's identity and technical
preferences, intentionally present on his installs (not a contradiction of
de-personalization, which targets only the shared surface).

**Manifest / not-copied split.** Never copied: `.env` (a fresh empty/placeholder one
is generated instead), all `projects/` content, the live populated
`context/projects.md` (empty one seeded from `assets/`), the live `current-feature.md`
(blank one seeded from `assets/`), everything under `context/ai-os/features|fixes|plans/`
(the ai-os dev specs — clean start), all of `context/projects/<name>/`,
`context/roadmap.md` (an explicitly temporary working file that its own header says is
retired once the accepted-ideas sequence is fully implemented — a fresh install
doesn't need it), and the entire `wiki/` Obsidian vault.

**Directory-structure nuance:** "clean start" means no historical spec *files*, not
missing directories — the install creates empty `context/ai-os/features/`, `fixes/`,
and `plans/` directories so the `feature` skill works there immediately.

**Scope note — install now, more coming.** This spec is actively being developed;
more installer refinements are expected. The self-evolving *update* mechanism
(re-running to sync new shared components, and the update channel it would pull from)
remains deferred to a future phase of this same script; only the manifest/selection
model is built now.

## Goals
- Refactor the home repo: move the live Projects table out of `CLAUDE.md` into a new
  root-level `context/projects.md`, and change `CLAUDE.md` to reference it — leaving
  `CLAUDE.md` a pure router (spec 0012 single-router principle preserved).
- Audit and strip personal-name references ("Michal") across the SHARED surface
  (`CLAUDE.md`, `README.md`, skills, agents, `GUIDELINES.md`) so it is
  generic/shareable, with personal identity concentrated in `context/about-me.md`
  (+ `context/stack-and-conventions.md` for tech prefs). (Repo-wide, largely
  installer-independent — may be cleaner as its own chore; captured here per
  instruction.)
- Introduce a top-level `assets/` folder with `assets/projects-table.template.md`
  (empty projects table) and `assets/current-feature.template.md` (blank
  current-feature).
- Provide an **interactive** bash installer at `scripts/install-local.sh` that
  installs into the CURRENT WORKING DIRECTORY (`$PWD`) as target and derives the
  SOURCE from its own script location — no positional target arg (optional override
  aside). The user pre-creates and enters the target dir, then runs the installer by
  path.
- Actively automate the `local-only-mode` setup on the target: `git init --bare`
  (default bare-repo path a `<target>.git` sibling, overridable), wire `origin`,
  seed-push, set `Remote: local` in the target's `context/ai-os/project-config.md`.
- Install the static structural core always: `CLAUDE.md` (verbatim),
  `.claude/GUIDELINES.md`, `assets/`, the `context/` scaffolding, a generated `.env`
  and `.gitignore`.
- Interactively select skills and scripts to copy, with an `a`/all option; discover
  the offered lists by reading `.claude/skills/` and `scripts/` at run time (NOT
  hardcoded). Copy `.claude/agents/` to back selected skills.
- Copy the personal-but-carried files 1:1: `context/about-me.md` and
  `context/stack-and-conventions.md`.
- Seed `context/projects.md` from `assets/projects-table.template.md` (empty) and a
  fresh `current-feature.md` from `assets/current-feature.template.md` (blank).
- Generate a fresh empty/placeholder `.env` and the `.gitignore` (with needed
  entries), never copying the home secret `.env`.
- Leave behind the not-copied set: `projects/` content, the ai-os dev specs, the live
  `context/projects.md`, `context/projects/`, `context/roadmap.md` (temporary working
  file), and `wiki/`.
- Create the empty structural directories (`context/ai-os/features/`, `fixes/`,
  `plans/`) without copying historical specs.
- Guard the target: if `$PWD` is non-empty, refuse and exit non-zero unless an
  explicit `--force` opt-in is passed.
- Register `scripts/install-local.sh`, `assets/`, and `context/projects.md` in
  `CLAUDE.md` for discovery.
- Add a `context/roadmap.md` entry for the item (on the home repo, before it retires).

## Constraints
- Target is `$PWD` at invocation (user pre-creates+enters it); source is derived from
  the installer's own script path — the installer must resolve both robustly
  (`realpath`/`BASH_SOURCE`) and never assume it was launched from the source root.
- Bootstrap starts `projects/` empty and the projects index empty.
- The installer does NOT edit `CLAUDE.md`; after the refactor + de-personalization it
  is pure router with no per-machine content, copied verbatim. Spec 0012 stays intact
  — the projects table is referenced data in `context/projects.md`.
- Skill and script selection lists are DISCOVERED at run time from the directories,
  never hardcoded; adding a new skill/script requires no installer edit.
- De-personalization targets ONLY the shared surface; personal identity is
  intentionally retained in `about-me.md` (+ `stack-and-conventions.md`) and copied
  1:1 onto his installs — this is not a contradiction.
- "Clean start" is history-free, not structure-free: the
  `context/ai-os/features|fixes|plans/` directories exist but hold no spec files.
- Secrets never travel: the home `.env` is never copied — a fresh empty/placeholder
  one is generated.
- Not copied: `projects/` content, live `context/projects.md`, live
  `current-feature.md`, the ai-os dev specs, `context/projects/`, `context/roadmap.md`
  (temporary working file, retired after the sequence), and all of `wiki/`.
- Depends on `local-only-mode`; automates that runbook rather than reimplementing the
  bare-repo semantics.
- `projects/<name>` behavior and the home machine's own `ai-os` git setup are
  unchanged aside from the `CLAUDE.md`/`context/projects.md` refactor and the
  de-personalization edits.
- **Out of scope for now (separate later features — "potem"):**
  - The self-evolving *update* path (re-running to sync new shared components, its
    idempotent re-sync semantics, and the update channel). The manifest/selection
    model built here is meant to serve it.
  - A project-context ASSEMBLY script plus coding-standards TEMPLATES under
    `assets/coding-standards/` (migrating the nestjs/angular coding-standards into
    templates), where the script lists templates and the user picks one per project.
    This feature only ESTABLISHES `assets/` with the projects-table and
    current-feature templates; `assets/` is deliberately designed to house those
    future templates.

## References
- `context/ai-os/plans/local-only-mode.md` — the dependency whose runbook the
  installer automates.
- `context/ai-os/local-mode-setup.md` — (created by the dependency) the bare-repo
  recipe automated end-to-end.
- `context/ai-os/project-config.md` — (created by the dependency) where `Remote:
  local` is written.
- `context/ai-os/features/0012-single-claude-md-router.md` — single-router principle
  the projects-table refactor is reconciled against.
- `CLAUDE.md` — refactored to reference `context/projects.md`, de-personalized, copied
  verbatim; registers installer/`assets/`/`context/projects.md`.
- `README.md` — de-personalization target.
- `.claude/skills/` — dynamically listed for interactive skill selection; feature spec
  template lives in `.claude/skills/feature/actions/plan.md` (ships with the skill).
- `.claude/agents/` — copied to back selected skills; de-personalization target.
- `.claude/GUIDELINES.md` — always-installed core; de-personalization target.
- `scripts/` — dynamically listed for script selection; home of `install-local.sh`,
  which resolves its own path to find SOURCE and reads `$PWD` for TARGET.
- `context/projects.md` — **new**; root-level projects index. Live copy not copied;
  installs get an empty seeded copy.
- `assets/projects-table.template.md`, `assets/current-feature.template.md` — **new**;
  templates the installer seeds from.
- `context/about-me.md`, `context/stack-and-conventions.md` — personal-but-carried;
  copied 1:1 onto his installs; the sole home of personal identity/preferences.
- `context/roadmap.md` — temporary working file; NOT copied; carries this item's entry
  on the home repo.
- `.gitignore` / `projects/.gitignore` — the `.gitignore` is generated on install.

## Acceptance Criteria
- Creating an empty dir, `cd`-ing into it, and running the installer by its source
  path installs a clean local `ai-os` into that dir (`$PWD`), with SOURCE correctly
  resolved from the script's own location regardless of where it was invoked from.
- After the refactor, `CLAUDE.md` no longer inlines the Projects table (it lives in
  `context/projects.md`, referenced) and carries no personal identity; it remains the
  sole router.
- A repo-wide audit leaves no personal-name references in the shared surface
  (`CLAUDE.md`, `README.md`, skills, agents, `GUIDELINES.md`); personal identity lives
  only in `about-me.md` (+ `stack-and-conventions.md`).
- The `assets/` folder exists with `projects-table.template.md` and
  `current-feature.template.md`.
- The installer runs interactively: it lists the actual contents of `.claude/skills/`
  and `scripts/` (proven by adding a new dir entry and seeing it offered without
  editing the installer), accepts per-item selection plus an `a`/all option, and copies
  exactly what was selected (agents backing selected skills included).
- After a run, the target is a working local-mode `ai-os`: `origin` points at a freshly
  `git init --bare` repo (default `<target>.git` sibling), `Remote: local` is set, the
  seed push succeeded, no network was used.
- The static core is always present: `CLAUDE.md` (verbatim-identical to source),
  `.claude/GUIDELINES.md`, `assets/`, the `context/` scaffolding, a generated
  placeholder `.env`, and a generated `.gitignore` with the needed entries.
- `context/about-me.md` and `context/stack-and-conventions.md` on the target are
  byte-for-byte copies of source.
- `context/projects.md` on the target equals the empty `assets/` template, and
  `current-feature.md` equals the blank `assets/` template — no home-machine content.
- `context/roadmap.md` is ABSENT on the target; also absent: home `.env`, `projects/`
  content, `wiki/`, `context/ai-os/features|fixes|plans/` spec files (those directories
  exist empty), `context/projects/`.
- Running in a non-empty `$PWD` refuses and exits non-zero unless `--force` is passed.
- `context/roadmap.md` (home repo) carries the entry.
