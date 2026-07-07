import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { validateSource, installSkill, installSharedSkillContent } from "../../src/cli/feature-skill-install/install-skill.js";

let tmpDir: string;

function createTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "fsi-test-"));
}

function createValidSkillSource(dir: string): void {
  const skillDir = path.join(dir, "source-skill");
  fs.mkdirSync(skillDir, { recursive: true });
  fs.writeFileSync(
    path.join(skillDir, "SKILL.md"),
    "---\nname: feature\ndescription: test\n---\n",
  );
  const actionsDir = path.join(skillDir, "actions");
  fs.mkdirSync(actionsDir);
  fs.writeFileSync(path.join(actionsDir, "load.md"), "# Load\n");
  const assetsDir = path.join(skillDir, "assets");
  fs.mkdirSync(assetsDir);
  fs.writeFileSync(path.join(assetsDir, "template.md"), "# Template\n");
}

beforeEach(() => {
  tmpDir = createTmpDir();
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe("validateSource", () => {
  it("succeeds for a valid source skill", () => {
    createValidSkillSource(tmpDir);
    expect(() => validateSource(path.join(tmpDir, "source-skill"))).not.toThrow();
  });

  it("throws when SKILL.md is missing", () => {
    const emptyDir = path.join(tmpDir, "empty");
    fs.mkdirSync(emptyDir);
    expect(() => validateSource(emptyDir)).toThrow("Packaged feature skill not found");
  });

  it("throws when SKILL.md does not declare name: feature", () => {
    const dir = path.join(tmpDir, "wrong-skill");
    fs.mkdirSync(dir);
    fs.writeFileSync(path.join(dir, "SKILL.md"), "---\nname: other\n---\n");
    expect(() => validateSource(dir)).toThrow("does not declare name: feature");
  });
});

describe("installSkill", () => {
  it("copies the skill when destination is absent", () => {
    createValidSkillSource(tmpDir);
    const src = path.join(tmpDir, "source-skill");
    const dest = path.join(tmpDir, "dest", ".claude", "skills", "feature");

    const result = installSkill(src, dest);

    expect(result.status).toBe("created");
    expect(fs.existsSync(path.join(dest, "SKILL.md"))).toBe(true);
    expect(fs.existsSync(path.join(dest, "actions", "load.md"))).toBe(true);
    expect(fs.existsSync(path.join(dest, "assets", "template.md"))).toBe(true);
  });

  it("reports exists for a valid existing installation", () => {
    createValidSkillSource(tmpDir);
    const src = path.join(tmpDir, "source-skill");
    const dest = path.join(tmpDir, "existing");
    fs.mkdirSync(dest, { recursive: true });
    fs.writeFileSync(
      path.join(dest, "SKILL.md"),
      "---\nname: feature\ndescription: existing\n---\n",
    );

    const result = installSkill(src, dest);

    expect(result.status).toBe("exists");
  });

  it("blocks when destination exists but is not a valid feature skill", () => {
    createValidSkillSource(tmpDir);
    const src = path.join(tmpDir, "source-skill");
    const dest = path.join(tmpDir, "incomplete");
    fs.mkdirSync(dest, { recursive: true });
    fs.writeFileSync(path.join(dest, "README.md"), "# Not a skill\n");

    const result = installSkill(src, dest);

    expect(result.status).toBe("blocked");
  });

  it("blocks when destination has a SKILL.md with wrong name", () => {
    createValidSkillSource(tmpDir);
    const src = path.join(tmpDir, "source-skill");
    const dest = path.join(tmpDir, "unrelated");
    fs.mkdirSync(dest, { recursive: true });
    fs.writeFileSync(path.join(dest, "SKILL.md"), "---\nname: other\n---\n");

    const result = installSkill(src, dest);

    expect(result.status).toBe("blocked");
  });

  it("creates missing parent directories", () => {
    createValidSkillSource(tmpDir);
    const src = path.join(tmpDir, "source-skill");
    const dest = path.join(tmpDir, "deep", "nested", "path", "feature");

    const result = installSkill(src, dest);

    expect(result.status).toBe("created");
    expect(fs.existsSync(path.join(dest, "SKILL.md"))).toBe(true);
  });
});

function createSharedSkillSource(dir: string): string {
  const sharedDir = path.join(dir, "shared-source");
  fs.mkdirSync(path.join(sharedDir, "actions"), { recursive: true });
  fs.mkdirSync(path.join(sharedDir, "docs"), { recursive: true });
  fs.mkdirSync(path.join(sharedDir, "assets"), { recursive: true });
  fs.writeFileSync(path.join(sharedDir, "actions", "load.md"), "# Load\n");
  fs.writeFileSync(path.join(sharedDir, "docs", "README.md"), "# Docs\n");
  fs.writeFileSync(
    path.join(sharedDir, "assets", "current-feature-template.md"),
    "# Template\n",
  );
  return sharedDir;
}

describe("installSharedSkillContent", () => {
  it("copies the shared content when destination is absent", () => {
    const src = createSharedSkillSource(tmpDir);
    const dest = path.join(tmpDir, "dest", "skills", "feature");

    const result = installSharedSkillContent(src, dest);

    expect(result.status).toBe("created");
    expect(fs.existsSync(path.join(dest, "actions", "load.md"))).toBe(true);
    expect(fs.existsSync(path.join(dest, "docs", "README.md"))).toBe(true);
    expect(fs.existsSync(path.join(dest, "assets", "current-feature-template.md"))).toBe(true);
  });

  it("reports exists when destination already looks like valid shared content, without copying again", () => {
    const src = createSharedSkillSource(tmpDir);
    const dest = path.join(tmpDir, "existing", "skills", "feature");
    fs.mkdirSync(path.join(dest, "actions"), { recursive: true });
    fs.mkdirSync(path.join(dest, "docs"), { recursive: true });
    fs.writeFileSync(path.join(dest, "actions", "custom.md"), "unchanged");

    const result = installSharedSkillContent(src, dest);

    expect(result.status).toBe("exists");
    expect(fs.readFileSync(path.join(dest, "actions", "custom.md"), "utf-8")).toBe("unchanged");
    expect(fs.existsSync(path.join(dest, "actions", "load.md"))).toBe(false);
  });

  it("blocks when destination exists but is missing actions/ or docs/", () => {
    const src = createSharedSkillSource(tmpDir);
    const dest = path.join(tmpDir, "incomplete", "skills", "feature");
    fs.mkdirSync(dest, { recursive: true });
    fs.writeFileSync(path.join(dest, "README.md"), "not the shared content");

    const result = installSharedSkillContent(src, dest);

    expect(result.status).toBe("blocked");
  });
});
