# AI_System

Michal's personal, self-growing AI system — combines development work, managing
businesses and systems, mailbox management, and idea mining under one roof. Every
real project lives under `projects/`, most tracked directly in this repo — a
project only gets its own separate git repo/clone (ignored in
`projects/.gitignore`) when it specifically needs one — while shared skills
and agents live under `.claude/`. The system is meant to grow
over time toward full AI-driven automation.

## Where to look for things

**Router principle:** there is exactly one CLAUDE.md — this root one — and it is the
system's single router (projects never carry their own; details in the bullets below).

- **A specific project** (e.g. a company name, a specific tool/automation) →
  `projects/<project-name>/` for the code itself. Projects don't carry their own
  CLAUDE.md — the system manages them centrally, so `context/projects/<project-name>/`
  holds `project-overview.md` (what the project is, stack, commands) and
  `coding-standards.md` (its conventions) as two separate files instead. See the
  Projects table below. Check `projects/.gitignore` to see whether a given
  project is tracked here or lives as its own separate repo.
- **Skills, agents, how to work with AI, automations** →
  `.claude/` (`skills/`, `agents/`) in this directory. This applies
  to the whole system, not a single project — don't look for this in project
  files.
- **Durable, deliberately-curated facts about Michal/the system** (not tied to a
  single project, not auto-generated) → [`context/`](context/) at the repo root
  — kept out of `.claude/` on purpose so it isn't tied to one harness (Claude
  Code today, possibly another tool later). The `ai-os` system carries its own
  config here too: [`context/ai-os/project-config.md`](context/ai-os/project-config.md)
  holds its `Remote:` mode — `github` (default, networked GitHub) or `local` (a
  local bare-repo `origin`, no network) — and
  [`context/ai-os/local-mode-setup.md`](context/ai-os/local-mode-setup.md) is the
  runbook for standing local mode up.
- **How Claude should behave** (communication style, git workflow, commit/push
  rules, when to ask vs. just act) → [`.claude/GUIDELINES.md`](.claude/GUIDELINES.md).
  Applies system-wide; a project's own `coding-standards.md` may override specifics.
- **Anything else** — if you haven't found the answer in `.claude/` or in the
  relevant project folder, only then, as a last resort, check the wiki:
  [`wiki/`](wiki/) (Obsidian vault). This is the ultimate fallback knowledge
  source — reach for it last. Inside `wiki/`: `raw/` holds unprocessed source
  dumps, `notes/` holds processed reference knowledge, `ideas/` holds concrete
  proposals for what to implement next (one file per idea) — always start at
  [`wiki/index.md`](wiki/index.md), which links everything by category.

## Projects

Each project's `context/projects/<name>/` layer holds three files — `project-overview.md` (what it
is, stack, commands), `coding-standards.md` (its conventions), and `project-config.md` (ticket
system + backport settings). Projects carry no own `CLAUDE.md`; these are the sole place that
context lives.

| Project | Overview | Coding Standards | Config |
|---|---|---|---|
| [`angular-template`](projects/angular-template/) | [`project-overview.md`](context/projects/angular-template/project-overview.md) | [`coding-standards.md`](context/projects/angular-template/coding-standards.md) | [`project-config.md`](context/projects/angular-template/project-config.md) |
| [`nestjs-template`](projects/nestjs-template/) | [`project-overview.md`](context/projects/nestjs-template/project-overview.md) | [`coding-standards.md`](context/projects/nestjs-template/coding-standards.md) | [`project-config.md`](context/projects/nestjs-template/project-config.md) |

## Secrets

API keys and other secrets live in a root `.env` file, gitignored. Never put a secret in
`.claude/`, `wiki/`, or any tracked file.
