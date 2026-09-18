# Explicit Publish Approval Per Call

## Git Workflow
- **Workflow:** trunk
- **Work Type:** fix
- **Jira Ticket:**
- **Base Branch:** main

## Description
`actions/publish.md` already says "single combined approval, asked once... do not commit or push
anything before this one approval" — but during this session (0006/0007) the orchestrator drifted
from that: it started staging/committing/pushing immediately and only narrating the exact commit
message *after* the push had already happened, treating an earlier "when review finishes, run
publish" instruction as blanket cover for the approval gate on that call too. The user caught this
live and wants every `publish` invocation to show the proposed commit message and wait for their
actual next turn — a chance to edit it — before touching git, regardless of anything said earlier
in the conversation about a later step.

The current wording isn't technically wrong, but it's ambiguous enough that an orchestrator (or a
future session) can read "asked once" as "once per work item is enough" rather than "once per
`publish` call, as its own fresh turn, every time." This spec tightens the wording to close that
reading.

## Goals
- `actions/publish.md` step 2: make explicit that the combined approval is a **distinct turn**
  for every `publish` invocation — show the exact proposed commit message text (not a paraphrase),
  the file list per commit, and the push target, then stop and wait for the user's actual next
  message. A prior instruction given earlier in the conversation (e.g. "when review finishes, run
  publish") authorizes *running* the action, not skipping this step's own approval — it never
  substitutes for showing that call's specific proposed message and waiting for a response to it.
- Keep the rest of step 2 unchanged (conventional commits, no AI attribution unless asked, Jira
  ticket infix logic from 0005) — this is a clarification of the approval-gate wording, not a
  change to what the message itself contains.

## Constraints
- No behavior change to *what* gets committed or *how* the message is built (conventional commits,
  Jira infix) — only to the approval-gate wording around *when* git commands may run.
- Doesn't touch `start`/`test`/`review`'s delegation-approval patterns (0006) — those don't commit
  or push anything, so this constraint doesn't apply to them; scope stays limited to `publish.md`.
- Doesn't add a new confirmation mechanism (e.g. AskUserQuestion) — the existing plain-chat
  propose-then-wait pattern already used successfully for 0005's publish is sufficient; this is a
  wording fix to `publish.md`, not a new UI requirement.

## References
- .claude/skills/feature/actions/publish.md (step 2, the approval gate this tightens)
- .claude/GUIDELINES.md ("Confirmation boundaries" section — routine questions limited to the
  combined publish approval)
- Live precedent in this session: 0005's publish (message shown, explicit "tak, commituj i
  pushuj" received before any git command ran) vs. 0006/0007's publish (message shown only in the
  post-hoc report, after commit+push already happened) — the gap this spec closes.

## Acceptance Criteria
- `actions/publish.md` explicitly states that the approval is required fresh on every `publish`
  call, and that an earlier "go ahead" for a *different* step does not carry forward to satisfy
  it.
- Following the procedure literally, an agent cannot commit/push in the same turn it first shows
  the proposed message — there must be a user turn in between.
