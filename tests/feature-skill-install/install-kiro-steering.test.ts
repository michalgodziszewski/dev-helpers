import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import {
  installKiroFeatureEntryPoint,
  installKiroProjectContext,
  installKiroCodeReviewGuidance,
} from "../../src/cli/feature-skill-install/install-kiro-steering.js";

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "fsi-kiro-"));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe("installKiroFeatureEntryPoint", () => {
  it("creates feature.md with manual inclusion front matter", () => {
    const entry = installKiroFeatureEntryPoint(tmpDir);

    expect(entry.status).toBe("created");
    expect(entry.path).toBe(".kiro/steering/feature.md");
    const content = fs.readFileSync(path.join(tmpDir, "feature.md"), "utf-8");
    expect(content).toMatch(/^---\ninclusion: manual\n---/);
    expect(content).toContain("../../skills/feature/actions");
  });

  it("creates missing parent directories", () => {
    const nested = path.join(tmpDir, "nested", "steering");
    installKiroFeatureEntryPoint(nested);
    expect(fs.existsSync(path.join(nested, "feature.md"))).toBe(true);
  });

  it("reports exists without overwriting an already-installed file", () => {
    fs.mkdirSync(tmpDir, { recursive: true });
    fs.writeFileSync(path.join(tmpDir, "feature.md"), "custom content");

    const entry = installKiroFeatureEntryPoint(tmpDir);

    expect(entry.status).toBe("exists");
    expect(fs.readFileSync(path.join(tmpDir, "feature.md"), "utf-8")).toBe("custom content");
  });
});

describe("installKiroProjectContext", () => {
  it("creates project-context.md with always inclusion front matter", () => {
    const entry = installKiroProjectContext(tmpDir);

    expect(entry.status).toBe("created");
    expect(entry.path).toBe(".kiro/steering/project-context.md");
    const content = fs.readFileSync(path.join(tmpDir, "project-context.md"), "utf-8");
    expect(content).toMatch(/^---\ninclusion: always\n---/);
    expect(content).toContain("context/project-overview.md");
    expect(content).toContain("context/current-feature.md");
  });

  it("reports exists without overwriting an already-installed file", () => {
    fs.mkdirSync(tmpDir, { recursive: true });
    fs.writeFileSync(path.join(tmpDir, "project-context.md"), "custom content");

    const entry = installKiroProjectContext(tmpDir);

    expect(entry.status).toBe("exists");
    expect(fs.readFileSync(path.join(tmpDir, "project-context.md"), "utf-8")).toBe("custom content");
  });
});

describe("installKiroCodeReviewGuidance", () => {
  function createSubagentTemplate(dir: string, filename: string): void {
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(
      path.join(dir, filename),
      [
        "---",
        "name: code-review",
        "description: test stack code review",
        "model: claude-sonnet-4-6",
        "color: orange",
        "tools:",
        "  - Read",
        "---",
        "",
        "# Code Review Agent",
        "",
        "Stack-specific checklist body.",
        "",
      ].join("\n"),
    );
  }

  it("translates Claude Code subagent frontmatter into Kiro manual-inclusion frontmatter", () => {
    const subagentsDir = path.join(tmpDir, "subagents");
    createSubagentTemplate(subagentsDir, "code-review-nextjs-template.md");
    const steeringDir = path.join(tmpDir, "steering");

    const entry = installKiroCodeReviewGuidance(
      subagentsDir,
      "code-review-nextjs-template.md",
      steeringDir,
    );

    expect(entry.status).toBe("created");
    const content = fs.readFileSync(
      path.join(steeringDir, "feature-code-review-guidance.md"),
      "utf-8",
    );
    expect(content).toMatch(/^---\ninclusion: manual\n---/);
    expect(content).not.toContain("name: code-review");
    expect(content).not.toContain("model: claude-sonnet-4-6");
    expect(content).toContain("# Code Review Agent");
    expect(content).toContain("Stack-specific checklist body.");
  });

  it("reports exists without overwriting an already-installed guidance file", () => {
    const subagentsDir = path.join(tmpDir, "subagents");
    createSubagentTemplate(subagentsDir, "code-review-angular-template.md");
    const steeringDir = path.join(tmpDir, "steering");
    fs.mkdirSync(steeringDir, { recursive: true });
    fs.writeFileSync(
      path.join(steeringDir, "feature-code-review-guidance.md"),
      "custom guidance",
    );

    const entry = installKiroCodeReviewGuidance(
      subagentsDir,
      "code-review-angular-template.md",
      steeringDir,
    );

    expect(entry.status).toBe("exists");
    expect(
      fs.readFileSync(path.join(steeringDir, "feature-code-review-guidance.md"), "utf-8"),
    ).toBe("custom guidance");
  });

  it("reports blocked instead of throwing when the source template cannot be read", () => {
    const subagentsDir = path.join(tmpDir, "subagents");
    fs.mkdirSync(subagentsDir, { recursive: true });
    const steeringDir = path.join(tmpDir, "steering");

    const entry = installKiroCodeReviewGuidance(
      subagentsDir,
      "code-review-missing-template.md",
      steeringDir,
    );

    expect(entry.status).toBe("blocked");
    expect(entry.path).toBe(".kiro/steering/feature-code-review-guidance.md");
    expect(entry.detail).toBeTruthy();
    expect(fs.existsSync(path.join(steeringDir, "feature-code-review-guidance.md"))).toBe(false);
  });
});
