# Troubleshooting

Start with:

```text
git status --short --branch
git branch --show-current
```

Then inspect `context/current-feature.md` and `context/feature-config.md`. Do not edit Git history or delete branches until the selected work item is clear.

## Quick symptom table

| Symptom | Likely cause | Next step |
|---|---|---|
| `load` asks for a ticket | Jira mode is required and no valid ticket resolved | Supply `--ticket` or add Jira Ticket to spec |
| Ticket rejected | Pattern or Project Keys allowlist failed | Check normalized key, number, regex, and allowlist |
| `load` cannot find spec | Filename-like source does not exist in search paths | Use a real path, create the spec, or use a multi-word inline description |
| `load` reports conflict | Explicit workflow/base differs from spec | Correct command or spec; do not rely on implicit override |
| `start` stops on dirty tree | Unrelated path exists outside context | Preserve or clean it manually |
| Remote base missing | `origin/<base>` does not exist | Verify spelling and remote refs |
| Pull cannot fast-forward | Local base diverged | Reconcile manually according to ownership/team policy |
| Branch already exists | Previous attempt or duplicate work name | Inspect existing branch and state before choosing action |
| `publish` says Needs changes | Review found actionable issues | Fix findings, test, and review again |
| Commit subject rejected | Jira format mismatch | Correct history manually; skill will not rewrite |
| PR points to main | Recorded base is another branch | Retarget PR to recorded Base Branch |
| `backport` rejects item | Item is not trunk work or primary merge is unverified | Select correct item and provide evidence if needed |
| Cherry-pick conflicts | Release changed overlapping lines | Resolve manually or abandon selected work |
| `complete` cannot verify | Commits not ancestors and evidence missing/wrong | Fetch, wait, or supply correct merge SHA |
| `abandon` refuses dirty work | Plain abandon is non-destructive | Preserve work or use explicit `--discard` |

## load cannot find a specification

Search order:

```text
<provided path>
context/features/<name>.md
context/fixes/<name>.md
same paths with .md appended
```

Example failure:

```text
/feature load account-summary
```

If no matching file exists, create `context/features/account-summary.md` or use an inline description with multiple words:

```text
/feature load trunk feature --ticket LSG-12 "Add account summary"
```

## Required Jira ticket is missing

Check config:

```md
- **Mode:** required
```

Supply:

```text
/feature load trunk feature --ticket LSG-12345 account-summary
```

or add:

```md
- **Jira Ticket:** LSG-12345
```

to the spec's Git Workflow metadata.

## Jira ticket matches regex but is rejected

Check Project Keys:

```md
- **Project Keys:** LSG, BOL
```

`ABC-12` matches the default regex but is not allowed. Add `ABC` only if the repository policy permits it, or use the correct project ticket.

## Jira configuration says a token is missing

Active Jira modes require exactly one occurrence of every token.

Valid:

```md
- **Branch Format:** <type>/<ticket>-<name>
- **Commit Format:** <commit-type>: [<ticket>] - <message>
```

Invalid:

```md
- **Branch Format:** <type>/<name>
- **Commit Format:** <commit-type>: <message>
```

## start reports unrelated dirty paths

Inspect:

```text
git status --short
git diff --stat
git diff --cached --stat
```

`context/` is ignored. An exact recorded Markdown Source Spec outside context is allowed. Everything else blocks start.

Do not solve this with an automatic stash. Decide which workflow owns each path.

## start says remote base does not exist

Inspect:

```text
git fetch origin --prune
git branch -r --list origin/<base-branch>
```

Common causes:

- branch typo;
- branch deleted remotely;
- wrong remote;
- user intended trunk but loaded explicit-base workflow;
- local ref exists but remote ref does not.

The local ref alone is insufficient.

## base branch cannot fast-forward

Inspect:

```text
git rev-list --left-right --count <base>...origin/<base>
git log --oneline --left-right <base>...origin/<base>
```

Interpretation:

- `0 N`: local is behind and should fast-forward;
- `N 0`: local has commits not on remote;
- `N M`: diverged.

The skill stops for non-fast-forward cases. Preserve legitimate local commits before any manual destructive operation.

## publish proposes the wrong commit type

Verify Work Type in local state.

Mapping:

```text
feature -> feat
bugfix -> fix
fix    -> fix
hotfix -> fix
chore  -> chore
```

If Work Type is wrong, abandon/reload or correct the specification before publication. Do not approve a misleading message.

## publish rejects existing commits

List selected commits:

```text
git rev-list --reverse --no-merges <work-branch> --not origin/<base-branch>
git log --format="%h %s" origin/<base-branch>..<work-branch>
```

Typical causes:

- missing Jira ticket;
- wrong conventional prefix;
- duplicate ticket;
- empty message after configured prefix;
- unrelated atomic commit;
- branch based on wrong base.

The skill will not amend or rebase automatically.

## publish includes unexpected commits

Check:

```text
git log --graph --oneline --decorate --all
git merge-base <work-branch> origin/<base-branch>
git log --oneline origin/<base-branch>..<work-branch>
```

Do not approve the atomic list until every SHA belongs to the work item.

## PR was created against main instead of release

The correct primary base is stored in `Base Branch`. The correct backport base is stored in `Backport Release Branch`.

Retarget the PR in GitHub before merge. If using CLI:

```text
gh pr edit <number> --base <correct-base>
```

Do not merge first and attempt to repair ancestry afterward.

## backport says primary merge is not verified

Normal merge policy:

```text
git merge-base --is-ancestor <published-commit> origin/trunk
```

For squash/rebase, provide the result SHA:

```text
/feature backport release-1.79.0 <primary-merge-sha>
```

The SHA must resolve and be contained in `origin/trunk`.

## backport conflict

Inspect:

```text
git status --short --branch
git diff --name-only --diff-filter=U
git rev-parse CHERRY_PICK_HEAD
```

Choose one path:

1. resolve intentionally, stage files, continue cherry-pick, and test;
2. abandon the selected item with `--discard` after reviewing consequences.

Never run random skips or choose a conflict side without understanding release behavior.

## complete cannot verify a normal merge

Fetch first:

```text
git fetch origin --prune
```

Then inspect whether each Published Commit is an ancestor of the recorded base. If GitHub used squash/rebase, supply the result SHA through the appropriate complete form.

## complete cannot verify backport

Check:

- Backport Release Branch is correct;
- every Backport Commit is recorded;
- remote release has been fetched;
- PR actually merged;
- squash/rebase evidence is supplied when original backport commits are absent.

PR existence alone is not completion evidence.

## abandon refuses to run

Plain abandon requires a clean tree. Destructive abandon requires current branch to equal the selected Work Branch or recorded Backport Branch.

Check:

```text
git branch --show-current
git status --short
```

For pending work, use the exact branch recorded under Pending Reviews. Partial names are not accepted.

## remote branch remains after abandon

This is expected. The skill never deletes remote branches or closes pull requests.

Handle remote cleanup separately according to team policy, for example through GitHub UI or an explicitly approved command.

## context files appear in Git status

Verify `.gitignore` contains:

```gitignore
/context/
```

If context files were previously tracked, adding ignore does not untrack them automatically. Resolve tracked state deliberately. Never force-add personal context.

## context templates exist but initialization command is missing

This is expected in the current version. The assets are prepared, but no supported action generates the full context directory yet.

Current assets:

```text
assets/ai-interaction-template.md
assets/coding-standards-nextjs-template.md
assets/project-overview-template.md
assets/current-feature-template.md
assets/feature-config-template.md
```

Until an initialization action is implemented, create or copy local context files manually without staging them.

## Escalation checklist

Stop and ask for help when:

- the correct base branch is unknown;
- local base commits have unclear ownership;
- a conflict requires product behavior decisions;
- history rewriting would affect a pushed branch;
- the selected pending item is ambiguous;
- required merge evidence cannot be identified;
- cleanup might delete unrelated local work.
