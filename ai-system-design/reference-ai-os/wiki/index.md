# Wiki Index

The single entry point into this vault. Start here before searching folders directly.

## Ideas — things to implement

- [context-folder](ideas/context-folder.md) — `context/` for durable facts
- [feature-skill-consolidation](ideas/feature-skill-consolidation.md) — maintenance-cost cleanup phase for the `feature` skill, before any new capability
- [env-secrets-convention](ideas/env-secrets-convention.md) — `.env` convention before any integrations
- [feature-skill-project-setup-action](ideas/feature-skill-project-setup-action.md) — dedicated action to scaffold a new project's whole context in one flow
- [feature-skill-publish-quality-gate](ideas/feature-skill-publish-quality-gate.md) — `publish` refuses unless agent-run `test` + `review` passed for the current branch state
- [project-pensieve](ideas/project-pensieve.md) — Myślodsiewnia: first real project (voice recording → transcription → saved note), doubles as the skill's battle test
- [project-tab-extractor](ideas/project-tab-extractor.md) — YouTube guitar-tab video → auto-detect + stitch scrolling tab → PDF
- [skill-grill-me](ideas/skill-grill-me.md) — knowledge-extraction interview skill
- [single-claude-md-router](ideas/single-claude-md-router.md) — one root CLAUDE.md as the only router; remove the unused `.claude/memory/` scaffold
- [obsidian-web-clipper](ideas/obsidian-web-clipper.md) — one-click source capture into `raw/`
- [automation-stack](ideas/automation-stack.md) — mailbox/business automations (deferred)

## Ideas — shipped

- [skill-feature](ideas/skill-feature.md) — orchestrator-led Git workflow skill across ai-os and every project
- [skill-session-handoff](ideas/skill-session-handoff.md) — context-reset skill

## Concepts (reference)

- [second-brain-levels](notes/concepts/second-brain-levels.md) — the 5-level framework for how
  much knowledge-system infrastructure a given use-case actually needs.
- [claude-md-as-router](notes/concepts/claude-md-as-router.md) — why CLAUDE.md should index,
  not contain, everything.
- [skills-vs-subagents](notes/concepts/skills-vs-subagents.md) — procedure vs. persona, and
  when to reach for each.
- [context-vs-connections](notes/concepts/context-vs-connections.md) — durable facts belong in
  the wiki; live data should be reached through a tool, not stored.

## Techniques (reference)

- [obsidian-raw-wiki-ingestion](notes/techniques/obsidian-raw-wiki-ingestion.md) — the raw→notes
  pattern this wiki itself is built on.
- [skill-and-agent-authoring](notes/techniques/skill-and-agent-authoring.md) — how to actually
  write a `SKILL.md` or sub-agent file, with named examples.
- [automation-stack](notes/techniques/automation-stack.md) — tools for mailbox/business
  automation, in more depth than the idea file above.

## Principles (reference)

- [philosophy](notes/principles/philosophy.md) — durable rules of thumb that outlast any single
  tool mentioned elsewhere in this wiki.
