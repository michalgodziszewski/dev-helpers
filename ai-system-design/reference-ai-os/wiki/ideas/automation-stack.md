# Idea: Automation stack (mailbox/business)

**Status:** deferred — no concrete repeated need yet
**Priority:** 5 (only once a real, repeated need exists)

## What

Google Workspace CLI (mailbox management), Tavily (research), Modal or Claude Code Routines
(scheduled/triggered automations).

## Why not yet

Building this now would be automation in search of a problem. Governing principle: default to
the simplest deterministic solution, and don't build unsupervised automation without hard
boundaries ("prompting is not a permission layer") and without evals against a golden dataset
first.

## How, when the time comes

See [automation-stack](../notes/techniques/automation-stack.md) for the specific tools, setup
steps, and the safety lesson (hardcode destinations/endpoints in anything unsupervised).
