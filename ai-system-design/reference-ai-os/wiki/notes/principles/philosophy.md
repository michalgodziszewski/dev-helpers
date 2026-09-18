# Principles: Durable Philosophy

These are principles worth re-reading whenever a design decision about AI_System feels
ambiguous — they outlast any specific tool/product mentioned elsewhere in this wiki.

- **Models vs. harness vs. you** — a three-layer mental model: the AI model is the engine, Claude
  Code (or whatever harness) is the car, you are the driver. You and your context matter more
  than which model you pick.
- **Context engineering beats prompt engineering going forward** — as models improve, prompting
  skill matters less; what persists in value is *what your AI knows about you* (your business,
  priorities, voice). This is the entire justification for building `wiki/` and
  `context/` in the first place.
- **"Garbage in, garbage out"** / **"context is king"** — durable truths regardless of which
  specific tools churn and get replaced.
- **CLAUDE.md as a router, not a dump** — see
  [claude-md-as-router](../concepts/claude-md-as-router.md). The core architectural philosophy
  for the whole system: don't cram everything into one file; teach the agent *where* to look.
- **"You can outsource your thinking, but you can never outsource your understanding"** — review
  everything an AI produces, because your name is attached to the output regardless of who/what
  produced it. A good reason to maintain an "AI phrase kill list" in a global CLAUDE.md:
  detectable AI-slop erodes trust in the person, not just the artifact.
- **Deterministic ("vending machine") vs. non-deterministic ("slot machine") tasks** — default to
  the simplest, cheapest, most predictable solution. Don't reach for an agent (or a wiki, or a
  knowledge graph) when a plain script or flat file suffices. Applied to knowledge-base design
  too: not every folder needs the same level of infrastructure — decide per data-type (see
  [second-brain-levels](../concepts/second-brain-levels.md)).
- **"You can't automate what you can't map"** — a process (or the person who does it) must be
  understood/documented before it can become a skill or automation. This is the reason for
  knowledge-extraction skills like "grill me" (see
  [skill-and-agent-authoring](../techniques/skill-and-agent-authoring.md)).
- **Theory of constraints** — when picking what to build/automate next, attack the front-most
  bottleneck in the actual workflow first, and define a "north star" metric per build so success
  is unambiguous. Directly informs how the [wiki index](../../index.md)'s ideas are prioritized.
- **"Reverse-engineer from the question you'll ask"** — design storage backwards from how you'll
  retrieve it later. Justifies choosing markdown+wiki vs. vector DB vs. knowledge graph per
  use-case instead of dogmatically picking one architecture for everything.
- **"Boring is beautiful"** — prefer plain, deterministic building blocks (folders, markdown
  files, hardcoded script destinations) over clever infrastructure whenever they're sufficient.
  Paired with **"prompting is not a permission layer"** — hard restrictions, not instructions,
  are what actually prevent an unsupervised automation from doing the wrong thing (see
  [automation-stack](../techniques/automation-stack.md)).
- **Tool-agnosticism as a design goal** — build the system as plain files/folders, not vendor
  connectors, specifically so it survives switching harnesses (Claude Code → Codex → whatever's
  next). Arguably the single most load-bearing philosophy for AI_System's own design: everything
  here is plain markdown in git repos, not locked into any one tool.
- **Iteration over perfection** — nothing (skills, CLAUDE.md, sub-agents, the second brain
  itself) is ever "done." Every use is a chance to give feedback and have the system rewrite its
  own instructions. Do the extraction work up front ("sharpen the axe") so each iteration starts
  from a higher baseline.
- **Manage AI like a new employee** — onboarding, explicit definitions of good/bad output, scoped
  permissions, gradual autonomy, review loops. The unifying metaphor for both skill design and
  permission/security design.
- **Don't build Level 5 (fully autonomous, always-ingesting) by default** — stay the human
  gatekeeper of what enters permanent memory, to avoid context bloat/noise degrading answer
  quality. A direct caution against over-automating AI_System's own wiki-sync process later.
