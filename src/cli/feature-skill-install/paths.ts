import path from "node:path";
import { fileURLToPath } from "node:url";
import type { SkillScope } from "./types.js";

function resolvePackageRoot(): string {
  const thisFile = fileURLToPath(import.meta.url);
  // At runtime this file is dist/src/cli/feature-skill-install/paths.js
  // so we need four levels up to reach the repository root.
  return path.resolve(path.dirname(thisFile), "..", "..", "..", "..");
}

export function resolveSourceSkillPath(): string {
  return path.join(resolvePackageRoot(), ".claude", "skills", "feature");
}

export function resolveRootAssetsPath(): string {
  return path.join(resolvePackageRoot(), "assets");
}

export function resolveSubagentsPath(): string {
  return path.join(resolvePackageRoot(), "assets", "subagents");
}

export function resolveSourceSettingsPath(): string {
  return path.join(resolvePackageRoot(), ".claude", "settings.json");
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
