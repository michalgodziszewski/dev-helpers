# Docs Sync Subagent

A read-only Claude Code subagent that checks consistency between the feature skill's documentation (`docs/`) and its action definitions (`actions/`, `SKILL.md`) — action tables, confirmation policy, file paths, and behavior descriptions. It reports mismatches only and never modifies files.

**Definition:** `.claude/agents/docs-sync.md`

## When to use

Spawn this subagent:

- When skill documentation may have drifted from the action definitions — for example after editing an action, adding an accepted form, or changing the confirmation policy.
- Directly, as a consistency check across `skills/feature/docs/` versus the actions and `SKILL.md`, before publishing skill changes.
- When a change touches specific action files and you want the docs re-checked only for the topics those files affect.

## How to spawn

Use the Agent tool with `subagent_type: "docs-sync"`:

```
Agent({
  description: "Check skill docs vs actions",
  subagent_type: "docs-sync",
  prompt: "Compare skills/feature/docs/*.md against skills/feature/actions/*.md and each provider entry point (.claude/skills/feature/SKILL.md, .kiro/steering/feature.md when present). Report mismatches only. Changed files: <list, or all>."
})
```

Pass the list of changed files when you want the check limited to the topics they touch; otherwise the subagent compares the full set.

## Model

Uses the **Sonnet** model, pinned to `model: claude-sonnet-4-6`. Cross-referencing documentation against action definitions benefits from careful reading without requiring Opus reasoning depth.

## Tools

| Tool | Purpose |
|---|---|
| Read | Read the skill's docs, actions, and `SKILL.md` |
| Grep | Search for action names, forms, fields, and policy statements across the skill |
| Glob | Enumerate the skill's docs and action files |

The subagent has **no shell access** — it cannot use Bash or PowerShell — and cannot use Edit, Write, NotebookEdit, or Agent. It reasons purely from file contents.

## Constraints

- Strictly read-only — never edits, creates, or deletes any file.
- No shell access at all; it does not run Git or any other command.
- Does not review grammar, style, or formatting.
- Does not check external documentation outside the skill directory.
- Does not invent issues; it reports only real mismatches.

## Scope

Compares `skills/feature/actions/*.md` and each provider entry point (`.claude/skills/feature/SKILL.md`, `.kiro/steering/feature.md` when present) against `skills/feature/docs/*.md`. When the caller lists specific changed files, it limits the check to the topics those files touch.

It checks for:

- actions, arguments, or accepted forms present in one place but missing or different in the other
- contradictory descriptions of preconditions, stop conditions, or effects
- confirmation policy statements that disagree between `SKILL.md`, actions, and docs
- file paths or template locations that no longer exist
- status values, workflow names, or field names spelled inconsistently

## Check procedure

1. Read the action definitions and `SKILL.md` as the source of behavior.
2. Read the corresponding `docs/*.md` pages, narrowing to the topics of the changed files when a list is provided.
3. Compare action tables, arguments, accepted forms, preconditions, stop conditions, effects, confirmation policy, paths, and field names.
4. Record only genuine disagreements, quoting the two conflicting statements briefly.

## Output format

One bullet per mismatch:

- `<doc-file> vs <action-file>` — what disagrees, quoting the two conflicting statements briefly, with a one-line suggested resolution.

Findings are grouped by doc file. The report ends with either `In sync` (no mismatches) or a one-line count summary.

## Relationship to other actions

| Action | Purpose | Relationship |
|---|---|---|
| Skill docs/actions consistency check (ad hoc, not a `/feature` action) | Keep `docs/` aligned with `actions/` and `SKILL.md` | Spawned directly for this check; no `/feature` action is wired to it in the delegation map |
| `/feature review` | Judge implemented work-branch changes | None — `review` covers code changes; this subagent covers skill-doc consistency |
| `/feature test` | Run repository checks | None — this subagent runs no commands and no tests |

Unlike the other subagents, `docs-sync` is not bound to a specific `/feature` action; `SKILL.md` lists it as a delegation target for ad-hoc skill docs/actions consistency checks.

If no `docs-sync` agent is installed in the project, the same consistency check runs inline and notes that delegation was skipped, rather than failing.
