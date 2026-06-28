# Action Reference

Invoke actions through `/feature <action> ...`. Each action reads only its matching procedure under `.claude/skills/feature/actions/`.

## Summary

| Action | Primary state | Main effect |
|---|---|---|
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

## load

### Syntax

```text
/feature load [--ticket <ticket>] <spec-file-or-name>
/feature load trunk <type> [--ticket <ticket>] <spec-file-or-description>
/feature load branch <base-branch> <type> [--ticket <ticket>] <spec-file-or-description>
```

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
- implements goals one by one.

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

- Reads Goals and the diff against the remote base.
- Discovers checks from repository files.
- Runs the narrowest relevant unit or integration tests first.
- Runs required lint, type-check, and build commands when available.
- Adds tests when goals and repository patterns require them.
- Reports every command and result.

### Boundaries

- Required check failure blocks publication and backport.
- Dependencies and test configuration are not installed or changed without permission.
- The action does not assume npm, Vitest, or any other tool.

## review

### Syntax

```text
/feature review
```

### Behavior

- Fetches origin.
- Reviews `git diff origin/<base-branch>...<work-branch>`.
- Checks goal coverage, unrelated scope, security, validation, error handling, tests, merge commits, secrets, generated artifacts, and debug code.
- Returns exactly one verdict: `Ready to publish` or `Needs changes`.

A Needs changes verdict blocks `publish`.

## explain

### Syntax

```text
/feature explain
```

### Behavior

- Uses the merge-base diff.
- Lists changed files and their roles.
- Identifies key functions or components.
- Summarizes data or control flow.
- States source and target branches explicitly.

`explain` is read-only.

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

1. shows Git status and a concise diff;
2. excludes all context files;
3. maps work type to commit type;
4. renders the Jira commit format when active;
5. asks permission for commit and push;
6. stages only work-item files;
7. creates one approved commit when uncommitted work exists;
8. fetches origin and verifies the base;
9. computes ordered, non-merge feature-only commits;
10. validates each commit, including Jira subject policy;
11. shows ignored merge commits;
12. asks confirmation for the exact atomic list;
13. stores Published Commits;
14. pushes the work branch and verifies remote equality;
15. sets status to Published;
16. produces a PR URL or `gh` command with explicit base and head.

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
- Published Commits exist or can be reconstructed with explicit confirmation for legacy state.

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

- Synchronizes the release branch with fast-forward-only rules.
- Creates a Jira-aware or legacy backport branch.
- Stores branch metadata before cherry-picking.
- Shows and confirms the exact ordered commits.
- Cherry-picks each with `git cherry-pick -x`.
- Records each resulting SHA immediately.
- Stops untouched on conflict.
- Tests, pushes, and provides a PR target for the release branch.

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

- Fetch origin.
- Verify the primary remote base exists.
- Accept when every Published Commit is an ancestor of the base.
- Otherwise require a contained primary merge/squash/rebase SHA.
- When backport metadata exists, verify every Backport Commit against the release or require a contained backport result SHA.
- Never infer completion from PR existence alone.

### State effect

- Append a dated History entry.
- Reset only selected active work or remove only selected pending work.
- Preserve all unrelated active, pending, and historical data.
- Offer local branch deletion separately when safe.
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

Requires a clean tree outside context. After confirmation it synchronizes the base, optionally deletes confirmed related local branches, reports remote branches, and resets active state.

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
