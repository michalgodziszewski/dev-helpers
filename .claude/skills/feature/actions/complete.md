# Complete Action

Use only after the work pull request has been merged on GitHub. For trunk work requiring a backport, use only after the backport pull request has also been merged.

1. Read the state file and require Status Published or Merged.
2. Require a clean working tree except for context/current-feature.md.
3. Run git fetch origin --prune.
4. Verify the work is present in origin/<base-branch>. Because GitHub may squash or rebase, accept either:
   - the published commit is an ancestor of the remote base, or
   - the user supplies the GitHub merge/squash commit SHA and it is contained in the remote base.
5. If Backport is populated, verify its merged commit is present in origin/<release-branch>.
6. Switch to Base Branch and run git pull --ff-only origin <base-branch>.
7. Verify the local Base Branch SHA equals its remote SHA.
8. Show local branches proposed for deletion. Ask for permission before deleting them.
9. Delete only confirmed, merged local Work Branch and Backport Branch. Never delete remote branches; GitHub policy owns remote cleanup.
10. Append a concise completion entry to History.
11. Reset all active feature fields to their placeholders and set Status to Completed.

Do not create a reset commit automatically. Leave the state-file change for the next authorized commit.
