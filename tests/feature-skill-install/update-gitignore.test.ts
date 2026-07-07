import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import {
  updateGitignore,
  hasClaudeRule,
  addClaudeRule,
  findClaudeIgnoreDestination,
  addClaudeMdIgnoreRule,
  hasKiroRule,
  addKiroRule,
  findKiroIgnoreDestination,
  hasSkillsRule,
  addSkillsRule,
  findSkillsIgnoreDestination,
  ignoreFileLabel,
} from "../../src/cli/feature-skill-install/update-gitignore.js";

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

describe("exclude destination", () => {
  it("writes /context/ to .git/info/exclude instead of .gitignore", () => {
    const entry = updateGitignore(tmpDir, "exclude");

    expect(entry.status).toBe("created");
    expect(entry.path).toBe(".git/info/exclude");
    expect(fs.existsSync(path.join(tmpDir, ".gitignore"))).toBe(false);
    const content = fs.readFileSync(path.join(tmpDir, ".git", "info", "exclude"), "utf-8");
    expect(content).toBe("/context/\n");
  });

  it("creates the .git/info directory when absent", () => {
    updateGitignore(tmpDir, "exclude");
    expect(fs.existsSync(path.join(tmpDir, ".git", "info"))).toBe(true);
  });

  it("does not duplicate /context/ in .git/info/exclude", () => {
    updateGitignore(tmpDir, "exclude");
    const entry = updateGitignore(tmpDir, "exclude");
    expect(entry.status).toBe("exists");
  });

  it("hasClaudeRule checks .git/info/exclude when destination is exclude", () => {
    expect(hasClaudeRule(tmpDir, "exclude")).toBe(false);
    addClaudeRule(tmpDir, "exclude");
    expect(hasClaudeRule(tmpDir, "exclude")).toBe(true);
    expect(hasClaudeRule(tmpDir, "gitignore")).toBe(false);
  });

  it("addClaudeRule writes to .git/info/exclude and reports its path", () => {
    const entry = addClaudeRule(tmpDir, "exclude");
    expect(entry.path).toBe(".git/info/exclude");
    const content = fs.readFileSync(path.join(tmpDir, ".git", "info", "exclude"), "utf-8");
    expect(content).toBe("/.claude/\n");
  });
});

describe("hasKiroRule", () => {
  it("returns false when .gitignore is missing", () => {
    expect(hasKiroRule(tmpDir)).toBe(false);
  });

  it("returns false when .kiro is not ignored", () => {
    fs.writeFileSync(path.join(tmpDir, ".gitignore"), "node_modules/\n/context/\n");
    expect(hasKiroRule(tmpDir)).toBe(false);
  });

  it("detects /.kiro/ and pattern variants", () => {
    for (const rule of ["/.kiro/", ".kiro/", "/.kiro", ".kiro"]) {
      fs.writeFileSync(path.join(tmpDir, ".gitignore"), `${rule}\n`);
      expect(hasKiroRule(tmpDir)).toBe(true);
    }
  });

  it("ignores commented lines", () => {
    fs.writeFileSync(path.join(tmpDir, ".gitignore"), "# .kiro/\n");
    expect(hasKiroRule(tmpDir)).toBe(false);
  });
});

describe("addKiroRule", () => {
  it("creates .gitignore with /.kiro/ when missing", () => {
    const entry = addKiroRule(tmpDir);

    expect(entry.status).toBe("created");
    const content = fs.readFileSync(path.join(tmpDir, ".gitignore"), "utf-8");
    expect(content).toBe("/.kiro/\n");
  });

  it("appends /.kiro/ preserving existing rules", () => {
    fs.writeFileSync(path.join(tmpDir, ".gitignore"), "node_modules/\n/context/\n");
    const entry = addKiroRule(tmpDir);

    expect(entry.status).toBe("created");
    const content = fs.readFileSync(path.join(tmpDir, ".gitignore"), "utf-8");
    expect(content).toBe("node_modules/\n/context/\n/.kiro/\n");
    expect(hasKiroRule(tmpDir)).toBe(true);
  });

  it("writes to .git/info/exclude and reports its path", () => {
    const entry = addKiroRule(tmpDir, "exclude");
    expect(entry.path).toBe(".git/info/exclude");
    const content = fs.readFileSync(path.join(tmpDir, ".git", "info", "exclude"), "utf-8");
    expect(content).toBe("/.kiro/\n");
  });
});

describe("findKiroIgnoreDestination", () => {
  it("returns null when no rule exists anywhere", () => {
    expect(findKiroIgnoreDestination(tmpDir)).toBeNull();
  });

  it("finds a rule already present in .gitignore", () => {
    addKiroRule(tmpDir, "gitignore");
    expect(findKiroIgnoreDestination(tmpDir)).toBe("gitignore");
  });

  it("finds a rule already present in .git/info/exclude", () => {
    addKiroRule(tmpDir, "exclude");
    expect(findKiroIgnoreDestination(tmpDir)).toBe("exclude");
  });

  it("does not confuse the Claude rule with the Kiro rule", () => {
    addClaudeRule(tmpDir, "gitignore");
    expect(findKiroIgnoreDestination(tmpDir)).toBeNull();
  });
});

describe("hasSkillsRule / addSkillsRule / findSkillsIgnoreDestination", () => {
  it("returns false/null when no rule exists anywhere", () => {
    expect(hasSkillsRule(tmpDir)).toBe(false);
    expect(findSkillsIgnoreDestination(tmpDir)).toBeNull();
  });

  it("creates .gitignore with /skills/ when missing", () => {
    const entry = addSkillsRule(tmpDir);

    expect(entry.status).toBe("created");
    const content = fs.readFileSync(path.join(tmpDir, ".gitignore"), "utf-8");
    expect(content).toBe("/skills/\n");
    expect(hasSkillsRule(tmpDir)).toBe(true);
    expect(findSkillsIgnoreDestination(tmpDir)).toBe("gitignore");
  });

  it("detects /skills/ and pattern variants", () => {
    for (const rule of ["/skills/", "skills/", "/skills", "skills"]) {
      fs.writeFileSync(path.join(tmpDir, ".gitignore"), `${rule}\n`);
      expect(hasSkillsRule(tmpDir)).toBe(true);
    }
  });

  it("writes to .git/info/exclude and reports its path", () => {
    const entry = addSkillsRule(tmpDir, "exclude");
    expect(entry.path).toBe(".git/info/exclude");
    expect(findSkillsIgnoreDestination(tmpDir)).toBe("exclude");
  });

  it("does not confuse the Claude or Kiro rule with the skills rule", () => {
    addClaudeRule(tmpDir, "gitignore");
    addKiroRule(tmpDir, "gitignore");
    expect(findSkillsIgnoreDestination(tmpDir)).toBeNull();
  });
});

describe("findClaudeIgnoreDestination", () => {
  it("returns null when no rule exists anywhere", () => {
    expect(findClaudeIgnoreDestination(tmpDir)).toBeNull();
  });

  it("finds a rule already present in .gitignore", () => {
    addClaudeRule(tmpDir, "gitignore");
    expect(findClaudeIgnoreDestination(tmpDir)).toBe("gitignore");
  });

  it("finds a rule already present in .git/info/exclude", () => {
    addClaudeRule(tmpDir, "exclude");
    expect(findClaudeIgnoreDestination(tmpDir)).toBe("exclude");
  });
});

describe("addClaudeMdIgnoreRule", () => {
  it("appends /CLAUDE.md to .gitignore", () => {
    const entry = addClaudeMdIgnoreRule(tmpDir, "gitignore");
    expect(entry.path).toBe(".gitignore");
    const content = fs.readFileSync(path.join(tmpDir, ".gitignore"), "utf-8");
    expect(content).toBe("/CLAUDE.md\n");
  });

  it("appends /CLAUDE.md to .git/info/exclude", () => {
    const entry = addClaudeMdIgnoreRule(tmpDir, "exclude");
    expect(entry.path).toBe(".git/info/exclude");
    const content = fs.readFileSync(path.join(tmpDir, ".git", "info", "exclude"), "utf-8");
    expect(content).toBe("/CLAUDE.md\n");
  });
});

describe("ignoreFileLabel", () => {
  it("labels gitignore and exclude destinations", () => {
    expect(ignoreFileLabel("gitignore")).toBe(".gitignore");
    expect(ignoreFileLabel("exclude")).toBe(".git/info/exclude");
  });
});
