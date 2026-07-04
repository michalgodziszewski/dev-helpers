# Backport Action

Backport the exact atomic commits recorded at publish. Never cherry-pick a GitHub merge commit.

## Accepted forms

- For an active trunk item: backport <release-branch> [primary-merge-sha]
- For a pending trunk item: backport <work-branch> <release-branch> [primary-merge-sha]

When the active slot is Idle, require an exact Pending Reviews Work Branch. Never guess when multiple pending items exist.

## Select and verify work

1. Require Workflow trunk and Base Branch trunk.
2. Read the ordered Published Commits list. Accept a legacy singular Published Commit SHA as a one-item list, reporting the migration; the combined cherry-pick confirmation below covers its approval.
3. Run git fetch origin --prune without asking.
4. Verify the primary PR was merged. Delegate this to the git-verify subagent (Agent tool, subagent_type "git-verify"), passing origin/trunk, the ordered Published Commits, and primary-merge-sha when supplied; verify inline with the same commands when the agent is not installed:
   - Require every Published Commit to resolve and be a non-merge commit.
   - Accept when every Published Commit is an ancestor of origin/trunk.
   - For squash or rebase policies where original commits are not ancestors, require primary-merge-sha and verify it is contained in origin/trunk.
5. The primary merge SHA is verification evidence only. Never cherry-pick it.
6. Verification is read-only and never asks a question.

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
8. Ask the user exactly once with the combined destructive confirmation, presenting together: the exact ordered Published Commits with subjects that will be cherry-picked, the backport branch they land on, the push target origin/<backport-branch>, and the exact proposed PR title with a note that approval also creates the pull request via `gh pr create --base <release-branch> --head <backport-branch>` when the GitHub CLI is available. Derive the title from the ordered Published Commits list being cherry-picked: use its sole subject verbatim, or the first (oldest) subject when there is more than one. This is the only question backport asks; approval covers every cherry-pick, the push, and PR creation. Without approval, stop without changing Git state.
9. Cherry-pick each Published Commit separately and in order:

   git cherry-pick -x <published-commit>

10. After each successful cherry-pick, immediately append the new HEAD SHA to the ordered Backport Commits list on the selected item.
11. On conflict:
   - Keep CHERRY_PICK_HEAD and the conflict untouched.
   - Keep the stored release branch, backport branch, and completed Backport Commits.
   - List the failing Published Commit, conflicted paths, completed commits, and remaining commits.
   - Tell the user they may resolve and continue, or use abandon --discard for active work or abandon --discard <work-branch> for exact pending work.
   - Stop. Never skip, abort, resolve, restore, or delete automatically.
12. Run relevant tests and build checks after all commits succeed, delegating to the test subagent when installed. A failed required check stops the push.
13. Push with git push -u origin <backport-branch>. The push was already approved in the combined confirmation; do not ask again.
14. Verify the stored Backport Release Branch, Backport Branch, and ordered Backport Commits match the completed backport.
15. For pending work set Status to Backport Awaiting Review without changing the active slot.
16. For active work set Status to Merged so clear can move it to Pending Reviews with all atomic metadata.

## Backport pull request target

1. The release branch argument is the only valid PR base.
2. Never use the generic Create pull request URL printed by git push.
3. Normalize origin to a GitHub <owner>/<repository> path.
4. Always produce and display, regardless of whether PR creation below runs:

   https://github.com/<owner>/<repository>/compare/<release-branch>...<backport-branch>?expand=1

5. Display Head and Base explicitly. This manual compare URL output never changes; PR creation is additive on top of it, never a replacement.
6. Check whether the GitHub CLI is available and authenticated. When it is not, report exactly why PR creation was skipped — the compare URL above remains the manual path. Never fail the backport because gh is missing or unauthenticated. Status (Merged or Backport Awaiting Review) stays as already set; PR creation never reverts it.
7. When gh is available, check for an existing backport PR (`gh pr view` or `gh pr list --head <backport-branch>`):
   - If one exists, report its URL. If it targets any branch other than the selected release branch, report the mismatch, print the existing PR's URL and current base, and tell the user to retarget it themselves (for example `gh pr edit <number> --base <release-branch>` or the GitHub UI) before merging. Do not attempt to retarget it automatically, and do not treat this as a backport failure.
   - If none exists, create it using the exact title approved in the combined confirmation:

     gh pr create --base <release-branch> --head <backport-branch> --title <title> --body <body>

     - Derive <title>: when exactly one commit was backported, use its subject verbatim; when more than one was backported, use the first (oldest) backported commit's subject as the title and list every backported commit's subject as a bullet in <body>.
     - Use a minimal <body>, extended only with the commit-subject bullet list above when there is more than one backported commit.
     - The title and body must never contain AI attribution of any kind — no "Generated with Claude Code", no "Co-Authored-By: Claude", no robot emoji footer, no mention of AI assistance — matching the no-AI-attribution rule in context/ai-interaction.md. Explicitly pass this title and body rather than relying on gh pr create's interactive defaults, since gh's own templates may otherwise append such a footer.
     - If `gh pr create` fails for any other reason (network error, API error, insufficient permissions, etc.), report the exact error and the compare URL from step 4, and stop here without failing the backport or reverting Status.
8. When a PR was created or found, print its URL next to the compare URL from step 4.

Never push directly to release and never force-push.
