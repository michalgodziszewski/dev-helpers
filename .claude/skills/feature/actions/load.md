# Load Action

Support both Markdown specifications and inline descriptions.

## Accepted forms

- load <spec-file-or-name>
- load trunk <type> <spec-file-or-description>
- load branch <base-branch> <type> <spec-file-or-description>

Accept feature, bugfix, hotfix, or chore as <type>.

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

1. For load trunk, set Workflow to trunk and Base Branch to trunk.
2. For load branch, require the explicit base branch.
3. For load <spec-file-or-name>, read Workflow, Work Type, and Base Branch from the specification when present.
4. If a file-only invocation does not define all required Git metadata, show the loaded specification and ask only for the missing values before updating current-feature.md.
5. Never guess the base branch. Work Type may be inferred from an unambiguous specification heading or from context/fixes for bugfix; otherwise ask.

## Update state

After the specification and Git metadata are complete:

1. Derive a short kebab-case work name.
2. Update context/current-feature.md:
   - Set the H1 to # Current Feature: <work name>.
   - Set Status to Not Started.
   - Set Workflow, Work Type, and Base Branch.
   - Set Source Spec to the resolved repository-relative Markdown path or inline.
   - Leave Work Branch empty until start.
   - Clear Backport fields.
   - Copy or derive concrete Goals and Notes from the specification.
   - Preserve History unchanged.
3. Show the source file when used, workflow, base branch, proposed <type>/<work-name> branch, and goals.

Loading state must not run Git commands or change branches.
