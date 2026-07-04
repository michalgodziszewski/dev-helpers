# State Model and Lifecycle

The skill stores workflow state in `context/current-feature.md`. This file is ignored, local to the user, and must never be staged.

## Active slot

The active slot represents at most one item.

| Status | Meaning | Typical next actions |
|---|---|---|
| `Idle` | No active work | `load` |
| `Not Started` | Specification and metadata are loaded; no work branch exists yet | `start`, `abandon` |
| `In Progress` | Work branch exists and implementation may be dirty or committed | `test`, `review`, `publish`, `abandon` |
| `Published` | Work branch and atomic commit list were pushed | `clear`, `complete` after merge, `backport` after trunk merge |
| `Merged` | Active trunk work completed a backport creation flow and can be cleared with backport metadata | `clear`, `complete` after required merges |

`load` refuses to overwrite `Not Started`, `In Progress`, `Published`, or `Merged` active work.

## Stored fields

| Field | Purpose |
|---|---|
| `Workflow` | `trunk` or `branch` |
| `Work Type` | `feature`, `bugfix`, `fix`, `hotfix`, or `chore` |
| `Jira Ticket` | Normalized ticket used by naming policy |
| `Base Branch` | Exact branch from which work starts and into which the primary PR must merge |
| `Work Branch` | Exact created branch; blank until `start` |
| `Source Spec` | Repository-relative Markdown path or inline description |
| `Published Commits` | Ordered primary atomic commit SHAs |
| `Backport Release Branch` | Exact release branch selected for backport |
| `Backport Commits` | Ordered SHAs created by cherry-picking primary commits |
| `Backport Branch` | Exact backport branch |
| `Goals` | Concrete work requirements |
| `Notes` | Constraints and additional context |

## State transitions

### Normal primary flow

```text
Idle
  | load
  v
Not Started
  | start
  v
In Progress
  | publish
  v
Published
  | complete after verified merge
  v
Idle + History entry
```

### Review queue flow

```text
Published or Merged
  | clear
  v
Idle active slot + exact Pending Reviews entry
  | complete <work-branch>
  v
Pending item removed + History entry
```

### Cancelled work

```text
Not Started / In Progress / Published / Merged
  | abandon [--discard]
  v
Idle
```

`abandon` does not append an Abandoned history record.

## Pending Reviews

`clear` moves one published active item into Pending Reviews. The entry preserves:

- work name and pending status;
- workflow and work type;
- Jira ticket;
- base and work branches;
- ordered Published Commits;
- optional release branch, Backport Commits, and backport branch.

Pending Reviews enables this pattern:

1. publish task A;
2. clear task A while its PR waits;
3. load and start task B;
4. complete task A by exact work branch without disrupting task B.

Exact branch identity is mandatory. Partial names are never guessed.

## History

`complete` prepends a dated History entry after verifying remote ancestry — History is newest-first, so the new entry goes above all existing entries. The entry includes the work name, type, Jira ticket when present, work branch, base branch, and completion result.

History is local workflow memory, not a source of truth for GitHub. Remote ancestry is checked again whenever completion evidence is required.

Legacy history lines that do not contain a work branch cannot be safely matched. `abandon` reports them as unverifiable and requires explicit confirmation before removing an exact line.

### History rotation

To keep context/current-feature.md small, `complete` rotates History once it holds more than 10 entries: the 10 most recent entries stay in current-feature.md, and older entries move verbatim, in their existing order, into context/history-archive.md (newest-first, with new rotations prepended above what is already archived). The archive file is created on its first rotation.

context/history-archive.md is ignored personal state exactly like the rest of context/ — it is never staged, committed, or required to exist. Rotation is purely mechanical: entries are relocated unchanged, never summarized or rewritten. `abandon`'s legacy-history matching and removal rules apply only to whatever remains in current-feature.md; the archive is untouched by `abandon` and out of scope for it.

## Atomic commit metadata

`publish` computes primary commits with:

```text
git rev-list --reverse --no-merges <work-branch> --not origin/<base-branch>
```

This excludes:

- commits already present on the remote base;
- merge commits;
- commits introduced only by synchronizing or merging the base branch into the work branch.

The resulting ordered list is the only commit source for a standard backport. A GitHub merge SHA may prove that a PR merged, but it is not added to Published Commits and is never cherry-picked as an atomic change.

## Backport metadata timing

The backport action stores the release branch and backport branch immediately after creating the branch, before cherry-picking. It initializes Backport Commits as empty.

After each successful cherry-pick, the new SHA is appended immediately. If a later commit conflicts, local state still identifies:

- the exact backport branch;
- the target release;
- successfully completed backport commits;
- the failing primary commit;
- remaining primary commits.

This metadata allows exact conflict cleanup through `abandon --discard`.

## State isolation rules

- Resetting the active slot must not remove unrelated Pending Reviews entries.
- Completing a pending item must not reset another active item.
- Abandoning one pending item must not clear the whole queue.
- Backporting a pending item must update only that item.
- `context/` remains ignored even when Git operations inspect cleanliness.
- State updates never authorize staging or committing context files.

## Example active state

```md
# Current Feature: account-summary

## Status

In Progress

## Git Workflow

- **Workflow:** trunk
- **Work Type:** feature
- **Jira Ticket:** LSG-12345
- **Base Branch:** trunk
- **Work Branch:** feature/LSG-12345-account-summary
- **Source Spec:** context/features/account-summary.md
- **Published Commits:**
- **Backport Release Branch:**
- **Backport Commits:**
- **Backport Branch:**
```

## Example pending entry

`clear` writes every Pending Reviews entry in one canonical Markdown layout, defined once in actions/clear.md step 6 and parsed by `backport`, `complete`, and `abandon`. Legacy entries written before this layout existed are still read by their existing fields but are never rewritten in place.

```md
- **Work Name:** account-summary
  - **Status:** Awaiting Review
  - **Workflow:** trunk
  - **Work Type:** feature
  - **Jira Ticket:** LSG-12345
  - **Base Branch:** trunk
  - **Work Branch:** feature/LSG-12345-account-summary
  - **Published Commits:** abc123 def456
```

Backport Release Branch, Backport Commits, and Backport Branch are appended in that order, all three together, only when the item has backport metadata.

## Concurrency boundary

The skill supports concurrent review, not concurrent active implementation:

- one active implementation item;
- any number of published pending items;
- completion and backport operations may target exact pending items while another item occupies the active slot;
- operations must preserve unrelated state and branches.
