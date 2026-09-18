# Action: `complete`

`complete [<work-branch>] [--system <system>]`

Verifies a `Published` (or backported `Merged`/`Backport Awaiting Review`) item actually merged,
then discards it and frees the slot.

1. Resolve `System` (default `ai-os`) and its repo mode per [`_common.md`](_common.md).
   `git fetch origin` in every repo involved: the resolved repo root for `ai-os`/tracked-in-`ai-os`;
   **both** the nested repo (`git -C projects/<name>`) and the AI_System repo root for own-repo.
2. Resolve which item: no argument → that system's active slot (must be Status `Published` or
   `Merged` — `Merged` means `backport` already ran on it directly, without an intervening `clear`);
   an argument → the matching entry under that system's `## Pending Reviews` (match by Work
   Branch, whatever its Status — `Published`, `Merged`, or `Backport Awaiting Review`).
3. Verify merge ancestry, independently per branch and per merge:
   - Primary — `ai-os`/tracked-in-`ai-os`: every commit in Published Commits must satisfy `git
     merge-base --is-ancestor <sha> origin/<Base Branch>` in the resolved repo root. Own-repo:
     Published Commits (code branch) against `origin/<Base Branch>` in the nested repo, **and**
     Context Published Commits (context branch) against `origin/<Context Base Branch>` at the
     AI_System repo root — both must pass independently. Refuse and report clearly which one hasn't
     merged if only one has; don't guess or assume either merged.
   - Backport (only when the entry carries backport metadata — `Backport Branch`/`Backport
     Commits` populated): every commit in `Backport Commits` must also satisfy `git merge-base
     --is-ancestor <sha> origin/<Backport Release Branch>`, run in the same repo as the primary
     check above (the resolved repo root for `ai-os`/tracked-in-`ai-os`, or the nested repo for
     own-repo — backport only ever touches the code side, never the context branch). No
     squash-merge SHA fallback — this repo merges every PR with a real merge commit, so a merged
     `Backport Commits` entry is always a real ancestor.
   If either applicable check fails — primary or backport — refuse, change nothing, and report
   exactly which merge is still missing (e.g. "primary merged, backport branch not yet merged into
   `release-178`"). Only once **every** applicable check passes does step 4 run. An entry with no
   backport metadata is entirely unaffected by the backport check — `complete` behaves exactly as
   it did before `backport` existed.
4. Remove the completed item: if it came from the active slot, reset those fields to blank
   (including `Context Work Branch`/`Context Published Commits` for own-repo, and `Backport
   Release Branch`/`Backport Branch`/`Backport Commits` when set), Status → `Idle`; if it came from
   `## Pending Reviews`, remove that entry and leave the active slot untouched. No History entry is
   written — the durable record of what merged and when lives in git, phrased by the resolved
   Remote mode (per [`_common.md`](_common.md)): in networked (`github`) mode that's `git log`
   plus the GitHub PR list; in `local` mode there is no PR list, so it's the local `origin`'s
   `<Base Branch>` `git log` alone. The ancestry check in step 3 is byte-for-byte identical either
   way — only this record wording differs.
