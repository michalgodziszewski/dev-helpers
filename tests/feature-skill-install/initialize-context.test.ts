import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import {
  createContextDirs,
  copyContextFiles,
  discoverCodingStandards,
  applyCodingStandards,
} from "../../src/cli/feature-skill-install/initialize-context.js";

let tmpDir: string;
let projectRoot: string;
let assetsDir: string;

function setupAssets(dir: string): string {
  const assets = path.join(dir, "assets");
  fs.mkdirSync(assets, { recursive: true });
  fs.writeFileSync(path.join(assets, "ai-interaction-template.md"), "# AI\n");
  fs.writeFileSync(path.join(assets, "current-feature-template.md"), "# Feature\n");
  fs.writeFileSync(path.join(assets, "feature-config-template.md"), "# Config\n");
  fs.writeFileSync(path.join(assets, "feature-spec-template.md"), "# Spec\n");
  fs.writeFileSync(path.join(assets, "project-overview-template.md"), "# Overview\n");
  fs.writeFileSync(path.join(assets, "coding-standards-nextjs-template.md"), "# Next.js\n");
  return assets;
}

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "fsi-ctx-"));
  projectRoot = path.join(tmpDir, "project");
  fs.mkdirSync(projectRoot, { recursive: true });
  assetsDir = setupAssets(tmpDir);
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe("createContextDirs", () => {
  it("creates all missing directories", () => {
    const entries = createContextDirs(projectRoot);

    expect(entries).toHaveLength(4);
    expect(entries.every((e) => e.status === "created")).toBe(true);
    expect(fs.existsSync(path.join(projectRoot, "context"))).toBe(true);
    expect(fs.existsSync(path.join(projectRoot, "context", "features"))).toBe(true);
    expect(fs.existsSync(path.join(projectRoot, "context", "fixes"))).toBe(true);
    expect(fs.existsSync(path.join(projectRoot, "context", "screenshots"))).toBe(true);
  });

  it("reports existing directories", () => {
    fs.mkdirSync(path.join(projectRoot, "context", "features"), { recursive: true });
    const entries = createContextDirs(projectRoot);

    const contextEntry = entries.find((e) => e.path === "context");
    const featuresEntry = entries.find((e) => e.path === "context/features");
    expect(contextEntry?.status).toBe("exists");
    expect(featuresEntry?.status).toBe("exists");
  });

  it("blocks when a file exists where a directory is expected", () => {
    fs.mkdirSync(path.join(projectRoot, "context"), { recursive: true });
    fs.writeFileSync(path.join(projectRoot, "context", "features"), "not a dir");

    const entries = createContextDirs(projectRoot);
    const featuresEntry = entries.find((e) => e.path === "context/features");
    expect(featuresEntry?.status).toBe("blocked");
  });
});

describe("copyContextFiles", () => {
  it("copies all asset files when targets are missing", () => {
    fs.mkdirSync(path.join(projectRoot, "context"), { recursive: true });
    const entries = copyContextFiles(projectRoot, assetsDir);

    expect(entries).toHaveLength(5);
    expect(entries.every((e) => e.status === "copied")).toBe(true);
    expect(fs.existsSync(path.join(projectRoot, "context", "ai-interaction.md"))).toBe(true);
    expect(fs.existsSync(path.join(projectRoot, "context", "current-feature.md"))).toBe(true);
    expect(fs.existsSync(path.join(projectRoot, "context", "feature-config.md"))).toBe(true);
    expect(fs.existsSync(path.join(projectRoot, "context", "feature-spec.md"))).toBe(true);
    expect(fs.existsSync(path.join(projectRoot, "context", "project-overview.md"))).toBe(true);
  });

  it("preserves existing target files", () => {
    fs.mkdirSync(path.join(projectRoot, "context"), { recursive: true });
    fs.writeFileSync(
      path.join(projectRoot, "context", "current-feature.md"),
      "# My state\n",
    );

    const entries = copyContextFiles(projectRoot, assetsDir);
    const cfEntry = entries.find((e) => e.path === "context/current-feature.md");
    expect(cfEntry?.status).toBe("exists");

    const content = fs.readFileSync(
      path.join(projectRoot, "context", "current-feature.md"),
      "utf-8",
    );
    expect(content).toBe("# My state\n");
  });

  it("blocks when target path is a directory instead of a file", () => {
    fs.mkdirSync(path.join(projectRoot, "context", "ai-interaction.md"), {
      recursive: true,
    });

    const entries = copyContextFiles(projectRoot, assetsDir);
    const aiEntry = entries.find((e) => e.path === "context/ai-interaction.md");
    expect(aiEntry?.status).toBe("blocked");
  });
});

describe("discoverCodingStandards", () => {
  it("discovers coding standards assets", () => {
    const choices = discoverCodingStandards(assetsDir);

    expect(choices).toHaveLength(1);
    expect(choices[0].label).toBe("Next.js");
    expect(choices[0].assetFilename).toBe("coding-standards-nextjs-template.md");
  });

  it("discovers multiple coding standards", () => {
    fs.writeFileSync(
      path.join(assetsDir, "coding-standards-angular-template.md"),
      "# Angular\n",
    );
    const choices = discoverCodingStandards(assetsDir);

    expect(choices).toHaveLength(2);
    expect(choices[0].label).toBe("Angular");
    expect(choices[1].label).toBe("Next.js");
  });
});

describe("applyCodingStandards", () => {
  it("copies asset when a template choice is selected", () => {
    fs.mkdirSync(path.join(projectRoot, "context"), { recursive: true });
    const entry = applyCodingStandards(projectRoot, assetsDir, {
      label: "Next.js",
      assetFilename: "coding-standards-nextjs-template.md",
    });

    expect(entry.status).toBe("copied");
    const content = fs.readFileSync(
      path.join(projectRoot, "context", "coding-standards.md"),
      "utf-8",
    );
    expect(content).toBe("# Next.js\n");
  });

  it("creates empty file when empty file choice is selected", () => {
    fs.mkdirSync(path.join(projectRoot, "context"), { recursive: true });
    const entry = applyCodingStandards(projectRoot, assetsDir, {
      label: "Empty file",
      assetFilename: null,
    });

    expect(entry.status).toBe("created");
    const content = fs.readFileSync(
      path.join(projectRoot, "context", "coding-standards.md"),
      "utf-8",
    );
    expect(content).toBe("");
  });
});
