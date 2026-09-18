# Concept: Skills vs. Sub-agents

Detailed how-to for actually authoring these lives in
[skill-and-agent-authoring](../techniques/skill-and-agent-authoring.md); this note is the
conceptual distinction.

## Skills

A markdown file (`SKILL.md`) with YAML front matter (`name`, `description`) plus a natural-
language "recipe" body — a repeatable procedure, not a persona. Lives at
`.claude/skills/<skill-name>/SKILL.md`, optionally with supporting reference docs/scripts/assets
in the same folder. The front matter is what enables **progressive disclosure**: Claude Code
scans only front matter across all skills to decide relevance before reading a full body — this
is why AI_System's `.claude/skills/README.md` already asks for a `SKILL.md` per folder.

Invocable via natural language, a slash command, or automatically (description match). Skills
can call sub-agents, other skills, or scripts.

## Sub-agents

Same shape (YAML front matter + body) but stored in `.claude/agents/*.md` — a specialized
**persona**, not a procedure. Runs in a fresh, isolated context window and reports back only to
the orchestrating main session (cannot talk to other sub-agents — that requires the separate,
experimental "Agent Teams" feature). Key front-matter fields: `name`, `description` (the
trigger — keep it precise to avoid misfires), `model` (can differ from the main session, e.g.
delegate cheap work to Haiku), `tools`/`disallowed-tools` (can force read-only), allowed MCP
servers, memory scope.

## When to reach for which

- **Sub-agent**: about to produce output you'll never re-read in full, reading many files,
  repeating the same independent job, doing parallel independent work, or wanting an unbiased /
  no-shared-memory reviewer.
- **Skip a sub-agent** (do it inline or as a skill instead): steps are sequential/dependent, or
  the work needs the full conversation context.
- **Skill**: the same *procedure* recurs across contexts, regardless of persona.

## Building a skill in practice (two paths)

1. Proactively describe the desired process to Claude and have it write the skill file.
2. Do the task manually with Claude once, then say "turn what we just did into a skill."

Anthropic ships a built-in `skill-creator` slash command for this. Skills are meant to be
iterated on forever — after every run, give feedback and ask Claude to update the skill's own
markdown (it self-improves in place).

## Community sources worth drawing from

Public skill/sub-agent plugin collections exist (e.g. brainstorming/planning skill bundles,
curated sub-agent repos covering roles like API design, backend dev, GraphQL, TypeScript/SQL
specialists) — worth searching for and adapting rather than building every skill from scratch.
