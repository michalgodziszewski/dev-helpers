# dev-helpers

A collection of Claude Code custom skills and a companion TypeScript CLI that automate common developer workflows — trunk-based development, Git branch management, publishing, and backporting.

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
| `dev feature-skill-install` | Interactively install the feature skill (global or project scope) and scaffold the context directory |

### npm scripts

| Script | Purpose |
|---|---|
| `build` | Compile TypeScript to `dist/` |
| `test` | Run the Vitest test suite |
| `dev` | Run the CLI via compiled output |
| `docs:generate` | Regenerate CLI command docs from registry metadata |
| `docs:check` | Verify docs are up to date (CI-friendly) |
| `verify` | Build + test + docs check (full pre-publish gate) |

## Claude Code skill: feature

`.claude/skills/feature/` implements a Git workflow lifecycle invoked via the `/feature` slash command: `plan → load → start → test → review/explain → publish → clear/abandon → backport → complete`. See `.claude/skills/feature/docs/README.md` for the full documentation map.

## Repository structure

```
bin/                       CLI entry points (compiled to dist/bin/)
src/cli/                   Command registry, commands, config, docs, and installer modules
tests/                     Mirrors src/ structure with .test.ts files
docs/commands/             Auto-generated CLI command documentation
assets/                    Context templates installed into projects by the installer
.claude/skills/feature/    Feature workflow skill
.claude/agents/            Installed subagent instances for this repository
context/                   Local ignored workflow state (not committed)
```
