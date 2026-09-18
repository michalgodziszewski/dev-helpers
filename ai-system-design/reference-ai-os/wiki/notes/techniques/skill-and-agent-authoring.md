# Technique: Authoring Skills and Sub-agents

Conceptual distinction lives in [skills-vs-subagents](../concepts/skills-vs-subagents.md); this
note is the practical how-to, including example patterns worth imitating the shape of.

## Example skills worth imitating (patterns, not literal copies)

- **"grill me"** — interviews the user relentlessly about a plan/topic/process, checkpointing
  every answer into a `brainstorms/<topic>.md` file so nothing is lost to context-window rot;
  only stops when there are no gaps left. Used for: extracting business knowledge, writing
  skill/agent specs, filling wiki content. **High-value first skill to build for AI_System** —
  see [skill-grill-me](../../ideas/skill-grill-me.md).
- **"session handoff"** — summarizes an entire session (decisions locked, what shipped, key
  files, open questions, "pick up here") into a paste-able block, used together with `/clear` to
  reset context without losing continuity. A solid replacement for relying on `/compact`.
- **"packaging"** — an example of a complex skill that references multiple large "playbook"
  markdown files, brand assets, scripts, and calls sub-agents.
- **"idea mining"** — content-idea generation skill. Directly relevant to the user's stated goal
  of using AI_System as an idea mine.
- **"roast"** / **"plan roaster"** sub-agent — spins up several sub-agents for adversarial
  critique of a plan ("roast my plan").
- A **front-end design skill**, invoked before writing any front-end code, that dramatically
  improves generated website aesthetics.

## Building a sub-agent in practice

Via `/agents` → create new → either "generate with Claude" (describe the purpose in plain
language) or manual config. Choose personal/global vs. project scope. Key front-matter fields to
set deliberately: `description` (precise, since this is the match trigger — vague descriptions
cause misfires), `model` (delegate cheap/bulk work to a smaller model), `tools`/
`disallowed-tools` (e.g. force a review-only agent to be read-only), memory scope.

## Agent Teams (separate, experimental feature — not the same as sub-agents)

Opt-in via `CLOUDCODE_EXPERIMENTAL_AGENT_TEAMS=1` in `settings.json`. Unlike sub-agents,
teammates share a task list and *can* talk to each other, coordinated by the main agent. More
token-expensive. Example use case: spinning up multiple debating personas (e.g. small-biz owner,
CEO, entry-level employee) to stress-test an idea and reach consensus. Not needed for AI_System
yet.

## Settings / permissions worth adopting early

`.claude/settings.json` (project) with allow/deny lists — e.g. allow bash/web-search/edit/write/
skills, explicitly deny destructive operations even under an otherwise permissive mode. A useful
framing: **treat Claude Code like managing a new hire** — onboard gradually, define what "good"
and "bad" output look like, grant the minimum tool/API scope needed (e.g. a read-only API key
instead of a full-access one), review output before trusting it, and only progressively remove
yourself from the loop once a skill/agent is battle-tested.
