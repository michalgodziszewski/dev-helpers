# Action: `abandon`

`abandon [--discard] [<work-branch>] [--system <system>]`

Resets a not-yet-published (or backported-in-place) active slot back to Idle, or removes one exact
`## Pending Reviews` entry outright.

## Active slot: `abandon [--discard] [--system <system>]`

No `<work-branch>` argument targets that system's active slot.

1. Resolve `System` (default `ai-os`) and its repo mode per [`_common.md`](_common.md). Requires
   that system's active slot Status to be `Not Started`, `In Progress`, or `Merged` — refuse for
   `Published` (use `clear`/`complete`
   instead, unrelated to backport). `Merged` is only ever reached via `backport` running directly on
   the active slot (see `actions/backport.md`); it's handled here, not as a separate case, because
   the reset/discard mechanics below are otherwise identical.
2. Plain `abandon`: reset that system's active slot to blank/`Idle` (including `Context Base
   Branch`/`Context Work Branch`/`Context Published Commits` when set, and `Backport Release
   Branch`/`Backport Branch`/`Backport Commits` when set). Every branch is left alone in git —
   nothing is deleted, own-repo's two branches and any recorded Backport Branch included.
3. `abandon --discard`: same reset, plus delete local branches. The branches in scope: the work
   branch in the resolved repo root for `ai-os`/tracked-in-`ai-os`; **both** the code branch (`git
   -C projects/<name>`) and the context branch (AI_System repo root) for own-repo; and, when
   Status was `Merged` and `Backport Branch` is recorded, that Backport Branch too — in the same
   repo as the code branch (backport never touches the context branch, so it's never in scope
   here). Git refuses to delete a currently-checked-out branch: if the context branch or the
   Backport Branch happens to be checked out, switch to whatever branch was there before deleting
   it (never assume `main`, since concurrent unrelated work might be checked out there instead).
   - If `CHERRY_PICK_HEAD` is active in the repo that holds the Backport Branch (a conflicted
     backport left mid-cherry-pick, per `actions/backport.md` step 8): require the branch currently
     checked out there to equal the recorded Backport Branch — refuse and stop if it doesn't match,
     since aborting a cherry-pick on the wrong branch would silently disturb unrelated work. Show
     the conflicting commit and the conflicted paths, and list "abort the in-progress cherry-pick"
     as one of the confirmed consequences, alongside every branch about to be deleted.
   - One explicit confirmation covers every branch deletion (and the cherry-pick abort, when
     applicable) together — asked once, not per-branch or per-consequence — this is destructive per
     `.claude/GUIDELINES.md`. Only after that confirmation: run `git cherry-pick --abort` first if
     applicable, then delete each branch (`git branch -D`). Never force-delete or abort anything
     before that confirmation.

## Pending Reviews entry: `abandon [--discard] <work-branch> [--system <system>]`

A `<work-branch>` argument targets one exact entry under that system's `## Pending Reviews` instead
of the active slot — general-purpose removal of a single pending item, not limited to
backport-related entries.

1. Resolve `System` (default `ai-os`) and its repo mode per [`_common.md`](_common.md). Find the
   `## Pending Reviews` entry whose
   Work Branch exactly equals `<work-branch>` — never a partial or fuzzy match. Refuse clearly, with
   no state changed, if no entry matches.
   The full set of local branches an entry may have recorded: Work Branch (always), Context Work
   Branch (own-repo entries only, in the AI_System repo root — same as the active-slot form
   already handles), and Backport Branch (when recorded, in the same repo as Work Branch). Every
   step below applies to all of them that exist on this entry, not just Work Branch/Backport
   Branch — own-repo pending entries must clean up exactly as completely as an own-repo active
   slot already does.
2. Plain `abandon <work-branch>` (no `--discard`): remove that exact entry immediately — the
   explicit work-branch argument is itself the instruction, so no confirmation is asked for the
   entry removal itself. Then, for each local branch this entry recorded (Work Branch, Context Work
   Branch when recorded, and Backport Branch when recorded) that isn't currently checked out: show
   its unmerged commits (e.g. `git log origin/<its base branch>..<branch>`) and ask one explicit
   confirmation before `git branch -D` — one confirmation per branch, not combined. A branch that's
   currently checked out, or whose deletion would disturb other active work, is left alone in git;
   report why, don't force it. Remote branches are never deleted, under any circumstance.
3. `abandon --discard <work-branch>`: remove that exact entry the same way (still no separate
   confirmation for the removal itself), then one single combined destructive confirmation covering
   all local cleanup for this entry at once — mirroring the active-slot `--discard` pattern above:
   if `CHERRY_PICK_HEAD` is active in the repo that holds this entry's recorded Backport Branch,
   require the currently checked-out branch there to equal it, and include "abort the in-progress
   cherry-pick" among the confirmed consequences alongside deleting every recorded branch (Work
   Branch, Context Work Branch when recorded, and Backport Branch when recorded). After that one
   confirmation: abort the cherry-pick if applicable, then delete each of those branches locally
   (`git branch -D`). Never deletes a remote branch or closes its PR, under any form.

Preserves every unrelated active slot, every other `## Pending Reviews` entry (any system), and any
other bookkeeping untouched — resetting the active slot or removing one entry never touches
anything else.
