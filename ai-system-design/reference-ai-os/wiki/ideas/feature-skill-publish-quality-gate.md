# Idea: `feature` skill — publish quality gate (test + review required)

**Status:** accepted (2026-07-18), not started

## What

`publish` must refuse to run unless both `test` and `review` have already been executed — via
their delegated agents (`feature-tester`, `feature-reviewer`) — against the work branch's current
state, and came back OK. Only then is the combined publish approval even shown. Today nothing in
[`actions/publish.md`](../../.claude/skills/feature/actions/publish.md) requires `test`/`review`
to have ever happened; `.claude/GUIDELINES.md` says "run checks before publishing" but the
procedure doesn't enforce it — the foundation every future project will run on currently allows
pushing code with zero verification.

## Why

The `feature` skill is the base workflow for every project to come (see
[[skill-feature]] / the bootstrap sequencing). A quality gate that exists only as a guideline
sentence will eventually be skipped; encoding it into `publish`'s own preconditions makes the
skip impossible rather than merely discouraged.

## How — to be worked out at `/feature plan`, rough shape

- `publish` gains a precondition step: verify that `test` and `review` both ran for the current
  work-branch state and passed. Refuse with a clear message ("run `test`/`review` first") when
  either is missing, stale, or failed.
- Open design questions to settle when planning for real:
  - How the "ran and passed" fact is recorded (e.g. fields on that system's
    `current-feature.md`), and how staleness is defined — new commits/changes on the work branch
    after a passing run should invalidate it.
  - What "review OK" means exactly (zero findings vs. findings explicitly triaged by Michal).
  - Whether an explicit user override exists at all, or the gate is absolute.
