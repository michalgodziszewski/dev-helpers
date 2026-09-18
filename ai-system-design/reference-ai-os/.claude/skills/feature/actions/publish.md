# Action: `publish`

`publish [--system <system>]`

Commits and pushes the work branch — a single combined approval, required fresh on every call.

1. Resolve `System` (default `ai-os`) and its repo mode per [`_common.md`](_common.md). Requires
   that system's Status `In Progress`.
2. Single combined approval covering **every** branch this publish touches (one for
   `ai-os`/tracked-in-`ai-os`, two for own-repo) — required fresh, as its own distinct turn, on
   **every** `publish` call. This is not a one-time gate: it does not carry forward from a
   different `publish` call on the same work item, and a prior instruction about a *different*
   step given earlier in the conversation (the recurring example: "when review finishes, run
   publish") only authorizes *running* the `publish` action at all — it is not this step's
   approval and does not substitute for it. Show the **exact** proposed commit message text for
   each branch (not a paraphrase or summary; conventional commits, no AI attribution unless
   asked), the file list per commit, the ordered list of atomic commits per branch, and each
   branch's push target — then stop and wait for the user's actual next message. Do not commit or
   push anything before that message arrives; showing this proposal and receiving a response to it
   are two separate turns, never the same one.
   If the loaded spec's `Jira Ticket` is set, format every commit message on every branch touched
   as `<type>: [<TICKET>] - <rest of message>`, where `<type>` is the conventional-commit
   abbreviation for the spec's Work Type: `feature` → `feat`, `fix`/`bugfix`/`hotfix` → `fix`,
   `chore` → `chore`. If `Jira Ticket` is blank, build commit messages exactly as today — no
   `[TICKET]` infix.
3. After approval:
   - `ai-os`/tracked-in-`ai-os`: stage, commit, push the work branch in the resolved repo root.
   - Own-repo: stage/commit/push the code branch in the nested repo (`git -C projects/<name>`)
     *and* the context branch at the AI_System repo root — two separate commit/push operations,
     covered by the one approval from step 2. Note whatever branch is currently checked out at the
     AI_System repo root (could be unrelated concurrent work on the `ai-os` system itself), check
     out the context branch just long enough to commit and push it, then switch back immediately —
     never leave the shared working tree sitting on the context branch afterward. Neither branch
     depends on the other succeeding first, but do both; a partial publish (only one branch
     pushed) must be reported clearly, not silently left half-done.
   Never push to `Base Branch`/`Context Base Branch` directly, and never merge as part of `publish`
   — merging is always a separate, user-controlled step (a GitHub PR in networked mode, a manual
   local merge+push in `local` mode — see step 5), on whichever repo/remote each branch's `origin`
   actually points at (the nested repo's own remote for the code branch, `ai-os`'s remote for the
   context branch).
4. Record the pushed commit list(s): `Published Commits` always; `Context Published Commits` too
   for own-repo. Set Status → `Published`. This is just a local edit to that system's gitignored
   `current-feature.md` — no separate commit needed for it.
5. Remind the user how to land the work — the reminder wording follows the resolved Remote mode
   (per [`_common.md`](_common.md)); the skill performs no merge itself in either mode:
   - **Networked (`github`, the default):** open/merge the PR(s) on GitHub (both, for own-repo —
     they can merge independently, in either order), then run `clear` or `complete` once they're in
     to free that system's slot.
   - **Local:** the local bare `origin` has no PR mechanism, so the merge is manual — checkout
     `<Base Branch>`, merge the work branch into it, and push to the local `origin` — mirroring the
     manual-PR convention exactly (merging stays user-controlled; the skill merges nothing). Then
     run `clear` or `complete` to free the slot. For own-repo, apply this per branch by its own
     remote: the **context branch** (in a local `ai-os`) gets this manual local-merge reminder,
     while the **code branch** still follows its project's remote — a GitHub PR — exactly as today.
