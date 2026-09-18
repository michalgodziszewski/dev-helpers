# Backport

## Git Workflow
- **Workflow:** trunk
- **Work Type:** feature
- **Jira Ticket:**
- **Base Branch:** main

## Description
Adds the `backport <release-branch> [<work-branch>] [--system <system>]` action to the `feature`
skill — Phase 7 of `context/feature-skill-plan.md`, the last unbuilt action besides the Phase 9
`feature-planner` agent. Once a `fix`/`bugfix`/`hotfix` item has merged into trunk (`main`),
`backport` cherry-picks its recorded `Published Commits` onto a named, already-cut release branch
(e.g. `release-178`), via an intermediate branch, so the fix can ship there too without
re-implementing it by hand. Design informed by a working implementation already built in the
`dev-helpers` repo (`skills/feature/actions/backport.md`) — adapted, not copied, to fit
AI_System's own state model (no History log, gitignored `current-feature.md`, existing
`clear`/`complete`/`project-config.md` conventions).

## Goals
- Standard trunk-based-development backport: the ordered `Published Commits` that merged into
  trunk get cherry-picked, in original order, non-merge commits only, onto a named release branch
  — via a new intermediate branch `backport/<release-branch>/<work-branch>`, never written
  directly onto the release branch itself (same "nothing lands directly on a shared branch" rule
  `publish` already follows for `main`). Merging that intermediate branch into the release branch
  happens externally via PR, exactly like `publish` stops at pushing and leaves the actual merge
  to GitHub.
- No new state section. `backport` operates on an item still sitting in the active slot (Status
  `Published`) or in `## Pending Reviews` — the exact same entries `clear`/`complete` already
  manage today. `clear` already parks a `Published` item in `## Pending Reviews` indefinitely, so
  the backport window is already naturally bounded by "any time before you run `complete` on it" —
  no separate "candidates" bookkeeping needed. Once `complete` runs, the entry (and its
  `Published Commits`) is gone, exactly as it is today; deciding not to backport something just
  means running `complete` as usual.
- Restricted to Work Type `fix`/`bugfix`/`hotfix` — `backport` refuses with a clear message on
  `feature`/`chore` items. Conceptually only fixes get returned to an already-cut release.
- Gated by a new per-project config field, `Backport: enabled | disabled` (default `disabled`) in
  `context/projects/<name>/project-config.md`, mirroring the existing `Ticket System` field from
  Phase 8/0007. `backport` refuses immediately, with a clear message, for any system whose
  `project-config.md` doesn't say `Backport: enabled` — including when the file doesn't exist at
  all. `ai-os` never has a `project-config.md` (existing Phase 8 convention: no process/policy
  config for `ai-os`), so `backport --system ai-os` always refuses — acceptable since `ai-os` is
  not expected to ever cut release branches; keeps the config surface consistent with how
  `Ticket System` already works rather than inventing a separate ai-os-only opt-in switch.
- `load`'s existing `project-config.md` scaffold step (Phase 8/0007) also asks the Backport
  enabled/disabled question at the same time it asks about Ticket System, for `projects/<name>`
  only.
- Documentation update: `wiki/notes/skills/feature/state-model.md` (or wherever `project-config.md`
  is currently documented) gets a clear, explicit description of `project-config.md` as the
  per-project settings hub — listing every field it currently holds (`Ticket System`, now
  `Backport`) and what each one enables/gates — rather than leaving `Backport` as an
  undocumented addition next to the existing `Ticket System` field. Future config fields land in
  the same documented place.
- `backport` procedure:
  1. Resolve the source item: active slot (`Published`, no work-branch argument) or a
     `## Pending Reviews` entry (by work-branch match) — both must be Work Type
     `fix`/`bugfix`/`hotfix` and `Workflow: trunk`.
  2. Read `Backport: enabled|disabled` from that system's `project-config.md`; refuse outright
     (no partial checks run) if not exactly `enabled`.
  3. Verify the item's `Published Commits` are ancestors of `origin/<Base Branch>` (same ancestry
     check `complete` already performs) — never touch the release branch otherwise.
  4. `git fetch origin`, verify the release branch exists remotely, create
     `backport/<release-branch>/<work-branch>` off it.
  5. Single combined confirmation, required fresh every call (matching `publish`'s pattern):
     shows the exact ordered `Published Commits` with subjects about to be cherry-picked, the new
     backport branch name, and the push target. Stop and wait for the next message — no
     cherry-pick or push before approval.
  6. Cherry-pick each commit separately and in order with `git cherry-pick -x` (keeps a
     "(cherry picked from commit ...)" trailer for traceability).
  7. On conflict: leave `CHERRY_PICK_HEAD` and the conflict untouched, keep whatever commits
     already succeeded, report the conflicting commit and remaining ones, tell the user to resolve
     manually and continue or `abandon --discard` to bail out — never auto-abort back to a clean
     state, since that would silently throw away real progress on a multi-commit backport.
  8. After all commits succeed, push the backport branch (already approved in step 5 — no second
     prompt), record `Backport Release Branch`/`Backport Branch`/`Backport Commits` on the same
     entry (still living in the active slot or `## Pending Reviews`, not removed), and remind the
     user to open the PR manually against the release branch on GitHub — no `gh pr create`
     automation, matching `publish`'s existing manual-PR convention exactly.
  9. Set Status on that entry: `Merged` if it was the active slot (so `clear` can still park it
     into `## Pending Reviews` afterward, carrying the backport fields along); `Backport Awaiting
     Review` if it was already a `## Pending Reviews` entry. Two new Status values, both meaning
     "primary merged, backport branch pushed, backport PR not yet confirmed merged."
- `complete` changes (extends the existing action, doesn't replace it): when the selected entry
  (active slot or `## Pending Reviews`) carries backport metadata (`Backport Branch`/`Backport
  Commits` populated), `complete` verifies **both** merges independently before discarding
  anything:
  1. Primary: `Published Commits` are ancestors of `origin/<Base Branch>` — exactly as today.
  2. Backport: `Backport Commits` are ancestors of `origin/<Backport Release Branch>` — new check,
     same ancestry method.
  If either check fails, `complete` refuses, changes nothing, and reports which merge is still
  missing. Only once both pass does it discard the entry, same as today's discard behavior
  otherwise. An entry with no backport metadata is entirely unaffected — `complete` behaves exactly
  as it does today.
  No squash-merge SHA fallback is needed for either check (unlike the `dev-helpers` reference,
  which supports squash/rebase policies) — this repo's own history merges every PR with a real
  merge commit (`Merge pull request #N ...`), so `Published Commits`/`Backport Commits` are always
  real ancestors once merged; adding fallback SHA arguments for a merge policy this repo doesn't
  use would be unused complexity.
- `abandon` changes (extends the existing action, doesn't replace it; design lifted directly from
  `dev-helpers`' `actions/abandon.md`, since backport's own conflict-recovery step above promises
  this escape hatch and today's `abandon` can't actually deliver it):
  - Active slot: accepts Status `Merged` in addition to today's `Not Started`/`In Progress`
    (`Published` still refuses — unrelated to backport, use `clear`/`complete` as today). When
    `--discard` runs on a `Merged` slot, treat the recorded `Backport Branch` as an extra branch to
    delete alongside the Work Branch — same single combined confirmation covering every branch. If
    `CHERRY_PICK_HEAD` is active (a conflicted backport), require the current checked-out branch to
    equal the recorded `Backport Branch`, show the conflicting commit/paths, list "abort the
    in-progress cherry-pick" among the confirmed consequences, and only run
    `git cherry-pick --abort` after that confirmation — never before.
  - New pending-entry forms: `abandon <work-branch> [--system <system>]` and
    `abandon --discard <work-branch> [--system <system>]`, matching an exact `## Pending Reviews`
    entry by Work Branch (never a partial/fuzzy match) — general-purpose removal of one pending
    item, not limited to backport-related entries, matching `dev-helpers`' full scope:
    - Plain form (no `--discard`): removes that exact entry outright — the explicit work-branch
      argument is itself the instruction, so no confirmation is asked for the entry removal. For
      each related local branch (Work Branch, and Backport Branch when recorded) that isn't
      currently checked out, show its unmerged commits and ask one explicit confirmation per
      branch before `git branch -D`; a branch that's checked out (or whose deletion would disturb
      other active work) is left alone, with the reason reported. Remote branches are never
      deleted.
    - `--discard` form: same entry removal, plus a single combined destructive confirmation
      covering all local cleanup at once (mirroring the active-slot `--discard` pattern): if
      `CHERRY_PICK_HEAD` exists on the entry's recorded `Backport Branch`, require the current
      branch to equal it and include aborting the cherry-pick in the confirmed consequences; then
      delete the entry's Work Branch and Backport Branch locally. Never deletes a remote branch or
      closes its PR.
  - Preserves every unrelated active, pending, and (per Phase 3's existing no-History-log
    decision) any other bookkeeping untouched — removing one entry or the active slot never
    touches anything else.
- `clear` changes (extends the existing action, doesn't replace it): today `clear` requires the
  active slot's Status to be exactly `Published`. Extend the precondition to accept `Published` **
  or `Merged`** — an active-slot item backported in place (Status `Merged`, per above) must still
  be clearable, so the user can free the slot for the next `load` without being forced to wait for
  the backport PR to merge first. The Pending Reviews entry `clear` writes already copies every
  field from the active slot; when `Backport Release Branch`/`Backport Branch`/`Backport Commits`
  are populated, they're copied too, same as `Published Commits` already is. An entry cleared this
  way keeps Status `Merged` in `## Pending Reviews` (not reset to `Awaiting Review`, since the
  backport branch already exists) until a later `complete <work-branch>` verifies both merges.

## Constraints
- Never write directly to the release branch — only ever to the intermediate
  `backport/<release-branch>/<work-branch>` branch.
- Never guess commit SHAs or release-branch state — always re-verify ancestry and fetch the
  release branch fresh before cherry-picking.
- Conflict handling never auto-aborts (`git cherry-pick --abort`) — leaves state for manual
  resolution, per Goal #7 above.
- Scoped to `Workflow: trunk` items, Work Type `fix`/`bugfix`/`hotfix` only.
- Gated by `project-config.md`'s `Backport: enabled` field; no technical carve-out for `ai-os` —
  it's simply always excluded today because it never has a `project-config.md`.
- No durable/tracked history log, no new file — backport metadata lives only in the same
  gitignored `current-feature.md` entry (active slot or `## Pending Reviews`) that already exists,
  consistent with Phase 3's "`git log`/PR list is the durable record" rationale.
- No auto-creation of the release-branch PR — push only, same manual-PR reminder `publish` already
  gives.
- `complete` must never discard an entry that has backport metadata until *both* the primary and
  backport merges are independently verified — no partial completion, no discarding "because the
  primary merged, close enough."
- No squash-merge SHA fallback in either `backport` or `complete` — out of scope, this repo
  doesn't use that merge policy.
- `abandon --discard` never runs `git cherry-pick --abort` before its explicit destructive
  confirmation, and never deletes a remote branch under any form.
- `abandon <work-branch>`/`abandon --discard <work-branch>` only ever match by exact Work Branch —
  never a partial name, never a guess when the match is ambiguous or absent.
- `resume` (reattaching a cleared item to the active slot for follow-up commits) is a related gap
  in `dev-helpers` but is **not** part of this spec — orthogonal to backport, left for a separate
  future item.

## References
- `context/feature-skill-plan.md` (Phase 7 section)
- `.claude/skills/feature/actions/complete.md` (the action this spec extends with the dual-merge
  backport check)
- `.claude/skills/feature/actions/clear.md` (the action this spec extends to also accept Status
  `Merged`, so a backported active-slot item can still be cleared)
- `.claude/skills/feature/actions/publish.md` (combined-approval pattern, manual-PR convention)
- `.claude/skills/feature/actions/abandon.md` (the action this spec extends with `Merged`-slot and
  pending-entry targeting)
- `wiki/notes/skills/feature/state-model.md` (current `current-feature.md` field shapes)
- `dev-helpers` repo, `skills/feature/actions/backport.md` and `clear.md` — reference
  implementation this design is adapted from (not copied: no History log, no auto-PR, no
  cross-Work-Type support, per the decisions above)

## Acceptance Criteria
- `backport release-178` on a real merged fix (still in the active slot or `## Pending Reviews`,
  not yet `complete`d) creates `backport/release-178/<work-branch>` off `release-178`,
  cherry-picks its exact `Published Commits` onto that new branch in order, pushes only after
  explicit fresh confirmation, never touches `release-178` directly, and records `Backport Release
  Branch`/`Backport Branch`/`Backport Commits` on the source entry without removing it.
- `backport` refuses with a clear message (no partial state changed) when: the item's Work Type is
  `feature`/`chore`; the system's `project-config.md` doesn't say `Backport: enabled` (including
  when the file or the whole system's config doesn't exist, e.g. `ai-os`); or the item's
  `Published Commits` aren't yet ancestors of `origin/<Base Branch>`.
- A deliberately conflicting cherry-pick leaves `CHERRY_PICK_HEAD`, the conflict, and any
  already-succeeded commits untouched, and reports exactly which commit conflicted — no
  auto-abort, no partial state silently discarded.
- Deciding not to backport an item requires no special action: running `complete` on it (as today)
  discards it normally, whether or not `backport` was ever run.
- `load` on a `projects/<name>` system without an existing `project-config.md` asks the Backport
  enabled/disabled question alongside the existing Ticket System question, and scaffolds both
  fields into the new file.
- `wiki/notes/skills/feature/state-model.md` documents `project-config.md` as the per-project
  config hub, listing `Ticket System` and `Backport` together with what each field gates.
- After `backport` succeeds, the source entry's Status is `Merged` (was active slot) or `Backport
  Awaiting Review` (was already `## Pending Reviews`); `wiki/notes/skills/feature/state-model.md`
  documents both as new valid Status values alongside the existing lifecycle diagram.
- `complete` on an entry with backport metadata refuses (no state changed) if the backport branch
  hasn't merged into the release branch yet, even when the primary merge into `Base Branch` is
  already verified — and succeeds (discarding as normal) once both are verified.
- `clear` succeeds on an active-slot item whose Status is `Merged` (not just `Published`), moving
  it into `## Pending Reviews` with its backport fields intact so the active slot is free for the
  next `load` immediately, without waiting for the backport PR to merge.
- A conflicted backport on the active slot (`CHERRY_PICK_HEAD` set, Status `Merged`) can be
  cleaned up with `abandon --discard`: the confirmation names aborting the cherry-pick and
  deleting both the Work Branch and Backport Branch; after confirmation, the working tree is
  clean, `CHERRY_PICK_HEAD` is gone, and both local branches are deleted (remote branches
  untouched).
- `abandon --discard <work-branch>` on a `## Pending Reviews` entry whose backport conflicted
  cleans it up the same way, removing only that exact entry and leaving every other active/pending
  item untouched.
- `abandon <work-branch>` (no `--discard`) on a `## Pending Reviews` entry with no local changes
  removes the entry immediately (the explicit argument is the instruction, no extra confirmation
  for the entry itself), asking separately, per branch, only before deleting any related local
  branch that isn't checked out.
