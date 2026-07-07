<!-- Generated file. Do not edit manually. -->
<!-- Version: 0.1.0 -->

# dev feature-skill-install

Install the feature skill and initialize project context

## Usage

```text
dev feature-skill-install
```

## Examples

```bash
dev feature-skill-install
```

Interactively install the feature skill (global or project) and initialize the project context structure.

## Behavior

- The Claude Code entry point (SKILL.md) is copied to the selected destination (global or project).
- The shared, provider-neutral skill content (`skills/feature/{actions,docs,assets}`) is present at the project's or home directory's `skills/feature/` — created if missing, reused if `dev feature-skill-install-kiro` already created it in this same project.
- Project context directories and files are created when missing.
- Subagent templates are installed into the project's `.claude/agents/` directory when missing.
- The Claude Code permission allowlist is present in `.claude/settings.json` (copied or merged).
- `.gitignore` contains `/context/`, and optionally `/.claude/` and `/skills/` together when requested.
- `CLAUDE.md` contains the Local Context Files section when authorized.
- A summary lists every created, copied, existing, skipped, and blocked item.

## Git Side Effects

- Copies the packaged Claude Code entry point to `~/.claude/skills/feature/` (global) or `<project>/.claude/skills/feature/` (project).
- Copies the packaged shared skill content to `<project>/skills/feature/` (project scope) or `~/skills/feature/` (global scope), skipping the copy if it already exists (installed there by this command or by `dev feature-skill-install-kiro`).
- Creates `context/`, `context/features/`, `context/fixes/`, and `context/screenshots/` directories.
- Copies asset-backed context files (`ai-interaction.md`, `current-feature.md`, `feature-config.md`, `feature-spec.md`, `project-overview.md`) when missing. All templates except `current-feature-template.md` are sourced from the package-root `assets/` directory.
- Prompts for a coding-standards template when `context/coding-standards.md` is missing.
- Prompts for a code-review subagent stack when `.claude/agents/code-review.md` is missing, and copies stack-agnostic subagent templates (`test`, `explain`, `git-verify`, `plan-research`, `docs-sync`) from `assets/subagents/` into `.claude/agents/` when missing.
- Copies the packaged `.claude/settings.json` permission allowlist, or merges missing `permissions.allow` rules into an existing file while preserving other settings.
- Creates or appends to `.gitignore` to ensure `/context/` is ignored.
- Asks once whether `.claude/` and `skills/feature/` should also be ignored together (default Yes); the question is skipped when a rule for either already exists (set by this command or by `dev feature-skill-install-kiro`), reusing that destination for whichever rule is still missing.
- Creates or updates `CLAUDE.md` with the Local Context Files section.
- Never runs Git commands, installs dependencies, or makes network requests.

## Failure Cases

- The packaged source skill is missing or invalid — stops before any project changes.
- The selected destination exists but is not a valid feature skill — stops before context initialization.
- A path-type conflict (e.g. file where a directory is expected) is reported and skipped.
- Permission errors on filesystem operations report the exact path and operation.

## Exit Behavior

- **Success:** Exits with code 0 and prints a complete summary.
- **Failure:** Exits with code 1 and identifies the failed operation. Existing files are never deleted or overwritten.
