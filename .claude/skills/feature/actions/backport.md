# Backport Action

Backport the exact atomic commits recorded at publish. Never cherry-pick a GitHub merge commit.

## Accepted forms

- For an active trunk item: backport <release-branch> [primary-merge-sha]
- For a pending trunk item: backport <work-branch> <release-branch> [primary-merge-sha]

When the active slot is Idle, require an exact Pending Reviews Work Branch. Never guess when multiple pending items exist.

## Select and verify work

1. Require Workflow trunk and Base Branch trunk.
2. Read the ordered Published Commits list. Accept legacy Published Commit SHA as a one-item list only after confirmation.
3. Require every Published Commit to resolve and be a non-merge commit.
4. Run git fetch origin --prune.
5. Verify the primary PR was merged:
   - Accept when every Published Commit is an ancestor of origin/trunk.
   - For squash or rebase policies where original commits are not ancestors, require primary-merge-sha and verify it is contained in origin/trunk.
6. The primary merge SHA is verification evidence only. Never cherry-pick it.

## Create atomic backport

1. Require a clean working tree outside context/.
2. Verify origin/<release-branch> exists.
3. Switch to the local release branch, creating its tracking branch when absent.
4. Run git pull --ff-only origin <release-branch>.
5. Verify local release equals origin/<release-branch>.
6. Derive the backport branch:
   - Read Jira Ticket from the selected item and Jira configuration from context/feature-config.md.
   - Jira naming is active when Mode is required, or when Mode is optional and the selected item has a ticket.
   - In required mode, when a legacy selected item has no Jira Ticket, ask only for the ticket, validate it, and persist it on that exact item before creating a branch.
   - When Jira naming is active, validate the stored ticket and render Branch Format with <type> = backport, <ticket> = the stored ticket, and <name> = <work-name>-<release-branch>.
   - When Mode is disabled or optional without a ticket, use backport/<work-name>-<release-branch>.
   - Require the result to pass git check-ref-format --branch, then create it.
7. Immediately store Backport Release Branch and Backport Branch on the selected item and initialize Backport Commits as empty. Persist this metadata before asking or cherry-picking so conflict cleanup can identify the exact branch. Preserve every unrelated active and pending item.
8. Show the exact ordered Published Commits with subjects and ask before cherry-picking and pushing.
9. Cherry-pick each Published Commit separately and in order:

   git cherry-pick -x <published-commit>

10. After each successful cherry-pick, immediately append the new HEAD SHA to the ordered Backport Commits list on the selected item.
11. On conflict:
   - Keep CHERRY_PICK_HEAD and the conflict untouched.
   - Keep the stored release branch, backport branch, and completed Backport Commits.
   - List the failing Published Commit, conflicted paths, completed commits, and remaining commits.
   - Tell the user they may resolve and continue, or use abandon --discard for active work or abandon --discard <work-branch> for exact pending work.
   - Stop. Never skip, abort, resolve, restore, or delete automatically.
12. Run relevant tests and build checks after all commits succeed.
13. Push with git push -u origin <backport-branch>.
14. Verify the stored Backport Release Branch, Backport Branch, and ordered Backport Commits match the completed backport.
15. For pending work set Status to Backport Awaiting Review without changing the active slot.
16. For active work set Status to Merged so clear can move it to Pending Reviews with all atomic metadata.

## Backport pull request target

1. The release branch argument is the only valid PR base.
2. Never use the generic Create pull request URL printed by git push.
3. Normalize origin to a GitHub <owner>/<repository> path.
4. Produce:

   https://github.com/<owner>/<repository>/compare/<release-branch>...<backport-branch>?expand=1

5. Display Head and Base explicitly.
6. With GitHub CLI, always use:

   gh pr create --base <release-branch> --head <backport-branch>

7. If an existing backport PR targets main, trunk, or any branch other than the selected release branch, stop and require retargeting before merge.

Never push directly to release and never force-push.
