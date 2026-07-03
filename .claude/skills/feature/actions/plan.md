# Plan Action

Plan a new work specification as an iterative session, not a one-shot generator. `plan` creates a real Markdown preview spec early, refines it as requirements arrive, and `plan done` finalizes it in place.

This action never starts Git work, never creates branches, never commits, never pushes, and never modifies the active slot in context/current-feature.md unless the user explicitly asks. It only reads and writes spec files under context/features/ or context/fixes/ and, when relevant, saves images under context/screenshots/.

## Dispatch

Read the first argument after `plan` and route:

- no argument → **Start or refine** a planning session (with no tracked session, this route begins with the Session recovery picker).
- a work type / name / description → **Start or refine** a planning session directly, never via the picker.
- `done` → **Finalize** the active preview spec.
- `cancel` → **Cancel** the active planning session.
- `status` → **Show planning status**.

Only `plan done` may finalize. Only `plan cancel` may delete a preview file. `plan status` never writes.

When no session is tracked in the conversation, every route first applies **Session recovery**: bare `plan` presents the recovery picker, `done` and `cancel` recover with explicit selection before running their normal procedure, and `status` reports recoverable previews read-only. `plan` with arguments never shows the picker.

## Planning session identity

There is no separate persisted draft state on disk. The active planning session is the preview spec file created during the current conversation. Track its resolved path in the conversation.

A preview spec is any generated spec whose body still contains the marker block:

```md
<!-- PLAN_PREVIEW_START -->
> Preview: this spec is still being planned. It will be finalized by `feature plan done`.
<!-- PLAN_PREVIEW_END -->
```

A finalized spec has no such block. Only operate on the preview file created by the current session. Never modify or delete another preview file unless the user explicitly selects it.

## Session recovery

The conversation-tracked session is lost after /clear, compaction, or a new session, but the preview file remains on disk. When a subcommand needs an active session and none is tracked in the conversation, recover before giving up. Recovery applies to bare `plan`, `plan status`, `plan done`, and `plan cancel` only — `plan` with arguments always starts a new session directly and never shows the picker:

1. Scan `.md` files in `context/features/` and `context/fixes/` for files containing the exact preview marker block defined above. Skip missing folders.
2. If no preview files exist, there is nothing to recover; behave exactly as before this recovery step existed.
3. If preview files exist, present every one as a recovery listing: repository-relative path, title (the H1 subtitle line), work type, and which finalization-required fields are still missing in that file.
4. Ask the user to pick one preview. When recovery was triggered from bare `plan`, also offer explicitly starting a brand-new planning session; when triggered from `plan done` or `plan cancel`, the only choices are selecting a preview to act on or aborting. Never auto-select, even when exactly one preview exists — a single match may be offered as the obvious default, but the user chooses.
5. On selection, resume: re-read the selected file, track its path as the active planning session, report which finalization-required fields are already satisfied, and continue with the normal procedure of the subcommand that triggered recovery.

Recovery selection is a clarifying question about ambiguous state, not a new routine approval; it does not change the confirmation policy. Recovery never modifies any file by itself — only the selected preview file may later be modified or deleted, by the same rules as an ordinary session.

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

Note: `/feature load` currently accepts only `feature`, `bugfix`, `fix`, `hotfix`, and `chore`. When a broader planning work type is used, tell the user that loading the finalized spec may require choosing one of those five load types.

## Number and path resolution

1. Do not ask the user for the number.
2. Scan `.md` files in the selected target folder.
3. Read four-digit numeric filename prefixes in the `0001-...md` style.
4. If no numbered Markdown files exist, use `0001`. Otherwise use the highest detected number plus one.
5. Pad the number to four digits.
6. Each target folder has independent numbering; never share one sequence across folders.
7. Derive the filename slug from the planned name: lowercase, hyphen-separated words, remove unsupported special characters, keep it short and readable.
8. Compose the source spec path as `<target-folder>/<number>-<slug>.md`, for example `context/features/0010-feature-skill-plan-action.md`.
9. Never silently overwrite an existing spec file. If the composed filename already exists, report the collision and adjust safely (recompute the next free number) or ask for confirmation before writing.

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
2. When no session is tracked in the conversation, route by whether `plan` received arguments:
   - Bare `plan` (no arguments): apply Session recovery. When preview files exist on disk, present the recovery picker and let the user resume a selected preview or explicitly start a brand-new session. With no previews on disk, continue below exactly as today.
   - `plan <work-type / name / description>` (with arguments): start a new planning session directly, without the picker. When unrelated preview files exist on disk, at most mention in one line that other unfinalized previews exist.
3. Gather the required-to-create inputs. Ask targeted questions for anything missing instead of producing a weak spec too early.
4. Resolve the target folder from the work type, asking when unclear. Create the folder if it does not exist.
5. Resolve the next number and slug, then compose the source spec path. Handle collisions safely.
6. If a preview spec for this session already exists (including one just resumed through Session recovery), update that same file only. Otherwise create the preview file from `../assets/current-feature-template.md`:
   - Replace `{{title}}`, `{{short_description}}`, `{{workflow}}`, `{{work_type}}`, `{{jira_ticket}}`, `{{base_branch}}`, `{{work_branch}}`, `{{source_spec}}`, `{{goals}}`, `{{references}}`, `{{scope}}`, `{{documentation_requirements}}`, and `{{notes}}` with resolved values or safe defaults.
   - Set `{{source_spec}}` to the composed repository-relative path.
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

1. If no session is tracked in the conversation, apply the scan from Session recovery read-only: when preview files exist on disk, report each one with its path, title, work type, and missing finalization-required fields, and point to bare `plan` for resuming one; when none exist, clearly say there is no active plan. Stop in both cases without asking a question.
2. If a session is active, show:
   - current preview spec path,
   - whether the spec is still preview or finalized,
   - selected target folder,
   - selected work type,
   - resolved number,
   - workflow approach if known,
   - base branch if known,
   - Jira ticket if known,
   - key references gathered so far,
   - missing required fields before finalization.
3. Show a concise missing-fields checklist covering the finalization requirements that are not yet satisfied.
4. Never finalize or modify the spec. `plan status` is read-only and may be run repeatedly.

## plan cancel

1. If no session is tracked in the conversation, apply Session recovery first: when preview files exist on disk, present the recovery picker and let the user explicitly select the preview to cancel; when none exist, clearly say there is no active plan to cancel and stop. Never pick a file to cancel automatically.
2. If the active preview file still contains the preview marker block, ask whether to delete it or keep it.
3. Never delete a finalized spec. Never remove a file whose preview marker block is missing.
4. If the user chooses to keep the file, leave it untouched and clear only the active planning session.
5. If the user chooses to delete it, delete only the active preview file created by the current session. Never delete unrelated preview files or any file under context/screenshots/.

## plan done

1. Require an active planning session with a resolved preview file. If no session is tracked in the conversation, apply Session recovery first: when preview files exist on disk, present the recovery picker and let the user explicitly select the preview to finalize, then continue this procedure on the selected file; when none exist, say there is no active plan and stop.
2. Verify every finalization-required field is present. If any is missing, do not finalize:
   - show the missing-fields checklist,
   - keep the preview spec active and unchanged,
   - stop.
3. Summarize the resolved plan before writing:
   - target folder,
   - resolved number,
   - source spec path,
   - work type,
   - workflow,
   - base branch,
   - main goals,
   - key references.
4. Write the finalized Markdown to the already resolved `Source Spec` path, keeping the same file path created during `plan`:
   - Follow the recreated `../assets/current-feature-template.md` structure exactly.
   - Remove the entire preview block from `<!-- PLAN_PREVIEW_START -->` through `<!-- PLAN_PREVIEW_END -->`, including both marker lines.
   - Fill every remaining placeholder with resolved values; render empty optional list sections as `None.`.
   - Keep `## History` exactly as `<!-- Managed by skill -->`. Never generate or edit history here.
5. If the file cannot be written or updated, report the problem and show the generated Markdown content as a fallback.
6. After a successful finalization:
   - show the finalized spec path,
   - suggest the exact next command `/feature load <generated-source-spec-path>` using the resolved `Source Spec` path,
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
