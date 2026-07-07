import fs from "node:fs";
import path from "node:path";
import type { StatusEntry } from "./types.js";
import { REFERENCES } from "./update-claude-md.js";

const FEATURE_STEERING_FILENAME = "feature.md";
const PROJECT_CONTEXT_STEERING_FILENAME = "project-context.md";
export const CODE_REVIEW_GUIDANCE_FILENAME = "feature-code-review-guidance.md";

// Relative to .kiro/steering/feature.md, this always resolves to the shared skill content
// installed alongside it (skills/feature/ under the project root, or under the home
// directory for a global install) — see resolveKiroSteeringDestinationPath and
// resolveDestinationSharedSkillPath in paths.ts, which keep the same two-level relationship.
const SHARED_ACTIONS_RELATIVE_PATH = "../../skills/feature/actions";

const FEATURE_STEERING_CONTENT = `---
inclusion: manual
---

# Feature Workflow

Manage one active work item plus any number of published items awaiting review, using the
same Git workflow the Claude Code \`/feature\` skill implements. Invoke with \`#feature <action> ...\`
or \`/feature <action> ...\` in chat.

Kiro has no on-demand subagent delegation (manual hooks were discontinued in favor of manual
steering). Every action therefore runs entirely inline in this conversation. Wherever an action
file says to delegate to a subagent, take its "no subagent installed" fallback instead — this is
always the active path on Kiro, not an exception. Where a stack-specific guidance steering file is
installed (for example \`${CODE_REVIEW_GUIDANCE_FILENAME}\`), read and apply it during that step.

Wherever an action says to track progress with TaskCreate/TaskUpdate, render a plain Markdown
\`- [ ]\`/\`- [x]\` checklist directly in the response instead — Kiro has no equivalent tool.

## Actions

| Action | Usage | Purpose |
|---|---|---|
| plan | plan [<work-type>] [<name-or-description>] | Start or refine an iterative planning session; previews are staged in context/plans/ |
| plan | plan resume <file> | Resume one staged preview from context/plans/ as the active planning session |
| plan | plan status | Show the active planning state and missing required fields, or list staged previews when no session is tracked |
| plan | plan cancel | Cancel the active planning session, optionally deleting its preview file |
| plan | plan done | Finalize the active preview: assign the next number, move it into its target folder, and suggest /feature load |
| load | load [--ticket <ticket>] [--yolo] <spec-file-or-name> | Load a Markdown spec and resolve Git/Jira metadata; with --yolo, autonomously run through publish |
| load | load trunk <type> [--ticket <ticket>] [--yolo] <spec-file-or-description> | Prepare work based on trunk; with --yolo, autonomously run through publish |
| load | load branch <base-branch> <type> [--ticket <ticket>] [--yolo] <spec-file-or-description> | Prepare work based on a specific branch; with --yolo, autonomously run through publish |
| start | start | Synchronize the base, create the work branch, and implement the Goals as a visible checklist |
| test | test | Discover and run repository checks inline (no subagent delegation on Kiro) |
| review | review | Review goals, diff, and branch safety; apply installed code-review guidance inline |
| explain | explain | Explain changed files and flow inline |
| publish | publish | Run checks, then commit and push after one combined approval; when Status is already Published, runs the re-publish path for follow-up commits after review feedback |
| clear | clear | Move published work to Pending Reviews and free the active slot |
| resume | resume <work-branch> | Reattach one Pending Reviews entry to the active slot so publish's re-publish path can run against it |
| abandon | abandon | Abandon active work without discarding local changes |
| abandon | abandon --discard | Explicitly discard active work and its local work/backport branches |
| abandon | abandon <work-branch> | Remove one exact pending item from local workflow tracking |
| abandon | abandon --discard <work-branch> | Discard one exact pending item and its local work/backport branches |
| backport | backport <release-branch> [primary-merge-sha] | Atomically backport the active trunk item |
| backport | backport <work-branch> <release-branch> [primary-merge-sha] | Atomically backport a pending trunk item |
| complete | complete | Complete active work using ancestry verification |
| complete | complete active <primary-merge-sha> [backport-merge-sha] | Complete squash-merged active work |
| complete | complete <work-branch> [primary-merge-sha] [backport-merge-sha] | Complete an exact pending item |

Read and execute only the matching file under \`${SHARED_ACTIONS_RELATIVE_PATH}/\`. If no action is
provided, show this table. Do not commit, push, merge, cherry-pick, delete a branch, or reset state
unless the matching action explicitly authorizes it.
`;

function buildProjectContextSteeringContent(): string {
  const fileList = REFERENCES.map((ref) => ref.replace(/^- @/, "- ")).join("\n");
  return `---
inclusion: always
---

# Project Context

The context/ directory contains personal, ignored workflow state and may not exist in a fresh
clone. The feature skill initializes its required local state automatically. Read the following
files only when they exist locally:

${fileList}
`;
}

function writeIfMissing(filePath: string, content: string, label: string): StatusEntry {
  if (fs.existsSync(filePath)) {
    return { status: "exists", path: label };
  }
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, "utf-8");
  return { status: "created", path: label };
}

export function installKiroFeatureEntryPoint(steeringDir: string): StatusEntry {
  const filePath = path.join(steeringDir, FEATURE_STEERING_FILENAME);
  return writeIfMissing(
    filePath,
    FEATURE_STEERING_CONTENT,
    `.kiro/steering/${FEATURE_STEERING_FILENAME}`,
  );
}

export function installKiroProjectContext(steeringDir: string): StatusEntry {
  const filePath = path.join(steeringDir, PROJECT_CONTEXT_STEERING_FILENAME);
  return writeIfMissing(
    filePath,
    buildProjectContextSteeringContent(),
    `.kiro/steering/${PROJECT_CONTEXT_STEERING_FILENAME}`,
  );
}

/**
 * Strips a Claude Code subagent's YAML frontmatter (name/description/model/color/tools) and
 * replaces it with Kiro manual-inclusion frontmatter, so the same per-stack checklist content
 * is reused instead of being rewritten per provider.
 */
export function installKiroCodeReviewGuidance(
  subagentsDir: string,
  assetFilename: string,
  steeringDir: string,
): StatusEntry {
  const sourcePath = path.join(subagentsDir, assetFilename);
  const label = `.kiro/steering/${CODE_REVIEW_GUIDANCE_FILENAME}`;
  let source: string;
  try {
    source = fs.readFileSync(sourcePath, "utf-8");
  } catch (err) {
    return {
      status: "blocked",
      path: label,
      detail: `Could not read source template: ${(err as Error).message}`,
    };
  }
  const bodyStart = source.indexOf("---", source.indexOf("---") + 3);
  const body = bodyStart === -1 ? source : source.slice(bodyStart + 3).trimStart();
  const content = `---\ninclusion: manual\n---\n\n${body}`;

  const filePath = path.join(steeringDir, CODE_REVIEW_GUIDANCE_FILENAME);
  return writeIfMissing(filePath, content, label);
}
