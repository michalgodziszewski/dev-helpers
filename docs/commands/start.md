<!-- Generated file. Do not edit manually. -->
<!-- Version: 0.1.0 -->

# dev start

Create a Git work branch from a synchronized base

## Usage

```text
dev start <TICKET> [description] [--type <type>] [--base <branch>]
```

## Arguments

| Argument | Required | Description |
|---|---|---|
| `TICKET` | Yes | Jira ticket identifier (e.g. LSG-12345). Normalized to uppercase. Must match the pattern: one or more uppercase letters, a hyphen, and one or more digits starting with a non-zero digit. |
| `description` | No | Optional description words appended to the branch name as a lowercase kebab-case slug. Quoted multi-word strings are split on whitespace. A description that becomes empty after normalization is treated as omitted. |

## Options

| Option | Required | Default | Description |
|---|---|---|---|
| `--type <type>` | No | `feature` | Work type used as the branch prefix. Allowed values: `feature`, `bugfix`, `fix`, `hotfix`, `chore`. |
| `--base <branch>` | No | `main` | Base branch to synchronize and branch from. Validated with `git check-ref-format --branch`. Must exist on origin. |

## Examples

```bash
dev start LSG-12345
```

Creates `feature/LSG-12345` from `main`.

```bash
dev start LSG-12345 "add user search"
```

Creates `feature/LSG-12345-add-user-search` from `main`.

```bash
dev start LSG-12346 --base release-1.78.0
```

Creates `feature/LSG-12346` from the freshly updated `release-1.78.0`.

```bash
dev start LSG-12347 "fix release behavior" --base release-1.78.0
```

Creates `feature/LSG-12347-fix-release-behavior` from `release-1.78.0`.

```bash
dev start LSG-12348 "fix timeout" --type fix --base release-1.78.0
```

Creates `fix/LSG-12348-fix-timeout` from `release-1.78.0`.

## Behavior

- The new branch is created locally and checked out.
- The branch is not automatically pushed to origin.
- Success output shows the updated base branch (with short SHA) and the created branch name.

## Git Side Effects

- Runs `git fetch origin --prune` to update remote tracking references.
- Switches to the resolved base branch.
- Runs `git pull --ff-only` to fast-forward the base branch.
- If the base branch does not exist locally but exists on origin, creates a local tracking branch.
- Creates a new local branch from the freshly updated base.

## Failure Cases

- Missing or invalid ticket format stops the command before any Git operation.
- Any tracked, untracked, staged, or unstaged change outside `context/` blocks branch creation. Changes inside `context/` are ignored.
- An existing local target branch stops creation.
- An existing remote target branch (detected via `origin/<branch>`) stops creation.
- An invalid `--base` value (fails `git check-ref-format --branch`) stops the command.
- A base branch that does not exist on origin stops the command.
- A diverged base branch that cannot fast-forward stops the command. The base is never merged, rebased, or force-pulled.
- A missing `--type` or `--base` value stops the command.
- An unrecognized `--type` value stops the command.

## Exit Behavior

- **Success:** Exits with code 0.
- **Failure:** Exits with code 1 and prints the failed operation. Never claims a branch was created on failure.
