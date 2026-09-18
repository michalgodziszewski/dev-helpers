# ai-os

Michal's personal, self-growing AI system — combines development work, managing
businesses and systems, mailbox management, and idea mining under one roof.

The system is meant to grow over time toward full AI-driven automation, with
Michal staying the human gatekeeper of what enters permanent memory.

## Structure

- **`projects/`** — every real project lives here. Most are tracked directly
  in this repo; a project that needs to live as its own separate git
  repo/clone gets an explicit entry in `projects/.gitignore` instead. Projects
  don't carry their own `CLAUDE.md` — they're managed centrally, so each
  project's details live under `context/projects/<name>/` (a
  `project-overview.md` and a `coding-standards.md`) instead.
- **`.claude/`** — shared skills and agents that apply to the whole system,
  not any single project:
  - `skills/` — reusable procedures the AI can invoke
  - `agents/` — sub-agent/persona definitions
- **`context/`** — durable, deliberately-curated facts about Michal/the system
  (not auto-generated, not tied to one project) — kept at the repo root rather
  than under `.claude/` so it isn't tied to one harness.
- **`wiki/`** — an Obsidian vault, used as the last-resort fallback knowledge
  source. Start at [`wiki/index.md`](wiki/index.md), which links everything
  by category:
  - `raw/` — unprocessed source dumps
  - `notes/` — processed reference knowledge (concepts, techniques,
    principles)
  - `ideas/` — concrete proposals for what to implement next, one file per
    idea

## Core philosophy

- **CLAUDE.md as a router, not a dump** — index where to look, don't cram
  everything into one file.
- **Context engineering beats prompt engineering** — what persists in value
  is what the AI knows about Michal (business, priorities, voice), not
  clever prompting.
- **Tool-agnosticism** — everything here is plain markdown in git repos, not
  locked into any one harness or vendor, so it survives switching tools.
- **Iteration over perfection** — skills, agents, and memory are never
  "done"; every use is a chance to refine them.

See [`CLAUDE.md`](CLAUDE.md) for the full routing instructions, and
[`wiki/notes/principles/philosophy.md`](wiki/notes/principles/philosophy.md)
for the complete set of durable principles behind this system's design.
