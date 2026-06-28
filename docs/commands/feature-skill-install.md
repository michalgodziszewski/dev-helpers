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

- The feature skill is copied to the selected destination (global or project).
- Project context directories and files are created when missing.
- `.gitignore` contains `/context/`.
- `CLAUDE.md` contains the Local Context Files section when authorized.
- A summary lists every created, copied, existing, skipped, and blocked item.

## Git Side Effects

- Copies the packaged feature skill to `~/.claude/skills/feature/` (global) or `<project>/.claude/skills/feature/` (project).
- Creates `context/`, `context/features/`, `context/fixes/`, and `context/screenshots/` directories.
- Copies asset-backed context files (`ai-interaction.md`, `current-feature.md`, `feature-config.md`, `feature-spec.md`, `project-overview.md`) when missing.
- Prompts for a coding-standards template when `context/coding-standards.md` is missing.
- Creates or appends to `.gitignore` to ensure `/context/` is ignored.
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
