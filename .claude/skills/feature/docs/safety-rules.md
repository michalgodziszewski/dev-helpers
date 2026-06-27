# Safety Rules

The `feature` skill is intentionally conservative. These rules prevent accidental branch damage, incorrect pull request targets, and loss of local state.

## Local state is private runtime data

The skill stores runtime state in `context/current-feature.md`. Files under `context/` are personal runtime data and must never be staged or committed.

## One active item at a time

The active slot may contain only one work item. Published work can be moved to Pending Reviews with `clear`, allowing a new active item without losing completion metadata for the previous one.

## Never infer critical Git metadata

The skill must not guess unspecified base branches, release branches, or commit SHAs. Missing or conflicting workflow metadata must be requested explicitly before state is updated.

## Synchronize before branching

Before creating any work or backport branch, the selected base must be fetched, checked out or created as a tracking branch, fast-forward pulled, and verified against `origin/<base-branch>`.

If synchronization fails, the skill stops. It must not branch from stale state, auto-stash, force-pull, reset, or silently resolve divergence.

## Preserve atomic commit metadata

`publish` records ordered non-merge Published Commits. `backport` reuses exactly those commits, one at a time, and records the resulting Backport Commits.

Merge commits, GitHub merge SHAs, and combined diffs are verification evidence only. They must not replace atomic commit lists.

## Pull request base must match local state

The pull request base is the recorded Base Branch for primary work and the selected release branch for backports. Generic URLs printed by `git push` must not be trusted if they point to the wrong base.

## Destructive operations require explicit confirmation

Operations that discard local changes, delete local branches, or remove pending workflow entries require explicit confirmation. Remote branches and pull requests are never deleted automatically.
