# Single CLAUDE.md Router

## Git Workflow
- **Workflow:** trunk
- **Work Type:** chore
- **Jira Ticket:**
- **Base Branch:** main

## Description

Roadmap item 2. Cleanup and documentation-routing chore that establishes exactly one
CLAUDE.md — the root one — as the system's single router, and removes the unused in-repo
memory scaffold that no longer has a role.

The repo's `.claude/memory/` was modeled on the harness's auto-memory mechanism but nothing
ever accumulated there: its only file, `MEMORY.md`, holds just a header and a commented-out
empty entries list. The real auto-memory lives in the harness's own home-directory store,
outside the repo, and stays there untouched. Deleting the in-repo scaffold therefore loses
nothing. After deletion, every tracked file that still asserts the scaffold exists or holds
working memory must be updated so the router's claims stay true.

No new capability — this is doc-routing hygiene: fewer places claiming to be memory, one
clearly-designated router, and a decision on the parallel empty `context/decisions.md`
scaffold.

## Goals

- Delete the in-repo `.claude/memory/` directory (its only content is the empty
  `MEMORY.md` scaffold), leaving the harness's out-of-repo auto-memory untouched.
- Update every tracked file that asserts the scaffold exists or holds memory, so the router
  stays accurate after deletion:
  - `CLAUDE.md:20-21` — routing line listing `memory/` under `.claude/` and
    "auto-accumulated memory"; drop the `memory/` reference.
  - `README.md:21-22` — structure section describing `.claude/memory/` as an empty scaffold.
  - `wiki/notes/concepts/context-vs-connections.md:9` — lists `.claude/memory/` as part of
    the "second brain".
  - `wiki/notes/principles/philosophy.md:11-12` — cites `.claude/memory/` as a justification
    for building the system.
- Settle and act on the two open decisions below (decisions.md deletion; principle wording).
- Tick roadmap item 2 in `context/roadmap.md` once shipped.

## Constraints

- Do NOT touch the harness's home-directory auto-memory store (outside the repo) — only the
  in-repo `.claude/memory/` scaffold is in scope.
- Do NOT redo the `wiki/index.md` dead `raw/` link fix — already resolved by roadmap item 1
  (spec 0011); the router section no longer links `raw/` (only descriptive idea/note entries
  mention it, which is correct and stays).
- Descriptive mentions of this idea/plan (roadmap, idea file, this spec, `wiki/index.md`
  entries) are NOT assertions that the scaffold exists — leave them alone; only rewrite the
  four files above that actually claim the scaffold is/holds memory.
- English-only across all file content and commits.

## References

- `wiki/ideas/single-claude-md-router.md` — the accepted idea driving this work (authoritative scope).
- `context/roadmap.md` (item 2) — sequence position; independent of item 1.
- `.claude/memory/MEMORY.md` — the empty in-repo scaffold to delete.
- `CLAUDE.md:20-21`, `README.md:21-22`,
  `wiki/notes/concepts/context-vs-connections.md:9`,
  `wiki/notes/principles/philosophy.md:11-12` — the four references to rewrite.
- `context/decisions.md` — the empty decisions-log scaffold (open decision below).

## Acceptance Criteria

- `.claude/memory/` no longer exists in the repo.
- No tracked file asserts `.claude/memory/` exists or holds memory; a repo-wide grep for
  `.claude/memory` returns only descriptive plan/idea mentions, none of them false.
- The harness's out-of-repo auto-memory is untouched.
- Roadmap item 2 is ticked in `context/roadmap.md`.
- (Pending decision 1) `context/decisions.md` is deleted, or explicitly kept with a recorded reason.
- (Pending decision 2) CLAUDE.md's "one root CLAUDE.md is the single router" convention is
  stated as an explicit durable principle, or explicitly judged already-sufficient.
