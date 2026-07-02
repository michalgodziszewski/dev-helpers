import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import {
  readModelProfiles,
  writeModelProfiles,
  upsertActiveProfile,
  resolveInstallerModelOverride,
  DEFAULT_PROFILE_NAME,
  DEFAULT_PROFILE,
} from "../../src/cli/feature-skill-install/model-profiles.js";

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "fsi-mp-"));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe("readModelProfiles", () => {
  it("returns null when context/model-profiles.md does not exist", () => {
    expect(readModelProfiles(tmpDir)).toBeNull();
  });

  it("parses the active profile and all profile blocks", () => {
    writeModelProfiles(tmpDir, {
      active: "org",
      profiles: {
        default: DEFAULT_PROFILE,
        org: { sonnet: "eu.anthropic.claude-sonnet-4-6", haiku: "eu.anthropic.claude-haiku-4-5-20251001-v1:0" },
      },
    });

    const result = readModelProfiles(tmpDir);
    expect(result?.active).toBe("org");
    expect(result?.profiles.default).toEqual(DEFAULT_PROFILE);
    expect(result?.profiles.org).toEqual({
      sonnet: "eu.anthropic.claude-sonnet-4-6",
      haiku: "eu.anthropic.claude-haiku-4-5-20251001-v1:0",
    });
  });
});

describe("upsertActiveProfile", () => {
  it("creates the file with the default profile plus the new one", () => {
    upsertActiveProfile(tmpDir, "org", { sonnet: "s", haiku: "h" });

    const result = readModelProfiles(tmpDir);
    expect(result?.active).toBe("org");
    expect(result?.profiles[DEFAULT_PROFILE_NAME]).toEqual(DEFAULT_PROFILE);
    expect(result?.profiles.org).toEqual({ sonnet: "s", haiku: "h" });
  });

  it("preserves previously stored profiles when adding another", () => {
    upsertActiveProfile(tmpDir, "org-a", { sonnet: "a1", haiku: "a2" });
    upsertActiveProfile(tmpDir, "org-b", { sonnet: "b1", haiku: "b2" });

    const result = readModelProfiles(tmpDir);
    expect(result?.active).toBe("org-b");
    expect(result?.profiles["org-a"]).toEqual({ sonnet: "a1", haiku: "a2" });
    expect(result?.profiles["org-b"]).toEqual({ sonnet: "b1", haiku: "b2" });
  });
});

describe("resolveInstallerModelOverride", () => {
  it("does not skip prompting on a fresh project with no model-profiles.md", () => {
    const decision = resolveInstallerModelOverride(tmpDir);
    expect(decision).toEqual({ skipPrompt: false, override: null });
  });

  it("skips prompting and reuses the active override when a profile is already configured", () => {
    upsertActiveProfile(tmpDir, "org", {
      sonnet: "eu.anthropic.claude-sonnet-4-6",
      haiku: "eu.anthropic.claude-haiku-4-5-20251001-v1:0",
    });

    const decision = resolveInstallerModelOverride(tmpDir);
    expect(decision).toEqual({
      skipPrompt: true,
      override: { sonnet: "eu.anthropic.claude-sonnet-4-6", haiku: "eu.anthropic.claude-haiku-4-5-20251001-v1:0" },
    });
  });

  it("skips prompting even when the active profile is the default aliases", () => {
    upsertActiveProfile(tmpDir, DEFAULT_PROFILE_NAME, DEFAULT_PROFILE);

    const decision = resolveInstallerModelOverride(tmpDir);
    expect(decision.skipPrompt).toBe(true);
    expect(decision.override).toEqual(DEFAULT_PROFILE);
  });
});
