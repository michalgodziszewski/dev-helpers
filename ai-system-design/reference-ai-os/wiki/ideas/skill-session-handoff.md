# Idea: "session handoff" skill

**Status:** done — `.claude/skills/session-handoff/SKILL.md`
**Priority:** 3

## What

A skill that summarizes an entire session (decisions locked, what shipped, key files, open
questions, "pick up here") into a paste-able block, used together with `/clear` to reset context
without losing continuity.

## Why

Solves context-window rot on long sessions — a lighter, earlier-triggered alternative to relying
on the built-in `/compact`.

## How

See [skill-and-agent-authoring](../notes/techniques/skill-and-agent-authoring.md) for the shape
of a skill (`SKILL.md` with YAML front matter + natural-language body).
