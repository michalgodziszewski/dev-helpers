# Plan Research Subagent

A read-only Claude Code subagent that explores the repository during feature planning and returns practical requirements context — relevant files, existing patterns, constraints, and risks — without loading file dumps into the planning conversation. It never modifies files or Git state.

**Definition:** `.claude/agents/plan-research.md`

## When to use

Spawn this subagent:

- Automatically when `/feature plan` needs repository exploration — locating relevant files, existing patterns, constraints, or the impact of a proposed change — so file contents stay out of the planning conversation.
- Directly, when you are shaping a spec and want grounded answers to concrete questions like "which files implement X" or "what would a change to Z touch".

## How to spawn

Use the Agent tool with `subagent_type: "plan-research"`:

```
Agent({
  description: "Research context for planned work",
  subagent_type: "plan-research",
  prompt: "Planned work: <description>. Answer: which files implement X, what patterns exist for Y, what a change to Z would touch. Return practical requirements, not file dumps."
})
```

Pass the planned work description and specific research questions. The subagent answers selectively and never dumps raw file contents into the reply.

## Model

Uses the **Sonnet** model (`model: "sonnet"`). Repository exploration and pattern-finding do not require Opus reasoning depth and benefit from faster execution.

## Tools

| Tool | Purpose |
|---|---|
| Read | Read only the parts of relevant files that matter |
| Grep | Search for patterns, conventions, and usages across the codebase |
| Glob | Find files by name patterns |
| Bash | **Read-only inspection only** — `git ls-files`, `git log --oneline`, `git grep`, `git show` |
| PowerShell | The same read-only inspection commands on Windows shells |

The subagent cannot use Edit, Write, NotebookEdit, or Agent.

## Constraints

- Strictly read-only — never modifies, creates, or deletes files.
- Never commits, pushes, merges, checks out, resets, or cleans state.
- Never runs `git fetch`, `git pull`, or anything that modifies files or Git state.
- Never dumps raw file contents or overly long excerpts; it extracts practical requirements instead.
- Says so explicitly when something cannot be found, instead of guessing.

## Scope

Focuses on the context a plan needs:

- answers to the caller's specific research questions
- existing patterns and conventions the planned work should follow
- constraints, coupling points, and risks the plan should record

It does not write the spec, make the plan decision, or modify planning state — those belong to the `/feature plan` action.

## Research procedure

1. Answer the caller's questions by locating the relevant files and reading only the parts that matter.
2. Identify existing patterns and conventions the planned work should follow.
3. Identify constraints, coupling points, and risks the plan should mention.
4. Extract practical requirements; never dump raw file contents or overly long excerpts.

## Output format

- one short paragraph per research question with the answer
- a bullet list of relevant paths with a one-line reason each (`path — why it matters`)
- a bullet list of constraints and risks worth recording in the spec

It is selective, reporting only what changes the plan, and states explicitly when something could not be found.

## Relationship to other actions

| Action | Purpose | Relationship |
|---|---|---|
| `/feature plan` | Start or refine an iterative planning session and create a preview spec | Delegates repository exploration to this subagent so file contents stay out of the planning conversation |
| `/feature load` | Load a spec and resolve Git/Jira metadata | None — research happens during planning, before load |
| `/feature review` | Judge the implemented changes | None — this subagent informs the plan, not the review |

If no `plan-research` agent is installed in the project, the `plan` action explores inline and notes that delegation was skipped, rather than failing.
