# Concept: The 5 Levels of a Second Brain

A framework for how much infrastructure a personal knowledge system actually needs. The core
message: pick the level a given folder/use-case actually needs — don't default to the fanciest
option.

## Level 1 — Router + plain files
`CLAUDE.md` as router, plain folders/files (`context/`, `decisions/`, `projects/`). Only supports
exact-word / exact-file lookups. This is roughly where AI_System's skeleton started (root
`CLAUDE.md` + `.claude/` + `projects/`).

## Level 2 — LLM wiki
Add a `raw/` + `notes/` structure with an `index.md` and cross-linked notes (backlinks), plus
auto-memory. See [obsidian-raw-wiki-ingestion](../techniques/obsidian-raw-wiki-ingestion.md) for
the mechanics. In practice, this level is enough for most single-person projects indefinitely —
moving further is optional, not a default goal. **This is the target level for AI_System's
`wiki/` right now.**

## Level 3 — Semantic / vector search
Add embeddings + a vector DB (Pinecone, Supabase) or a plugin like Obsidian's "Smart Lookup" for
specific sub-folders where meaning-based (not exact-word) retrieval matters. Not meant to replace
markdown everywhere — decide per-folder, only where it earns its cost.

## Level 4 — Knowledge graph
A true entity-relationship graph (typed relationships, e.g. "Jordan works at Acme," "Acme is
endorsed by Postpilot") via tools like LightRAG/GraphRAG, rather than just markdown backlinks.
This makes more sense for heavy CRM / multi-client work than for a single-person content-style
setup, and isn't necessary by default.

## Level 5 — Always-on autonomous brain
Continuous, unattended ingestion/refresh of memory, with no human review step. Deliberately
avoided by default here — better to stay the human gatekeeper of what enters permanent memory,
to avoid context bloat/noise degrading answer quality. Treat this as a caution, not a goal, when
designing AI_System automations.

## Governing principle

Design storage based on how you'll query it later (a "you have to work backwards" mindset —
picture the hoop before you shoot). Different sub-folders of the same project can legitimately
sit at different levels; there's no single "correct" architecture, only "does the routing make
sense to you and your AI."

See also: [wiki index](../../index.md) for AI_System's current ideas/backlog this maps onto.
