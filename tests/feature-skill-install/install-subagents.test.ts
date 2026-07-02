import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import {
  discoverCodeReviewStacks,
  installSubagents,
} from "../../src/cli/feature-skill-install/install-subagents.js";

let tmpDir: string;
let projectRoot: string;
let subagentsDir: string;

function setupSubagents(dir: string): string {
  const subagents = path.join(dir, "assets", "subagents");
  fs.mkdirSync(subagents, { recursive: true });
  fs.writeFileSync(path.join(subagents, "code-review-nextjs-template.md"), "---\nmodel: sonnet\n---\n# Next.js Review\n");
  fs.writeFileSync(path.join(subagents, "code-review-angular-template.md"), "---\nmodel: sonnet\n---\n# Angular Review\n");
  fs.writeFileSync(path.join(subagents, "test-template.md"), "---\nmodel: sonnet\n---\n# Test\n");
  fs.writeFileSync(path.join(subagents, "explain-template.md"), "---\nmodel: sonnet\n---\n# Explain\n");
  fs.writeFileSync(path.join(subagents, "git-verify-template.md"), "---\nmodel: haiku\n---\n# Git Verify\n");
  fs.writeFileSync(path.join(subagents, "plan-research-template.md"), "---\nmodel: sonnet\n---\n# Plan Research\n");
  fs.writeFileSync(path.join(subagents, "docs-sync-template.md"), "---\nmodel: sonnet\n---\n# Docs Sync\n");
  return subagents;
}

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "fsi-agents-"));
  projectRoot = path.join(tmpDir, "project");
  fs.mkdirSync(projectRoot, { recursive: true });
  subagentsDir = setupSubagents(tmpDir);
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe("discoverCodeReviewStacks", () => {
  it("discovers code-review stack variants sorted by label", () => {
    const stacks = discoverCodeReviewStacks(subagentsDir);

    expect(stacks).toHaveLength(2);
    expect(stacks[0]).toEqual({
      label: "Angular",
      assetFilename: "code-review-angular-template.md",
    });
    expect(stacks[1]).toEqual({
      label: "Next.js",
      assetFilename: "code-review-nextjs-template.md",
    });
  });

  it("returns empty list when the directory is missing", () => {
    const stacks = discoverCodeReviewStacks(path.join(tmpDir, "missing"));
    expect(stacks).toEqual([]);
  });
});

describe("installSubagents", () => {
  it("installs stack-agnostic agents and the selected code-review stack", () => {
    const entries = installSubagents(projectRoot, subagentsDir, {
      label: "Angular",
      assetFilename: "code-review-angular-template.md",
    });

    expect(entries.every((e) => e.status === "copied")).toBe(true);
    const agentsDir = path.join(projectRoot, ".claude", "agents");
    for (const agent of ["test.md", "explain.md", "git-verify.md", "plan-research.md", "docs-sync.md", "code-review.md"]) {
      expect(fs.existsSync(path.join(agentsDir, agent))).toBe(true);
    }
    expect(fs.readFileSync(path.join(agentsDir, "code-review.md"), "utf-8")).toBe(
      "---\nmodel: sonnet\n---\n# Angular Review\n",
    );
  });

  it("declines code-review when no stack is selected", () => {
    const entries = installSubagents(projectRoot, subagentsDir, null);

    const crEntry = entries.find((e) => e.path === ".claude/agents/code-review.md");
    expect(crEntry?.status).toBe("declined");
    expect(fs.existsSync(path.join(projectRoot, ".claude", "agents", "code-review.md"))).toBe(false);
    expect(fs.existsSync(path.join(projectRoot, ".claude", "agents", "test.md"))).toBe(true);
  });

  it("preserves existing agent files", () => {
    const agentsDir = path.join(projectRoot, ".claude", "agents");
    fs.mkdirSync(agentsDir, { recursive: true });
    fs.writeFileSync(path.join(agentsDir, "test.md"), "# My customized test agent\n");
    fs.writeFileSync(path.join(agentsDir, "code-review.md"), "# My customized review\n");

    const entries = installSubagents(projectRoot, subagentsDir, {
      label: "Angular",
      assetFilename: "code-review-angular-template.md",
    });

    const testEntry = entries.find((e) => e.path === ".claude/agents/test.md");
    const crEntry = entries.find((e) => e.path === ".claude/agents/code-review.md");
    expect(testEntry?.status).toBe("exists");
    expect(crEntry?.status).toBe("exists");
    expect(fs.readFileSync(path.join(agentsDir, "test.md"), "utf-8")).toBe("# My customized test agent\n");
    expect(fs.readFileSync(path.join(agentsDir, "code-review.md"), "utf-8")).toBe("# My customized review\n");
  });

  it("blocks when the source subagents directory is missing", () => {
    const entries = installSubagents(projectRoot, path.join(tmpDir, "missing"), null);

    expect(entries).toHaveLength(1);
    expect(entries[0].status).toBe("blocked");
  });

  it("applies a model override while copying new agent files", () => {
    installSubagents(projectRoot, subagentsDir, null, {
      sonnet: "eu.anthropic.claude-sonnet-4-6",
      haiku: "eu.anthropic.claude-haiku-4-5-20251001-v1:0",
    });

    const agentsDir = path.join(projectRoot, ".claude", "agents");
    expect(fs.readFileSync(path.join(agentsDir, "test.md"), "utf-8")).toContain(
      "model: eu.anthropic.claude-sonnet-4-6",
    );
    expect(fs.readFileSync(path.join(agentsDir, "git-verify.md"), "utf-8")).toContain(
      "model: eu.anthropic.claude-haiku-4-5-20251001-v1:0",
    );
  });
});
