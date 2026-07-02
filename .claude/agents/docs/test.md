# Test Subagent

A read-only Claude Code subagent that discovers this repository's quality checks, runs the ones relevant to the changed files, and reports every command with its result. It runs checks only — it never modifies files, installs dependencies, or changes Git state.

**Definition:** `.claude/agents/test.md`

## When to use

Spawn this subagent:

- Automatically as the delegated check runner of `/feature test`, and inside `/feature publish`, which runs `test.md` before committing.
- Directly, after implementing changes, when you want the relevant tests, lint, type checks, and build run and reported without hunting for the commands yourself.
- When you want a changed-file-scoped verification pass rather than a full-suite run.

## How to spawn

Use the Agent tool with `subagent_type: "test"`:

```
Agent({
  description: "Run repository checks for current changes",
  subagent_type: "test",
  prompt: "Discover this repository's checks and run the ones relevant to the changed files. Report every command and its result."
})
```

Pass the changed files and goals as scope when you have them. When no changed-file scope is provided, the subagent derives it from `git status --short` and `git diff --name-only` (or the merge-base diff against the base branch).

## Model

Uses the **Sonnet** model (`model: "sonnet"`). Discovery and check execution do not require Opus reasoning depth and benefit from faster execution.

## Tools

| Tool | Purpose |
|---|---|
| Read | Read manifests (package.json, Makefile, pyproject.toml, …) and test files to map changes to checks |
| Grep | Search for test conventions and check definitions across the codebase |
| Glob | Find files and tests by name patterns |
| Bash | Discover and run checks on POSIX shells |
| PowerShell | Discover and run checks on Windows shells |

The subagent cannot use Edit, Write, NotebookEdit, or Agent.

## Constraints

- Runs checks only — never edits, creates, or deletes files.
- Never installs missing dependencies; it reports the missing prerequisite instead.
- Never modifies test configuration, commits, pushes, merges, checks out, resets, cleans, or changes Git state in any way.
- Stops early when a required check fails and reports the failure output.
- Does not review code quality (handled by the `code-review` subagent) or goal completeness (handled by `/feature review`).

## Scope

Local runs — standalone `/feature test` and inside `/feature publish` alike — always scope to what changed. A full, whole-repository run (complete suite, full build, every check) is CI's job (e.g. a GitHub Actions workflow triggered by the push), not something to reproduce locally on every publish.

The subagent widens to a full run only when changed files cannot be reliably mapped to specific tests (for example, a change to shared test setup, config, or a widely imported utility with no obvious owning test file), or when the caller explicitly asks for a full run.

## Test procedure

1. Read the scope provided by the caller; when none is given, inspect `git status --short` and `git diff --name-only` (or the merge-base diff against the base branch) to find changed and newly added files.
2. Discover available checks from project files without assuming a package manager or framework — inspect the manifests actually present (package.json scripts, Makefile, composer.json, `*.csproj`, pyproject.toml, or equivalent).
3. Map changed and newly added files to the tests that exercise them and run only those via the framework's targeted invocation (explicit test file arguments, `vitest related`, `jest --findRelatedTests`, `pytest <path>`), plus any newly added test files.
4. Run lint and type-check scoped to the changed files when the toolchain supports partial checking; run inherently whole-project checks (single-pass compiler or bundler) once as usual.
5. Run the complete suite or any whole-repository check only when changes cannot be mapped to specific tests, or when the caller explicitly asks.
6. Never install missing dependencies; report the missing prerequisite instead.
7. Stop early when a required check fails and report the failure output.

## Output format

The subagent reports:

- which files were mapped to which tests, and whether the run stayed scoped or widened to the full suite (and why, if it widened)
- every command it ran, in order, with pass/fail and a short result summary
- full relevant output for each failing check, trimmed to the failing part
- checks that exist but were skipped, with the reason
- a final verdict: `All checks passed` or `Failed: <check>`

It reports facts only and proposes a fix only when the failure output makes it obvious, in one sentence.

## Relationship to other actions

| Action | Purpose | Relationship |
|---|---|---|
| `/feature test` | Discover and run repository checks | Delegates the discovery and execution to this subagent |
| `/feature publish` | Commit and push | Runs `test.md` before committing, inheriting this subagent's changed-file-scoped run; stops on any failure |
| `/feature review` | Goal completeness, diff scope, branch safety, code-quality pass | None — this subagent does not run the review; the `code-review` subagent handles quality |

If no `test` agent is installed in the project, the `test` action runs the same discovery-and-execution procedure inline and notes that delegation was skipped, rather than failing.
