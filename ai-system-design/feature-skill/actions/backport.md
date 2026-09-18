# Action: `backport`

`backport <release-branch> [<work-branch>] [--system <system>]`

Cherry-picks a merged fix's `Published Commits` onto an already-cut release branch, via a new
intermediate branch — never writing directly to the release branch itself.

1. Resolve `System` (default `ai-os`) and its repo mode per [`_common.md`](_common.md). Resolve the
   source item: no `<work-branch>` argument → that system's active slot, which must be Status
   `Published` or `Merged` (`Merged` means `backport` already ran on it once, for a different release
   branch — see the note on repeat backports in step 5; it's still eligible to backport again); a
   `<work-branch>`
   argument → the matching entry under that system's `## Pending Reviews` (match by Work Branch,
   whatever its Status — `Published`, `Merged`, or `Backport Awaiting Review` are all eligible, the
   last one for the same reason). Either way, refuse immediately, no partial checks run, unless the
   entry is both Work Type `fix`/`bugfix`/`hotfix` and `Workflow: trunk` — report the actual Work
   Type/Workflow in the refusal so it's clear why. `feature`/`chore` items are refused
   unconditionally; backport is only ever conceptually about returning a fix to an already-cut
   release.
2. Read `Backport: enabled|disabled` from `context/<system>/project-config.md`. Refuse outright, no
   partial checks run, unless it reads exactly `enabled` — this covers a `disabled` value, a
   missing `Backport` field, a missing `project-config.md` file entirely (every `projects/<name>`
   system before its first opt-in), and `System: ai-os` (whose `project-config.md` exists but sets
   `Backport: disabled`, so `backport --system ai-os` always refuses this way — no ai-os-specific
   carve-out).
3. Verify the entry's `Published Commits` are ancestors of `origin/<Base Branch>` — the same
   ancestry check `complete` already performs (`git merge-base --is-ancestor <sha>
   origin/<Base Branch>` for each commit, in order), run against the repo where the Work Branch
   actually lives: the resolved repo root for `ai-os`/tracked-in-`ai-os`, or the nested repo (`git
   -C projects/<name>`) for own-repo — `backport` only ever touches the code side, never the
   context branch. Refuse, changing nothing, if any commit isn't yet an ancestor; never touch the
   release branch otherwise.
4. `git fetch origin` in that same repo, then verify `<release-branch>` actually exists on
   `origin` (e.g. `git ls-remote --exit-code origin <release-branch>`) — refuse clearly if it
   doesn't, rather than guessing or creating it. Create the intermediate branch
   `backport/<release-branch>/<work-branch>` off `origin/<release-branch>`.
5. Immediately after creating that branch — before asking for approval, before any cherry-pick —
   persist two things on the entry (still living in the active slot or `## Pending Reviews`, never
   removed):
   - `Backport Release Branch: <release-branch>`, `Backport Branch:
     backport/<release-branch>/<work-branch>`, `Backport Commits:` (empty for now, appended to as
     each cherry-pick succeeds — see step 7).
   - Status: `Merged` if this entry is the active slot (so `clear` can still park it into
     `## Pending Reviews` afterward, carrying the backport fields along — see `actions/clear.md`);
     `Backport Awaiting Review` if it's already a `## Pending Reviews` entry.

   Do this now, not after cherry-picking finishes, for one specific reason: it's what makes step 8
   below (conflict recovery via `abandon --discard`) actually reachable. Before this step,
   `Status` was `Published` (the normal case for an active-slot item's very first backport
   attempt) — and `actions/abandon.md`'s active-slot form refuses on `Published`. If a conflict
   happens on the very first cherry-pick and Status hadn't already moved off `Published`, there
   would be no procedural way to invoke the recovery step 8 explicitly promises. Creating a local
   branch and editing the gitignored `current-feature.md` are both non-destructive, so doing this
   before the confirmation below is safe — mirrors how `actions/start.md` already sets Status →
   `In Progress` right after creating the work branch, before any implementation happens, not
   after.

   These three `Backport *` fields are singular, not a list — running `backport` again on an entry
   that already carries backport metadata (a deliberate second backport, to a *different* release
   branch) **overwrites** them with this newest attempt's values, starting from this step. Nothing
   in git is lost by that overwrite: an earlier backport's branch and PR still exist on `origin`
   exactly as before, `current-feature.md` just stops pointing at them from this entry. The
   practical consequence: `complete`'s backport ancestry check (see `actions/complete.md`) only
   ever verifies the *most recently recorded* backport. If a fix is deliberately backported into
   more than one release branch, confirm every earlier backport PR has already merged before
   running `backport` again on the same entry — once overwritten, `complete` no longer has any
   record of the earlier one to check.
6. Single combined confirmation, required fresh on every call — same pattern `publish` uses, per
   `.claude/GUIDELINES.md`: show the exact ordered `Published Commits` with their subjects about to
   be cherry-picked, the new backport branch name, and the push target (`origin
   backport/<release-branch>/<work-branch>`). Stop and wait for the user's actual next message — do
   not cherry-pick or push anything before that message arrives. This does not carry forward from a
   previous `backport` call or from an earlier instruction to "run backport" — it's this step's own
   approval, required fresh every time.
7. After approval, cherry-pick each commit individually and in the same order as `Published
   Commits`, with `git cherry-pick -x <sha>` (keeps a "(cherry picked from commit ...)" trailer for
   traceability). One commit per `git cherry-pick` call — never batch several SHAs into one call —
   so a conflict on commit N leaves every commit before it already applied and committed on the
   backport branch. Immediately after each individual commit succeeds, append its new SHA to
   `Backport Commits` on the entry — so a conflict partway through still leaves an accurate,
   complete record of exactly which commits already landed on the backport branch, not just
   whatever was true at the very end.
8. On conflict: stop immediately. Leave `CHERRY_PICK_HEAD` and the conflict exactly as git left
   them, and leave whatever commits already succeeded (and already recorded in `Backport Commits`,
   per step 7) on the backport branch untouched. Report which commit conflicted (subject + SHA) and
   which remaining commits haven't been attempted yet. Tell the user to either resolve the conflict
   manually and run `git cherry-pick --continue` themselves, or run `abandon --discard` (see
   `actions/abandon.md`) to bail out of the whole backport — reachable regardless of whether this
   is the entry's first backport attempt or a repeat, since Status and `Backport Branch` were
   already persisted in step 5, before cherry-picking began. Never run `git cherry-pick --abort`
   here — that would silently discard the already-succeeded commits along with the conflicted one,
   throwing away real progress on a multi-commit backport.
9. Once every commit succeeds, push the backport branch (`git push origin
   backport/<release-branch>/<work-branch>`) — already approved in step 6, no second prompt needed.
   `Backport Commits` is already complete and accurate from step 7's incremental recording; nothing
   further to record here. Then remind the user to land the backport branch — wording follows the
   resolved Remote mode (per [`_common.md`](_common.md)), the skill merging nothing itself either
   way: in networked (`github`) mode, open the PR manually against `<release-branch>` on GitHub — no
   `gh pr create` automation, matching `publish`'s existing manual-PR convention exactly; in `local`
   mode (a local bare `origin`, no PR mechanism), the merge is manual — checkout `<release-branch>`,
   merge the backport branch into it, and push to the local `origin`, mirroring that same
   manual-merge convention. `backport` only ever touches the code side, so the mode follows the repo
   the Work Branch lives in: for own-repo that's the project's *own* nested remote — in practice the
   org's networked GitHub, so the PR path — since the code side is never `local` (per
   [`_common.md`](_common.md)); for `ai-os`/tracked-in-`ai-os` the code work lives in the AI_System
   repo, so it follows `ai-os`'s `Remote` mode.
