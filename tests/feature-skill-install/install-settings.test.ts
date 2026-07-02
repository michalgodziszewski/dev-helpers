import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { installSettings } from "../../src/cli/feature-skill-install/install-settings.js";

let tmpDir: string;
let projectRoot: string;
let sourcePath: string;

const SOURCE_SETTINGS = {
  permissions: {
    allow: ["Bash(git status:*)", "Bash(git diff:*)", "Bash(git log:*)"],
  },
};

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "fsi-settings-"));
  projectRoot = path.join(tmpDir, "project");
  fs.mkdirSync(projectRoot, { recursive: true });
  sourcePath = path.join(tmpDir, "source-settings.json");
  fs.writeFileSync(sourcePath, JSON.stringify(SOURCE_SETTINGS, null, 2) + "\n");
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

function readTarget(): { permissions?: { allow?: string[] }; [key: string]: unknown } {
  return JSON.parse(
    fs.readFileSync(path.join(projectRoot, ".claude", "settings.json"), "utf-8"),
  );
}

describe("installSettings", () => {
  it("copies the packaged settings when the target is missing", () => {
    const entry = installSettings(projectRoot, sourcePath);

    expect(entry.status).toBe("copied");
    expect(readTarget().permissions?.allow).toEqual(SOURCE_SETTINGS.permissions.allow);
  });

  it("merges missing allow rules into existing settings", () => {
    const targetDir = path.join(projectRoot, ".claude");
    fs.mkdirSync(targetDir, { recursive: true });
    fs.writeFileSync(
      path.join(targetDir, "settings.json"),
      JSON.stringify({
        model: "opus",
        permissions: { allow: ["Bash(git status:*)", "Edit"], deny: ["WebFetch"] },
      }),
    );

    const entry = installSettings(projectRoot, sourcePath);

    expect(entry.status).toBe("merged");
    const merged = readTarget();
    expect(merged.permissions?.allow).toEqual([
      "Bash(git status:*)",
      "Edit",
      "Bash(git diff:*)",
      "Bash(git log:*)",
    ]);
    // Unrelated settings are preserved.
    expect(merged["model"]).toBe("opus");
    expect((merged.permissions as { deny?: string[] }).deny).toEqual(["WebFetch"]);
  });

  it("reports exists when every rule is already present", () => {
    const targetDir = path.join(projectRoot, ".claude");
    fs.mkdirSync(targetDir, { recursive: true });
    fs.writeFileSync(
      path.join(targetDir, "settings.json"),
      JSON.stringify(SOURCE_SETTINGS),
    );
    const before = fs.readFileSync(path.join(targetDir, "settings.json"), "utf-8");

    const entry = installSettings(projectRoot, sourcePath);

    expect(entry.status).toBe("exists");
    const after = fs.readFileSync(path.join(targetDir, "settings.json"), "utf-8");
    expect(after).toBe(before);
  });

  it("blocks on invalid existing JSON without overwriting it", () => {
    const targetDir = path.join(projectRoot, ".claude");
    fs.mkdirSync(targetDir, { recursive: true });
    fs.writeFileSync(path.join(targetDir, "settings.json"), "{ not json");

    const entry = installSettings(projectRoot, sourcePath);

    expect(entry.status).toBe("blocked");
    expect(fs.readFileSync(path.join(targetDir, "settings.json"), "utf-8")).toBe("{ not json");
  });

  it("blocks when the source settings file is missing", () => {
    const entry = installSettings(projectRoot, path.join(tmpDir, "missing.json"));
    expect(entry.status).toBe("blocked");
  });
});
