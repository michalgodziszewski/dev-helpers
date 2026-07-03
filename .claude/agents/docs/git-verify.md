# Git Verify Subagent

A read-only Claude Code subagent that verifies Git merge evidence and commit facts — whether given commits are ancestors of a base or release branch, whether each SHA resolves and is a non-merge commit, and it reports the exact evidence. It never fetches and never modifies files, branches, refs, or remote-tracking state.

**Definition:** `.claude/agents/git-verify.md`

## When to use

Spawn this subagent:

- Automatically as the delegated merge-evidence check of `/feature complete`, to confirm published commits are ancestors of the base before local cleanup.
- Automatically as the delegated primary-merge verification of `/feature backport`, before creating the backport branch and cherry-picking.
- Directly, when you need to confirm that specific commits landed in a ref without changing any state yourself.

## How to spawn

Use the Agent tool with `subagent_type: "git-verify"`:

```
Agent({
  description: "Verify merge evidence",
  subagent_type: "git-verify",
  prompt: "Target ref origin/<base-branch>. Verify these ordered SHAs are ancestors and non-merge commits: <sha1> <sha2>. Optional merge SHA for a squash merge: <merge-sha>."
})
```

Pass the target ref, the ordered list of commit SHAs to verify, and optionally a merge SHA used as evidence for squash or rebase merges. The caller must fetch before delegating — this subagent verifies against the refs as they are. If a required input is missing, it reports exactly what is missing and stops.

## Model

Uses the **Haiku** model, pinned to `model: claude-haiku-4-5`. Ancestry and commit-fact checks are mechanical, so the fastest, lowest-cost model is appropriate.

## Tools

| Tool | Purpose |
|---|---|
| Bash | Run the read-only verification commands on POSIX shells |
| PowerShell | Run the same read-only verification commands on Windows shells |

The subagent has **no file tools** — it cannot use Read, Grep, Glob, Edit, Write, NotebookEdit, or Agent. Its only capability is running the allowed read-only Git commands.

### Allowed shell commands

```bash
git rev-parse --verify <sha>^{commit}
git rev-parse <ref>
git cat-file -p <sha>
git merge-base --is-ancestor <sha> <ref>
git branch -r --contains <sha>
git log --oneline -n <n> <ref>
git show --no-patch --format=%H%x09%P%x09%s <sha>
```

Nothing else.

## Constraints

- Strictly read-only — never edits, creates, or deletes files.
- Never commits, pushes, merges, checks out, resets, cleans, **fetches**, or pulls; it never changes files, branches, refs, or remote-tracking state.
- Never guesses a branch or SHA; a missing required input is reported and stops the run.
- Never infers success from partial evidence — it reports exactly what was verified and what failed.

## Scope

Focuses on merge and commit evidence:

- that a target ref resolves
- that each SHA resolves, whether it is a merge commit (more than one parent), and its subject
- ancestry of each SHA against the target ref
- when supplied, that a merge SHA is contained in the target ref — reported separately as evidence only, never as part of the atomic commit list

It does not decide what to do with the evidence; the delegating action owns cleanup or cherry-pick decisions.

## Verify procedure

1. Verify the target ref resolves.
2. For every SHA: verify it resolves, report whether it is a merge commit, and report its subject.
3. Check ancestry with `git merge-base --is-ancestor <sha> <ref>`; record yes/no per SHA.
4. When a merge SHA is provided, verify it is contained in the target ref and report that separately.
5. Never infer success from partial evidence; report exactly what was verified and what failed.

## Output format

One line per SHA:

```
<sha> <subject> — ancestor of <ref>: yes/no — merge commit: yes/no
```

Followed by a final verdict:

- `VERIFIED` — every required check passed
- `NOT VERIFIED: <exact reason>` — anything failed or was missing

No recommendations, no state changes, facts only.

## Relationship to other actions

| Action | Purpose | Relationship |
|---|---|---|
| `/feature complete` | Verify merges, update the local base, clean up branches | Delegates merge-evidence verification to this subagent before any local cleanup |
| `/feature backport` | Synchronize a release branch, create a backport branch, cherry-pick atomically | Delegates primary-merge verification to this subagent (target `origin/trunk`, ordered Published Commits, optional primary-merge-sha) before branching |
| `/feature publish` | Commit and push | None — verification happens at complete and backport, after GitHub merges |

If no `git-verify` agent is installed in the project, `complete` and `backport` run the same read-only verification commands inline and note that delegation was skipped, rather than failing.
