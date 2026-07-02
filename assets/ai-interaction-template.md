# AI Interaction Guidelines

## Communication

- Be concise and direct.
- Explain non-obvious decisions briefly.
- Ask before large refactors or architectural changes.
- Do not add features outside the current Goals.
- Never delete files without clarification.

## Git workflows

Use one of two workflows for every work item.

### Trunk workflow

1. Document the work and choose its type.
2. Require a clean working tree except for context/current-feature.md runtime state and its exact local Markdown Source Spec.
3. Fetch origin, switch to trunk, and pull with fast-forward only.
4. Verify local trunk equals origin/trunk.
5. Create the work branch and implement the Goals.
6. Test and review without asking for permission to run checks.
7. Ask once with the combined approval: proposed commit message, ordered atomic commit list, and push target.
8. Push the work branch and merge through GitHub into trunk.
9. When a release needs the change, fetch origin and freshly synchronize the explicit release branch.
10. Create a backport branch from that release branch.
11. Ask once with the combined destructive confirmation (ordered cherry-pick list + backport branch push), then cherry-pick each ordered atomic commit recorded during publish separately and in order with -x, test, and push. Never cherry-pick the GitHub merge or squash commit.
12. Merge the backport through GitHub into the release branch.
13. Verify remote merges before local cleanup.

### Explicit-base workflow

1. Document the work, type, and exact base branch.
2. Require a clean working tree except for context/current-feature.md runtime state and its exact local Markdown Source Spec.
3. Fetch origin, switch to the base, and pull with fast-forward only.
4. Verify the local base equals origin/base.
5. Create the work branch and implement the Goals.
6. Test, review, ask once with the combined commit + push approval, then merge through GitHub into the same base.
7. Verify the remote merge before local cleanup.

Never create a work or backport branch from a stale base. If pull cannot fast-forward or local and remote SHAs differ, stop. Do not auto-stash, reset, rebase, or force-pull.

## Branching

Follow context/feature-config.md. When Jira mode is active, include the validated ticket in every work and backport branch, for example feature/ABC-12345-<name> or fix/XYZ-742-<name>. When disabled, use feature/<name>, bugfix/<name>, fix/<name>, hotfix/<name>, or chore/<name>.

## Commits and pushes

- Commit and push only after the single combined approval (message + atomic commit list + push target).
- Use conventional commit messages. When Jira mode is active, render the configured format, for example fix: [ABC-12345] - correct validation.
- Keep commits focused.
- Do not add AI attribution to commit messages.
- Never merge locally as part of this workflow; GitHub is the merge point.
- Never force-push or push directly to trunk or release branches.

## Testing and review

- Discover repository-specific checks instead of assuming a package manager.
- Run relevant tests, lint, type checks, and builds before publishing, without asking for permission to run them.
- Stop when a required check fails.
- Review security, validation, performance, logic, scope, and secrets.

## Confirmation boundaries

- Routine questions are limited to the combined publish approval. Destructive operations — backport cherry-picks with their push, local branch deletion, discarding work — get one explicit confirmation each.
- Read-only Git commands (status, fetch, diff, log, rev-list, rev-parse) never require a question or acknowledgement.

## When stuck

- After two or three failed attempts, stop and explain the issue.
- Do not try random fixes.
- Ask when requirements or Git state are ambiguous.
