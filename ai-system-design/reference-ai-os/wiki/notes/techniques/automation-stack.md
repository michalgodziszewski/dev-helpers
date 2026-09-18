# Technique: The Automation Stack (for later)

This is forward-looking material — see [automation-stack](../../ideas/automation-stack.md) for
when to actually reach for any of this. Directly relevant to the user's stated goals of mailbox
management and multi-business management.

## Secrets convention

A single `.env` file at project root for all API keys/secrets, `.gitignore`'d. This is preferred
over Claude's built-in OAuth "Connectors" specifically for **portability across harnesses** — a
`.env` + CLAUDE.md-documented connection works whether the project is driven from Claude Code,
VS Code, Codex, or some future tool; a Connector locks you into one app and has to be redone if
you switch.

## MCP vs. CLI vs. API

CLIs are increasingly preferred over MCP servers because MCP tool definitions get loaded into
context on every message (a standing token cost), whereas a CLI is only invoked (and only costs
tokens) when actually used. Example: a Google Workspace CLI is often a better choice than a
Google Calendar MCP server.

## Named tools/services worth knowing about

- **Google Workspace CLI ("GWS")** — open-source, unofficial; single CLI for Gmail/Drive/Docs/
  Sheets/Slides/Calendar/Admin; ships 100+ pre-built "recipe" skills; JSON-first. Setup requires
  a Google Cloud Console project, OAuth consent screen, OAuth client ID (desktop app), a
  downloaded `client_secret.json`, then `gws auth login`. **Most directly relevant tool for the
  user's mailbox-management goal.**
- **Tavily** — web-research API, worth setting as the default over Claude's built-in web search
  for richer results; free credits on signup.
- **Open Router** — one API key/dashboard covering many model providers, useful for automations
  instead of a direct Anthropic key.
- **Modal** (modal.com) — serverless platform for deploying deterministic Python-script
  automations (cron- or webhook-triggered) when a task doesn't need a full agentic loop. Secrets
  live in Modal's own secret manager; gives execution logs. ~$5 free credit, cheap per-run.
- **Trigger.dev** — an alternative to Modal for this kind of deployment.
- **Claude Code "Routines"** — Anthropic's own cloud-run scheduled automations. Configured once,
  run on Anthropic's infrastructure (no local machine needed). Triggered by schedule (min.
  1-hour interval), API call, or GitHub webhook. Requires syncing to a GitHub repo (reads
  CLAUDE.md/scripts/skills from it on each stateless run; the clone is destroyed after). Secrets
  go into a Cloud Environment's environment variables (not `.env`, since that's gitignored and
  invisible to the clone). Network access levels: `trusted` / `full` / `custom`. Daily run caps:
  5 (Pro) / 15 (Max) / 25 (Team/Enterprise); 4 vCPU / 16GB RAM / 30GB disk per run.
- **Puppeteer** — for a "screenshot loop" (Claude screenshots what it's building, compares
  against a reference design, self-corrects) — useful for website/landing-page work.
- **Playwright CLI** — browser automation for platforms with no public API.
- **Fireflies.ai** — meeting-transcription tool whose output can auto-feed a second brain via its
  API.

## Cron vs. webhook

A "doorbell vs. polling" distinction: webhooks trigger instantly on an event (e.g. form
submission → an endpoint → a DM); crons run on a fixed schedule. Pick based on whether the
trigger is event-driven or time-driven.

## Hard safety lesson

A real-world cautionary pattern: an unattended automation, once set up and forgotten, can
eventually misfire — e.g. sending a message to a public channel instead of a private DM. The
takeaway: **"prompting is not a permission layer."** Anything that runs unsupervised needs hard
tool/endpoint restrictions (e.g. hardcoding the destination channel/address in the deployed
script) rather than trusting agent judgment at run time. This matters a lot for a future mailbox-
management automation specifically — don't let an unsupervised agent choose *where* to send
things; hardcode the boundaries.

## Evals (briefly noted)

Before shipping an unsupervised automation: build a "golden dataset" of ~100+ input/expected-
output pairs, run the automation against it, measure pass/fail, iterate.

## Governing principle: deterministic vs. non-deterministic

Default to the simplest, cheapest, most predictable solution ("vending machine" vs. "slot
machine" tasks). Don't reach for a full agentic Claude Code loop when a plain script/workflow
suffices — and don't reach for a wiki or knowledge graph when a flat file would do either. This
principle is why this whole automation stack is filed under "for later" rather than built now:
there's no concrete, repeated need yet (see
[automation-stack](../../ideas/automation-stack.md)).
