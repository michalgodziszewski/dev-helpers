# Feature Skill Documentation

The `feature` skill manages Git work from specification loading through branch creation, publication, optional release backporting, and verified completion. It supports trunk-based development and work based on any explicit remote branch.

This documentation describes the behavior implemented by `.claude/skills/feature/SKILL.md` and the action files under `.claude/skills/feature/actions/`.

## Core guarantees

- A work branch is created only after its base branch is fetched, fast-forwarded, and verified against `origin`.
- The base branch is never guessed.
- Files under `context/` are local runtime data and are never staged or committed.
- Jira ticket rules can be required, optional, or disabled.
- Published commits are recorded as an ordered list of atomic, non-merge commits.
- Backports cherry-pick those atomic commits individually and in order.
- Pull requests target the recorded base branch, not the repository default by assumption.
- Destructive cleanup requires explicit confirmation.
- Routine interaction is minimal: publish asks once (commit message + atomic commit list + push target), backport asks once (cherry-pick list + push), and read-only Git commands never prompt.
- Read-only or self-contained work is delegated to installed subagents (code-review, test, explain, git-verify, plan-research, docs-sync); every delegation degrades gracefully to inline execution.
- Remote branches and pull requests are never deleted automatically.

## Documentation map

| Document | Use it for |
|---|---|
| [Planning](planning.md) | Iterative `plan` workflow, preview specs, numbering, screenshots, and finalization |
| [Configuration](configuration.md) | Local context files, Jira modes, templates, work types, and specification metadata |
| [State model](state-model.md) | Active statuses, Pending Reviews, History, and lifecycle transitions |
| [Workflows](workflows.md) | End-to-end trunk, explicit-base, review queue, and backport flows |
| [Action reference](action-reference.md) | Exact command forms, preconditions, side effects, and stop conditions |
| [Jira naming](jira-naming.md) | Ticket validation, branch templates, commit templates, and examples |
| [Scenarios](scenarios.md) | Copyable examples for common and unusual situations |
| [Safety and recovery](safety-and-recovery.md) | Dirty trees, divergence, conflicts, abandonment, and branch safety |
| [Troubleshooting](troubleshooting.md) | Symptoms, likely causes, checks, and recovery steps |

## Prerequisites

- A Git repository with an `origin` remote.
- The selected base branch must exist as `origin/<base-branch>`.
- Claude Code must be able to discover `.claude/skills/feature/SKILL.md`.
- Git credentials must allow fetch and push when those actions are requested.
- GitHub CLI is optional. When available, the skill can use `gh pr create` with explicit head and base branches.
- Repository-specific test, lint, type-check, and build tools must already be configured. The skill does not install dependencies without permission.

## Mental model

The skill tracks one active item and any number of published items waiting for review.

```text
Active slot: Idle -> Not Started -> In Progress -> Published -> Merged
                                      |              |
                                      | clear        | clear
                                      v              v
                              Pending Reviews queue
                                      |
                                      | complete after verified merge
                                      v
                                   History
```

`clear` frees the active slot without claiming that GitHub merged anything. `complete` verifies remote ancestry before recording completion.

## Quick start: Jira-enabled trunk feature

Assume `context/feature-config.md` uses `Mode: required` and accepts project key `LSG`.

```text
/feature load trunk feature --ticket LSG-12345 "Add account summary"
/feature start
/feature test
/feature review
/feature publish
```

With the default templates, the branch is:

```text
feature/LSG-12345-add-account-summary
```

The proposed commit subject is:

```text
feat: [LSG-12345] - add account summary
```

After GitHub merges the pull request:

```text
/feature complete
```

## Quick start: explicit-base fix

```text
/feature load branch release-1.80.0 fix --ticket BOL-742 context/fixes/payment-timeout.md
/feature start
/feature test
/feature review
/feature publish
```

The pull request base must be `release-1.80.0`, because that is the recorded base. This workflow does not automatically backport anything.

## Quick start: continue working while review is pending

```text
/feature publish
/feature clear
/feature load trunk feature --ticket LSG-12346 next-task
/feature start
```

The first item remains in Pending Reviews. Later, complete it by exact branch name:

```text
/feature complete feature/LSG-12345-add-account-summary
```

## Quick start: trunk backport

After trunk work is merged:

```text
/feature backport release-1.79.0
```

The skill verifies the primary merge, synchronizes the release branch, creates a backport branch, and cherry-picks every recorded Published Commit separately with `-x`.

## What the skill deliberately does not do

- It does not merge pull requests locally.
- It does not guess `main`, `trunk`, a release branch, or a merge SHA.
- It does not auto-stash local changes.
- It does not reset, force-pull, force-push, or silently rebase.
- It does not cherry-pick a GitHub merge commit for a backport.
- It does not delete remote branches or close pull requests.
- It does not stage any file under `context/`.
- It does not generate the complete `context/` directory itself — that is the job of the `dev feature-skill-install` CLI command, which scaffolds context files and subagents from the package-root `assets/`.

## Command notation

Examples show commands as `/feature <action> ...`, which is how a user normally invokes the skill in Claude Code. The action files use the shorter form, such as `load`, `start`, or `publish`.

Angle-bracket values are placeholders:

- `<type>`: `feature`, `bugfix`, `fix`, `hotfix`, or `chore`
- `<ticket>`: a Jira ticket such as `LSG-12345`
- `<base-branch>`: a real branch such as `trunk` or `release-1.80.0`
- `<work-branch>`: the exact branch recorded in local state
- `<primary-merge-sha>`: a merge, squash, or rebase result used only as verification evidence
- `<backport-merge-sha>`: equivalent verification evidence for the release branch

Continue with [Configuration](configuration.md) before using the skill in a new repository.
