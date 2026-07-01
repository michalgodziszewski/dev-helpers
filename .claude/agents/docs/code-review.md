# Code Review Subagent

A minimal, read-only Claude Code subagent that reviews changed files in the working tree and reports practical issues only. It never modifies files or performs git write operations.

**Definition:** `.claude/agents/code-review.md`

## When to use

Spawn this subagent:

- Automatically as the delegated code-quality pass of `/feature review` (and therefore `/feature publish`, which runs `review.md` before committing). The `review` action spawns it as a stack-agnostic black box and folds its findings into the single verdict.
- Directly, after implementing changes, when you want an independent practical review of the current working-tree changes.
- When you want a quick check for debug leftovers, unused code, or unsafe shell patterns.

## How to spawn

Use the Agent tool with `subagent_type: "code-review"`:

```
Agent({
  description: "Code review of current changes",
  subagent_type: "code-review",
  prompt: "Review the current working-tree changes and report practical issues."
})
```

The subagent reviews the local diff. No branch or goal metadata is required — it inspects the working tree directly with read-only git commands.

## Model

Uses the **Sonnet** model (`model: "sonnet"`) for cost efficiency. Code review does not require Opus reasoning depth and benefits from faster execution on large diffs.

## Tools

| Tool | Purpose |
|---|---|
| Read | Read full file contents for context beyond the diff |
| Grep | Search for patterns across the codebase |
| Glob | Find files by name patterns |
| Bash | **Read-only inspection only** — see the allowed commands below |

The subagent cannot use Edit, Write, NotebookEdit, or Agent.

### Allowed Bash commands

```bash
git status --short
git diff --stat
git diff
git diff --cached --stat
git diff --cached
git ls-files
grep -R "console\.\|debugger\|TODO\|FIXME\|HACK\|XXX" . --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=dist
```

No other Bash commands are run.

## Constraints

- Strictly read-only — never modifies, creates, or deletes files.
- Never commits, pushes, merges, cherry-picks, checks out, resets, or cleans state.
- Bash usage limited to the read-only inspection commands listed above.
- Reports issues with concrete fix suggestions but does not apply them.
- Does not run tests (handled by `/feature test`).
- Does not check goal completeness (handled by `/feature review`).

## Scope

Focuses on:

- TypeScript / JavaScript correctness and obvious runtime bugs
- simple code quality
- unused code and unused imports
- debug leftovers
- unsafe shell script patterns
- confusing Markdown/spec issues

Does not review:

- feature goal completeness
- business logic correctness
- release readiness
- test execution
- full architecture
- documentation generation
- git workflow correctness unless the changed code directly touches git behavior

## Review procedure

1. Inspect changed files using `git status --short`.
2. Inspect the diff using `git diff` and, if needed, `git diff --cached`.
3. Read changed files when the diff alone is not enough.
4. Report only concrete issues.
5. Keep the review short, and avoid suggesting large rewrites unless there is a real problem.

## Output format

Findings are grouped by severity:

- 🔴 **Blocker** — must be fixed before merge
- 🟡 **Warning** — should be fixed or consciously accepted
- 🟢 **Nit** — optional or cosmetic improvement

Each finding includes a file path and line (when possible), a short explanation, and a concrete suggestion. The report ends with a 1–2 sentence summary. If there are no findings, the subagent says so directly.

## Relationship to other actions

| Action | Purpose | Relationship |
|---|---|---|
| `/feature review` | Goal completeness, diff scope, branch safety, and the delegated code-quality pass | Delegates the code-quality pass to this subagent and folds its findings into the verdict |
| `/feature publish` | Commit and push | Runs `review.md` before committing, inheriting the delegated pass without a separate spawn |
| `/feature test` | Run tests, lint, type checks, build | None — subagent does not run tests |
| Code review subagent | Practical code quality, debug leftovers, unused code, shell/Markdown safety | Delegated by `review`; can also be spawned directly |

`review` inspects the committed branch diff (`origin/<base>...<work-branch>`) for goals and scope, while this subagent inspects the working tree (uncommitted changes). When everything is already committed and the tree is clean, the subagent returns no findings. If no `code-review` agent is installed in the project, `review` skips the delegated pass with a note instead of failing. The checklist itself is technology-dependent and owned by the installed agent template, so `review` stays stack-agnostic.
