# Load Action

Support both Markdown specifications and inline descriptions.

## Initialize local files

1. Treat context/ as ignored personal runtime data.
2. If context/current-feature.md does not exist:
   - Create context/ when necessary.
   - Copy the structure from ../assets/current-feature-template.md.
   - Because the template is placeholder-based, replace every remaining {{...}} placeholder with an empty value, remove the {{preview_notice}} line, and drop the optional planning-only sections (## References, ## Scope, ## Documentation Requirements) so the runtime state file keeps only Status, Git Workflow, Goals, Notes, Pending Reviews, and History.
3. If context/feature-config.md does not exist, copy ../assets/feature-config-template.md.
4. If current-feature.md is a legacy file without Jira Ticket, add the field after Work Type without changing other state.
5. Never stage or commit anything under context/.

## Accepted forms

- load [--ticket <ticket>] <spec-file-or-name>
- load trunk <type> [--ticket <ticket>] <spec-file-or-description>
- load branch <base-branch> <type> [--ticket <ticket>] <spec-file-or-description>

Accept feature, bugfix, fix, hotfix, or chore as <type>. Accept at most one --ticket argument and remove the flag pair before resolving the specification source.

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
4. Re-read current-feature.md after writing it and verify:
   - Stored Workflow equals the resolved Workflow.
   - Stored Work Type equals the resolved Work Type.
   - Stored Jira Ticket equals the resolved normalized ticket or is empty.
   - Stored Base Branch equals the resolved Base Branch.
   - Stored Source Spec equals the resolved source.
5. If any stored value differs, correct it immediately, re-read the file, and stop if the second verification still fails.
6. Show the source file, Jira mode, resolved ticket, workflow, base branch, proposed branch, and goals.

Loading state must not fetch, pull, create, switch, or modify Git branches. Never stage or commit context/.
