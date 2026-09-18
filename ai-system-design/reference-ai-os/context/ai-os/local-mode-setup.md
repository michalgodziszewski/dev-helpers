# Local-mode setup for `ai-os`

Personal operational reference — how to stand up `ai-os` in **local mode**, where its `origin` is
a **local bare git repo on the filesystem** instead of a networked GitHub remote. This is not
documentation of how the `feature` skill behaves (that lives in `.claude/skills/feature/`); it's
the literal how-to for provisioning a machine. Reached from the root [`CLAUDE.md`](../../CLAUDE.md)
router.

## Why local mode exists

In some contexts (e.g. at work) the `ai-os` repo must never reach a network remote, but the whole
`feature` lifecycle should still run unchanged. The realization: this does **not** require skipping
any git operation. `ai-os` keeps a perfectly normal `origin` — just a local bare repo on disk. `git
fetch` / `pull` / `push` and `git merge-base` all keep working byte-for-byte, with no network. The
mode is a deliberate, explicit choice recorded in `context/ai-os/project-config.md`'s `Remote:`
field — never inferred from the `origin` URL.

## Recipe (from scratch)

1. **Create the local bare repo** — pick a path off the network (e.g. under your home dir), then:

   ```sh
   git init --bare /path/to/ai-os-origin.git
   ```

2. **Point `ai-os`'s `origin` at it** — from the `ai-os` working clone:

   ```sh
   git remote set-url origin /path/to/ai-os-origin.git
   # or, if the clone has no origin remote at all:
   git remote add origin /path/to/ai-os-origin.git
   ```

3. **Seed the bare repo** with your current branch (usually `main`):

   ```sh
   git push -u origin main
   ```

4. **Record the mode** — set `Remote: local` in
   [`context/ai-os/project-config.md`](project-config.md). This is the single source of truth the
   `feature` skill reads; nothing is inferred from the URL. (This file is committed and travels with
   the repo, so its value reflects how *this* clone is set up.)

After step 4, `start` / `publish` / `complete` run to completion with **no network access** — every
git command targets the local bare `origin`.

## The one network-touching caveat

Everything above is offline *except* getting the repo contents onto the work machine in the first
place. Two ways to do that initial hop:

- **Clone-once-then-repoint:** clone `ai-os` from GitHub once (the only network touch), then run the
  recipe above to repoint `origin` at the local bare repo. After the repoint, nothing leaves the
  machine.
- **Copy files + `git init`:** copy the working tree onto the machine by any offline means (USB,
  internal transfer), then `git init` a fresh repo there, commit, and follow the recipe from step 1.
  No network at all.

Either way: one initial hop to obtain the contents, and from then on the `ai-os` repo never reaches
a network.

## Worked example — a local `ai-os` managing an own-repo org project

The interesting case is a **local** `ai-os` that manages a project living in its **own** git repo on
the organization's networked remote (own-repo mode; see `.claude/skills/feature/actions/_common.md`).
Here two remotes are in play at once, and the split is worth making concrete.

Say `ai-os` is in `local` mode (`origin` = `/path/to/ai-os-origin.git`) and it manages
`projects/acme-widget`, whose nested repo has `origin` = `git@github.corp:acme/widget.git` (a
networked org remote). A `feature` work item on `--system projects/acme-widget` creates **two**
branches:

- **Code branch** — in the nested repo (`git -C projects/acme-widget`), off `Base Branch`. All its
  git operations (`fetch` / `pull` / `push` / `merge-base`) hit the **org remote over the network**,
  exactly as today. It lands via a **GitHub PR** against the org remote. This is the project's own
  nested repo on its own remote — it is **never `local`** (the `Remote:` field is a property of the
  `ai-os` repo, not of a project); a project that should be fully local is kept tracked-in-`ai-os`
  instead. This spec leaves `projects/<name>` behavior completely unchanged.
- **Context branch** — in the `ai-os` repo (at the repo root), off `Context Base Branch`. All its
  git operations hit the **local bare `ai-os` origin** — no network. Because `ai-os` is in `local`
  mode, `publish` reminds you to land it **manually**: checkout `<Context Base Branch>`, merge the
  context branch into it, and push to the local `origin`. No PR is involved; the skill merges
  nothing itself.

So a single work item drives two independent remotes: the code side reaches the org's GitHub over
the network (PR flow), while the context side stays entirely on the local disk (manual merge). The
only `Remote:` mode in play is the `ai-os` repo's — it governs the context branch (and everything
tracked-in-`ai-os`); the code branch just uses its own nested repo's remote, which stays networked
regardless. `complete` then verifies both branches' merge ancestry independently, each against its
own `origin`, exactly as in networked mode.
