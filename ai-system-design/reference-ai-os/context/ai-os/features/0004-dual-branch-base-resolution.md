# Dual-Branch Base Resolution

## Git Workflow
- **Workflow:** trunk
- **Work Type:** feature
- **Jira Ticket:**
- **Base Branch:** main

## Description
This is the (redefined) Phase 6 of `context/feature-skill-plan.md`. The scope shifted twice while
talking it through, and landed somewhere different from where it started — worth recording why,
since both rejected paths are real design decisions, not just discarded drafts.

**First framing (rejected):** for `System: projects/<name>` in tracked-in-`ai-os` mode, a project's
own `Base Branch` might not be `main` (e.g. a `release`-branching Angular app tracked inside the
`ai-os` repo). One branch can't be based on two diverged branches at once, so the first idea was:
split into two branches even for tracked-in-`ai-os` — one for the code (off the project's
`Base Branch`), one for `context/projects/<name>/` state (off `main`). **Rejected**: if it's the
same repo, it stays *one* branch, full stop — code and `context/` ride together on a branch off
whatever `Base Branch` is declared, same as today. The accepted tradeoff: if that `Base Branch`
isn't `main`, `context/projects/<name>/` only reaches `main` whenever/if that branch's target
itself merges to `main` — not immediately. A real cost, but the simpler, more predictable rule
("same repo → same branch, no exceptions") won.

**Second, real gap:** own-repo systems (`projects/<name>/.git` present) already work with real
separate branches, one per repo — that part was never in question, and doesn't need building. But
own-repo's *own* `context/projects/<name>/` state, in Phase 4/5, gets committed **immediately and
directly to `ai-os`'s `main`** — no branch, no PR — because it has no code branch of its own to
ride along on. That's the actual problem: **nothing should ever land on `main` outside a feature
branch, for any system, no exceptions.** So own-repo needs a second, real branch after all — not
for the reason first proposed (base-branch divergence within one repo), but because own-repo's
`context/` state needs *some* branch, and direct-to-`main` isn't an acceptable one.

That surfaced a third point: nothing about `Base Branch` should be hardcoded to `main` for anyone,
including `ai-os` itself — today's docs state `ai-os`'s `Base Branch` is always `main` as a fixed
invariant, but there's no real reason it can't be an explicit, overridable field like everywhere
else (e.g. a deliberately long-lived integration branch for `ai-os`'s own work, someday). `main`
stays the *default* — just never a hardcoded assumption anywhere in the docs or the procedures.

## Goals
- Add **`Context Base Branch`** as a new, optional field in the spec's Git Workflow section —
  relevant only for own-repo systems (the base, in the `ai-os` repo, for that system's context
  branch); defaults to `main` when omitted, overridable like any other field.
- Remove every "`Base Branch` is always `main`" hardcoded claim from the docs — for `ai-os`,
  tracked-in-`ai-os`, and (for its code branch) own-repo alike, `Base Branch` is always an
  explicit per-item field with a sensible default, never an assumed constant. Same for `Context
  Base Branch` (own-repo only): explicit, defaults to `main`, never assumed fixed.
- Remove own-repo's "commit `context/` immediately, directly, to `main`" pattern (built in Phase
  4/5) entirely. Replace it: own-repo systems get a real second branch — the **context branch** —
  in the `ai-os` repo, created at `start` (off `Context Base Branch`), alongside the code branch
  created in the nested repo (off `Base Branch`). New/changed `context/projects/<name>/` files
  from `plan done`/`load` stay uncommitted in the `ai-os` working tree — exactly like
  tracked-in-`ai-os` already works today — until `start` creates the context branch and `publish`
  commits it.
- Extend `current-feature.md`'s shape with `Context Work Branch`/`Context Published Commits`,
  populated **only** for own-repo systems. `ai-os` and tracked-in-`ai-os` stay single-branch,
  these fields always blank for them.
- Update `actions/plan.md`: drop the "own-repo commits immediately" step entirely — every system
  now leaves `plan done`'s moved file uncommitted, no exceptions.
- Update `actions/load.md`: drop the matching "own-repo commits `project-overview.md` immediately"
  step; same uncommitted-until-branched treatment for every system.
- Update `actions/start.md`: for own-repo systems, create *two* branches — code (nested repo, off
  `Base Branch`) and context (`ai-os` repo, off `Context Base Branch`) — fetched/ff-pulled/verified
  independently before creating either. `ai-os`/tracked-in-`ai-os` stay single-branch, unchanged
  except that `Base Branch` is now read as a genuinely free-form field rather than an assumed
  `main`.
- Update `actions/publish.md`: for own-repo, single combined approval covering both branches
  (commit message + commit list + push target, for each), then stage/commit/push each to its own
  base, recording both `Published Commits` and `Context Published Commits`.
- Update `actions/complete.md`: for own-repo, verify merge ancestry for both branches
  independently (code against the nested repo's `origin/<Base Branch>`, context against `ai-os`'s
  `origin/<Context Base Branch>`) before freeing the slot — refuse clearly if only one has merged.
- Update `actions/clear.md`/`actions/abandon.md`: park/discard both branches together as one unit
  (one `## Pending Reviews` entry; one combined `--discard` confirmation, not two).
- Update `wiki/notes/skills/feature/system-resolution.md` (replace the "Own-repo state has no
  shared branch to ride along on" section entirely — it described the pattern this spec removes),
  `wiki/notes/skills/feature/state-model.md` (new fields, `Context Base Branch` in the spec
  template, remove the "`Base Branch` is always `main` for `ai-os`" line), and
  `context/feature-skill-plan.md` (this phase's real scope, replacing the original Phase 6
  definition; `backport` stays split into its own Phase 7 as already agreed).

## Constraints
- `ai-os` and tracked-in-`ai-os` systems stay single-branch, always — no dual-branch for them
  regardless of `Base Branch`. This closes off the first (rejected) framing explicitly: it is not
  in scope, not a future option left open, just wrong for those two cases.
- Own-repo's dual-branch flow is verified by code-review/dry-run reasoning only — no real second
  git repo cloned under `projects/` for a live test, consistent with the same precedent Phase 4
  already set for the own-repo branch (deferred to whenever the first real own-repo project shows
  up).
- `backport` stays out of scope — its own future wave (Phase 7).
- Single combined `publish` approval still applies even when publishing two branches (own-repo) —
  no change to that already-agreed rule.
- No behavior change for tracked-in-`ai-os`/`ai-os` beyond `Base Branch` becoming a genuinely free
  field instead of an assumed constant — the single-branch mechanics themselves don't change.

## References
- context/feature-skill-plan.md (original Phase 6 definition, now superseded; "Tracked context"
  and "Workflow field: trunk vs. explicit-base" sections)
- .claude/skills/feature/actions/plan.md, load.md, start.md, publish.md, complete.md, clear.md,
  abandon.md
- wiki/notes/skills/feature/system-resolution.md ("Own-repo state has no shared branch to ride
  along on" — the section this spec replaces)
- wiki/notes/skills/feature/state-model.md
- context/ai-os/features/0002-multi-system-resolution.md (original own-repo design this corrects)

## Acceptance Criteria
- The spec template's Git Workflow section documents `Context Base Branch` (own-repo only,
  defaults to `main`, overridable).
- No remaining doc states `Base Branch`/`Context Base Branch` is hardcoded or fixed for any
  System — always an explicit field with a stated default.
- `plan done`/`load` never commit anything immediately for any system, own-repo included — new
  files stay uncommitted until a branch exists to carry them.
- `current-feature.md`'s shape documents `Context Work Branch`/`Context Published Commits`,
  populated only for own-repo systems.
- `actions/start.md`/`publish.md`/`complete.md`/`clear.md`/`abandon.md` all handle the own-repo
  two-branch flow: two branches created off their own correct bases, one combined publish
  approval, independent dual-ancestry verification at `complete`, both branches parked/discarded
  together.
- `wiki/system-resolution.md`, `state-model.md`, and `context/feature-skill-plan.md` updated —
  no stale reference to the old "own-repo commits immediately to main" pattern anywhere.
- Own-repo two-branch flow verified by code-review/dry-run reasoning (no real second repo cloned),
  consistent with Phase 4's own precedent.
