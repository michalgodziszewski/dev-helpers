# AI Interaction Guidelines

System-wide rules for how Claude should behave in AI_System: how to communicate, how to
handle git, and where the boundaries of "just do it" vs. "ask first" are. Applies across the
whole system (all `projects/`, `.claude/`, `wiki/`), on top of whatever a project's own
CLAUDE.md adds.

## Communication

- Be concise and direct.
- Explain non-obvious decisions briefly.
- Ask before large refactors or architectural changes.
- Do not add features outside the current goal.
- Never delete files without clarification.
- All file content, commits, and docs are in English, even when the conversation is in
  Polish.

## Git workflow

AI_System repos are trunk-based on `main` — no release/backport branches, no multi-environment
ceremony. The "no Jira" part of that is about `ai-os`'s own work items specifically:
`projects/<name>` items may optionally carry a Jira ticket via the spec's `Jira Ticket` field
(see the `feature` skill docs), which changes that item's branch/commit naming. Use this workflow
for every work item unless a specific project's own CLAUDE.md overrides it:

1. Require a clean working tree before starting new work (aside from expected runtime/context
   files a project explicitly allows).
2. Fetch origin, switch to `main`, and pull with fast-forward only. Verify local `main`
   matches `origin/main` before branching.
3. Create a work branch off `main`: `feature/<name>`, `fix/<name>`, `bugfix/<name>`,
   `hotfix/<name>`, or `chore/<name>`.
4. Implement the goal on that branch.
5. Test and review without asking for permission to run checks.
6. Ask once with the combined approval: proposed commit message(s), ordered commit list, and
   push target.
7. Push the work branch; merge into `main` through GitHub (PR), not locally.
8. Verify the remote merge before any local branch cleanup.

Never branch from a stale `main`. If a fast-forward pull fails or local/remote SHAs differ,
stop and surface it — do not auto-stash, reset, rebase, or force-pull.

## Commits and pushes

- Commit and push only after the single combined approval (message + commit list + push
  target).
- Use conventional commit messages (`feat:`, `fix:`, `chore:`, ...). Keep commits focused.
- Never add AI/agent attribution or co-authorship anywhere in the Git history or on GitHub —
  not in commit messages, and not in PR or issue titles or descriptions. No `Co-Authored-By`
  trailer, no "Generated with Claude Code" line, no wording that says or implies the work was
  done in cooperation with a coding agent. The history must read as authored by Michal alone.
- Never merge locally as part of this workflow — GitHub is the merge point.
- Never force-push or push directly to `main`.

## Testing and review

- Discover repository-specific checks instead of assuming a package manager or toolchain.
- Run relevant tests, lint, type checks, and builds before publishing, without asking for
  permission to run them.
- Stop when a required check fails — don't paper over it.
- Review for security, validation, performance, logic, scope, and secrets before proposing a
  commit.

## Confirmation boundaries

- Routine questions are limited to the combined publish approval (commit message + commit list
  + push target).
- Destructive operations — discarding work, local branch deletion, force-push, deleting
  files — each get one explicit confirmation, separate from the publish approval.
- Read-only git commands (`status`, `fetch`, `diff`, `log`, `rev-list`, `rev-parse`) never
  require a question or acknowledgement.

## When stuck

- After two or three failed attempts at the same fix, stop and explain the issue instead of
  continuing to try random changes.
- Ask when requirements or git state are ambiguous rather than guessing.
