# Action Reference

Invoke actions through `/feature <action> ...`. Each action reads only its matching procedure under `.claude/skills/feature/actions/`.

## Summary

| Action | Primary state | Main effect |
|---|---|---|
| `plan` | No active work required | Iteratively plan a spec staged in context/plans/, numbered and moved to its target folder at finalization |
| `load` | Idle | Resolve a spec and write Not Started state |
| `start` | Not Started | Synchronize base, create branch, begin implementation |
| `test` | In Progress or reviewable work | Run relevant repository checks |
| `review` | Work branch exists | Review merge-base diff and return verdict |
| `explain` | Work branch exists | Explain files and control flow |
| `publish` | In Progress | Commit with permission, record atomic commits, push |
| `clear` | Published or Merged | Move active item to Pending Reviews |
| `backport` | Merged trunk evidence available | Cherry-pick recorded commits to release branch |
| `complete` | Published/Merged or pending | Verify remote merge and record History |
| `abandon` | Active or exact pending item | Remove one cancelled item safely |

## plan

### Syntax

```text
/feature plan [<work-type>] [<name-or-description>]
/feature plan resume <file>
/feature plan status
/feature plan cancel
/feature plan done
```

See [Planning](planning.md) for the full workflow.

### Preconditions

- `plan` (start/refine): a resolvable work type or target folder, feature/fix name, and short description. Ask when missing.
- `plan resume`: a `<file>` argument resolving to an existing staged preview containing the preview marker block (resolved load-style: provided path, then `context/plans/<name>.md`, `.md` appended when omitted).
- `plan done` and `plan cancel`: a conversation-tracked session (created by `plan` or reattached by `plan resume`); without one they point at `plan status` + `plan resume` and stop.
- `plan done` additionally: all finalization-required fields present — target collection, work type, name, short description, workflow, base branch, goals, and scope.
- `plan status`: none; it works with or without a tracked session.

### Behavior

- Infers the target folder from work type (`fix`/`bugfix`/`hotfix` → `context/fixes/`; `feature`/`docs`/`refactor`/`chore`/`tooling`/`config`/`test`/`ci`/`research` → `context/features/`), used at finalization.
- Stages the preview at `context/plans/<slug>.md` (slug-only, no number prefix; a slug collision stops the session and requires a different name). Previews consume no numbers in the target folders.
- Creates the preview spec file from the skill's own `assets/current-feature-template.md` with a removable preview marker block; `Source Spec` stays empty while staged.
- Refines the same preview file as requirements arrive, including screenshots under `context/screenshots/` and optional Jira/MCP context.
- `plan` — bare or with arguments — always starts a new session directly and never scans the disk for previews first.
- `plan resume <file>` reattaches the selected staged preview as the active session, reporting which finalization-required fields are already satisfied.
- `plan status` with a session reports it and a missing-fields checklist without writing; without a session it lists `context/plans/` read-only (path, title, work type, missing fields per file), warns about files lacking the preview marker block, and points at `plan resume`.
- `plan cancel` clears the session and, only for a still-preview file, optionally deletes it.
- `plan done` resolves the next four-digit number in the target folder at that moment, moves the staged file to `<target-folder>/<number>-<slug>.md`, removes the preview block, sets `Source Spec` to the final path, fills placeholders, keeps `## History` skill-managed, then suggests `/feature load <path>`.

### Git side effects

None. `plan` never fetches, pulls, branches, commits, or pushes.

### Stops when

- required-to-create inputs are missing (asks instead of guessing);
- the composed slug already exists in `context/plans/` (requires a different name, never overwrites or suffixes);
- the final numbered filename already exists and cannot be safely adjusted without confirmation;
- `plan resume` cannot resolve its argument or the resolved file lacks the preview marker block;
- `plan done` is missing finalization-required fields (shows the checklist and keeps the preview);
- no session is tracked for `plan done` or `plan cancel` (points at `plan status` + `plan resume`).

### Does not

- modify the active slot in `context/current-feature.md` unless explicitly asked;
- delete finalized specs, unrelated preview files, or screenshots;
- run `/feature load` automatically;
- generate or edit History.

## load

### Syntax

```text
/feature load [--ticket <ticket>] [--yolo] <spec-file-or-name>
/feature load trunk <type> [--ticket <ticket>] [--yolo] <spec-file-or-description>
/feature load branch <base-branch> <type> [--ticket <ticket>] [--yolo] <spec-file-or-description>
```

`--yolo` is an optional flag on every load form. It strips out before the spec source is resolved and, once load succeeds, autonomously chains start → implement → test → review → publish, stopping only at the combined publish approval. See [Autonomous run (--yolo)](#autonomous-run---yolo).

### Accepted work types

`feature`, `bugfix`, `fix`, `hotfix`, `chore`.

### Preconditions

- Active slot is Idle or an empty legacy Completed state.
- Local Jira configuration is valid.
- Required Git metadata can be resolved.
- Required Jira ticket can be resolved.

### Behavior

- Creates `context/current-feature.md` and `context/feature-config.md` from assets when missing.
- Migrates a legacy state file by adding Jira Ticket after Work Type.
- Resolves file or inline specifications.
- Applies explicit arguments before spec metadata.
- Validates workflow, work type, base, ticket, naming templates, and rendered branch.
- Writes Not Started state.
- Preserves Pending Reviews and History.

### Git side effects

`load` may use `git check-ref-format --branch` for read-only validation. It does not fetch, pull, create, switch, or modify branches.

### Stops when

- an active item already occupies the slot;
- a filename-like spec cannot be found;
- spec and explicit workflow metadata conflict;
- base branch is missing from resolved metadata;
- Jira configuration or ticket is invalid;
- rendered branch is not a valid Git ref.

## Autonomous run (--yolo)

`--yolo` on any load form runs the whole workflow in one pass instead of one action at a time.

### Behavior

- After a successful load, chains `start` (whose own procedure tracks Goal implementation as a visible checklist — see `start`) → `test` → `review` → `publish` in the same turn.
- Stops at the `publish` combined approval — the only prompt on the normal path. It never auto-commits or auto-pushes. The pre-existing `test` gate still applies: a check needing a dependency install or test-config change stops and asks, exactly as a manual run would.
- Failing tests or required checks are fixed and re-run until they pass, bounded to ~2–3 attempts on the same failure, then reported.
- `Needs changes` review verdicts and high-severity findings are remediated, re-tested, and re-reviewed until `Ready to publish`, within the same bounded-attempts guard.

### Stops the run when

- `start` hits an infrastructure/safety stop (dirty tree outside the recorded Source Spec, base cannot fast-forward, local base differs from origin, or the work branch already exists);
- a check or review failure persists past the bounded retries.

### Does not

- add, remove, pre-answer, or suppress the combined publish approval;
- auto-stash, reset, force-pull, or force-push to recover;
- run backport, branch deletion, or discard.

## start

### Syntax

```text
/feature start
```

### Preconditions

- Status is Not Started.
- Goals, workflow, work type, and base are populated.
- Required Jira ticket is valid.
- Working tree is clean outside `context/`, except the exact recorded Markdown Source Spec when it is outside context.

### Behavior

- Renders and validates the exact work branch.
- Fetches and prunes origin.
- switches to or creates a tracking base branch;
- pulls the base with `--ff-only`;
- verifies local base equals remote base;
- creates the work branch;
- verifies the source spec remained unchanged;
- sets status to In Progress;
- implements goals one by one, tracked as a visible checklist: a task per Goal (or per concrete step within a Goal, when a Goal spans multiple distinct pieces of work) created up front via TaskCreate; each task set to in_progress immediately before starting it and to completed immediately after finishing it, via TaskUpdate; scoped to this work item's Goals only, never unrelated repository maintenance.

### Stops when

- any unrelated file is dirty, staged, untracked, or conflicted;
- source spec points outside the repository or is not Markdown;
- remote base does not exist;
- local base diverged or cannot fast-forward;
- switching would overwrite the source spec;
- rendered work branch is invalid or already exists.

## test

### Syntax

```text
/feature test
```

### Behavior

- Reads Goals and the diff against the remote base, skipping a redundant fetch when one already ran in the current action chain.
- Delegates check discovery and execution to the `test` subagent (Agent tool, `subagent_type: "test"`); runs the same procedure inline when the agent is not installed.
- Discovers checks from repository files and scopes them to the tests exercising changed files rather than running the entire suite — both standalone and inside `/feature publish`. A full, whole-repository run is left to CI (e.g. a GitHub Actions workflow triggered by the push), not reproduced locally.
- Adds tests when goals and repository patterns require them (in the main conversation, not the subagent).
- Relays every command and result.

### Boundaries

- Required check failure blocks publication and backport.
- Running discovered checks never asks for permission; that is the point of the action.
- Dependencies and test configuration are not installed or changed without permission.
- The action does not assume npm, Vitest, or any other tool.

## review

### Syntax

```text
/feature review
```

### Behavior

- Fetches origin.
- Reviews `git diff origin/<base-branch>...<work-branch>` for goal coverage, unrelated scope, security, validation, error handling, tests, merge commits, secrets, generated artifacts, and debug code.
- Delegates the practical code-quality pass to the `code-review` subagent (spawned via the Agent tool with `subagent_type: "code-review"`). The subagent is treated as a stack-agnostic black box: its checklist is technology-dependent (Angular, Next.js, .NET, …) and owned by the installed agent template, so the action never restates stack-specific checks.
- The subagent inspects the working tree (uncommitted changes); the committed branch diff is covered by the action's own analysis. If no `code-review` agent is installed, the delegated pass is skipped with a note and the review does not fail.
- Folds the subagent's findings into its own analysis and returns exactly one verdict: `Ready to publish` or `Needs changes`.

A Needs changes verdict blocks `publish`. `publish` runs `review.md` before creating a commit, so it inherits the delegated code-quality pass without spawning the subagent separately.

## explain

### Syntax

```text
/feature explain
```

### Behavior

- Delegates the walkthrough to the `explain` subagent (Agent tool, `subagent_type: "explain"`); explains inline when the agent is not installed.
- Uses the merge-base diff.
- Lists changed files and their roles.
- Identifies key functions or components.
- Summarizes data or control flow.
- States source and target branches explicitly.

`explain` is read-only and asks no questions.

## publish

### Syntax

```text
/feature publish
```

### Preconditions

- Status is In Progress.
- Current branch equals Work Branch.
- Current branch is not Base Branch.
- Jira branch policy passes when active.
- `test` succeeds.
- `review` returns Ready to publish.

### Behavior

1. fetches origin once and verifies the base; `test` and `review` inside the publish chain reuse this fetch;
2. runs `test` and `review`, stopping on failure or a non-ready verdict;
3. shows Git status and a concise diff;
4. excludes all context files;
5. maps work type to commit type and renders the Jira commit format when active;
6. computes ordered, non-merge feature-only commits and validates each, including Jira subject policy, before asking anything;
7. asks exactly one combined approval showing the proposed commit message, the final ordered atomic commit list (existing SHAs plus the pending new commit), ignored merge commits, and the push target;
8. after approval: stages only work-item files, creates one commit with the approved message when uncommitted work exists, recomputes the final SHAs without asking again;
9. stores Published Commits;
10. pushes the work branch and verifies remote equality;
11. sets status to Published;
12. produces a PR URL or `gh` command with explicit base and head.

### Stops when

- tests or review fail;
- branch naming does not match configuration;
- no atomic commit exists;
- a selected commit is a merge commit or invalid;
- a Jira subject is non-compliant;
- remote base is missing;
- push or remote equality verification fails.

### Does not

- merge locally;
- push directly to the base;
- trust a generic Git push PR URL when it targets another branch;
- rewrite invalid commit history automatically.

## clear

### Syntax

```text
/feature clear
```

### Preconditions

- Active status is Published or Merged.
- Work branch, base, type, workflow, and work name are populated.
- Remote work branch exists and matches local.
- Published Commits exist or are reconstructed for legacy state (the computed list is shown and recorded without asking; a later backport re-confirms it in its destructive prompt).

### Behavior

- Copies all required metadata into one Pending Reviews entry.
- Resets only the active slot to Idle.
- Preserves all existing pending entries and History.
- Does not switch or delete branches.
- Does not verify that GitHub merged the PR.

## backport

### Syntax

```text
/feature backport <release-branch> [primary-merge-sha]
/feature backport <work-branch> <release-branch> [primary-merge-sha]
```

The first form targets active trunk work. The second targets an exact pending trunk item.

### Preconditions

- Workflow is trunk and Base Branch is trunk.
- Ordered Published Commits exist and are non-merge commits.
- Primary work is verified in `origin/trunk`, directly or through explicit merge evidence.
- Working tree is clean outside context.
- Remote release branch exists.

### Behavior

- Verifies the primary merge through the `git-verify` subagent when installed (inline otherwise), without asking.
- Synchronizes the release branch with fast-forward-only rules.
- Creates a Jira-aware or legacy backport branch.
- Stores branch metadata before cherry-picking.
- Asks exactly one combined destructive confirmation covering the exact ordered commits to cherry-pick and the backport branch push.
- Cherry-picks each with `git cherry-pick -x`.
- Records each resulting SHA immediately.
- Stops untouched on conflict.
- Tests (via the `test` subagent when installed) and pushes without asking again, then provides a PR target for the release branch.

### Important rule

`primary-merge-sha` is evidence only. It is never cherry-picked.

## complete

### Syntax

```text
/feature complete
/feature complete active <primary-merge-sha> [backport-merge-sha]
/feature complete <work-branch> [primary-merge-sha] [backport-merge-sha]
```

### Selection

- `complete` selects active Published or Merged work.
- `complete active ...` supplies explicit evidence for active work.
- `complete <work-branch> ...` selects one exact pending item.

### Verification

- Fetch origin without asking; delegate the ancestry checks to the `git-verify` subagent when installed, inline otherwise.
- Verify the primary remote base exists.
- Accept when every Published Commit is an ancestor of the base.
- Otherwise require a contained primary merge/squash/rebase SHA.
- When backport metadata exists, verify every Backport Commit against the release or require a contained backport result SHA.
- Never infer completion from PR existence alone.

### State effect

- Append a dated History entry.
- Reset only selected active work or remove only selected pending work.
- Preserve all unrelated active, pending, and historical data.
- Offer local branch deletion when safe — one explicit confirmation naming the branch; the only question complete asks.
- Never delete a remote branch.

## abandon

### Syntax

```text
/feature abandon
/feature abandon --discard
/feature abandon <work-branch>
/feature abandon --discard <work-branch>
```

### Plain active abandon

Requires a clean tree outside context. The explicit abandon command is the instruction — resetting tracking state asks no question. It synchronizes the base, asks one explicit confirmation per related local branch before deleting it (the only questions this form asks), reports remote branches, and resets active state.

### Destructive active abandon

Requires current branch to equal the selected Work Branch or recorded Backport Branch. It previews all affected paths and commits, then asks for explicit confirmation.

After confirmation it may:

- abort a selected backport cherry-pick;
- restore staged and tracked paths;
- clean previewed untracked paths without `-x` or `-X`;
- preserve context;
- synchronize the base;
- delete only related local work/backport branches;
- reset only selected workflow state.

### Pending abandon

`abandon <work-branch>` matches exactly one Pending Reviews item. It preserves the active slot and every non-matching pending/history entry.

Use `--discard <work-branch>` when the selected pending backport is currently checked out with changes or a cherry-pick conflict.

### Never

- delete remote branches;
- close pull requests;
- clear the entire Pending Reviews queue;
- infer a branch by partial name;
- delete ignored context files;
- append an Abandoned History entry.
