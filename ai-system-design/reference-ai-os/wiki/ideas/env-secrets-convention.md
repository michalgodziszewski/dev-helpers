# Idea: `.env` convention for secrets

**Status:** done — `.env` created, gitignored, documented in `CLAUDE.md`
**Priority:** 2

## What

A root `.env` file for API keys/secrets, `.gitignore`'d before the file even exists.

## Why

Every later integration (mailbox, business APIs, web search) will need somewhere to put
credentials. This should be set up *before* wiring any tool, not bolted on afterward. Preferred
over Claude's built-in OAuth "Connectors" for portability across harnesses (Claude Code → VS
Code → other tools) — see [automation-stack](../notes/techniques/automation-stack.md#secrets-convention).

## How

`touch .env`, add `.env` to root `.gitignore`, document in `CLAUDE.md` that secrets live there.
