# Remove Wiki References From Feature Skill (+ Wiki Cleanup)

## Git Workflow
- **Workflow:** trunk
- **Work Type:** fix
- **Jira Ticket:**
- **Base Branch:** main

## Description
The `feature` skill's own operational files were meant to never reference the wiki at all — per the
documented design, `CLAUDE.md` is the *sole* place in the repo allowed to point at `wiki/` (as the
last-resort fallback an agent checks only after a project's own docs/context don't answer the
question). The wiki itself is meant to hold the `feature` skill's own conceptual documentation
(system resolution, repo mode, state model, spec template, scenarios, troubleshooting) — but the
skill's own files should be self-contained enough to run without sending the agent out to read it,
and must never link back to it.

That rule has been violated: every action file under `.claude/skills/feature/actions/`, the skill's
own `SKILL.md`, and `.claude/agents/feature-planner.md` currently link to
`wiki/notes/skills/feature/index.md` (or, in `publish.md`'s case, `state-model.md` directly) as
their "concepts live here" pointer. This spec removes every such reference from the skill's running
files, without touching the wiki content itself or deleting any wiki page — the documentation stays
put, only the skill-side links to it go away.

**Amendment 1 (folded in after the first drafting pass):** separately, several `wiki/` pages had drifted
out of date relative to what's actually shipped — specifically two ideas under `wiki/ideas/` still
marked `not started` for work that's fully built, and `wiki/index.md` entries reflecting that same
stale status. This is a small, targeted correction (matching the "done" status style already used by
`context-folder.md`/`env-secrets-convention.md`), not a full audit of every wiki page — it does not
expand into rewriting concept/technique/principle notes, which weren't found to be stale.

**Amendment 2 (folded in during publish-approval review, after a full wiki link-integrity sweep):** the
sweep found two further real defects, unrelated to staleness: (a) six dead links across five files
all pointing at `wiki/notes/roadmap/ai-system-roadmap.md`, a file that has never existed in this
repo's git history — a long-standing dangling reference predating this fix, not introduced by it;
(b) a wrong relative-path link (`../../../CLAUDE.md`/`../../../README.md`, one `../` too many —
verified by testing path resolution) inside a fenced code example in
`wiki/notes/skills/feature/state-model.md`, which turns out to mirror the exact same bug in the real
file it's illustrating, `context/ai-os/project-overview.md` (`../../CLAUDE.md`/`../../README.md`
would resolve correctly; the extra `../` does not). Both are now folded into this fix rather than
deferred, on the reasoning that fixing the wiki's illustrative copy while leaving the real bug it
mirrors in place would be pointless.

## Goals
- Remove the "Concepts ... are documented in `wiki/notes/skills/feature/index.md`" pointer sentence
  (and its link) from the header of every file under `.claude/skills/feature/actions/`:
  `plan.md`, `load.md`, `start.md`, `publish.md`, `clear.md`, `complete.md`, `abandon.md`,
  `backport.md`, `test.md`, `review.md`. Each of these currently reads roughly "Concepts (System
  resolution, repo mode...) are documented in `wiki/notes/skills/feature/index.md` — this file is
  only the operational steps"; rework each header note so it no longer names or links the wiki at
  all (e.g. drop the sentence entirely, since each file is already self-contained for its own
  operational steps).
- Remove the wiki link from `.claude/skills/feature/SKILL.md`'s "Documentation of how the skill
  works as a whole ... lives in `wiki/notes/skills/feature/`" sentence (currently line 18).
- Remove the inline `wiki/notes/skills/feature/state-model.md` reference inside
  `.claude/skills/feature/actions/publish.md` step 2 (the parenthetical "same mapping documented
  in `wiki/notes/skills/feature/state-model.md`, near the spec template").
- Remove the `wiki/notes/skills/feature/state-model.md` reference inside
  `.claude/agents/feature-planner.md` (currently: "Work from the fixed spec template ... — see
  `wiki/notes/skills/feature/state-model.md`").
- After the fix, `grep -ril wiki .claude/skills/feature .claude/agents/feature-planner.md` returns
  no matches.
- Update `wiki/ideas/skill-feature.md`'s `**Status:**` line from `not started` to `done`, with a
  one-line summary of what was actually produced (matching the style of `context-folder.md`'s
  `done — context/{about-me,stack-and-conventions,decisions}.md scaffolded` line) — e.g. pointing at
  `.claude/skills/feature/`, `.claude/agents/feature-*.md`, and `context/feature-skill-plan.md`
  (Phases 0-9 complete).
- Update `wiki/ideas/skill-session-handoff.md`'s `**Status:**` line from `not started` to `done`,
  same style, pointing at the now-existing `.claude/skills/session-handoff/SKILL.md`.
- Update `wiki/index.md`: move the `skill-feature` and `skill-session-handoff` bullets out of the
  "Ideas — things to implement" section (they're no longer proposals) — either drop them from that
  list or annotate them as shipped; and fix the "Skills (reference)" section's `feature` bullet,
  which currently reads "currently through Phase 2" — that's stale, it's Phase 9/complete now.
- Remove the dead `[ai-system-roadmap](../roadmap/ai-system-roadmap.md)` link from all 6 occurrences
  across all 5 files it appears in (`notes/techniques/obsidian-raw-wiki-ingestion.md`,
  `notes/techniques/automation-stack.md` (2 occurrences), `notes/techniques/skill-and-agent-authoring.md`,
  `notes/concepts/second-brain-levels.md`, `notes/principles/philosophy.md`) — drop the dead link and
  lightly reword the surrounding sentence so it still reads naturally without inventing new roadmap
  content or creating the missing file.
- Fix the wrong relative path in `wiki/notes/skills/feature/state-model.md`'s fenced code example
  (`../../../CLAUDE.md` → `../../CLAUDE.md`, `../../../README.md` → `../../README.md`) — the one
  narrow edit allowed to that file (see Constraints).
- Fix the same wrong relative path in the real file the example illustrates,
  `context/ai-os/project-overview.md` (same `../../../` → `../../` correction, both links).

## Constraints
- Do not delete, move, or edit the `wiki/notes/skills/feature/` content itself
  (`index.md`/`system-resolution.md`/`scenarios.md`/`troubleshooting.md`/`testing-checklist.md`) —
  it keeps documenting the skill's behavior exactly as before; only the skill-side *links into it*
  are removed. `state-model.md` gets exactly one narrow exception, per Amendment 2: fixing the
  broken relative-path example (nothing else in that file changes).
- The exceptions to "don't touch wiki content," added by the two amendments above: the
  `**Status:**` line updates in `wiki/ideas/skill-feature.md` and `wiki/ideas/skill-session-handoff.md`;
  the two stale-status fixes in `wiki/index.md` described under Goals; removing the 6 dead
  `ai-system-roadmap` links from the 5 named files; and the one relative-path fix in
  `state-model.md`. Nothing else under `wiki/` changes — no other idea file, and no other content in
  any concept/technique/principle note, is touched. This still does not become a general wiki audit —
  every change traces to a specific, verified defect (stale status or a broken link), not a style
  pass.
- Do not create `wiki/notes/roadmap/ai-system-roadmap.md` — the fix is removing the dead links, not
  writing the missing file.
- Do not touch `context/feature-skill-plan.md` — it's the build-record/design-rationale doc, not
  part of the running skill, and its extensive wiki references document past decisions (including
  the Phase 4 "three separate places" design this fix partially reverses) rather than being
  something the skill reads at runtime. Out of scope for this fix.
- Do not touch `CLAUDE.md` — it is already the one correct, intentional reference to `wiki/` (the
  last-resort fallback step) and needs no change.
- No behavior change to any action's actual procedure — this is a documentation/reference cleanup
  only; no step's logic, ordering, or output changes.

## References
- .claude/skills/feature/SKILL.md (line 18, the "Documentation ... lives in wiki/..." sentence)
- .claude/skills/feature/actions/plan.md (lines 4-7, header pointer)
- .claude/skills/feature/actions/load.md (header pointer)
- .claude/skills/feature/actions/start.md (header pointer)
- .claude/skills/feature/actions/publish.md (header pointer, line 6-8; inline reference, line 27)
- .claude/skills/feature/actions/clear.md (header pointer)
- .claude/skills/feature/actions/complete.md (header pointer)
- .claude/skills/feature/actions/abandon.md (header pointer)
- .claude/skills/feature/actions/backport.md (header pointer)
- .claude/skills/feature/actions/test.md (header pointer)
- .claude/skills/feature/actions/review.md (header pointer)
- .claude/agents/feature-planner.md (line 65, "see `wiki/notes/skills/feature/state-model.md`")
- CLAUDE.md ("Anything else" section — the one sanctioned wiki-fallback reference, left unchanged)
- wiki/notes/skills/feature/index.md and siblings (content this fix leaves untouched)
- wiki/ideas/skill-feature.md (Status line, stale "not started")
- wiki/ideas/skill-session-handoff.md (Status line, stale "not started")
- wiki/index.md (Ideas list + Skills reference section, stale entries)
- wiki/ideas/context-folder.md and wiki/ideas/env-secrets-convention.md (style reference for how a
  "done" status line reads)
- wiki/notes/techniques/obsidian-raw-wiki-ingestion.md (dead roadmap link)
- wiki/notes/techniques/automation-stack.md (dead roadmap link, 2 occurrences)
- wiki/notes/techniques/skill-and-agent-authoring.md (dead roadmap link)
- wiki/notes/concepts/second-brain-levels.md (dead roadmap link)
- wiki/notes/principles/philosophy.md (dead roadmap link)
- wiki/notes/skills/feature/state-model.md (wrong relative path in fenced example)
- context/ai-os/project-overview.md (same wrong relative path, the real file being illustrated)

## Acceptance Criteria
- `grep -ril wiki .claude/skills/feature/ .claude/agents/feature-planner.md` returns no matches.
- Every file listed under References above still reads sensibly on its own (no dangling "as
  documented [gap]" sentence fragments left behind after the wiki mention is removed).
- `wiki/notes/skills/feature/*.md` files are byte-identical to before this fix — confirmed by `git
  diff` touching zero files under `wiki/notes/skills/feature/`.
- `context/feature-skill-plan.md` and `CLAUDE.md` are untouched by this fix — confirmed by `git
  diff` touching zero lines in either.
- `wiki/ideas/skill-feature.md` and `wiki/ideas/skill-session-handoff.md` both read `**Status:**
  done — ...` instead of `not started`.
- `wiki/index.md` no longer lists `skill-feature`/`skill-session-handoff` as open proposals, and its
  `feature` skills-reference bullet no longer says "currently through Phase 2".
- `grep -rn "ai-system-roadmap" wiki/` returns no matches anywhere in the repo.
- `wiki/notes/roadmap/` is not created by this fix.
- `grep -n "\.\./\.\./\.\./CLAUDE.md\|\.\./\.\./\.\./README.md" wiki/notes/skills/feature/state-model.md context/ai-os/project-overview.md`
  returns no matches (both now read `../../CLAUDE.md`/`../../README.md`).
- `git diff --stat -- wiki/` touches exactly `wiki/ideas/skill-feature.md`,
  `wiki/ideas/skill-session-handoff.md`, `wiki/index.md`,
  `wiki/notes/techniques/obsidian-raw-wiki-ingestion.md`,
  `wiki/notes/techniques/automation-stack.md`, `wiki/notes/techniques/skill-and-agent-authoring.md`,
  `wiki/notes/concepts/second-brain-levels.md`, `wiki/notes/principles/philosophy.md`, and
  `wiki/notes/skills/feature/state-model.md` — no other file under `wiki/`.
- `git diff --stat -- context/` additionally shows `context/ai-os/project-overview.md` (plus this
  spec file itself).
