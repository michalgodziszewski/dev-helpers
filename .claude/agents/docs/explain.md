# Explain Subagent

A read-only Claude Code subagent that explains the changes on a work branch — what changed in every file, the key functions or components involved, and the data or control flow between them. It never modifies files or Git state.

**Definition:** `.claude/agents/explain.md`

## When to use

Spawn this subagent:

- Automatically as the delegated walkthrough of `/feature explain`.
- Directly, when you want a concise, plain-language summary of a branch's changes before reviewing, publishing, or handing work off.
- When you want the flow between changed files described without a review verdict or severity grading.

## How to spawn

Use the Agent tool with `subagent_type: "explain"`:

```
Agent({
  description: "Explain the work-branch changes",
  subagent_type: "explain",
  prompt: "Explain the merge-base diff git diff origin/<base-branch>...<work-branch>: what changed per file and how the files connect."
})
```

Pass both branches (or an explicit diff range). Use the merge-base form (`origin/<base-branch>...<work-branch>`) so unrelated changes already on the base are excluded. When no branches are provided, the subagent explains the working-tree changes via `git status --short` and `git diff`.

## Model

Uses the **Sonnet** model (`model: "sonnet"`). Summarizing a diff does not require Opus reasoning depth and benefits from faster execution.

## Tools

| Tool | Purpose |
|---|---|
| Read | Read full file contents for context beyond the diff |
| Grep | Search for related definitions and usages across the codebase |
| Glob | Find files by name patterns |
| Bash | **Read-only inspection only** — `git status`, `git diff`, `git log`, `git show`, `git ls-files` |
| PowerShell | The same read-only inspection commands on Windows shells |

The subagent cannot use Edit, Write, NotebookEdit, or Agent.

## Constraints

- Strictly read-only — never modifies, creates, or deletes files.
- Never commits, pushes, merges, checks out, resets, or cleans state.
- Never runs `git fetch`, `git pull`, or anything that modifies files or Git state; shell usage is limited to the read-only inspection commands above.
- Produces an explanation, not a review: no severity grading and no verdicts.
- Does not run tests or check goal completeness.

## Scope

Focuses on describing the branch (or working-tree) changes clearly:

- what changed in each file and why it matters
- the key functions or components involved
- the data or control flow connecting the changed files
- the explicit source and target branches

It does not judge correctness, release readiness, or scope — those belong to `/feature review`.

## Explain procedure

1. List the changed files with their change type (from `git diff origin/<base-branch>...<work-branch> --name-status`, or `git status --short` for working-tree changes).
2. For every changed file, explain in one or two sentences what changed and name the key functions or components involved.
3. Summarize the data or control flow between the changed files.
4. State the source and target branches explicitly.

## Output format

- a short overview paragraph
- one bullet per changed file: `path — what changed and why it matters`
- a closing "Flow" paragraph connecting the files

The whole explanation stays readable in under a minute, with no severity grading and no review verdicts.

## Relationship to other actions

| Action | Purpose | Relationship |
|---|---|---|
| `/feature explain` | Walk through the branch's changes | Delegates the walkthrough to this subagent, passing both branches and asking for the merge-base diff explanation |
| `/feature review` | Goal completeness, diff scope, branch safety, code-quality pass | None — review judges the changes; this subagent only describes them |
| `/feature test` | Run tests, lint, type checks, build | None — this subagent does not run checks |

If no `explain` agent is installed in the project, the `explain` action runs the same walkthrough inline and notes that delegation was skipped, rather than failing.
