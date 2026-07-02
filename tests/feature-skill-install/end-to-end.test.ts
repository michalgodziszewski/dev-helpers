import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { validateSource, installSkill } from "../../src/cli/feature-skill-install/install-skill.js";
import { createContextDirs, copyContextFiles, discoverCodingStandards, applyCodingStandards } from "../../src/cli/feature-skill-install/initialize-context.js";
import { discoverCodeReviewStacks, installSubagents } from "../../src/cli/feature-skill-install/install-subagents.js";
import { updateGitignore } from "../../src/cli/feature-skill-install/update-gitignore.js";
import { updateClaudeMd } from "../../src/cli/feature-skill-install/update-claude-md.js";

let tmpDir: string;
let projectRoot: string;
let homeDir: string;
let sourceSkillPath: string;
let rootAssetsDir: string;
let skillAssetsDir: string;
let subagentsDir: string;

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

  // The skill itself ships only the current-feature template.
  const assetsDir = path.join(skillDir, "assets");
  fs.mkdirSync(assetsDir);
  fs.writeFileSync(path.join(assetsDir, "current-feature-template.md"), "# Current Feature\n");

  const docsDir = path.join(skillDir, "docs");
  fs.mkdirSync(docsDir);
  fs.writeFileSync(path.join(docsDir, "README.md"), "# Docs\n");

  return skillDir;
}

function createRootAssets(baseDir: string): string {
  const assets = path.join(baseDir, "assets");
  fs.mkdirSync(assets, { recursive: true });
  fs.writeFileSync(path.join(assets, "ai-interaction-template.md"), "# AI Interaction\n");
  fs.writeFileSync(path.join(assets, "feature-config-template.md"), "# Feature Config\n");
  fs.writeFileSync(path.join(assets, "feature-spec-template.md"), "# Feature Spec\n");
  fs.writeFileSync(path.join(assets, "project-overview-template.md"), "# Project Overview\n");
  fs.writeFileSync(path.join(assets, "coding-standards-nextjs-template.md"), "# Next.js Standards\n");

  const subagents = path.join(assets, "subagents");
  fs.mkdirSync(subagents);
  fs.writeFileSync(path.join(subagents, "code-review-nextjs-template.md"), "# Next.js Code Review\n");
  fs.writeFileSync(path.join(subagents, "code-review-angular-template.md"), "# Angular Code Review\n");
  fs.writeFileSync(path.join(subagents, "test-template.md"), "# Test Agent\n");
  fs.writeFileSync(path.join(subagents, "explain-template.md"), "# Explain Agent\n");
  fs.writeFileSync(path.join(subagents, "git-verify-template.md"), "# Git Verify Agent\n");

  return assets;
}

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "fsi-e2e-"));
  projectRoot = path.join(tmpDir, "project");
  homeDir = path.join(tmpDir, "home");
  fs.mkdirSync(projectRoot, { recursive: true });
  fs.mkdirSync(homeDir, { recursive: true });
  sourceSkillPath = createFullSourceSkill(tmpDir);
  rootAssetsDir = createRootAssets(tmpDir);
  skillAssetsDir = path.join(sourceSkillPath, "assets");
  subagentsDir = path.join(rootAssetsDir, "subagents");
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe("end-to-end: fresh project with project install", () => {
  it("produces the complete expected structure", () => {
    const destPath = path.join(projectRoot, ".claude", "skills", "feature");

    // Install skill
    const skillEntry = installSkill(sourceSkillPath, destPath);
    expect(skillEntry.status).toBe("created");

    // Create context dirs
    const dirEntries = createContextDirs(projectRoot);
    expect(dirEntries.every((e) => e.status === "created")).toBe(true);

    // Copy context files
    const fileEntries = copyContextFiles(projectRoot, rootAssetsDir, skillAssetsDir);
    expect(fileEntries.every((e) => e.status === "copied")).toBe(true);

    // Apply coding standards
    const csEntry = applyCodingStandards(projectRoot, rootAssetsDir, {
      label: "Next.js",
      assetFilename: "coding-standards-nextjs-template.md",
    });
    expect(csEntry.status).toBe("copied");

    // Install subagents
    const stacks = discoverCodeReviewStacks(subagentsDir);
    expect(stacks.map((s) => s.label)).toEqual(["Angular", "Next.js"]);
    const agentEntries = installSubagents(projectRoot, subagentsDir, stacks[1]);
    expect(agentEntries.every((e) => e.status === "copied")).toBe(true);

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
    expect(fs.existsSync(path.join(projectRoot, ".claude", "agents", "code-review.md"))).toBe(true);
    expect(fs.existsSync(path.join(projectRoot, ".claude", "agents", "test.md"))).toBe(true);
    expect(fs.existsSync(path.join(projectRoot, ".claude", "agents", "explain.md"))).toBe(true);
    expect(fs.existsSync(path.join(projectRoot, ".claude", "agents", "git-verify.md"))).toBe(true);
    expect(fs.readFileSync(path.join(projectRoot, ".claude", "agents", "code-review.md"), "utf-8")).toContain("Next.js");
    expect(fs.readFileSync(path.join(projectRoot, ".gitignore"), "utf-8")).toContain("/context/");
    expect(fs.readFileSync(path.join(projectRoot, "CLAUDE.md"), "utf-8")).toContain("## Local Context Files");
  });
});

describe("end-to-end: fresh project with global install", () => {
  it("copies skill globally and initializes context locally", () => {
    const destPath = path.join(homeDir, ".claude", "skills", "feature");

    const skillEntry = installSkill(sourceSkillPath, destPath);
    expect(skillEntry.status).toBe("created");
    expect(fs.existsSync(path.join(destPath, "SKILL.md"))).toBe(true);

    // Context is still in project
    createContextDirs(projectRoot);
    copyContextFiles(projectRoot, rootAssetsDir, skillAssetsDir);
    expect(fs.existsSync(path.join(projectRoot, "context", "ai-interaction.md"))).toBe(true);
    expect(fs.existsSync(path.join(homeDir, "context"))).toBe(false);
  });
});

describe("end-to-end: idempotent second run", () => {
  it("produces no content changes on fully configured project", () => {
    const destPath = path.join(projectRoot, ".claude", "skills", "feature");

    // First run
    installSkill(sourceSkillPath, destPath);
    createContextDirs(projectRoot);
    copyContextFiles(projectRoot, rootAssetsDir, skillAssetsDir);
    applyCodingStandards(projectRoot, rootAssetsDir, {
      label: "Next.js",
      assetFilename: "coding-standards-nextjs-template.md",
    });
    installSubagents(projectRoot, subagentsDir, {
      label: "Next.js",
      assetFilename: "code-review-nextjs-template.md",
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

    const fileEntries2 = copyContextFiles(projectRoot, rootAssetsDir, skillAssetsDir);
    expect(fileEntries2.every((e) => e.status === "exists")).toBe(true);

    const agentEntries2 = installSubagents(projectRoot, subagentsDir, null);
    expect(agentEntries2.every((e) => e.status === "exists")).toBe(true);

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

    const fileEntries = copyContextFiles(projectRoot, rootAssetsDir, skillAssetsDir);
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

    installSkill(sourceSkillPath, destPath);
    createContextDirs(projectRoot);
    copyContextFiles(projectRoot, rootAssetsDir, skillAssetsDir);
    applyCodingStandards(projectRoot, rootAssetsDir, {
      label: "Next.js",
      assetFilename: "coding-standards-nextjs-template.md",
    });
    updateGitignore(projectRoot);
    const cmdEntry = updateClaudeMd(projectRoot, false);

    expect(cmdEntry.status).toBe("declined");
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

    const skillEntry = installSkill(sourceSkillPath, destPath);
    expect(skillEntry.status).toBe("created");

    const dirEntries = createContextDirs(spacedProject);
    expect(dirEntries.every((e) => e.status === "created")).toBe(true);

    const fileEntries = copyContextFiles(spacedProject, rootAssetsDir, skillAssetsDir);
    expect(fileEntries.every((e) => e.status === "copied")).toBe(true);
  });
});
