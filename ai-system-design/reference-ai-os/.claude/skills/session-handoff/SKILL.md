---
name: session-handoff
description: Use when the user wants to wrap up the current session before clearing context — "/session-handoff", "wrap up this session", "give me a handoff", "I'm about to /clear", or similar. Produces a paste-able summary so the next session (after /clear) can pick up without losing continuity.
---

# `session-handoff` skill

Compose a single paste-able handoff block summarizing this actual conversation — not a generic
template — so the user can copy it, run `/clear` themselves, and paste it back at the start of the
next session to restore continuity. Never invoke `/clear` yourself; that stays the user's call.

Print the block inline as a chat message. Never write it to a file.

Keep it tight enough to serve as a prompt, not a full transcript — the point is orientation for
the next session, not a complete record.

## Sections, in this order

1. **Decisions locked** — choices the user made or confirmed during the session, especially ones
   that took correction/iteration to land on. Skip anything still open or provisional.
2. **What shipped** — concrete outcomes: files changed, commits made, PRs opened/merged. Reference
   actual paths and commit/PR identifiers from this session, not paraphrases.
3. **Key files** — the small set of files someone would need to open to understand or continue
   the work (specs, main implementation files, docs touched).
4. **Open questions** — anything left unresolved, deferred, or flagged for later, stated
   concretely enough that the next session doesn't have to re-derive what was ambiguous.
5. **Pick up here** — one or two sentences naming the exact next action, phrased so it can be
   pasted as the first instruction of the next session.

Omit a section entirely rather than padding it if the session genuinely has nothing for it (e.g.
a session with no open questions shouldn't invent one).
