# Review Action

1. Read Goals, Base Branch, and Work Branch from the state file.
2. Run git fetch origin --prune before comparing against the remote base.
3. Review git diff origin/<base-branch>...<work-branch>.
4. Check:
   - Every goal is implemented.
   - No unrelated scope was added.
   - Security, validation, error handling, and tests are adequate.
   - The branch contains no merge commits from unrelated branches.
   - The diff does not include secrets, generated artifacts, or debug code.
5. Return one verdict: Ready to publish or Needs changes, with concrete findings.
