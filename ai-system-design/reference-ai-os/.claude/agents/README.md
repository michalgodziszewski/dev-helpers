# Agents

Custom subagents for this system — specialized personas for specific tasks (e.g.
researcher, code-reviewer, business-analyst), each with its own toolset and way
of working.

Convention: one file per agent, kebab-case name, e.g. `inbox-triage.md`,
`idea-curator.md`, with frontmatter describing tools, model, and a distinct
`color` so agents are visually distinguishable when they run.
