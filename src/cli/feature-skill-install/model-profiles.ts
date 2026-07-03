import fs from "node:fs";
import path from "node:path";
import type { ModelOverride } from "./model-override.js";

export interface ModelProfiles {
  active: string;
  profiles: Record<string, ModelOverride>;
}

export const DEFAULT_PROFILE_NAME = "default";
export const DEFAULT_PROFILE: ModelOverride = {
  sonnet: "claude-sonnet-4-6",
  haiku: "claude-haiku-4-5",
};

function modelProfilesPath(projectRoot: string): string {
  return path.join(projectRoot, "context", "model-profiles.md");
}

export function readModelProfiles(projectRoot: string): ModelProfiles | null {
  const filePath = modelProfilesPath(projectRoot);
  if (!fs.existsSync(filePath)) return null;

  const content = fs.readFileSync(filePath, "utf-8");
  const activeMatch = /## Active Profile\s*\n\s*([^\n]+)/.exec(content);
  const active = activeMatch ? activeMatch[1].trim() : DEFAULT_PROFILE_NAME;

  const profiles: Record<string, ModelOverride> = {};
  const profilePattern = /### (\S+)\s*\n\s*- \*\*Sonnet:\*\* ([^\n]+)\s*\n\s*- \*\*Haiku:\*\* ([^\n]+)/g;
  let match: RegExpExecArray | null;
  while ((match = profilePattern.exec(content)) !== null) {
    profiles[match[1]] = { sonnet: match[2].trim(), haiku: match[3].trim() };
  }

  return { active, profiles };
}

export function writeModelProfiles(projectRoot: string, data: ModelProfiles): void {
  const filePath = modelProfilesPath(projectRoot);
  const profileBlocks = Object.entries(data.profiles)
    .map(
      ([name, override]) =>
        `### ${name}\n\n- **Sonnet:** ${override.sonnet}\n- **Haiku:** ${override.haiku}`,
    )
    .join("\n\n");

  const content =
    `# Model Profiles\n\n` +
    `## Active Profile\n\n${data.active}\n\n` +
    `## Profiles\n\n${profileBlocks}\n`;

  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, "utf-8");
}

/** Record or update a named profile and make it active, preserving any other profiles already stored. */
export function upsertActiveProfile(
  projectRoot: string,
  name: string,
  override: ModelOverride,
): void {
  const existing = readModelProfiles(projectRoot) ?? {
    active: DEFAULT_PROFILE_NAME,
    profiles: { [DEFAULT_PROFILE_NAME]: DEFAULT_PROFILE },
  };
  existing.profiles[name] = override;
  existing.active = name;
  writeModelProfiles(projectRoot, existing);
}

export interface InstallerModelOverrideDecision {
  /** True when context/model-profiles.md already exists — the installer must not re-prompt or reset the recorded active profile. */
  skipPrompt: boolean;
  /** Override to apply to newly-copied subagent files; null means leave the template's own pinned `model:` value unchanged. */
  override: ModelOverride | null;
}

/** Re-running the installer must never silently reset an already-configured active profile back to the default aliases — only prompt on first install. */
export function resolveInstallerModelOverride(projectRoot: string): InstallerModelOverrideDecision {
  const existing = readModelProfiles(projectRoot);
  if (existing === null) {
    return { skipPrompt: false, override: null };
  }
  const override = existing.profiles[existing.active] ?? null;
  return { skipPrompt: true, override };
}
