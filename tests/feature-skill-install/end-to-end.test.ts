import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { validateSource, installSkill } from "../../src/cli/feature-skill-install/install-skill.js";
import { createContextDirs, copyContextFiles, discoverCodingStandards, applyCodingStandards } from "../../src/cli/feature-skill-install/initialize-context.js";
import { updateGitignore } from "../../src/cli/feature-skill-install/update-gitignore.js";
import { updateClaudeMd } from "../../src/cli/feature-skill-install/update-claude-md.js";

let tmpDir: string;
let projectRoot: string;
let homeDir: string;
let sourceSkillPath: string;

function createFullSourceSkill(baseDir: string): string {
  const skillDir = path.join(baseDir, "source-skill");
  fs.mkdirSync(skillDir, { recursive: true });
  fs.writeFileSync(
    path.join(skillDir, "SKILL.md"),
    "---\nname: feature\ndescription: Manage feature branches\n---\n# Feature\n",
  );

  const actionsDir = path.join(skillDir, "actions");
  fs.mkdirSync(actionsDir);
  fs.writeFileSync(path.join(actionsDir, "load.md"), "# Load Action\n");
  fs.writeFileSync(path.join(actionsDir, "start.md"), "# Start Action\n");

  const assetsDir = path.join(skillDir, "assets");
  fs.mkdirSync(assetsDir);
  fs.writeFileSync(path.join(assetsDir, "ai-interaction-template.md"), "# AI Interaction\n");
  fs.writeFileSync(path.join(assetsDir, "current-feature-template.md"), "# Current Feature\n");
  fs.writeFileSync(path.join(assetsDir, "feature-config-template.md"), "# Feature Config\n");
  fs.writeFileSync(path.join(assetsDir, "feature-spec-template.md"), "# Feature Spec\n");
  fs.writeFileSync(path.join(assetsDir, "project-overview-template.md"), "# Project Overview\n");
  fs.writeFileSync(path.join(assetsDir, "coding-standards-nextjs-template.md"), "# Next.js Standards\n");

  const docsDir = path.join(skillDir, "docs");
  fs.mkdirSync(docsDir);
  fs.writeFileSync(path.join(docsDir, "README.md"), "# Docs\n");

  return skillDir;
}

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "fsi-e2e-"));
  projectRoot = path.join(tmpDir, "project");
  homeDir = path.join(tmpDir, "home");
  fs.mkdirSync(projectRoot, { recursive: true });
  fs.mkdirSync(homeDir, { recursive: true });
  sourceSkillPath = createFullSourceSkill(tmpDir);
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe("end-to-end: fresh project with project install", () => {
  it("produces the complete expected structure", () => {
    const destPath = path.join(projectRoot, ".claude", "skills", "feature");
    const assetsDir = path.join(sourceSkillPath, "assets");

    // Install skill
    const skillEntry = installSkill(sourceSkillPath, destPath);
    expect(skillEntry.status).toBe("created");

    // Create context dirs
    const dirEntries = createContextDirs(projectRoot);
    expect(dirEntries.every((e) => e.status === "created")).toBe(true);

    // Copy context files
    const fileEntries = copyContextFiles(projectRoot, assetsDir);
    expect(fileEntries.every((e) => e.status === "copied")).toBe(true);

    // Apply coding standards
    const csEntry = applyCodingStandards(projectRoot, assetsDir, {
      label: "Next.js",
      assetFilename: "coding-standards-nextjs-template.md",
    });
    expect(csEntry.status).toBe("copied");

    // Update gitignore
    const giEntry = updateGitignore(projectRoot);
    expect(giEntry.status).toBe("created");

    // Update CLAUDE.md
    const cmdEntry = updateClaudeMd(projectRoot, true);
    expect(cmdEntry.status).toBe("created");

    // Verify structure
    expect(fs.existsSync(path.join(destPath, "SKILL.md"))).toBe(true);
    expect(fs.existsSync(path.join(destPath, "actions", "load.md"))).toBe(true);
    expect(fs.existsSync(path.join(destPath, "docs", "README.md"))).toBe(true);
    expect(fs.existsSync(path.join(projectRoot, "context", "features"))).toBe(true);
    expect(fs.existsSync(path.join(projectRoot, "context", "fixes"))).toBe(true);
    expect(fs.existsSync(path.join(projectRoot, "context", "screenshots"))).toBe(true);
    expect(fs.existsSync(path.join(projectRoot, "context", "ai-interaction.md"))).toBe(true);
    expect(fs.existsSync(path.join(projectRoot, "context", "coding-standards.md"))).toBe(true);
    expect(fs.readFileSync(path.join(projectRoot, ".gitignore"), "utf-8")).toContain("/context/");
    expect(fs.readFileSync(path.join(projectRoot, "CLAUDE.md"), "utf-8")).toContain("## Local Context Files");
  });
});

describe("end-to-end: fresh project with global install", () => {
  it("copies skill globally and initializes context locally", () => {
    const destPath = path.join(homeDir, ".claude", "skills", "feature");
    const assetsDir = path.join(sourceSkillPath, "assets");

    const skillEntry = installSkill(sourceSkillPath, destPath);
    expect(skillEntry.status).toBe("created");
    expect(fs.existsSync(path.join(destPath, "SKILL.md"))).toBe(true);

    // Context is still in project
    createContextDirs(projectRoot);
    copyContextFiles(projectRoot, assetsDir);
    expect(fs.existsSync(path.join(projectRoot, "context", "ai-interaction.md"))).toBe(true);
    expect(fs.existsSync(path.join(homeDir, "context"))).toBe(false);
  });
});

describe("end-to-end: idempotent second run", () => {
  it("produces no content changes on fully configured project", () => {
    const destPath = path.join(projectRoot, ".claude", "skills", "feature");
    const assetsDir = path.join(sourceSkillPath, "assets");

    // First run
    installSkill(sourceSkillPath, destPath);
    createContextDirs(projectRoot);
    copyContextFiles(projectRoot, assetsDir);
    applyCodingStandards(projectRoot, assetsDir, {
      label: "Next.js",
      assetFilename: "coding-standards-nextjs-template.md",
    });
    updateGitignore(projectRoot);
    updateClaudeMd(projectRoot, true);

    // Snapshot
    const gitignoreBefore = fs.readFileSync(path.join(projectRoot, ".gitignore"), "utf-8");
    const claudeMdBefore = fs.readFileSync(path.join(projectRoot, "CLAUDE.md"), "utf-8");

    // Second run
    const skillEntry2 = installSkill(sourceSkillPath, destPath);
    expect(skillEntry2.status).toBe("exists");

    const dirEntries2 = createContextDirs(projectRoot);
    expect(dirEntries2.every((e) => e.status === "exists")).toBe(true);

    const fileEntries2 = copyContextFiles(projectRoot, assetsDir);
    expect(fileEntries2.every((e) => e.status === "exists")).toBe(true);

    const giEntry2 = updateGitignore(projectRoot);
    expect(giEntry2.status).toBe("exists");

    const cmdEntry2 = updateClaudeMd(projectRoot, true);
    expect(cmdEntry2.status).toBe("exists");

    // Verify no content changes
    const gitignoreAfter = fs.readFileSync(path.join(projectRoot, ".gitignore"), "utf-8");
    const claudeMdAfter = fs.readFileSync(path.join(projectRoot, "CLAUDE.md"), "utf-8");
    expect(gitignoreAfter).toBe(gitignoreBefore);
    expect(claudeMdAfter).toBe(claudeMdBefore);
  });
});

describe("end-to-end: partial context completion", () => {
  it("completes only missing project configuration", () => {
    const destPath = path.join(projectRoot, ".claude", "skills", "feature");
    const assetsDir = path.join(sourceSkillPath, "assets");

    // Pre-existing partial state
    installSkill(sourceSkillPath, destPath);
    fs.mkdirSync(path.join(projectRoot, "context"), { recursive: true });
    fs.writeFileSync(
      path.join(projectRoot, "context", "current-feature.md"),
      "# My active work\nStatus: In Progress\n",
    );

    // Complete
    const dirEntries = createContextDirs(projectRoot);
    const contextEntry = dirEntries.find((e) => e.path === "context");
    expect(contextEntry?.status).toBe("exists");

    const fileEntries = copyContextFiles(projectRoot, assetsDir);
    const cfEntry = fileEntries.find((e) => e.path === "context/current-feature.md");
    expect(cfEntry?.status).toBe("exists");

    // Verify preserved
    const content = fs.readFileSync(
      path.join(projectRoot, "context", "current-feature.md"),
      "utf-8",
    );
    expect(content).toContain("My active work");
  });
});

describe("end-to-end: declining CLAUDE.md", () => {
  it("completes all other steps when CLAUDE.md creation is declined", () => {
    const destPath = path.join(projectRoot, ".claude", "skills", "feature");
    const assetsDir = path.join(sourceSkillPath, "assets");

    installSkill(sourceSkillPath, destPath);
    createContextDirs(projectRoot);
    copyContextFiles(projectRoot, assetsDir);
    applyCodingStandards(projectRoot, assetsDir, {
      label: "Next.js",
      assetFilename: "coding-standards-nextjs-template.md",
    });
    updateGitignore(projectRoot);
    const cmdEntry = updateClaudeMd(projectRoot, false);

    expect(cmdEntry.status).toBe("skipped");
    expect(fs.existsSync(path.join(projectRoot, "CLAUDE.md"))).toBe(false);
    expect(fs.existsSync(path.join(destPath, "SKILL.md"))).toBe(true);
    expect(fs.existsSync(path.join(projectRoot, "context", "ai-interaction.md"))).toBe(true);
    expect(fs.readFileSync(path.join(projectRoot, ".gitignore"), "utf-8")).toContain("/context/");
  });
});

describe("end-to-end: paths with spaces", () => {
  it("works correctly with spaces in project path", () => {
    const spacedProject = path.join(tmpDir, "my project dir");
    fs.mkdirSync(spacedProject, { recursive: true });
    const destPath = path.join(spacedProject, ".claude", "skills", "feature");
    const assetsDir = path.join(sourceSkillPath, "assets");

    const skillEntry = installSkill(sourceSkillPath, destPath);
    expect(skillEntry.status).toBe("created");

    const dirEntries = createContextDirs(spacedProject);
    expect(dirEntries.every((e) => e.status === "created")).toBe(true);

    const fileEntries = copyContextFiles(spacedProject, assetsDir);
    expect(fileEntries.every((e) => e.status === "copied")).toBe(true);
  });
});
