# Shared: System and repo-mode resolution

Not an action — a shared include every `actions/*.md` references at its first step ("resolve
`System` (default `ai-os`) and its repo mode per `_common.md`") instead of restating it. The `_`
prefix marks it as an include, so it stays out of `SKILL.md`'s action table. This is the single
copy of the resolution procedure; actions point here rather than paraphrasing it back in.

## System

Every action accepts an optional `--system <system>` argument:

- **`ai-os`** — the default when `--system` is omitted. Resolves to the AI_System repo root.
- **`projects/<name>`** — a project under `projects/`. Repo mode (below) is resolved automatically.

`ai-os` is not a special case bolted on top — it's the first, default row of the same table every
project uses: the same context-folder shape (`context/<system>/...`), the same actions, the same
lifecycle. Passing `--system` explicitly is always safe, including for `ai-os`.

## Repo mode

Only relevant when `System` is `projects/<name>` — `ai-os` always resolves to the AI_System repo
root and never uses `git -C`. Detected by checking for `projects/<name>/.git` on the filesystem —
never asked, never guessed, never read from a config file. Re-derived the same way on every action
against that system (not cached in `current-feature.md`), since it's a cheap filesystem check and a
project could gain its own repo between actions.

- **No `projects/<name>/.git`** (tracked-in-`ai-os`, the default — see `projects/.gitignore`): all
  git operations (fetch/checkout/pull/branch/commit/push) run against the AI_System repo root
  exactly as for `System: ai-os`, with implementation work scoped to files under `projects/<name>/`.
  State under `context/projects/<name>/` is committed as part of the same work branch.
- **`projects/<name>/.git` present** (own repo): all git operations run against that nested repo via
  `git -C projects/<name> ...`, never the AI_System repo root. `load` fails clearly — it does not
  scaffold `project-overview.md`, `coding-standards.md`, or `current-feature.md` — if that repo has
  no `origin` remote; this is a hard stop, not a prompt to add one. State under
  `context/projects/<name>/` still lives in the `ai-os` repo either way (it's tracked context about
  the work, not the work itself), even though the actual branch/commits live in the nested repo.

`Base Branch` (from the loaded spec) is what every git step actually checks out/pulls/pushes
against — **never** a hardcoded `main`, for any system, `ai-os` included. `main` is only ever the
default when the field is omitted; every work item declares its own `Base Branch` explicitly.

## Remote mode

`Remote:` describes the **AI_System repo itself** — whether *its* `origin` is a **networked**
GitHub remote or a **local** bare git repo on the filesystem. It is a property of that one repo, not
of a `--system`, so it is read **only** from the `Remote:` field of
`context/ai-os/project-config.md` — never per-project, never inferred from any `origin` URL, never
guessed from remote state:

- `Remote: github`, the field absent, or that file missing ⇒ **networked** (the default). A true
  no-op relative to always: identical git behavior, identical GitHub-PR guidance.
- `Remote: local` ⇒ **local**: `origin` is a local bare repo, so every git command
  (fetch/pull/push/`merge-base`) against the AI_System repo runs byte-for-byte identically, just
  with no network.

This one fact changes **only** GitHub-PR-specific *guidance wording* — the manual-merge reminders in
`publish`/`backport` and the durable-record wording in `complete` — never a git command, a branch,
or the never-auto-merge rule: merging `Base Branch` stays manual and user-controlled in both modes.
It governs every git operation that runs **against the AI_System repo**, and nothing else:

- `System: ai-os`'s own work, and every **tracked-in-`ai-os`** project (code and context share the
  AI_System repo — see below), follow this mode wholesale. A tracked-in-`ai-os` project never has
  its own `Remote`; it *is* the AI_System repo, so `ai-os`'s mode is the only one that applies.
- For **own-repo** projects (two branches, defined in `## Own-repo needs two branches, not one`
  below) only the **context branch** lives in the AI_System repo, so only it follows this mode. The
  **code branch** lives in the project's *own* nested repo with its own remote — this spec never
  touches it (`projects/<name>` push/pull is unchanged), so it stays whatever that repo already is:
  in practice its org's networked GitHub remote. An own-repo project is therefore **never `local` on
  its code side**; a project that should be fully local is kept tracked-in-`ai-os` instead. So a
  local `ai-os` managing an org project points the code branch at a GitHub PR and the context branch
  at a manual local merge — see `context/ai-os/local-mode-setup.md` for the worked two-remote
  example.

## Own-repo needs two branches, not one

Tracked-in-`ai-os` mode shares one branch between code and `context/` because they live in the same
repo — the spec and the implementation commit together, same branch, same PR. Own-repo mode can't
do that: `context/projects/<name>/` state lives in the `ai-os` repo, but the actual code lives in a
completely different repo, so there's no branch the two could ever share.

That doesn't mean `context/` skips branching, though — **nothing lands on `main` outside a feature
branch, no exceptions, for any system.** So own-repo systems get a real second branch instead: the
**context branch**, created in the `ai-os` repo off `Context Base Branch` (a spec field, own-repo
only, defaulting to `main`), alongside the **code branch** created in the nested repo off `Base
Branch`. Whichever action creates a new tracked file under `context/projects/<name>/` (`plan done`
finalizing the spec, `load` scaffolding `project-overview.md`/`coding-standards.md`) leaves it
uncommitted in the `ai-os` working tree — exactly like tracked-in-`ai-os` mode already does — until
`start` creates the context branch and `publish` commits it there. `publish` is a single combined
approval covering both branches; `complete` verifies both branches' merge ancestry independently.
See [`start.md`](start.md), [`publish.md`](publish.md), and [`complete.md`](complete.md) for the
exact steps.
