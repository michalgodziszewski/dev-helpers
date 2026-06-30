# Code Review Subagent

A specialized Claude Code subagent that reviews code changes against project conventions, architecture patterns, safety invariants, and quality gates. It is read-only and never modifies files or performs git write operations.

**Definition:** `.claude/agents/code-review.md`

## When to use

Spawn this subagent:

- After implementing changes, before `/feature publish`.
- When you want a deeper structural review beyond `/feature review` (which checks goal completeness and diff scope).
- When you want an independent convention check on a specific set of changes.

## How to spawn

Use the Agent tool with `subagent_type: "code-review"`:

```
Agent({
  description: "Code review of current changes",
  subagent_type: "code-review",
  prompt: "Review the work branch feature/my-branch against base branch main. Goals: ..."
})
```

The prompt must include:

| Field | Required | Source |
|---|---|---|
| Base branch | Yes | `context/current-feature.md` or user input |
| Work branch | Yes | `context/current-feature.md` or user input |
| Goals | Yes | `context/current-feature.md` or user input |
| Scope filter | No | User input — limits review to specific categories |

## Model

Uses the **Sonnet** model (`model: "sonnet"`) for cost efficiency. Code review does not require Opus reasoning depth and benefits from faster execution on large diffs.

## Tools

| Tool | Purpose |
|---|---|
| Read | Read full file contents for context beyond the diff |
| Grep | Search for patterns across the codebase |
| Glob | Find files by name patterns |
| Bash | **Read-only git commands only** — `git fetch`, `git diff`, `git log`, `git status`, `git rev-parse`, `git check-ref-format`, `git show`, `git branch --list` |

The subagent cannot use Edit, Write, NotebookEdit, or Agent.

## Constraints

- Strictly read-only — never modifies files.
- Never commits, pushes, merges, cherry-picks, deletes branches, or resets state.
- Bash usage limited to read-only git commands listed above.
- Reports issues with concrete fix suggestions but does not apply them.
- Does not run tests (handled by `/feature test`).
- Does not check goal completeness (handled by `/feature review`).
- Focuses on conventions, patterns, safety, and code quality — not functional correctness.

## Review procedure

1. **Determine the diff** — Fetches origin, diffs the work branch against the base using three-dot syntax. If the work branch is not yet pushed, uses the local branch and flags this in the report.
2. **Classify changes** — Partitions changed files into categories (CLI commands, infrastructure, skill definitions, tests, documentation, configuration, etc.).
3. **Run applicable checks** — Executes every relevant check from a 17-item checklist. Skips checks for categories with no changed files.

## Review checklist

| # | Check | Triggered by |
|---|---|---|
| 1 | Registry and handler sync | `src/cli/commands/**`, `command-registry.ts`, `bin/dev.ts` |
| 2 | Command implementation pattern | `src/cli/commands/**` |
| 3 | Argument parsing | `src/cli/commands/**` |
| 4 | Error handling | Any `src/**` file |
| 5 | Console output formatting | Any file producing terminal output |
| 6 | Git client usage | `src/cli/git/git-client.ts` or callers |
| 7 | Naming and validation | `src/cli/naming/**`, `src/cli/utils/**` |
| 8 | Environment and configuration | `src/cli/config/**`, `.env` |
| 9 | Test quality | `tests/**` or new source files without tests |
| 10 | Documentation sync | `command-registry.ts`, `src/cli/commands/**`, `docs/**` |
| 11 | TypeScript strictness | Any `.ts` file |
| 12 | Safety invariants | Git operation or workflow state code |
| 13 | Skill definition quality | `.claude/skills/**`, `.claude/agents/**` |
| 14 | Feature skill installer | `src/cli/feature-skill-install/**` |
| 15 | Code quality and hygiene | Always |
| 16 | Scope and intent | Always |
| 17 | Dependencies and configuration | `package.json`, `tsconfig.json` |

## Output format

The subagent produces a structured report:

```
## Code Review Report

### Summary
<one paragraph: what the changes do, overall assessment>

### Verdict: <Ready to publish | Needs changes>

### Findings

#### Critical (must fix before publish)
- [ ] <finding with file:line reference>

#### Warnings (should fix, judgment call)
- [ ] <finding with file:line reference>

#### Notes (informational, no action required)
- <observation>

### Checks passed
- <list of checks that passed cleanly>
```

### Verdict rules

- **Ready to publish** — Zero critical findings. Warnings are acceptable.
- **Needs changes** — One or more critical findings, each with a concrete fix suggestion.

## Relationship to other actions

| Action | Purpose | Overlap |
|---|---|---|
| `/feature review` | Goal completeness, diff scope, branch safety | None — complementary |
| `/feature test` | Run tests, lint, type checks, build | None — subagent does not run tests |
| Code review subagent | Convention enforcement, code quality, safety patterns | Deeper structural analysis |
