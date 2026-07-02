import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { updateGitignore, hasClaudeRule, addClaudeRule } from "../../src/cli/feature-skill-install/update-gitignore.js";

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "fsi-gi-"));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe("updateGitignore", () => {
  it("creates .gitignore with /context/ when missing", () => {
    const entry = updateGitignore(tmpDir);

    expect(entry.status).toBe("created");
    const content = fs.readFileSync(path.join(tmpDir, ".gitignore"), "utf-8");
    expect(content).toBe("/context/\n");
  });

  it("appends /context/ when not present", () => {
    fs.writeFileSync(path.join(tmpDir, ".gitignore"), "node_modules/\n");
    const entry = updateGitignore(tmpDir);

    expect(entry.status).toBe("created");
    const content = fs.readFileSync(path.join(tmpDir, ".gitignore"), "utf-8");
    expect(content).toBe("node_modules/\n/context/\n");
  });

  it("does not duplicate when /context/ already exists", () => {
    fs.writeFileSync(path.join(tmpDir, ".gitignore"), "node_modules/\n/context/\n");
    const entry = updateGitignore(tmpDir);

    expect(entry.status).toBe("exists");
    const content = fs.readFileSync(path.join(tmpDir, ".gitignore"), "utf-8");
    expect(content).toBe("node_modules/\n/context/\n");
  });

  it("treats context/ without leading slash as sufficient", () => {
    fs.writeFileSync(path.join(tmpDir, ".gitignore"), "context/\n");
    const entry = updateGitignore(tmpDir);

    expect(entry.status).toBe("exists");
  });

  it("handles missing terminal newline", () => {
    fs.writeFileSync(path.join(tmpDir, ".gitignore"), "node_modules/");
    const entry = updateGitignore(tmpDir);

    expect(entry.status).toBe("created");
    const content = fs.readFileSync(path.join(tmpDir, ".gitignore"), "utf-8");
    expect(content).toBe("node_modules/\n/context/\n");
  });

  it("preserves existing rules", () => {
    const existing = "# comment\nnode_modules/\n.env\n";
    fs.writeFileSync(path.join(tmpDir, ".gitignore"), existing);
    updateGitignore(tmpDir);

    const content = fs.readFileSync(path.join(tmpDir, ".gitignore"), "utf-8");
    expect(content).toContain("# comment");
    expect(content).toContain("node_modules/");
    expect(content).toContain(".env");
    expect(content).toContain("/context/");
  });
});

describe("hasClaudeRule", () => {
  it("returns false when .gitignore is missing", () => {
    expect(hasClaudeRule(tmpDir)).toBe(false);
  });

  it("returns false when .claude is not ignored", () => {
    fs.writeFileSync(path.join(tmpDir, ".gitignore"), "node_modules/\n/context/\n");
    expect(hasClaudeRule(tmpDir)).toBe(false);
  });

  it("detects /.claude/ and pattern variants", () => {
    for (const rule of ["/.claude/", ".claude/", "/.claude", ".claude"]) {
      fs.writeFileSync(path.join(tmpDir, ".gitignore"), `${rule}\n`);
      expect(hasClaudeRule(tmpDir)).toBe(true);
    }
  });

  it("ignores commented lines", () => {
    fs.writeFileSync(path.join(tmpDir, ".gitignore"), "# .claude/\n");
    expect(hasClaudeRule(tmpDir)).toBe(false);
  });
});

describe("addClaudeRule", () => {
  it("creates .gitignore with /.claude/ when missing", () => {
    const entry = addClaudeRule(tmpDir);

    expect(entry.status).toBe("created");
    const content = fs.readFileSync(path.join(tmpDir, ".gitignore"), "utf-8");
    expect(content).toBe("/.claude/\n");
  });

  it("appends /.claude/ preserving existing rules", () => {
    fs.writeFileSync(path.join(tmpDir, ".gitignore"), "node_modules/\n/context/\n");
    const entry = addClaudeRule(tmpDir);

    expect(entry.status).toBe("created");
    const content = fs.readFileSync(path.join(tmpDir, ".gitignore"), "utf-8");
    expect(content).toBe("node_modules/\n/context/\n/.claude/\n");
    expect(hasClaudeRule(tmpDir)).toBe(true);
  });

  it("handles missing terminal newline", () => {
    fs.writeFileSync(path.join(tmpDir, ".gitignore"), "node_modules/");
    addClaudeRule(tmpDir);

    const content = fs.readFileSync(path.join(tmpDir, ".gitignore"), "utf-8");
    expect(content).toBe("node_modules/\n/.claude/\n");
  });
});
