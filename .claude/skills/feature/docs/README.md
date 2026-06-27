# Feature Skill Documentation

This documentation explains when to use the `feature` skill and how to operate it safely during everyday development.

## Documentation map

- [Use cases](use-cases.md) describes the practical scenarios the skill supports.
- [Workflow guide](workflow-guide.md) explains the end-to-end lifecycle from loading work to completion.
- [Action reference](action-reference.md) summarizes each supported command and when to use it.
- [Safety rules](safety-rules.md) documents the invariants that protect branches, commits, and local runtime state.

## Quick start

1. Load a specification or inline description with `load`.
2. Start work with `start`, which synchronizes the base branch before creating a work branch.
3. Implement the requested changes.
4. Run `test` and `review` before publication.
5. Publish with `publish`, then optionally use `clear` to free the active slot while review is pending.
6. Finish with `complete` after the primary work and any backport have been merged.
