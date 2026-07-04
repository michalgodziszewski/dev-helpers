# Review Action

## Own analysis

1. Read Goals, Base Branch, and Work Branch from the state file.
2. Run git fetch origin --prune before comparing against the remote base, unless a fetch already ran earlier in the current action chain (for example when review runs inside publish). Never ask before fetching.
3. Produce and review git diff origin/<base-branch>...<work-branch>, keeping its content available for the delegated pass below.
4. Check:
   - Every goal is implemented.
   - No unrelated scope was added.
   - Security, validation, error handling, and tests are adequate.
   - The branch contains no merge commits from unrelated branches.
   - The diff does not include secrets, generated artifacts, or debug code.

## Delegated code-quality pass

5. Delegate the practical code-quality pass to the code-review subagent instead of inspecting code quality inline. The installed subagent's own whitelisted Git commands only cover the working tree and the staged index, not a three-dot range against the remote base, so never ask it to run that comparison itself. Instead, take the merge-base diff already produced in step 3 and paste its content into the spawn prompt, alongside an instruction to also inspect any uncommitted working-tree changes with its own allowed commands. Spawn it with the Agent tool using subagent_type "code-review".
6. Treat the subagent as a stack-agnostic black box. Its checklist is technology-dependent, for example Angular, Next.js, or .NET, and is owned by the installed agent template, mirroring the per-stack coding-standards templates in assets/. Do not assume, hardcode, or restate any stack-specific checks in this action, and do not change the subagent's allowed commands or template. Rely only on the contract: spawn code-review with the committed diff supplied in the prompt, receive graded findings.
7. The subagent inspects the full committed branch diff plus any uncommitted working-tree changes together, so incrementally committed work is always covered even when the working tree is clean. Expect an empty result only when there is no diff against the base at all — nothing committed on the branch and no uncommitted changes.
8. If no code-review subagent is available in the project, do not fail. Continue with the own analysis above and clearly note that the delegated code-quality pass was skipped because no code-review agent is installed.

## Verdict

9. Fold the subagent findings into the own analysis and return exactly one verdict: Ready to publish or Needs changes, with concrete findings. Attribute delegated findings to the code-review subagent. When the delegated pass reported no findings, state which case applies: the subagent inspected the merge-base diff and any uncommitted changes and found nothing, or it had nothing to inspect because there was no diff against the base at all, or the pass was skipped because no code-review agent is installed. Never present an uninspected diff as a clean result.

The subagent is strictly read-only and must never edit files or change Git state. This action does not run tests; /feature test covers that.
