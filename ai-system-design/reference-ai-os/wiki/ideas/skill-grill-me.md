# Idea: "grill me" skill

**Status:** accepted (2026-07-18), not started
**Priority:** after the `feature` skill is complete to Michal's satisfaction — the `feature` skill
is deliberately the foundation everything else (every project, every pillar) will be built on, and
it gets finished properly first, without rushing. First concrete use of this skill: filling the
empty `context/` layer (`about-me.md`, `stack-and-conventions.md`).

## What

A skill that interviews the user relentlessly about a plan/topic/process, checkpointing every
answer into a `brainstorms/<topic>.md` file so nothing gets lost to context-window rot. Only
stops when there are no gaps left.

## Why

This is how to properly capture business/domain knowledge into `wiki/` or `context/`
instead of guessing at it. Directly useful for extracting knowledge about the user's actual
businesses once we get to that.

## How

See [skill-and-agent-authoring](../notes/techniques/skill-and-agent-authoring.md) for the shape
of a skill (`SKILL.md` with YAML front matter + natural-language body).
