# Publish Action

## Verify work and Jira policy

1. Read local state and require Status In Progress.
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
7. Run test.md and review.md. test.md here uses the same changed-file-scoped run as a standalone `/feature test` call — not the complete suite or full build; the pushed branch's CI (e.g. GitHub Actions) is responsible for the whole-repository pass. Stop on any failure or non-ready verdict. Because review.md delegates the code-quality pass to the code-review subagent, publish inherits that check here; do not spawn the subagent separately. Neither action asks the user anything.
8. Show git status --short and a concise diff summary. Exclude context/ completely from staging.

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
5. Compute the ordered feature-only commits already on the branch:

   git rev-list --reverse --no-merges <work-branch> --not origin/<base-branch>

6. Never use a merge commit, GitHub merge SHA, or combined diff as a Published Commit. The --not origin/<base-branch> exclusion must remove commits introduced by syncing or merging the base branch into the work branch.
7. For every existing SHA, verify it resolves and is not a merge commit. When Jira naming is active, require each subject to match Commit Format exactly around the <message> placeholder, use the mapped commit type, contain the exact stored ticket once, and contain a non-empty message. If any existing commit violates Jira policy, stop before asking anything. List each invalid SHA and expected subject shape. Never amend, rebase, or force-rewrite commits automatically.
8. Build the final ordered atomic commit list: the existing valid commits in order, followed by the proposed new commit when uncommitted work exists. Require at least one atomic commit.

## Single combined approval

Ask the user exactly once, presenting together:

- the exact proposed commit message for the uncommitted work (when present),
- the final ordered atomic commit list with SHA and subject for existing commits and a "new" marker for the pending one,
- ignored merge commits on the work branch, so synchronization merges are visible,
- the push target: origin/<work-branch>,
- the exact proposed PR title, and that approval creates the pull request via `gh pr create --base <base-branch> --head <work-branch>` when the GitHub CLI is available. Derive the title from the final ordered atomic commit list above: when a new commit is proposed, use its subject verbatim (the already-rendered Commit Format subject when Jira naming is active); otherwise (no uncommitted work, so no new commit) use the sole existing commit's subject, or the first (oldest) existing commit's subject when there is more than one.

This is the only question publish asks. Approval covers staging, the commit, the push, and PR creation in one answer. Without approval, stop without committing, pushing, or creating a PR.

## Execute after approval

1. Stage only work-item files outside context/.
2. Commit once with the approved exact message when uncommitted work exists.
3. Recompute the ordered commit list to capture the final SHAs. Do not ask again; if the recomputed list differs from the approved list in anything other than the appended new commit's SHA, stop and report the difference.
4. Store the ordered SHAs as Published Commits in local state.
5. Run git push -u origin <work-branch>.
6. Verify origin/<work-branch> equals the local Work Branch commit.
7. Set Status to Published.

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
