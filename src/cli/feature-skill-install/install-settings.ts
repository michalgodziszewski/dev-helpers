import fs from "node:fs";
import path from "node:path";
import type { StatusEntry } from "./types.js";

interface SettingsJson {
  permissions?: {
    allow?: string[];
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

function readSettings(filePath: string): SettingsJson | null {
  try {
    const parsed: unknown = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
      return null;
    }
    return parsed as SettingsJson;
  } catch {
    return null;
  }
}

/**
 * Install the packaged Claude Code permission allowlist.
 *
 * - Target missing: copy the packaged .claude/settings.json as-is.
 * - Target exists: merge missing permissions.allow rules into it,
 *   preserving every other setting and the existing rule order.
 */
export function installSettings(
  projectRoot: string,
  sourceSettingsPath: string,
): StatusEntry {
  const target = ".claude/settings.json";
  const targetPath = path.join(projectRoot, ".claude", "settings.json");

  if (!fs.existsSync(sourceSettingsPath)) {
    return {
      status: "blocked",
      path: target,
      detail: `Source settings missing: ${sourceSettingsPath}`,
    };
  }

  if (!fs.existsSync(targetPath)) {
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    fs.copyFileSync(sourceSettingsPath, targetPath);
    return { status: "copied", path: target, detail: "Permission allowlist installed" };
  }

  const source = readSettings(sourceSettingsPath);
  const existing = readSettings(targetPath);
  if (source === null) {
    return { status: "blocked", path: target, detail: "Source settings.json is not valid JSON" };
  }
  if (existing === null) {
    return { status: "blocked", path: target, detail: "Existing settings.json is not valid JSON; merge skipped" };
  }

  const sourceAllow = source.permissions?.allow ?? [];
  const existingAllow = existing.permissions?.allow ?? [];
  const missing = sourceAllow.filter((rule) => !existingAllow.includes(rule));

  if (missing.length === 0) {
    return { status: "exists", path: target, detail: "Allowlist already present" };
  }

  const merged: SettingsJson = {
    ...existing,
    permissions: {
      ...existing.permissions,
      allow: [...existingAllow, ...missing],
    },
  };
  fs.writeFileSync(targetPath, JSON.stringify(merged, null, 2) + "\n", "utf-8");
  return {
    status: "merged",
    path: target,
    detail: `Added ${missing.length} permission rule(s)`,
  };
}
