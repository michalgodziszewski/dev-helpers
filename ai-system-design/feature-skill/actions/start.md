# Action: `start`

`start [--system <system>]`

Creates the work branch and implements the loaded spec's Goals.

1. Resolve `System` (default `ai-os`) and its repo mode per [`_common.md`](_common.md). Requires
   that system's `current-feature.md` Status `Not Started`.
2. Requires a clean working tree (per `.claude/GUIDELINES.md`) — stop and report if not. For
   `ai-os`/tracked-in-`ai-os`, that's the AI_System repo root. For own-repo, **both** repos must be
   clean: the nested repo (`git -C projects/<name> status`) and the AI_System repo root itself
   (since own-repo now also creates a branch there) — check both before creating anything.
3. `ai-os`/tracked-in-`ai-os` (single branch): `git fetch origin`, `git checkout <Base Branch>`,
   `git pull --ff-only origin <Base Branch>`, then verify local `<Base Branch>` matches
   `origin/<Base Branch>`. Run these as separate steps, not one chained script — verify state
   between them. If the fast-forward fails or SHAs differ, stop and surface it; never auto-stash,
   reset, rebase, or force-pull. Then create the work branch off `<Base Branch>`:
   `<work-type>/<name>` (`feature/`, `fix/`, `bugfix/`, `hotfix/`, or `chore/`, per
   `.claude/GUIDELINES.md`) — or, if the loaded spec's `Jira Ticket` is set,
   `<work-type>/<TICKET>-<name>` instead. Record it as Work Branch.
4. Own-repo (two branches): repeat the same fetch/checkout/pull/verify sequence **independently
   for each** — `git -C projects/<name> ...` against `<Base Branch>` for the code branch, plain
   `git` at the AI_System repo root against `Context Base Branch` for the context branch. Create
   the code branch (`<work-type>/<name>`, or `<work-type>/<TICKET>-<name>` if `Jira Ticket` is
   set) in the nested repo off `Base Branch`, record it as Work Branch; create the context branch
   (`<work-type>/<name>-context`, or `<work-type>/<TICKET>-<name>-context` with the same ticket)
   in the AI_System repo off `Context Base Branch`, record it as Context Work Branch. Neither
   branch's creation depends on the other having succeeded first, but verify both independently —
   never assume one implies the other is in a good state. Note which branch was checked out at the
   AI_System repo root *before* this step (e.g. another system's own in-progress work) and switch
   back to it immediately after creating the context branch — never leave the shared `ai-os` working tree
   sitting on the new context branch, since that could silently get in the way of unrelated
   concurrent work on the `ai-os` system itself. `publish` re-checks-out the context branch only
   when it's actually ready to commit there.
5. Read the spec's Goals section. For tracked-in-`ai-os` mode, scope implementation changes to
   files under `projects/<name>/` (plus this system's own `context/<system>/` state, which rides
   along on the same branch) — never touch unrelated parts of the `ai-os` repo as part of this
   work item. For own-repo mode, implementation happens entirely on the code branch (in the nested
   repo); the context branch only ever receives `context/<system>/` files, never application code.
6. Before invoking `feature-implementer`, build a TaskCreate checklist: one task per Goal in the
   spec's Goals section.
7. Delegate implementation to the `feature-implementer` agent (`.claude/agents/feature-implementer.md`
   — see step 8 if it's missing): invoke it with the resolved repo root, the
   spec's Goals (and enough Description/Constraints for context), and that system's
   `project-overview.md`/`coding-standards.md` content as its brief (`ai-os` has no
   `coding-standards.md`) — brief it like a smart colleague per this session's own Agent-tool
   guidance, don't just say "implement the spec." Read its summary back when it reports, then
   reconcile the checklist from the previous step against what that summary says: TaskUpdate each
   Goal's task to `completed` only when the summary confirms that Goal was addressed. If the
   summary is ambiguous about a particular Goal, leave that Goal's task `in_progress` and flag the
   ambiguity when reporting back to the user, rather than marking it completed on a guess.
8. If `.claude/agents/feature-implementer.md` is missing, report that the required
   `feature-implementer` agent is not installed and stop — there is no inline implementation path.
   The agent ships with this repo and is always installed, so this is an error condition, not a
   routine branch.
9. Set Status → `In Progress`.
