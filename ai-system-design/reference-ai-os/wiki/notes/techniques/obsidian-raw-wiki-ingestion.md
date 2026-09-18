# Technique: The Raw → Wiki Ingestion Pattern

This is the concrete mechanism behind
[second-brain-levels](../concepts/second-brain-levels.md) Level 2, and it is exactly the pattern
this `wiki/` folder in AI_System is now built around.

## Setup

1. Create/open an Obsidian vault folder (or, as in AI_System, a plain folder you'll later open
   in Obsidian).
2. Open that same folder in a terminal and run Claude Code there — it operates on the same files
   Obsidian visualizes.
3. Tell Claude Code to implement "my complete second brain" using the raw/wiki idea, and to
   create the `CLAUDE.md` schema for it.
4. Claude auto-creates a `raw/` folder (unprocessed source dump) and a `wiki/` folder (processed,
   linked knowledge base) — in AI_System these are `wiki/raw/` and `wiki/notes/` respectively,
   to avoid a confusing `wiki/wiki/` nesting under the existing top-level `wiki/`.
5. Install the **Obsidian Web Clipper** browser extension; in its options, change the default
   save location from "clippings" to the vault's `raw/` folder, so clipped articles land in the
   right place automatically. *(Not yet done for AI_System — see
   [obsidian-web-clipper](../../ideas/obsidian-web-clipper.md).)*
6. When a new file lands in `raw/`, tell Claude Code to "ingest" it. Claude asks clarifying
   questions (what to emphasize, granularity, purpose of the project), then splits one source
   into multiple wiki notes with cross-links/backlinks between them — one article can become
   ~10-25 linked pages (concepts, entities, people, orgs).
7. Switch Obsidian to **Graph view** to watch nodes and relationships form as ingestion happens.
8. Periodically run a health-check pass over the wiki: find inconsistent data, backfill gaps via
   web search, surface candidate new articles worth writing.

## Structural conventions

- `index.md` — top-level index of everything in the wiki (tools, sources, concepts, comparisons,
  entities, etc.)
- `log.md` — an ingestion/operation history log
- `wiki/CLAUDE.md` — explains how the vault works and how to search/extend it
- Sub-folders like `concepts/`, `comparisons/`, `sources/`, `entities/`, `analysis/`,
  `techniques/`, `platforms/` — but this should be decided **per-project**; sometimes flat with
  zero subfolders is better, don't over-organize in advance. AI_System's `wiki/notes/` only uses
  the categories that actually have content from a given source, per source, rather than
  pre-creating the full taxonomy.

## Example applications

- A **research/knowledge-tracking vault**: ingesting many articles/transcripts over time,
  organized into concepts/sources/techniques/comparisons/platforms, all cross-linked.
- A **personal/business second brain**: quarterly priorities, team notes, decisions,
  meeting-transcript summaries, support-thread summaries.

## Governing principle

Any agent, any AI can sit on top of folders and files and use them just fine — the whole system
is intentionally just markdown/text files, no proprietary format, so it survives switching tools
(Claude Code → Codex → whatever comes next). See [philosophy](../principles/philosophy.md).

## Explicit caveat

Obsidian itself is optional — the markdown files are what matters, not the app. In practice,
Obsidian is often barely opened directly; it's a nice-to-have visual layer (graph view, Smart
Lookup semantic search), not infrastructure. Don't block on setting up Obsidian before the
raw/notes files themselves are useful.

## Privacy caveat

Everything fed into this system via Claude Code is sent to Anthropic's servers unless local/
open-source models are used. Worth remembering once AI_System starts holding business- or
client-sensitive content.
