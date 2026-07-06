# dev-helpers

A collection of AI coding assistant skills — for Claude Code and Kiro — plus a companion TypeScript CLI that automate common developer workflows — trunk-based development, Git branch management, publishing, and backporting.

## Technology stack

- **Runtime:** Node.js ≥ 18, ES modules
- **Language:** TypeScript with strict mode, targeting ES2024
- **Build:** `tsc` compiles `src/` and `bin/` into `dist/`
- **Testing:** Vitest (unit and integration tests)
- **Dependencies:** dotenv (runtime); @types/node, typescript, and vitest (dev)
- **Environment:** `.env` file with `DEV_DEFAULT_BASE_BRANCH` (defaults to `main`)

## Getting started

```sh
npm install
npm run build
npm test
```

## CLI (`dev`)

The `dev` CLI is the package's bin entry point. It dispatches subcommands registered in `src/cli/command-registry.ts`.

| Command | Purpose |
|---|---|
| `dev start <TICKET> [description] [--type <type>] [--base <branch>]` | Fetch origin, synchronize a base branch (ff-only), create a typed work branch with Jira ticket naming |
| `dev feature-skill-install` | Interactively install the feature skill for Claude Code (global or project scope) and scaffold the context directory |
| `dev feature-skill-install-kiro` | Interactively install the feature skill for Kiro (global or project steering) and scaffold the context directory |

### npm scripts

| Script | Purpose |
|---|---|
| `build` | Compile TypeScript to `dist/` |
| `test` | Run the Vitest test suite |
| `dev` | Run the CLI via compiled output |
| `docs:generate` | Regenerate CLI command docs from registry metadata |
| `docs:check` | Verify docs are up to date (CI-friendly) |
| `verify` | Build + test + docs check (full pre-publish gate) |

## Feature skill: Claude Code and Kiro

The shared workflow logic lives in `skills/feature/` and implements a Git workflow lifecycle: `plan → load → start → test → review/explain → publish → clear/abandon → backport → complete`. It is invoked via `.claude/skills/feature/SKILL.md` (Claude Code, `/feature` slash command) or `.kiro/steering/feature.md` (Kiro, `#feature`/`/feature` manual steering). See `skills/feature/docs/README.md` for the full documentation map.

Both providers can be installed in the same project at the same time. Each provider's installer creates the shared `skills/feature/` content only if it does not already exist — whichever installer runs first creates it, and the other reuses it — so a work item started with one provider can be continued with the other, sharing the same `context/` runtime state.

Known Kiro-specific limitations, documented in `skills/feature/docs/`:

- Kiro has no on-demand subagent delegation (its manual hooks were discontinued in favor of manual steering), so every action runs inline in one conversation instead of delegating to a subagent.
- There is no per-task model selection on Kiro — the whole workflow runs under whichever single model is active in the Kiro session, unlike Claude Code's per-subagent `model:` pinning.
- There is no confirmed Kiro equivalent of `.claude/settings.json`'s permission allowlist.

## Repository structure

```
bin/                       CLI entry points (compiled to dist/bin/)
src/cli/                   Command registry, commands, config, docs, and installer modules
tests/                     Mirrors src/ structure with .test.ts files
docs/commands/             Auto-generated CLI command documentation
assets/                    Context templates installed into projects by the installers
skills/feature/            Shared, provider-neutral feature skill core (actions/, docs/, assets/)
.claude/skills/feature/    Claude Code entry point (SKILL.md) referencing skills/feature/
.claude/agents/            Installed subagent instances for this repository (Claude Code only)
.kiro/steering/            Kiro entry point (feature.md) and project context, referencing skills/feature/
context/                   Local ignored workflow state (not committed), shared by both providers
```
