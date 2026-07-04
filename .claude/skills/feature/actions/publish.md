# Publish Action

Publish supports two entry states: Status In Progress (first publication) and Status Published (re-publishing follow-up commits after PR review feedback). Both share the same Jira/branch verification, the same test + review chain, and the same single combined approval; only atomic-list computation and post-approval bookkeeping differ, as called out below.

## Verify work and Jira policy

1. Read local state and require Status In Progress or Published. Any other status (Idle, Not Started, Merged) stops here.
2. Read context/feature-config.md using the exact Jira fields defined by load.md.
3. Determine whether Jira naming is active:
   - active when Mode is required
   - active when Mode is optional and Jira Ticket is populated
   - inactive when Mode is disabled or optional without a ticket
4. When Jira naming is active:
   - Require the stored Jira Ticket to pass Ticket Pattern and the configured Project Keys allowlist.
   - Render Branch Format from Work Type, Jira Ticket, and work name.
   - Require Work Branch and the current branch to equal that exact rendered branch.
5. When Jira naming is inactive, require the current branch to equal Work Branch and require Work Branch not to equal Base Branch.
6. Run git fetch origin --prune once and verify origin/<base-branch> exists. This is the only fetch in the publish chain; test.md and review.md executed as part of publish reuse it and must not fetch again.
7. When Status is Published (re-publish path), also require:
   - origin/<work-branch> exists,
   - origin/<work-branch> is an ancestor of the local Work Branch (`git merge-base --is-ancestor origin/<work-branch> <work-branch>`), i.e. the local branch is a fast-forward ahead of origin with no divergence.
   - If origin/<work-branch> is missing, or is not an ancestor of the local branch (someone pushed commits remotely, or history was rewritten), stop and report the exact divergence. Never resolve it automatically — no merge, rebase, or force-push.
8. Run test.md and review.md. test.md here uses the same changed-file-scoped run as a standalone `/feature test` call — not the complete suite or full build; the pushed branch's CI (e.g. GitHub Actions) is responsible for the whole-repository pass. Stop on any failure or non-ready verdict. Because review.md delegates the code-quality pass to the code-review subagent, publish inherits that check here; do not spawn the subagent separately. Neither action asks the user anything.
9. Show git status --short and a concise diff summary. Exclude context/ completely from staging.

## Prepare the commit and atomic list

1. Map Work Type to the conventional commit type:
   - feature -> feat
   - bugfix -> fix
   - fix -> fix
   - hotfix -> fix
   - chore -> chore
2. Propose a concise commit message.
3. When Jira naming is active, render Commit Format with:
   - <commit-type> = mapped conventional type
   - <ticket> = stored normalized Jira Ticket
   - <message> = concise message without a duplicate ticket
4. When Jira naming is inactive, use the normal conventional commit format.
5. Compute the ordered atomic commit list:
   - Status In Progress (first publication): `git rev-list --reverse --no-merges <work-branch> --not origin/<base-branch>`.
   - Status Published (re-publish): `git rev-list --reverse --no-merges <work-branch> --not origin/<work-branch>` — only the commits made since the last successful publish. The existing Published Commits already recorded in local state are shown as context, never recomputed or reordered.
6. Never use a merge commit, GitHub merge SHA, or combined diff as a Published Commit. The exclusion in step 5 must remove commits introduced by syncing or merging the base branch into the work branch.
7. For every existing SHA (the ones the computation above reports as already on the branch), verify it resolves and is not a merge commit. When Jira naming is active, require each subject to match Commit Format exactly around the <message> placeholder, use the mapped commit type, contain the exact stored ticket once, and contain a non-empty message. If any existing commit violates Jira policy, stop before asking anything. List each invalid SHA and expected subject shape. Never amend, rebase, or force-rewrite commits automatically.
8. Build the final ordered atomic commit list:
   - Status In Progress: the existing valid commits in order, followed by the proposed new commit when uncommitted work exists. Require at least one atomic commit.
   - Status Published: only the new commits computed in step 5 (already-committed follow-up work), followed by the proposed new commit when uncommitted work also exists. Require at least one new atomic commit — publish stops if there is nothing to re-publish.

## Single combined approval

Ask the user exactly once, presenting together:

- the exact proposed commit message for the uncommitted work (when present),
- on the re-publish path, the already-published SHAs from local state shown as context, clearly separated from the final ordered atomic commit list described next,
- the final ordered atomic commit list with SHA and subject for existing (new, on re-publish) commits and a "new" marker for the pending one,
- ignored merge commits on the work branch, so synchronization merges are visible,
- the push target: origin/<work-branch>,
- the exact proposed PR title, and that approval creates the pull request via `gh pr create --base <base-branch> --head <work-branch>` when the GitHub CLI is available on first publication, or updates the existing PR by pushing to the same branch on re-publish. Derive the title from the final ordered atomic commit list above: when a new commit is proposed, use its subject verbatim (the already-rendered Commit Format subject when Jira naming is active); otherwise (no uncommitted work, so no new commit) use the sole existing (new, on re-publish) commit's subject, or the first (oldest) one's subject when there is more than one.

This is the only question publish asks. Approval covers staging, the commit, the push, and PR creation/update in one answer. Without approval, stop without committing, pushing, or creating a PR.

## Execute after approval

1. Stage only work-item files outside context/.
2. Commit once with the approved exact message when uncommitted work exists.
3. Recompute the ordered commit list (using the same base for computation as step 5 above, matching the entry status) to capture the final SHAs. Do not ask again; if the recomputed list differs from the approved list in anything other than the appended new commit's SHA, stop and report the difference.
4. Store the ordered SHAs in local state:
   - Status In Progress: set Published Commits to the recomputed list.
   - Status Published: append the recomputed new SHAs to the existing Published Commits list, in order, without rewriting or reordering the commits already recorded.
5. Run git push -u origin <work-branch> (first publication) or git push origin <work-branch> (re-publish; the upstream is already set).
6. Verify origin/<work-branch> equals the local Work Branch commit.
7. Set Status to Published. On re-publish this is a no-op — Status was already Published — but leaves it explicit for both paths.

## Pull request target

1. Base Branch from local state is the only valid PR target.
2. Never use the generic Create pull request URL printed by git push.
3. Normalize origin to a GitHub <owner>/<repository> path.
4. Always produce and display, regardless of whether PR creation below runs:

   https://github.com/<owner>/<repository>/compare/<base-branch>...<work-branch>?expand=1

5. Display Head and Base explicitly. This manual compare URL output never changes; PR creation is additive on top of it, never a replacement.
6. Check whether the GitHub CLI is available and authenticated (for example `gh auth status`). When it is not, report exactly why PR creation was skipped and stop here — the compare URL above remains the manual path. Never fail publish because gh is missing or unauthenticated. Status stays Published either way; PR creation never reverts a status already set after a successful push.
7. When gh is available, check for an existing PR on the work branch (`gh pr view` or `gh pr list --head <work-branch>`):
   - If one exists, report its URL. Require it to target Base Branch; if it targets any other branch, report the mismatch, print the existing PR's URL and current base, and tell the user to retarget it themselves (for example `gh pr edit <number> --base <base-branch>` or the GitHub UI) before merging. Do not attempt to retarget it automatically, and do not treat this as a publish failure — Status stays Published.
   - If none exists, create it using the exact title approved in the combined approval:

     gh pr create --base <base-branch> --head <work-branch> --title <title> --body <body>

     - <title> is the exact PR title approved in the combined approval.
     - Use a minimal <body>.
     - The title and body must never contain AI attribution of any kind — no "Generated with Claude Code", no "Co-Authored-By: Claude", no robot emoji footer, no mention of AI assistance — matching the no-AI-attribution rule in context/ai-interaction.md. Explicitly pass this title and body rather than relying on gh pr create's interactive defaults, since gh's own templates may otherwise append such a footer.
     - If `gh pr create` fails for any other reason (network error, API error, insufficient permissions, etc.), report the exact error and the compare URL from step 4, and stop here without failing publish or reverting Status.
8. When a PR was created or found, print its URL next to the compare URL from step 4.

Do not merge locally. Never stage or commit context/.
