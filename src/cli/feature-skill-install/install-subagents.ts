import fs from "node:fs";
import path from "node:path";
import type { StatusEntry } from "./types.js";

export interface SubagentStackChoice {
  label: string;
  assetFilename: string | null;
}

const CODE_REVIEW_PATTERN = /^code-review-(.+)-template\.md$/;
const TEMPLATE_PATTERN = /^(.+)-template\.md$/;

function formatStackLabel(stack: string): string {
  return stack
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(/js\b/gi, ".js");
}

export function discoverCodeReviewStacks(
  subagentsDir: string,
): SubagentStackChoice[] {
  if (!fs.existsSync(subagentsDir)) return [];

  const choices: SubagentStackChoice[] = [];
  for (const file of fs.readdirSync(subagentsDir)) {
    const match = CODE_REVIEW_PATTERN.exec(file);
    if (match) {
      choices.push({ label: formatStackLabel(match[1]), assetFilename: file });
    }
  }

  choices.sort((a, b) => a.label.localeCompare(b.label));
  return choices;
}

function copyAgent(
  sourcePath: string,
  agentsDir: string,
  agentFilename: string,
  detail?: string,
): StatusEntry {
  const target = `.claude/agents/${agentFilename}`;
  const targetPath = path.join(agentsDir, agentFilename);

  if (fs.existsSync(targetPath)) {
    return { status: "exists", path: target };
  }
  fs.copyFileSync(sourcePath, targetPath);
  return { status: "copied", path: target, detail };
}

export function installSubagents(
  projectRoot: string,
  subagentsDir: string,
  codeReview: SubagentStackChoice | null,
): StatusEntry[] {
  const entries: StatusEntry[] = [];

  if (!fs.existsSync(subagentsDir)) {
    return [
      {
        status: "blocked",
        path: ".claude/agents",
        detail: `Source subagents directory missing: ${subagentsDir}`,
      },
    ];
  }

  const agentsDir = path.join(projectRoot, ".claude", "agents");
  fs.mkdirSync(agentsDir, { recursive: true });

  // Stack-agnostic agents: every <name>-template.md except code-review variants.
  for (const file of fs.readdirSync(subagentsDir).sort()) {
    if (CODE_REVIEW_PATTERN.test(file)) continue;
    const match = TEMPLATE_PATTERN.exec(file);
    if (!match) continue;
    entries.push(
      copyAgent(path.join(subagentsDir, file), agentsDir, `${match[1]}.md`),
    );
  }

  // Per-stack code-review agent, installed only when a stack was selected.
  const codeReviewTarget = path.join(agentsDir, "code-review.md");
  if (fs.existsSync(codeReviewTarget)) {
    entries.push({ status: "exists", path: ".claude/agents/code-review.md" });
  } else if (codeReview === null || codeReview.assetFilename === null) {
    entries.push({
      status: "declined",
      path: ".claude/agents/code-review.md",
      detail: "No code-review stack selected",
    });
  } else {
    entries.push(
      copyAgent(
        path.join(subagentsDir, codeReview.assetFilename),
        agentsDir,
        "code-review.md",
        codeReview.label,
      ),
    );
  }

  return entries;
}
