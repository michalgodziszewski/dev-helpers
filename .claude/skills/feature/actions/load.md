# Load Action

Support both Markdown specifications and inline descriptions.

## Initialize local state

1. Treat context/ as ignored personal runtime data.
2. If context/current-feature.md does not exist:
   - Create context/ when necessary.
   - Copy the structure from ../assets/current-feature-template.md.
3. Never stage or commit the created directory or any file under context/.

## Accepted forms

- load <spec-file-or-name>
- load trunk <type> <spec-file-or-description>
- load branch <base-branch> <type> <spec-file-or-description>

Accept feature, bugfix, fix, hotfix, or chore as <type>.

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

## Resolve Git metadata

Resolve all metadata before writing current-feature.md.

1. Parse Markdown metadata from exact list fields under Git Workflow:
   - **Workflow:** <value>
   - **Work Type:** <value>
   - **Base Branch:** <value>
2. Trim Markdown formatting and whitespace from values. Preserve branch spelling exactly.
3. Apply this precedence:
   - Explicit command arguments
   - Values parsed from the specification
   - Ask the user
4. Never use the current branch, repository default branch, origin/HEAD, main, or trunk as an implicit fallback.
5. For load trunk:
   - Set Workflow to trunk.
   - Set Base Branch to trunk.
   - If a specification explicitly contains conflicting values, stop and report the conflict.
6. For load branch:
   - Set Workflow to branch.
   - Require the explicit base branch argument.
   - If a specification explicitly contains conflicting values, stop and report the conflict.
7. For load <spec-file-or-name>:
   - Use Workflow, Work Type, and Base Branch exactly as parsed from the specification.
   - Do not override parsed values with repository conventions.
8. Enforce invariants:
   - Workflow trunk requires Base Branch trunk.
   - Workflow branch requires a non-empty explicit Base Branch.
   - Work Type must be feature, bugfix, fix, hotfix, or chore.
9. If any required value is absent or inconsistent, show the parsed values and ask only for the missing or conflicting value before updating state.
10. Work Type may be inferred from context/fixes only when the specification omits it; otherwise preserve the explicit value.

## Update state

After the specification and Git metadata are complete:

1. Require the active slot to be Idle or an empty legacy Completed state. If active work is Not Started, In Progress, Published, or Merged, stop and tell the user to finish, clear, or abandon it first.
2. Derive a short kebab-case work name.
3. Update context/current-feature.md:
   - Set the H1 to # Current Feature: <work name>.
   - Set Status to Not Started.
   - Set Workflow, Work Type, and Base Branch.
   - Set Source Spec to the resolved repository-relative Markdown path or inline.
   - Leave Work Branch empty until start.
   - Clear Published Commits and all backport fields.
   - Copy or derive concrete Goals and Notes from the specification.
   - Preserve History unchanged.
4. Preserve Pending Reviews and History unchanged.
5. Re-read current-feature.md after writing it and verify:
   - Stored Workflow equals the resolved Workflow.
   - Stored Work Type equals the resolved Work Type.
   - Stored Base Branch equals the resolved Base Branch.
   - Stored Source Spec equals the resolved source.
6. If any stored value differs, correct it immediately, re-read the file, and stop if the second verification still fails.
7. Show the source file, resolved workflow, resolved base branch, proposed <type>/<work-name> branch, and goals.

Loading state must not run Git commands or change branches. Never stage or commit context/.
