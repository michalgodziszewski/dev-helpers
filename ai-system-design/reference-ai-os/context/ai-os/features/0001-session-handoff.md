# Session Handoff Skill

## Git Workflow
- **Workflow:** trunk
- **Work Type:** feature
- **Jira Ticket:**
- **Base Branch:** main

## Description
AI_System sessions can run long enough that context gets summarized/compacted and continuity
suffers. This skill produces a paste-able handoff block at the end of a session — decisions
locked, what shipped, key files touched, open questions, and a "pick up here" pointer — so the
user can `/clear` and start the next session by pasting the block back in, instead of relying on
the built-in `/compact`.

## Goals
- Build `.claude/skills/session-handoff/SKILL.md` (YAML front matter + natural-language body,
  per the shape in `skill-and-agent-authoring.md`) that triggers on requests like
  "/session-handoff", "wrap up this session", "give me a handoff", or "I'm about to /clear".
- The skill's body instructs Claude to compose a paste-able handoff block covering: decisions
  locked, what shipped (files changed/commits made), key files touched, open questions, and a
  "pick up here" pointer for the next session — derived from the actual current conversation, not
  a generic template.
- Output is printed inline as a chat message only — no file is written.

## Constraints
- Must not invoke `/clear` itself — the user copies the block and runs `/clear` manually.
- Keep the block concise enough to paste back into a fresh session as a prompt, not a full
  transcript dump.
- Self-contained — no dependency on sub-agents or other skills.

## References
- wiki/ideas/skill-session-handoff.md
- wiki/notes/techniques/skill-and-agent-authoring.md

## Acceptance Criteria
- Invoking the skill at the end of a real session produces a block with all five sections
  (decisions, shipped, key files, open questions, pick-up-here) that accurately reflects that
  session's actual content.
- `.claude/skills/session-handoff/SKILL.md` is registered and appears in Claude Code's available
  skills listing.
