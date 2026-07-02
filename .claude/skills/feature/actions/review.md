# Review Action

## Own analysis

1. Read Goals, Base Branch, and Work Branch from the state file.
2. Run git fetch origin --prune before comparing against the remote base, unless a fetch already ran earlier in the current action chain (for example when review runs inside publish). Never ask before fetching.
3. Review git diff origin/<base-branch>...<work-branch>.
4. Check:
   - Every goal is implemented.
   - No unrelated scope was added.
   - Security, validation, error handling, and tests are adequate.
   - The branch contains no merge commits from unrelated branches.
   - The diff does not include secrets, generated artifacts, or debug code.

## Delegated code-quality pass

5. Delegate the practical code-quality pass to the code-review subagent instead of inspecting code quality inline. Spawn it with the Agent tool using subagent_type "code-review" and a prompt asking it to review the current working-tree changes and report practical issues.
6. Treat the subagent as a stack-agnostic black box. Its checklist is technology-dependent, for example Angular, Next.js, or .NET, and is owned by the installed agent template, mirroring the per-stack coding-standards templates in assets/. Do not assume, hardcode, or restate any stack-specific checks in this action. Rely only on the contract: spawn code-review, receive graded findings.
7. The subagent inspects the working tree, meaning uncommitted changes. When all work is already committed and the tree is clean, expect an empty result because there was nothing to inspect; the delegated pass primarily covers uncommitted work, while steps 3 and 4 cover the committed branch diff.
8. If no code-review subagent is available in the project, do not fail. Continue with the own analysis above and clearly note that the delegated code-quality pass was skipped because no code-review agent is installed.

## Verdict

9. Fold the subagent findings into the own analysis and return exactly one verdict: Ready to publish or Needs changes, with concrete findings. Attribute delegated findings to the code-review subagent. When the delegated pass reported no findings, state which case applies: the subagent inspected changes and found nothing, or it had nothing to inspect because the tree was clean or the pass was skipped. Never present an uninspected tree as a clean result.

The subagent is strictly read-only and must never edit files or change Git state. This action does not run tests; /feature test covers that.
