# Plan Action

Plan a new work specification as an iterative session, not a one-shot generator. `plan` creates a real Markdown preview spec early in `context/plans/`, refines it as requirements arrive, and `plan done` numbers it, moves it into its target folder, and finalizes it.

This action never starts Git work, never creates branches, never commits, never pushes, and never modifies the active slot in context/current-feature.md unless the user explicitly asks. It only reads and writes spec files under context/plans/, context/features/, or context/fixes/ and, when relevant, saves images under context/screenshots/.

## Dispatch

Read the first argument after `plan` and route:

- no argument, or a work type / name / description → **Start or refine** a planning session. This route always starts or continues a session directly; it never scans the disk for previews first.
- `resume <file>` → **Resume** one specific staged preview from context/plans/.
- `done` → **Finalize** the active preview spec.
- `cancel` → **Cancel** the active planning session.
- `status` → **Show planning status**.

Only `plan done` may finalize. Only `plan cancel` may delete a preview file. `plan status` never writes.

With no conversation-tracked session, `plan status` is the discovery point (it lists context/plans/ read-only) and `plan resume` is the only way to reattach to a staged preview. `plan done` and `plan cancel` never pick or recover a file on their own.

## Planning session identity

There is no separate persisted draft state on disk. The active planning session is the preview spec file created during the current conversation, or the one explicitly reattached with `plan resume`. Track its resolved path in the conversation.

Unfinalized previews are staged in `context/plans/` with slug-only filenames (no number prefix). A preview spec is any generated spec whose body still contains the marker block:

```md
<!-- PLAN_PREVIEW_START -->
> Preview: this spec is still being planned. It will be finalized by `feature plan done`.
<!-- PLAN_PREVIEW_END -->
```

A finalized spec has no such block, carries a four-digit number prefix, and lives in `context/features/` or `context/fixes/`. Only operate on the preview file tracked by the current session. Never modify or delete another preview file unless the user explicitly selects it with `plan resume`.

## Work type to target folder

Infer the target folder from the planned work type:

| Target folder | Work types |
|---|---|
| `context/fixes/` | `fix`, `bugfix`, `hotfix` |
| `context/features/` | `feature`, `docs`, `refactor`, `chore`, `tooling`, `config`, `test`, `ci`, `research` |

- Store the selected work type verbatim in the generated `Work Type` field.
- The target folder and the work type do not need to share a name.
- If the work type is unknown or unclear, ask before creating the preview spec.
- If the target folder is still unclear, ask whether the spec belongs in `context/features/` or `context/fixes/`.
- The target folder is used only at finalization; while planning, the preview stays in `context/plans/`.

Note: `/feature load` currently accepts only `feature`, `bugfix`, `fix`, `hotfix`, and `chore`. When a broader planning work type is used, tell the user that loading the finalized spec may require choosing one of those five load types.

## Staging path resolution

While a session is being planned, its preview lives at `context/plans/<slug>.md`:

1. Derive the filename slug from the planned name: lowercase, hyphen-separated words, remove unsupported special characters, keep it short and readable.
2. Compose the staging path as `context/plans/<slug>.md`. Create `context/plans/` when it does not exist.
3. Slug collisions are not allowed: when the composed filename already exists in `context/plans/`, stop and require a different name. Never overwrite and never silently suffix the filename.
4. Previews carry no number and consume no number in `context/features/` or `context/fixes/`.

## Number and path resolution (at finalization)

`plan done` resolves the final number and path at the moment of finalization, never earlier:

1. Do not ask the user for the number.
2. Scan `.md` files in the selected target folder.
3. Read four-digit numeric filename prefixes in the `0001-...md` style.
4. If no numbered Markdown files exist, use `0001`. Otherwise use the highest detected number plus one.
5. Pad the number to four digits.
6. Each target folder has independent numbering; never share one sequence across folders.
7. Compose the final source spec path as `<target-folder>/<number>-<slug>.md`, for example `context/features/0010-feature-skill-plan-action.md`.
8. Never silently overwrite an existing spec file. If the composed filename already exists, report the collision and adjust safely (recompute the next free number) or ask for confirmation before writing.

## Required inputs

Required before creating a useful preview spec:

- target spec collection or work type,
- feature/fix name,
- short description.

Required before finalization with `plan done`:

- target spec collection,
- work type,
- feature/fix name,
- short description,
- workflow approach,
- base branch,
- goals,
- scope.

Optional values may stay empty or render as `None.` depending on the section. Empty Git Workflow fields stay blank unless the value is known. Never silently assume workflow approach or base branch; ask before finalizing when either is missing.

## Start or refine

1. This is a planning session; do not touch the active slot in context/current-feature.md.
2. `plan` — bare or with arguments — always starts a new session (or continues the session already tracked in this conversation). It never scans the disk for other previews and never asks which preview to resume; reattaching to a staged preview is `plan resume`'s job.
3. Gather the required-to-create inputs. Ask targeted questions for anything missing instead of producing a weak spec too early.
4. Resolve the target folder from the work type, asking when unclear. The folder is recorded for finalization; nothing is created there yet.
5. Resolve the slug and compose the staging path `context/plans/<slug>.md`. On a slug collision, stop and require a different name.
6. If a preview spec for this session already exists (including one reattached through `plan resume`), update that same file only. Otherwise create the preview file from `../assets/current-feature-template.md`:
   - Replace `{{title}}`, `{{short_description}}`, `{{workflow}}`, `{{work_type}}`, `{{jira_ticket}}`, `{{base_branch}}`, `{{work_branch}}`, `{{source_spec}}`, `{{goals}}`, `{{references}}`, `{{scope}}`, `{{documentation_requirements}}`, and `{{notes}}` with resolved values or safe defaults.
   - Leave `{{source_spec}}` empty while the preview is staged in `context/plans/`; `plan done` fills it with the final numbered path.
   - Leave `{{work_branch}}` empty; it is populated later by `/feature start`, not by planning.
   - Set `{{preview_notice}}` to the exact recommended preview block:

     ```md
     <!-- PLAN_PREVIEW_START -->
     > Preview: this spec is still being planned. It will be finalized by `feature plan done`.
     <!-- PLAN_PREVIEW_END -->
     ```

   - Render empty list sections as `None.` when no useful content exists. Keep `## History` exactly as `<!-- Managed by skill -->`.
7. Report the created or updated preview path and remind the user it is still a preview.
8. Keep refining: apply new requirements to the same preview file as the user or gathered sources provide them.

## plan resume

Resume one specific staged preview by explicit filename. The typical case is when no session is tracked in the conversation (after /clear, compaction, or a new session — the conversation-tracked session is lost but the preview file remains on disk), but `plan resume` also works when a session is already tracked, switching the active session to the selected file:

1. Require a `<file>` argument. Without one, point at `plan status` for the list of staged previews and stop.
2. Resolve the argument the same way `load` resolves its spec argument. Check each candidate in order and use the first that exists as a file:
   - the provided value exactly as given,
   - the provided value with `.md` appended (only when it does not already end in `.md`),
   - `context/plans/<name>.md`, where `<name>` is the provided value,
   - `context/plans/<name>.md` with `.md` appended to `<name>` (only when `<name>` does not already end in `.md`).
3. If no matching file exists, stop and report every path checked.
4. Require the resolved file to contain the preview marker block. A file without it is not a resumable preview — report that and stop; finalized specs are loaded with `/feature load`, not resumed.
5. On success, resume: re-read the selected file, track its path as the active planning session, report which finalization-required fields are already satisfied and which are still missing, and continue the normal refine loop on that same file.

Resume never modifies any file by itself — only the resumed preview file may later be modified or deleted, by the same rules as an ordinary session. If a session is already tracked in the conversation, `plan resume` switches the session to the selected file and says so.

## Requirement gathering

- Support iterative changes before finalization.
- Requirements may come directly from the user, or from optional external sources: Atlassian/Jira through MCP, repository files, existing documentation, pasted notes, screenshots under `context/screenshots/`, or other available MCP/tool sources.
- When planning needs repository exploration (locating relevant files, existing patterns, constraints, or impact), delegate it to the plan-research subagent (Agent tool, subagent_type "plan-research") so file contents stay out of the planning conversation. Explore inline when the agent is not installed.
- External sources are optional capabilities. If a source is unavailable, continue with user-provided context; never fail the whole plan because an optional source is missing.
- Do not blindly copy Jira or external content into the spec. Extract practical requirements; avoid dumping raw or overly long source text.
- When requirements come from Jira or another external source, summarize the gathered context before finalization.
- If requirements are loaded from Jira and the ticket key is known, set the generated `Jira Ticket` to that key.

## Visual references and screenshots

- Recognize references to files under `context/screenshots/`.
- When the user provides a screenshot path under `context/screenshots/`, treat it as a required planning input and inspect it when preparing the plan.
- Include screenshot paths in the generated `## References` section.
- Reflect relevant observations from screenshots in `## Goals`, `## Scope`, or `## Notes`, not only as links.
- If a referenced screenshot is missing or unreadable, report it clearly and continue with the remaining context.
- When requirements are loaded from Jira through MCP, check whether the issue has image attachments. Download only attachments relevant to the planned work into `context/screenshots/`.
  - Use safe, readable filenames in the form `<jira-ticket>-<short-slug>.<extension>`.
  - On a filename collision, create a unique filename instead of overwriting.
  - Reference downloaded images in `## References` and note which visual evidence informed the plan.
  - If attachments cannot be downloaded, keep the Jira attachment references in the planning summary and continue without failing the plan.

## Scope content rules

- The `## Scope` section may use grouped structure when useful:

  ```md
  In scope:

  - ...

  Out of scope:

  - ...
  ```

- Add `Out of scope` only when the discussion identifies work that should not be part of this spec. Keep it concise; do not invent out-of-scope items when there are none.

## plan status

1. If no session is tracked in the conversation, list every `.md` file in `context/plans/` read-only. Unlike the old session recovery, do not use the marker block as a filter to decide which files to show — list all of them, then read each one's contents to report on it:
   - When the folder is missing or empty, clearly say there is no active plan and no staged previews.
   - Otherwise show, per `.md` file: the repository-relative path, title (the H1 subtitle line), work type, and which finalization-required fields are still missing in that file.
   - Warn about any file in `context/plans/` that lacks the preview marker block (a misplaced manual file or a bug that should not happen) instead of silently skipping it.
   - Point at `plan resume <file>` for resuming one.
   - Stop in all cases without asking a question.
2. If a session is active, show:
   - current preview spec path,
   - whether the spec is still preview or finalized,
   - selected target folder,
   - selected work type,
   - workflow approach if known,
   - base branch if known,
   - Jira ticket if known,
   - key references gathered so far,
   - missing required fields before finalization.
3. Show a concise missing-fields checklist covering the finalization requirements that are not yet satisfied.
4. Never finalize or modify the spec. `plan status` is read-only and may be run repeatedly. The final number is not shown because it is assigned only by `plan done`.

## plan cancel

1. If no session is tracked in the conversation, do not pick or recover a file: point at `plan status` to list staged previews and `plan resume <file>` to reattach to the one to cancel, then stop.
2. If the active preview file still contains the preview marker block, ask whether to delete it or keep it.
3. Never delete a finalized spec (finalized specs live in the target folder, not context/plans/, so this should not arise for a tracked session). Never remove a file whose preview marker block is missing — a file in context/plans/ that lost its marker block is the same anomaly `plan status` warns about, not a finalized spec; leave it in place.
4. If the user chooses to keep the file, leave it untouched in `context/plans/` and clear only the active planning session.
5. If the user chooses to delete it, delete only the active preview file tracked by the current session. Never delete unrelated preview files or any file under context/screenshots/.

## plan done

1. Require an active planning session with a resolved preview file. If no session is tracked in the conversation, do not pick or recover a file: point at `plan status` to list staged previews and `plan resume <file>` to reattach to the one to finalize, then stop.
2. Verify every finalization-required field is present. If any is missing, do not finalize:
   - show the missing-fields checklist,
   - keep the preview spec active and unchanged,
   - stop.
3. Resolve the final number and path now, following "Number and path resolution (at finalization)": scan the target folder, take the next free four-digit number, and compose `<target-folder>/<number>-<slug>.md`.
4. Summarize the resolved plan before writing:
   - target folder,
   - resolved number,
   - final source spec path,
   - work type,
   - workflow,
   - base branch,
   - main goals,
   - key references.
5. Write the finalized Markdown to the resolved final path and remove the staged file from `context/plans/` (a move):
   - Follow the recreated `../assets/current-feature-template.md` structure exactly.
   - Remove the entire preview block from `<!-- PLAN_PREVIEW_START -->` through `<!-- PLAN_PREVIEW_END -->`, including both marker lines.
   - Set the `Source Spec` field to the final numbered repository-relative path.
   - Fill every remaining placeholder with resolved values; render empty optional list sections as `None.`.
   - Keep `## History` exactly as `<!-- Managed by skill -->`. Never generate or edit history here.
6. If the finalized file cannot be written, report the problem, keep the staged preview in `context/plans/` untouched, and show the generated Markdown content as a fallback. Never delete the staged file before the finalized file is confirmed written.
7. After a successful finalization:
   - show the finalized spec path,
   - suggest the exact next command `/feature load <final-source-spec-path>` using the resolved `Source Spec` path,
   - explain that `/feature load ...` starts working with the generated spec,
   - do not run `/feature load ...` automatically. Starting actual work is a separate explicit user action.

## Compatibility

- Do not rename, remove, or change the triggers of existing actions.
- Do not change existing action behavior unless this feature requires it, and call out any such change.
- Finalized specs must load through `/feature load <path>` exactly like hand-written specs.
- Existing actions must not treat preview specs as active work unless the user explicitly loads them.

## Boundaries

- Do not manually generate or edit feature history.
- Do not modify `dev start` or `dev status`, and do not add a `dev plan` CLI command.
- Do not mix CLI helper behavior with skill behavior.
- Do not start git work, create branches, commit, or push.
- Do not expand this workflow with non-essential improvements; plan future enhancements as separate feature or fix specs.
