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
7. Run test.md and review.md. Stop on any failure or non-ready verdict. Because review.md delegates the code-quality pass to the code-review subagent, publish inherits that check here; do not spawn the subagent separately. Neither action asks the user anything.
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
- the push target: origin/<work-branch>.

This is the only question publish asks. Approval covers staging, the commit, and the push in one answer. Without approval, stop without committing or pushing.

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
4. Produce:

   https://github.com/<owner>/<repository>/compare/<base-branch>...<work-branch>?expand=1

5. Display Head and Base explicitly.
6. With GitHub CLI, always use:

   gh pr create --base <base-branch> --head <work-branch>

7. If an existing PR targets another branch, stop and require retargeting before merge.

Do not merge locally. Never stage or commit context/.
