# Idea: one CLAUDE.md as the single router — remove the repo memory scaffold

**Status:** accepted (2026-07-18), not started

## What

There is exactly **one** CLAUDE.md in the whole system — the root one — and it is the central
point that knows everything: it links to every project, that project's context
(`context/projects/<name>/`), and its `project-overview.md`. Projects never get their own
CLAUDE.md (already the rule today; this idea makes it an explicit, durable principle rather than
an incidental convention).

Consequences to implement:

- **Delete `.claude/memory/`** (the in-repo scaffold with its empty `MEMORY.md`). It was modeled
  on the harness's auto-memory but nothing ever accumulated there — the real auto-memory lives in
  the harness's own home-directory store, outside the repo, and stays there. The repo keeps
  durable knowledge only in the places CLAUDE.md routes to: `context/` and `wiki/`.
- **Update every reference** to `.claude/memory/` after the deletion: root `CLAUDE.md` (routing
  line for "auto-accumulated memory"), `README.md` (structure section), and any wiki notes that
  mention it.
- **Fix the wiki** so the router's targets are real: `wiki/index.md` links `raw/`, which doesn't
  exist on disk — create it or drop the link (overlaps with
  [[feature-skill-consolidation]]'s documentation-drift item; whichever lands first fixes it).

## Related decision — decisions stay in specs

Also decided 2026-07-18: system-wide decisions are **not** collected into
`context/decisions.md` — the finalized specs under `context/<system>/{features,fixes}/` are the
record of what was ever implemented and why; that's what `context/` is for. Open question to
settle when implementing: whether the empty `context/decisions.md` scaffold should be deleted
along with `.claude/memory/`, since its intended role is now explicitly covered by specs.
