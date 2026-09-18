# Idea: Myślodsiewnia (Pensieve) — first real project

**Status:** accepted direction (2026-07-18), not started — waits for the `feature` skill to be
finished to Michal's satisfaction (consolidation + publish quality gate), then becomes its first
real-world battle test.

## What

The first real application built on top of the AI_System foundation, working name
**Myślodsiewnia** (Polish for "Pensieve"). Teaser scope ("zajawka"), deliberately small:

- A UI that accepts a voice recording (upload).
- The recording is transcribed.
- From the transcription, a note is produced and saved.

## Open decisions

- **Where the note lands** — not decided yet: the Obsidian vault (`wiki/`), somewhere else
  entirely, or a dedicated database of our own.
- Stack, transcription engine, and whether it starts from one of the existing templates
  (`projects/angular-template` / `projects/nestjs-template`) — all to be settled at
  `/feature plan` time.

## Why this project first

- It's the "idea mining" pillar's natural seed: capture a spoken thought → durable note.
- Building it exercises the whole foundation for real for the first time — the `feature` skill
  workflow end to end on a project that isn't the skill itself, and the context-setup action
  ([[feature-skill-project-setup-action]]) as its onboarding step.
