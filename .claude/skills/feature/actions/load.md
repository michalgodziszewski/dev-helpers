# Load Action

Support both Markdown specifications and inline descriptions.

## Initialize local files

1. Treat context/ as ignored personal runtime data.
2. If context/current-feature.md does not exist:
   - Create context/ when necessary.
   - Copy the structure from ../assets/current-feature-template.md.
   - Because the template is placeholder-based, replace every remaining {{...}} placeholder with an empty value, remove the {{preview_notice}} line, and drop the optional planning-only sections (## References, ## Scope, ## Documentation Requirements) so the runtime state file keeps only Status, Git Workflow, Goals, Notes, Pending Reviews, and History.
3. If context/feature-config.md does not exist, create it with this exact default content. The packaged assets/feature-config-template.md is the source of truth; the installed skill does not carry that template, so this inline copy must stay byte-identical to it:

   ```md
   # Feature Configuration

   ## Jira

   - **Mode:** disabled
   - **Project Keys:**
   - **Ticket Pattern:** ^[A-Z][A-Z0-9]*-[1-9][0-9]*$
   - **Branch Format:** <type>/<ticket>-<name>
   - **Commit Format:** <commit-type>: [<ticket>] - <message>
   ```
4. If current-feature.md is a legacy file without Jira Ticket, add the field after Work Type without changing other state.
5. Never stage or commit anything under context/.

## Accepted forms

- load [--ticket <ticket>] [--yolo] <spec-file-or-name>
- load trunk <type> [--ticket <ticket>] [--yolo] <spec-file-or-description>
- load branch <base-branch> <type> [--ticket <ticket>] [--yolo] <spec-file-or-description>

Accept feature, bugfix, fix, hotfix, or chore as <type>. Accept at most one --ticket argument and remove the flag pair before resolving the specification source.

Accept an optional `--yolo` flag in any position on every form. Strip it out before resolving the specification source, and record that this load starts an autonomous run. `--yolo` takes no value; treat a repeated `--yolo` as the same single flag. See "Autonomous continuation (--yolo)" below.

## Read Jira configuration

Parse these exact list fields under Jira in context/feature-config.md:

- **Mode:** <disabled | optional | required>
- **Project Keys:** <comma-separated keys or empty>
- **Ticket Pattern:** <regular expression>
- **Branch Format:** <template>
- **Commit Format:** <template>

Validate before updating state:

1. Require Mode to be disabled, optional, or required.
2. Require Ticket Pattern to compile.
3. Normalize configured project keys to uppercase. Require every non-empty key to match ^[A-Z][A-Z0-9]*$.
4. Require Branch Format to contain <type>, <ticket>, and <name> exactly once when Mode is optional or required.
5. Require Commit Format to contain <commit-type>, <ticket>, and <message> exactly once when Mode is optional or required.
6. Stop and report the exact invalid field. Never silently fall back to another Jira mode or format.

## Resolve the specification

1. When the remaining source is an existing Markdown path, read that file.
2. When load receives one filename-like value, search in this order:
   - the provided path
   - context/features/<name>.md
   - context/fixes/<name>.md
   - repeat the searches with .md appended when omitted
3. When no matching file exists and the source contains multiple words, treat it as an inline description.
4. When a filename-like value cannot be found, stop and report every path checked.
5. Never modify or move the source specification file.
6. Store a resolved file as a repository-relative Source Spec path. Store inline for an inline description.

## Resolve Git and Jira metadata

Resolve all metadata before writing current-feature.md.

1. Parse Markdown metadata from exact list fields under Git Workflow:
   - **Workflow:** <value>
   - **Work Type:** <value>
   - **Base Branch:** <value>
   - **Jira Ticket:** <value>
2. Trim Markdown formatting and whitespace from values. Preserve branch spelling exactly.
3. Resolve Workflow, Work Type, and Base Branch with this precedence:
   - Explicit command arguments
   - Values parsed from the specification
   - Ask the user
4. Resolve Jira Ticket with this precedence:
   - Explicit --ticket argument
   - Jira Ticket parsed from the specification
   - Ask the user only when Jira Mode is required
5. Normalize a resolved Jira Ticket to uppercase.
6. When Jira Mode is optional or required and a ticket is present:
   - Require it to match Ticket Pattern completely, not as a substring.
   - Extract the project key before the first hyphen.
   - When Project Keys is non-empty, require an exact match to one allowed key.
7. When Jira Mode is required, stop and ask only for Jira Ticket if it is absent or invalid.
8. When Jira Mode is disabled, Jira Ticket may be stored for reference but must not affect branch or commit naming.
9. Never use the current branch, repository default branch, origin/HEAD, main, or trunk as an implicit fallback.
10. For load trunk:
   - Set Workflow to trunk.
   - Set Base Branch to trunk.
   - If a specification explicitly contains conflicting values, stop and report the conflict.
11. For load branch:
   - Set Workflow to branch.
   - Require the explicit base branch argument.
   - If a specification explicitly contains conflicting values, stop and report the conflict.
12. For load <spec-file-or-name>:
   - Use Workflow, Work Type, and Base Branch exactly as parsed from the specification.
   - Do not override parsed values with repository conventions.
13. Enforce invariants:
   - Workflow trunk requires Base Branch trunk.
   - Workflow branch requires a non-empty explicit Base Branch.
   - Work Type must be feature, bugfix, fix, hotfix, or chore.
14. If any required value is absent or inconsistent, show the parsed values and ask only for the missing or conflicting value before updating state.
15. Work Type may be inferred from context/fixes only when the specification omits it; otherwise preserve the explicit value.

## Derive names

1. Derive a short kebab-case work name.
2. If the source name or title starts with the resolved Jira Ticket, remove that ticket and the following separators before deriving the work name. Never duplicate the ticket.
3. When Jira Mode is optional or required and Jira Ticket is populated, render the proposed branch from Branch Format:
   - <type> = Work Type
   - <ticket> = normalized Jira Ticket
   - <name> = work name
4. Otherwise use <work-type>/<work-name>.
5. Require the rendered value to pass git check-ref-format --branch. This validation is read-only and must not create or switch branches.

## Update state

After the specification and all metadata are complete:

1. Require the active slot to be Idle or an empty legacy Completed state. If active work is Not Started, In Progress, Published, or Merged, stop and tell the user to finish, clear, or abandon it first.
2. Update context/current-feature.md:
   - Set the H1 to # Current Feature: <work name>.
   - Set Status to Not Started.
   - Set Workflow, Work Type, Jira Ticket, and Base Branch.
   - Set Source Spec to the resolved repository-relative Markdown path or inline.
   - Leave Work Branch empty until start.
   - Clear Published Commits and all backport fields.
   - Copy or derive concrete Goals and Notes from the specification.
   - Preserve History unchanged.
3. Preserve Pending Reviews and History unchanged.
4. Verify the write once: confirm the stored Workflow, Work Type, Jira Ticket, Base Branch, and Source Spec equal the resolved values (a confirmed successful write counts as verification). On a mismatch, correct it immediately and stop if it persists. Do not run repeated re-read loops.
5. Show the source file, Jira mode, resolved ticket, workflow, base branch, proposed branch, and goals.

load asks the user only for missing or conflicting required metadata (workflow, work type, base branch, or a required Jira ticket). Every other step, including all read-only Git validation, runs without questions. Loading state must not fetch, pull, create, switch, or modify Git branches. Never stage or commit context/.

## Autonomous continuation (--yolo)

When `--yolo` was supplied and load completed successfully (state is Not Started), do not stop at the load summary. Continue the workflow autonomously in the same turn, following each action's own procedure:

1. Run the `start` action: synchronize the base and create the work branch. If start stops for an infrastructure or safety reason (dirty tree outside the allowed Source Spec, base cannot fast-forward, local base differs from origin, or the work branch already exists), stop the autonomous run and report exactly what blocked it. Do not attempt to auto-resolve it.
2. Implement the Goals from the specification, one by one, exactly as start already requires.
3. Run the `test` action. If a required check fails, fix the cause, re-run the relevant checks, and repeat until they pass. Bound the loop to about 2–3 attempts on the same failure; if it still fails, stop and report the failure and what was tried.
4. Run the `review` action. Treat a `Needs changes` verdict or high-severity findings as work to do, not a stop: remediate them, re-run the relevant tests, and re-review until the verdict is `Ready to publish`, within the same bounded-attempts guard.
5. Run the `publish` action and stop at its single combined approval. On the normal path this is the only prompt of the whole run. Do not commit or push before the user approves.

Rules for the autonomous run:

- The combined publish approval is never skipped, pre-answered, or suppressed. `--yolo` never commits or pushes without it.
- The pre-existing permission gates still apply. If a check would require installing dependencies or changing test configuration, stop and ask exactly as a manual `/feature test` would; `--yolo` never grants permission to install dependencies or change configuration. This is the only prompt that can appear before publish, and only when a check needs it.
- Never auto-stash, reset, rebase, force-pull, or force-push to get past an infrastructure or safety stop.
- Destructive operations (backport, branch deletion, discard) are never part of a `--yolo` run.
- When any load metadata is missing or conflicting, resolve it exactly as a normal load would — asking the user for that specific value — before beginning the autonomous chain.
- If load itself stops (invalid config, unresolved metadata, occupied active slot), `--yolo` has no effect; there is no run to start.
