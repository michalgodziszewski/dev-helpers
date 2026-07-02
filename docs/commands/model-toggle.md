<!-- Generated file. Do not edit manually. -->
<!-- Version: 0.1.0 -->

# dev model-toggle

Switch the active model-naming profile for installed subagents

## Usage

```text
dev model-toggle <profile>
```

## Arguments

| Argument | Required | Description |
|---|---|---|
| `profile` | Yes | Name of a model profile recorded in `context/model-profiles.md` (created by `dev feature-skill-install`). |

## Examples

```bash
dev model-toggle default
```

Rewrite installed subagent `model:` values back to the "sonnet"/"haiku" aliases.

```bash
dev model-toggle org
```

Rewrite installed subagent `model:` values to the literal names stored under the "org" profile (e.g. for an account whose routing requires Bedrock-style names). If "org" does not exist yet, prompts to create it interactively instead of requiring a full `dev feature-skill-install` re-run.

## Behavior

- Every installed `.claude/agents/*.md` file with a known alias role has its `model:` value rewritten to the selected profile.
- `context/model-profiles.md` records the newly active profile, adding it first if it did not exist.

## Git Side Effects

- Overwrites the `model:` frontmatter line in installed subagent files under `.claude/agents/`.
- Updates the Active Profile field in `context/model-profiles.md`, and adds a new profile entry when one was created interactively.
- Never runs Git commands or network requests.

## Failure Cases

- Missing profile name argument stops the command before any file changes.
- `context/model-profiles.md` does not exist — run `dev feature-skill-install` first.
- The requested profile name is not recorded in `context/model-profiles.md` and the user declines the interactive prompt to create it.

## Exit Behavior

- **Success:** Exits with code 0 and lists every updated agent file.
- **Failure:** Exits with code 1 and prints the failed condition. No files are changed on failure.
