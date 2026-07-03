# Planning

The `plan` action turns a rough idea into a complete, consistent work specification through an iterative session. It creates a real preview spec file early in `context/plans/`, refines it as requirements arrive, and finalizes it with `plan done`, which assigns the number and moves it into its target folder.

Planning is deliberately separate from execution. `plan` never starts Git work, creates branches, commits, or pushes, and it never changes the active slot in `context/current-feature.md` unless you explicitly ask. Starting actual work stays a separate step: `/feature load <path>`.

## Commands

```text
/feature plan [<work-type>] [<name-or-description>]
/feature plan resume <file>
/feature plan status
/feature plan cancel
/feature plan done
```

- `plan` starts a new session or refines the active preview spec; it always starts directly and never scans the disk for other previews first.
- `plan resume <file>` reattaches a staged preview from `context/plans/` as the active session.
- `plan status` shows the current planning state and what is still required, or lists the staged previews when no session is tracked.
- `plan cancel` abandons the session and optionally removes the preview file.
- `plan done` finalizes the active preview spec — assigning its number and moving it into the target folder — and suggests the next command.

## The preview spec

`plan` creates the spec file immediately so the plan has a real place in the repository: `context/plans/<slug>.md`, with a slug-only filename and no number prefix. Previews consume no numbers in `context/features/` or `context/fixes/`. The file is generated from the skill's own `assets/current-feature-template.md` and carries a preview marker block:

```md
<!-- PLAN_PREVIEW_START -->
> Preview: this spec is still being planned. It will be finalized by `feature plan done`.
<!-- PLAN_PREVIEW_END -->
```

`plan done` removes the entire block, including both marker lines, which is safer than deleting free-form preview text. While the preview is staged, its `Source Spec` field stays empty; `plan done` fills it with the final numbered path. The skill only edits the preview file tracked by the current session and never touches another preview file unless you explicitly select it with `plan resume`.

Slug collisions in `context/plans/` are not allowed: when a new session's slug matches an existing file, the skill stops and requires a different name — it never overwrites and never silently suffixes the filename.

## Resuming a session

The session itself is tracked only in the conversation, so /clear, compaction, or a new session loses it while the preview file stays on disk. That is not a dead end:

- `plan status` with no tracked session is the discovery point: it lists the contents of `context/plans/` read-only — per file the path, title, work type, and the finalization-required fields still missing — and points to `plan resume <file>`. It asks no question. Files in `context/plans/` that lack the preview marker block are reported with a warning instead of being silently skipped.
- `plan resume <file>` reattaches one specific preview. The argument is resolved the same way `load` resolves its spec argument: the provided path first, then `context/plans/<name>.md`, with `.md` appended when omitted. Resuming re-reads the selected file, tracks it as the active session, reports which finalization-required fields are already satisfied, and continues the normal refine loop on that same file.
- `plan done` and `plan cancel` with no tracked session do not pick or recover a file: they point at `plan status` + `plan resume` and stop.
- Bare `plan` and `plan <work-type / name / description>` always start a new session directly, without scanning the disk for previews.

Resume never modifies anything by itself, and only the explicitly resumed preview file is ever modified or deleted afterwards.

## Template asset

The skill's own `assets/current-feature-template.md` is the source of truth for generated specs. It defines the standard Current Feature structure with `{{...}}` placeholders and these sections:

```text
# Current Feature
{{title}} — {{short_description}}
{{preview_notice}}
## Status
## Git Workflow      (Workflow, Work Type, Jira Ticket, Base Branch, Work Branch, Source Spec, Published/Backport fields)
## Goals
## References
## Scope
## Documentation Requirements
## Notes
## Pending Reviews   (None.)
## History           (<!-- Managed by skill -->)
```

`## History` is always managed by the skill and must never be expanded manually. When this template bootstraps `context/current-feature.md` as runtime state, `load` drops the preview notice and the planning-only sections and clears remaining placeholders.

## Work types and target folders

The target folder is inferred from the planned work type and used at finalization:

| Target folder | Work types |
|---|---|
| `context/fixes/` | `fix`, `bugfix`, `hotfix` |
| `context/features/` | `feature`, `docs`, `refactor`, `chore`, `tooling`, `config`, `test`, `ci`, `research` |

The selected work type is stored verbatim in the generated `Work Type` field. The folder and the work type do not need to share a name. If the work type or folder is unclear, the skill asks before creating the preview spec. While planning, the preview stays in `context/plans/` regardless of the target folder.

> Compatibility note: `/feature load` currently accepts only `feature`, `bugfix`, `fix`, `hotfix`, and `chore`. A finalized spec using a broader planning work type (for example `docs` or `refactor`) may require choosing one of those five load types when you later run `/feature load`.

## Number and path resolution

Numbers are assigned by `plan done` at finalization, never at session start, so staged plans never consume or block numbers:

- each target folder has independent numbering;
- the skill scans `.md` files and reads four-digit `0001-...md` prefixes;
- with no numbered files it uses `0001`, otherwise the highest number plus one, padded to four digits;
- the slug is derived from the name — lowercase, hyphen-separated, special characters removed, kept short.

Example: `Feature Skill Plan Action` staged as `context/plans/feature-skill-plan-action.md` finalizes to `context/features/0010-feature-skill-plan-action.md`.

The skill never silently overwrites an existing spec. On a filename collision in the target folder it reports the problem and adjusts safely or asks before writing.

## Required fields

Required before a useful preview spec is created:

- target spec collection or work type,
- feature/fix name,
- short description.

Required before `plan done` finalizes:

- target spec collection,
- work type,
- feature/fix name,
- short description,
- workflow approach,
- base branch,
- goals,
- scope.

If finalization is blocked, `plan done` shows a concise missing-fields checklist and keeps the preview spec active. Optional values may stay empty or render as `None.`; empty Git Workflow fields stay blank unless known. The skill never silently assumes the workflow approach or base branch.

## Requirement gathering

Requirements can be gathered iteratively from multiple sources:

- direct conversation and pasted notes,
- repository files and existing documentation,
- screenshots under `context/screenshots/`,
- Atlassian/Jira and other MCP or tool sources.

External sources are optional and environment-dependent. If a source is unavailable, planning continues with user-provided context. The skill extracts practical requirements instead of dumping raw text and summarizes any external or Jira context before finalization. When requirements come from Jira and the ticket key is known, the generated `Jira Ticket` is set to that key.

Repository exploration during planning (locating relevant files, existing patterns, constraints, and impact) is delegated to the `plan-research` subagent when it is installed, keeping file contents out of the planning conversation. Without the agent, exploration happens inline.

## Visual references and screenshots

- Screenshot paths under `context/screenshots/` are treated as required planning inputs and inspected when preparing the plan.
- They are listed under `## References`, and relevant observations are reflected in `## Goals`, `## Scope`, or `## Notes`, not only as links.
- A missing or unreadable screenshot is reported, and planning continues with the remaining context.
- When Jira is available through MCP, relevant image attachments can be downloaded into `context/screenshots/` using safe filenames of the form `<jira-ticket>-<short-slug>.<extension>`, avoiding overwrites, and referenced in the generated spec. If images cannot be downloaded, the references are kept in the planning summary and the plan does not fail.

## Scope structure

`## Scope` may group content when useful:

```md
In scope:

- ...

Out of scope:

- ...
```

`Out of scope` is added only when the discussion identifies work that should not be part of the spec. It stays concise, and no out-of-scope items are invented when there are none.

## Finalization

`plan done`:

1. verifies all finalization-required fields, showing the missing-fields checklist and keeping the preview active if any are missing;
2. resolves the next free four-digit number in the target folder and composes the final path `<target-folder>/<number>-<slug>.md`;
3. summarizes the resolved plan (folder, number, final source spec path, work type, workflow, base branch, main goals, key references);
4. writes the finalized Markdown to the final path and removes the staged file from `context/plans/` (a move), removing the preview marker block, setting `Source Spec` to the final numbered path, and filling every placeholder;
5. keeps `## History` as `<!-- Managed by skill -->`;
6. falls back to showing the generated Markdown if the file cannot be written, keeping the staged preview untouched — the staged file is never deleted before the finalized file is confirmed written.

After finalization the skill shows the finalized path and suggests:

```text
/feature load <final-source-spec-path>
```

The skill does not run `/feature load` automatically — starting actual work is an explicit user action.

## Cancellation

`plan cancel` abandons the active session:

- with no tracked session it does not pick a file: it points at `plan status` + `plan resume` and stops;
- for a still-preview file it asks whether to delete or keep it;
- it never deletes a finalized spec, never removes a file whose preview marker is missing, and never deletes unrelated preview files or screenshots;
- keeping the file leaves it untouched in `context/plans/` and clears only the session; deleting removes only the active preview file.

## Compatibility

The planning workflow does not rename, remove, or change the triggers or behavior of existing actions. Specs finalized by `plan done` load through `/feature load <path>` exactly like hand-written specs, and existing actions do not treat preview specs as active work unless you explicitly load them. Future improvements to planning should be added as separate feature or fix specs.
