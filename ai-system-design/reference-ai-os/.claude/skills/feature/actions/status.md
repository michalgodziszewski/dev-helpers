# Action: `status`

`status [--system <system>]`

Read-only overview of in-flight `feature`-skill state across every system at once — the active
work item, everything parked in Pending Reviews, and every staged planning preview. It never
writes, never delegates, and never mutates any state: it only reads the files below and reports
what it finds. It is the whole-workflow counterpart to `plan status`, which covers staged previews
only.

1. Resolve `System` per [`_common.md`](_common.md). With `--system <system>` given, scope the whole
   report to that one system; omitted, report across **every** system — `ai-os` and every
   `projects/<name>` that has any `context/<system>/` state. Repo mode is not needed here: nothing
   runs git, so no `git -C` resolution happens.
2. For each in-scope system, read its `context/<system>/current-feature.md` if present (it is
   gitignored and may be absent — treat a missing file, or a `Status: Idle`/blank slot, as "no
   active item" for that system, not an error):
   - **Active slot**: report `Status`, `Work Branch` (and `Context Work Branch` for own-repo
     systems, when set), and `Source Spec`. Skip the field-by-field dump for an Idle/absent slot —
     just note the system has no active item.
   - **`## Pending Reviews`**: report every entry under that heading, each with its `Status`,
     `Work Branch`, and `Source Spec` (plus `Backport Branch`/`Backport Release Branch` when a
     `Backport Awaiting Review` entry carries them). If there are none, say so plainly for that
     system.
3. For each in-scope system, list every staged preview under `context/<system>/plans/` — each with
   its path, title/name, and Work Type — exactly the same set `plan status` (no live session) would
   surface, but reported here alongside the active slot and Pending Reviews rather than on its own.
   If a system has nothing staged, say so.
4. Present the result grouped by system, so an at-a-glance read shows, per system: the active item
   (or "none"), any Pending Reviews awaiting `complete`/`abandon`, and any previews awaiting
   `plan done`. If nothing is in flight anywhere in scope, say so plainly.

This action is always inline, never delegated, and strictly read-only — it never writes, moves, or
commits `current-feature.md` (which stays gitignored and outside the repo) or any other file, and
adds no new state, status, or flag. It is purely a reporting view over state the other actions own.
