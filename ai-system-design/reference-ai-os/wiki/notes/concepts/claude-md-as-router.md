# Concept: CLAUDE.md as a Router, Not a Dump

The core architectural stance for `CLAUDE.md` (root level and per-project): it's the closest
thing to a system prompt, loaded automatically on every message, so it should be treated as an
**index that tells the agent where to look**, not a file that contains everything.

## What to put in it

- A role definition (e.g. "You are the user's executive assistant...")
- A **routing map**: "if you want to find things about X, go to [path]" — for business, team,
  strategy, corporate/tax/IP, voice & style, projects, research defaults (e.g. "default to
  Tavily for web search, key lives in `.env`")
- An explicit note about what does *not* need a wiki lookup (cheap, common facts vs. things
  worth a trip to the wiki)
- An **"Applied Learning"** section that gets appended to over time: one-line bullets (<15 words)
  of workarounds/failures/tool quirks discovered during use, so lessons persist across sessions
- It can be edited conversationally: "update your instructions in the CLAUDE.md so you don't do
  this again"

## Token-hygiene rule

Keep `CLAUDE.md` under roughly 200 lines. Point to bigger files rather than inlining their
content.

## Multiple tiers

- **Global** `~/.claude/CLAUDE.md` — read on every project, every machine. A good place for
  durable personal preferences that apply everywhere, e.g. an "AI phrase kill list" (banned
  AI-sounding phrases) applied to all writing.
- **Project-level** `CLAUDE.md` — scoped to one repo.
- **Private/local** tier — personal notes distinct from a shared team system prompt.
- **`agents.md`** — a duplicate kept in parallel so OpenAI's Codex CLI (which looks for
  `agents.md` instead of `CLAUDE.md`) can read the same instructions; referenced *from* the real
  CLAUDE.md via `@agents.md` to avoid duplicating content by hand. Only relevant if/when AI_System
  starts being driven by more than one harness.

## Direct relevance to AI_System

This is exactly the pattern the root `CLAUDE.md` in AI_System already follows (three-sentence
overview + a "where to look" routing section). The main addition from this note is giving
`wiki/` a real internal router (`wiki/CLAUDE.md`) so the root file doesn't need to know wiki
internals.
