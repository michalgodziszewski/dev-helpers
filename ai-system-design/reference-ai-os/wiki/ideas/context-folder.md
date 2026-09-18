# Idea: `context/` — evergreen context files

**Status:** done — `context/{about-me,stack-and-conventions,decisions}.md` scaffolded
**Priority:** 1 (cheapest, most foundational)

## What

Add `about-me.md`, `stack-and-conventions.md`, and an append-only `decisions.md` (dated entries)
under a repo-root `context/` folder.

## Why

Right now AI_System has nowhere to record durable facts about the user/businesses that aren't
tied to a single project. See [context-vs-connections](../notes/concepts/context-vs-connections.md)
for the "context" (durable) vs. "connections" (live data) distinction this is based on.

`context/` lives at the repo root rather than under `.claude/` deliberately: it's core to how work
gets planned and built (see [skill-feature](skill-feature.md)), not a Claude-Code-specific
mechanism — unlike `SKILL.md`/agent files, nothing about it requires living under `.claude/` for
discovery. Keeping it tool-agnostic means it survives adding another harness (e.g. Codex)
alongside Claude Code later, matching the tool-agnosticism principle in
[philosophy](../notes/principles/philosophy.md).

## How

Create the three files with minimal headers; content gets filled in over time as real
facts/decisions accumulate — don't pre-fill with guesses.

## Downstream

[skill-feature](skill-feature.md) builds its tracked, per-system workflow state under
`context/features/`, alongside this folder — it depends on this idea landing first.
