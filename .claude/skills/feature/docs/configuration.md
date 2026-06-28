# Configuration

The feature skill separates tracked skill behavior from ignored, personal runtime configuration.

## Local files

| Path | Purpose | Tracked |
|---|---|---|
| `context/feature-config.md` | Jira policy and naming templates | No |
| `context/current-feature.md` | Active item, pending reviews, and history | No |
| `context/project-overview.md` | Project-specific architecture and commands | No |
| `context/coding-standards.md` | Selected coding conventions | No |
| `context/ai-interaction.md` | Local AI collaboration rules | No |
| `context/features/` | Personal feature specifications | No |
| `context/fixes/` | Personal fix specifications | No |
| `context/screenshots/` | Personal screenshots used during work | No |

The repository should ignore `/context/`. The skill must never stage or commit anything below that directory.

## Configuration bootstrap

When `load` runs and `context/feature-config.md` does not exist, it copies:

```text
.claude/skills/feature/assets/feature-config-template.md
```

The current tracked template is:

```md
# Feature Configuration

## Jira

- **Mode:** required
- **Project Keys:**
- **Ticket Pattern:** ^[A-Z][A-Z0-9]*-[1-9][0-9]*$
- **Branch Format:** <type>/<ticket>-<name>
- **Commit Format:** <commit-type>: [<ticket>] - <message>
```

An empty `Project Keys` value accepts every project key that matches the ticket pattern.

## Jira fields

### Mode

`Mode` accepts exactly three values.

| Mode | Ticket required | Jira naming applied |
|---|---:|---:|
| `required` | Yes | Always |
| `optional` | No | Only when a ticket is supplied |
| `disabled` | No | Never |

In disabled mode a ticket may remain in the specification or local state for reference, but it must not affect branch or commit naming.

### Project Keys

`Project Keys` is a comma-separated allowlist. Values are normalized to uppercase.

```md
- **Project Keys:** LSG, BOL
```

Accepted tickets include `LSG-12345` and `BOL-742`. `ABC-10` is rejected even when it matches the regular expression, because `ABC` is not in the allowlist.

Use an empty value to accept all matching project keys:

```md
- **Project Keys:**
```

### Ticket Pattern

The default pattern requires:

- an uppercase letter at the start;
- zero or more uppercase letters or digits in the project key;
- one hyphen;
- a positive integer that does not begin with zero.

Examples:

| Ticket | Default pattern |
|---|---:|
| `LSG-12345` | Valid |
| `BOL-742` | Valid |
| `abc-12` | Invalid until normalized; `load` normalizes a resolved ticket to uppercase |
| `LSG-0` | Invalid |
| `LSG-012` | Invalid |
| `LSG123` | Invalid |

The configured pattern must compile. A malformed pattern stops `load` before state is updated.

### Branch Format

When Jira naming is active, `Branch Format` must contain each token exactly once:

- `<type>`
- `<ticket>`
- `<name>`

Default:

```md
- **Branch Format:** <type>/<ticket>-<name>
```

Example rendering:

```text
type    = feature
ticket  = LSG-12345
name    = add-account-summary
result  = feature/LSG-12345-add-account-summary
```

The final branch name must pass `git check-ref-format --branch` before the skill changes branches.

### Commit Format

When Jira naming is active, `Commit Format` must contain each token exactly once:

- `<commit-type>`
- `<ticket>`
- `<message>`

Default:

```md
- **Commit Format:** <commit-type>: [<ticket>] - <message>
```

The work type maps to a conventional commit type:

| Work type | Commit type |
|---|---|
| `feature` | `feat` |
| `bugfix` | `fix` |
| `fix` | `fix` |
| `hotfix` | `fix` |
| `chore` | `chore` |

Examples:

```text
feature + LSG-12345 -> feat: [LSG-12345] - add account summary
fix     + BOL-742   -> fix: [BOL-742] - correct payment timeout
chore   + OPS-19    -> chore: [OPS-19] - refresh generated client
```

Every atomic commit selected by `publish` must follow the configured shape. A non-compliant existing commit stops publication before push. The skill never rewrites history automatically.

## Supplying a Jira ticket

A ticket can come from an explicit command flag:

```text
/feature load trunk feature --ticket LSG-12345 account-summary
```

or from a Markdown specification:

```md
# Account Summary

## Git Workflow

- **Workflow:** trunk
- **Work Type:** feature
- **Jira Ticket:** LSG-12345
- **Base Branch:** trunk
```

Precedence is:

1. explicit `--ticket` argument;
2. `Jira Ticket` parsed from the specification;
3. a user prompt when mode is required.

`load` normalizes the resolved ticket to uppercase. If the specification title already starts with that ticket, the ticket and following separators are removed before the work name is derived. This prevents branches such as `feature/LSG-12345-lsg-12345-account-summary`.

## Work specification lookup

For a filename-like source, `load` searches:

1. the provided path;
2. `context/features/<name>.md`;
3. `context/fixes/<name>.md`;
4. the same paths with `.md` appended.

A one-token filename-like value that cannot be found is an error. A multi-word source that does not resolve to a file is treated as an inline description.

## Specification example

```md
# Payment Timeout

## Git Workflow

- **Workflow:** branch
- **Work Type:** fix
- **Jira Ticket:** BOL-742
- **Base Branch:** release-1.80.0

## Description

Correct timeout handling for payment status polling.

## Goals

- Preserve successful responses.
- Retry transient timeouts once.
- Add focused tests.

## Constraints

- Do not change the public API.

## Acceptance Criteria

- Existing success tests pass.
- Timeout tests cover retry and final failure.
```

## Context templates

The skill currently contains:

- `assets/ai-interaction-template.md`
- `assets/coding-standards-nextjs-template.md`
- `assets/project-overview-template.md`
- `assets/current-feature-template.md`
- `assets/feature-config-template.md`
- `assets/feature-spec-template.md`

A future context initialization action is planned to:

1. copy the AI interaction template;
2. discover `coding-standards-<stack>-template.md` variants;
3. ask the user which coding standards variant to use;
4. copy it to `context/coding-standards.md`;
5. inspect the repository and fill the project overview;
6. ensure `/context/` is in `.gitignore`.

This initialization action is not currently listed as a supported command. Do not assume it exists.

## Recommended local configurations

### Company repository with mandatory Jira

```md
- **Mode:** required
- **Project Keys:** LSG, BOL
- **Ticket Pattern:** ^[A-Z][A-Z0-9]*-[1-9][0-9]*$
- **Branch Format:** <type>/<ticket>-<name>
- **Commit Format:** <commit-type>: [<ticket>] - <message>
```

### Personal repository without Jira

```md
- **Mode:** disabled
- **Project Keys:**
- **Ticket Pattern:** ^[A-Z][A-Z0-9]*-[1-9][0-9]*$
- **Branch Format:** <type>/<ticket>-<name>
- **Commit Format:** <commit-type>: [<ticket>] - <message>
```

### Mixed repository

Use `optional` when some branches require tickets and others do not. A supplied ticket activates both branch and commit templates; an omitted ticket preserves legacy names.
