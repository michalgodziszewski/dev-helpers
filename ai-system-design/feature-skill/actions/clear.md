# Action: `clear`

`clear [--system <system>]`

Parks a `Published` (or backported `Merged`) active item in Pending Reviews, freeing that system's
slot without verifying merge.

1. Resolve `System` (default `ai-os`) per [`_common.md`](_common.md). Requires Status `Published`
   **or `Merged`** in that
   system's active slot — `Merged` means `backport` already ran on the active-slot item directly
   (see `actions/backport.md`); either way `clear` runs identically from here on.
2. Append the active slot's full field block (System/Workflow/Work Type/Base Branch/Work
   Branch/Source Spec/Status/Published Commits, plus `Context Base Branch`/`Context Work
   Branch`/`Context Published Commits` when set for own-repo, and `Backport Release Branch`/
   `Backport Branch`/`Backport Commits` when set) as a new entry under that system's `##
   Pending Reviews` — every branch and every backport field travels together as one entry, never
   split apart. Status is copied verbatim (`Published` stays `Published`, `Merged` stays `Merged`)
   — a `Merged` entry is **not** reset to anything else on the way into `## Pending Reviews`,
   since the backport branch already exists and still needs its own merge verified; `complete`
   later checks that independently (see `actions/complete.md`).
3. Reset that system's active slot fields to blank (including `Backport Release Branch`/`Backport
   Branch`/`Backport Commits` when set), Status → `Idle`.

Use this when you want to start the next `plan`/`load` for this system while a previous PR (or,
for a `Merged` item, a backport PR) is still open — it does not verify the item actually merged;
`complete` does that later. Other systems' slots are unaffected.
