import fs from "node:fs";
import path from "node:path";
import type { StatusEntry } from "./types.js";
import type { ModelOverride } from "./model-override.js";

/** Each installed agent's alias role, fixed by its template — not derived from the current `model:` value, which may already hold a previously applied override. */
const AGENT_ROLES: Record<string, "sonnet" | "haiku"> = {
  "test.md": "sonnet",
  "explain.md": "sonnet",
  "plan-research.md": "sonnet",
  "docs-sync.md": "sonnet",
  "code-review.md": "sonnet",
  "git-verify.md": "haiku",
};

const MODEL_LINE_PATTERN = /^model: .+$/m;

export function applyProfileToAgents(agentsDir: string, override: ModelOverride): StatusEntry[] {
  const entries: StatusEntry[] = [];

  if (!fs.existsSync(agentsDir)) {
    return [{ status: "blocked", path: ".claude/agents", detail: "Directory does not exist" }];
  }

  for (const [filename, role] of Object.entries(AGENT_ROLES)) {
    const filePath = path.join(agentsDir, filename);
    const target = `.claude/agents/${filename}`;
    if (!fs.existsSync(filePath)) {
      entries.push({ status: "skipped", path: target, detail: "Not installed" });
      continue;
    }
    const content = fs.readFileSync(filePath, "utf-8");
    const updated = content.replace(MODEL_LINE_PATTERN, `model: ${override[role]}`);
    fs.writeFileSync(filePath, updated, "utf-8");
    entries.push({ status: "created", path: target, detail: `model: ${override[role]}` });
  }

  return entries;
}
