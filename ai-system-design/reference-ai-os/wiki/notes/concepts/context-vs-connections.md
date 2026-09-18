# Concept: Context vs. Connections

There's a sharp line between two kinds of information a personal AI system deals with, and they
should be stored completely differently.

## Context

Evergreen, worth keeping forever. Decisions, quarterly priorities, durable facts about you/your
business/your voice. This belongs **inside** the second brain (`context/`,
`wiki/notes/`) — it should persist and accumulate.

## Connections

Live, changing data: Slack, email, CRM records, calendars. The instruction here is: **don't
ingest this into the second brain** — instead, make sure the agent knows *how to reach it live*
(a CLI, an API, an MCP connector) rather than storing a stale snapshot of it.

## Why this matters for AI_System

The user's stated goals include mailbox management and multi-business management — both are
squarely "connections" territory. The temptation will be to dump inbox contents or business
records into `wiki/`; per this principle, that's the wrong instinct. `wiki/` should hold
*durable* facts and decisions about the businesses (structure, strategy, recurring rules), while
live data (current inbox state, live CRM records) should be reached through a tool/connector at
query time — see [automation-stack](../techniques/automation-stack.md) for how to wire those
connections (`.env` + CLI tools, preferred over OAuth "Connectors" for portability).

This also explains the optional idea of a small "hot cache" file (~500 words) of the most recent
context, used only where recency genuinely matters — some projects benefit from one, others
don't need it at all. Not implemented in AI_System yet — worth adding only if/when a specific
project's wiki needs recency, not by default.
