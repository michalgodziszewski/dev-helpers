# Jira Naming

Jira support is local and configurable. It affects work branches, backport branches, proposed commit subjects, and validation of already-created atomic commits.

## Enablement modes

### Required

```md
- **Mode:** required
```

A valid ticket is mandatory. `load` asks only for the ticket when all other metadata is valid but the ticket is missing.

### Optional

```md
- **Mode:** optional
```

A supplied ticket activates Jira naming. No ticket preserves legacy naming.

### Disabled

```md
- **Mode:** disabled
```

A ticket may remain stored for reference, but branch and commit naming ignore it.

## Project key policy

Restrict to company projects:

```md
- **Project Keys:** LSG, BOL
```

Allow any syntactically valid Jira project:

```md
- **Project Keys:**
```

Project keys are compared after uppercase normalization. They must match `^[A-Z][A-Z0-9]*$`.

## Ticket sources and precedence

### Explicit flag

```text
/feature load trunk feature --ticket LSG-12345 "Add account summary"
```

### Specification field

```md
## Git Workflow

- **Workflow:** trunk
- **Work Type:** feature
- **Jira Ticket:** LSG-12345
- **Base Branch:** trunk
```

### Required-mode prompt

If neither source provides a ticket and mode is required, `load` stops and requests only Jira Ticket. It does not write partial state first.

Precedence:

1. explicit flag;
2. spec field;
3. prompt.

## Branch rendering

Default template:

```md
- **Branch Format:** <type>/<ticket>-<name>
```

Examples:

| Type | Ticket | Work name | Branch |
|---|---|---|---|
| `feature` | `LSG-12345` | `account-summary` | `feature/LSG-12345-account-summary` |
| `fix` | `BOL-742` | `payment-timeout` | `fix/BOL-742-payment-timeout` |
| `bugfix` | `APP-90` | `empty-state` | `bugfix/APP-90-empty-state` |
| `hotfix` | `OPS-7` | `login-outage` | `hotfix/OPS-7-login-outage` |
| `chore` | `DEV-88` | `refresh-client` | `chore/DEV-88-refresh-client` |

The template must contain `<type>`, `<ticket>`, and `<name>` exactly once. The rendered branch must pass Git reference validation.

## Avoiding duplicate tickets

If a spec is named `LSG-12345-account-summary.md` or its title begins with `LSG-12345`, load removes the leading ticket before deriving the work name.

Expected:

```text
feature/LSG-12345-account-summary
```

Rejected design:

```text
feature/LSG-12345-lsg-12345-account-summary
```

## Commit rendering

Default template:

```md
- **Commit Format:** <commit-type>: [<ticket>] - <message>
```

Work type mapping:

| Work type | Commit prefix | Example |
|---|---|---|
| `feature` | `feat` | `feat: [LSG-12345] - add account summary` |
| `bugfix` | `fix` | `fix: [LSG-12346] - handle empty response` |
| `fix` | `fix` | `fix: [BOL-742] - correct payment timeout` |
| `hotfix` | `fix` | `fix: [OPS-7] - restore login callback` |
| `chore` | `chore` | `chore: [DEV-88] - refresh generated client` |

The message placeholder must be non-empty and must not duplicate the ticket.

## Existing atomic commits

`publish` validates every selected atomic commit, not only a newly-created commit. Consider:

```text
111aaaa feat: add account summary
222bbbb feat: [LSG-12345] - add summary tests
```

In required mode the first commit is invalid. Publication stops before storing Published Commits or pushing. The skill lists the invalid SHA and expected shape.

It does not run amend, interactive rebase, reset, or force-push automatically. Rewrite history manually only after understanding the branch and team policy.

## Multiple atomic commits

All commits selected for a single work item use the mapped commit type and exact stored ticket:

```text
111aaaa feat: [LSG-12345] - add summary query
222bbbb feat: [LSG-12345] - add summary endpoint
333cccc feat: [LSG-12345] - add summary tests
```

The order is recorded and preserved during backport.

## Backport branch naming

Jira-enabled backport rendering uses:

- `<type>` = `backport`;
- `<ticket>` = the original stored ticket;
- `<name>` = `<work-name>-<release-branch>`.

Example:

```text
backport/LSG-12345-account-summary-release-1.79.0
```

Cherry-picked commits preserve their original compliant subjects and gain the `-x` source reference in the body.

## Legacy item without a ticket

If local Jira mode is required and an older pending item has no Jira Ticket, `backport` asks for a ticket, validates it, and persists it on that exact item before creating the branch.

## Disabled-mode comparison

Specification:

```md
- **Work Type:** feature
- **Jira Ticket:** BOL-742
```

With mode required or optional:

```text
branch: feature/BOL-742-jira-naming-test
commit: feat: [BOL-742] - add Jira naming test
```

With mode disabled:

```text
branch: feature/jira-naming-test
commit: feat: add Jira naming test
```

The ticket can still be visible in local state, but it has no naming effect.

## Invalid configuration examples

### Unknown mode

```md
- **Mode:** enabled
```

Use `required`, `optional`, or `disabled`.

### Missing token

```md
- **Branch Format:** <type>/<name>
```

This is invalid in active Jira modes because `<ticket>` is missing.

### Duplicate token

```md
- **Commit Format:** <commit-type>: [<ticket>] - <ticket> - <message>
```

This is invalid because `<ticket>` appears twice.

### Disallowed project

```md
- **Project Keys:** LSG, BOL
```

`ABC-12` matches the default regex but fails the allowlist.

## Recommended policy checks

Before `start`:

- confirm the normalized ticket;
- confirm the rendered branch;
- confirm the base branch;
- ensure the work name does not repeat the ticket.

Before `publish`:

- confirm current branch equals the rendered branch;
- confirm proposed subject contains the exact ticket once;
- confirm every pre-existing atomic commit follows the same policy;
- confirm no context file is staged.
