# Custok Workflow - Project Overview

Custok Workflow is a collection of reusable developer automations and AI skills.

## Skill structure

Each skill uses:

- skills/<name>/SKILL.md as its entry point and action router.
- skills/<name>/actions/<action>.md for concrete procedures.
- context/current-feature.md for active runtime state.

## Feature skill

The feature skill supports two Git workflows.

### Trunk-based work

Create feature, bugfix, hotfix, or chore branches from a freshly synchronized trunk. Publish the work branch to origin and merge it through GitHub. When the merged change is also required in a release, create a separate backport branch from a freshly synchronized release branch and cherry-pick the GitHub merge or squash commit.

Flow: load trunk -> start -> test -> review -> publish -> GitHub merge -> optional backport -> GitHub merge -> complete.

### Explicit-base work

Start from an explicitly named branch, synchronize it with origin, create and publish the work branch, then merge it back through GitHub.

Flow: load branch -> start -> test -> review -> publish -> GitHub merge -> complete.

## Actions

| Action | Purpose |
|---|---|
| load | Load a Markdown spec or inline description, then record its source, workflow, type, base, and goals |
| start | Fetch origin, fast-forward the base, verify SHAs, then create the work branch |
| test | Discover and run relevant repository checks |
| review | Review goals and the merge-base diff |
| explain | Explain changed files and their connections |
| publish | Commit after permission and push the work branch |
| backport | Synchronize a release branch, create a backport branch, cherry-pick, test, and push |
| complete | Verify GitHub merges, update the local base, clean up with permission, and reset state |

## Safety rules

- Never branch from stale local state.
- Never guess a base branch, release branch, or cherry-pick SHA.
- Never auto-stash, force-pull, force-push, or push directly to trunk or release.
- Allow context/current-feature.md and its exact local Markdown Source Spec to be dirty before start; stop on any other dirty file, divergence, failed synchronization, conflicts, or failed required checks.
- Ask before commits, pushes, cherry-picks, and branch deletion.
- GitHub is the merge point.

## Design principles

- Prefer opinionated, repeatable procedures.
- Store runtime state in readable Markdown.
- Keep each action self-contained.
- Use concrete ordered steps instead of vague guidance.
