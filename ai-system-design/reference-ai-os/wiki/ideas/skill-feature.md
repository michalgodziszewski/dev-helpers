# Idea: `feature` skill — Git workflow lifecycle across ai-os and every project

**Status:** done — `.claude/skills/feature/`, `.claude/agents/feature-{planner,implementer,tester,reviewer}.md`; the phased build (Phases 0-10) is complete, and its build-record doc (`context/feature-skill-plan.md`) was retired once the last phase shipped — design rationale for any individual piece of work now lives in that work's own finalized spec under `context/<system>/{features,fixes}/`
**Priority:** 3 (depends on [[context-folder]] (1) and [[env-secrets-convention]] (2))

## What

A skill that manages Git work end-to-end for AI_System and every project under `projects/`:
`plan → load → start → test → review → publish → clear/abandon → backport → complete`. A single
main orchestrator (the skill itself) sequences the lifecycle and owns every git-state-changing
step directly (branch creation, commits, pushes, state-file writes), while delegating the phases
that benefit from isolated work to dedicated sub-agents — one each for planning, implementation,
testing, and review.

Four things shape the design:

1. **Multi-system targeting.** AI_System is a router repo (`ai-os`) plus projects under
   `projects/<name>/` — most tracked directly in `ai-os`, with a project only becoming its own
   separate git repo/clone when it has an explicit entry in `projects/.gitignore`. Every work
   item records which system it targets — `ai-os` for the root repo, `projects/<name>` for a
   project, with repo mode (tracked-in-ai-os vs. own repo) detected automatically — resolved
   explicitly at load time, never guessed. `ai-os` and every `projects/<name>` are symmetric:
   same context shape, same actions.
2. **Tracked, not ignored, context.** State lives under `context/features/<system>/`, committed
   to the `ai-os` repo (`context/` is repo-root, not under `.claude/`, so it's tool-agnostic — see
   [[context-folder]]) — a durable, cross-project ledger of what's active, pending review, and
   completed, everywhere, visible from any clone. It also carries a `project-overview.md` per
   system so the delegated agents know what they're actually working on.
3. **Trunk-based and explicit-base both supported.** AI_System's own workflow is trunk-based
   (see `.claude/GUIDELINES.md`), but a project under `projects/<name>` may use a different
   convention (e.g. release branches). `Workflow: trunk | branch` is resolved per work item, not
   assumed from AI_System's own convention.
4. **Orchestrator/agent split.** The skill itself sequences actions and is the only thing that
   ever mutates git state or `context/features/**`. Implementation, testing, review, and planning
   each run in their own sub-agent, with graceful inline fallback when an agent isn't installed
   yet for a given system.

## Why

There's no repeatable procedure today for starting, implementing, testing, reviewing, and
publishing work across AI_System's growing set of repos. Building it deliberately now, ahead of
`projects/` filling up, means the convention exists before the second or third real project shows
up.

## How

Built across ten phases, tracked at the time in a since-retired `context/feature-skill-plan.md`
roadmap doc. The skill itself now exists and is in everyday use — see
[`.claude/skills/feature/SKILL.md`](../../.claude/skills/feature/SKILL.md) for the action table and
its [`actions/`](../../.claude/skills/feature/actions/) files for how it's wired; real specs live
under `context/<system>/{features,fixes}/` via its own `plan` action.
