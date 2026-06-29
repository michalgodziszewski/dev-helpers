<!-- Generated file. Do not edit manually. -->
<!-- Version: 0.1.0 -->

# dev status

Show repository and branch status

## Usage

```text
dev status [--base <branch>] [--fetch]
```

## Options

| Option | Required | Default | Description |
|---|---|---|---|
| `--base <branch>` | No | `trunk` | Base branch to compare against. When omitted, uses `DEV_DEFAULT_BASE_BRANCH` from the environment or `.env` file, falling back to `trunk`. |
| `--fetch` | No | `—` | Fetch from origin before checking status. Without this flag, status uses only local data. |

## Examples

```bash
dev status
```

Show repository status against the default base branch (`DEV_DEFAULT_BASE_BRANCH` or `trunk`).

```bash
dev status --base release-1.78.0
```

Show status compared against `release-1.78.0`.

```bash
dev status --fetch
```

Fetch from origin first, then show status with up-to-date remote data.

```bash
dev status --base release-1.78.0 --fetch
```

Fetch from origin and show status compared against `release-1.78.0`.

## Behavior

- Prints a readable summary of repository path, current branch, base branch, working tree state, tracking branch, remote sync, and ahead/behind counts.
- The command is read-only — it never modifies branches, working tree, or remote state.

## Git Side Effects

- When `--fetch` is provided, runs `git fetch origin --prune` before status checks.
- Without `--fetch`, no network operations are performed.

## Failure Cases

- Current directory is not inside a Git repository.
- Git is not available.
- Fetch fails when `--fetch` is used.
- Base branch cannot be found for comparison.

## Exit Behavior

- **Success:** Exits with code 0.
- **Failure:** Exits with code 1 and prints the error. Partial output may be shown before the error when possible.
