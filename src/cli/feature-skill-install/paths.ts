import path from "node:path";
import { fileURLToPath } from "node:url";
import type { SkillScope } from "./types.js";

export function resolveSourceSkillPath(): string {
  const thisFile = fileURLToPath(import.meta.url);
  // At runtime this file is dist/src/cli/feature-skill-install/paths.js
  // so we need four levels up to reach the repository root.
  const repoRoot = path.resolve(path.dirname(thisFile), "..", "..", "..", "..");
  return path.join(repoRoot, ".claude", "skills", "feature");
}

export function resolveDestinationPath(
  scope: SkillScope,
  projectRoot: string,
  homeDir: string,
): string {
  if (scope === "global") {
    return path.join(homeDir, ".claude", "skills", "feature");
  }
  return path.join(projectRoot, ".claude", "skills", "feature");
}
