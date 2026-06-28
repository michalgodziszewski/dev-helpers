import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { updateClaudeMd } from "../../src/cli/feature-skill-install/update-claude-md.js";

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "fsi-cmd-"));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe("updateClaudeMd", () => {
  it("creates CLAUDE.md with section when missing and authorized", () => {
    const entry = updateClaudeMd(tmpDir, true);

    expect(entry.status).toBe("created");
    const content = fs.readFileSync(path.join(tmpDir, "CLAUDE.md"), "utf-8");
    expect(content).toContain("## Local Context Files");
    expect(content).toContain("@context/project-overview.md");
    expect(content).toContain("@context/coding-standards.md");
    expect(content).toContain("@context/ai-interaction.md");
    expect(content).toContain("@context/feature-config.md");
    expect(content).toContain("@context/current-feature.md");
  });

  it("skips creation when declined", () => {
    const entry = updateClaudeMd(tmpDir, false);

    expect(entry.status).toBe("skipped");
    expect(fs.existsSync(path.join(tmpDir, "CLAUDE.md"))).toBe(false);
  });

  it("appends section to existing file without the section", () => {
    fs.writeFileSync(
      path.join(tmpDir, "CLAUDE.md"),
      "# CLAUDE.md\n\n## Other Section\n\nContent here.\n",
    );
    const entry = updateClaudeMd(tmpDir, true);

    expect(entry.status).toBe("created");
    expect(entry.detail).toContain("Added Local Context Files section");
    const content = fs.readFileSync(path.join(tmpDir, "CLAUDE.md"), "utf-8");
    expect(content).toContain("## Other Section");
    expect(content).toContain("## Local Context Files");
  });

  it("reports exists when section is already complete", () => {
    const fullContent =
      "# CLAUDE.md\n\n## Local Context Files\n\n" +
      "The context/ directory contains personal, ignored workflow state and may not exist in a fresh clone. " +
      "The feature skill initializes its required local state automatically. " +
      "Read the following files only when they exist locally:\n\n" +
      "- @context/project-overview.md\n" +
      "- @context/coding-standards.md\n" +
      "- @context/ai-interaction.md\n" +
      "- @context/feature-config.md\n" +
      "- @context/current-feature.md\n";
    fs.writeFileSync(path.join(tmpDir, "CLAUDE.md"), fullContent);

    const entry = updateClaudeMd(tmpDir, true);

    expect(entry.status).toBe("exists");
    const afterContent = fs.readFileSync(path.join(tmpDir, "CLAUDE.md"), "utf-8");
    expect(afterContent).toBe(fullContent);
  });

  it("adds missing references to partial section", () => {
    const partialContent =
      "# CLAUDE.md\n\n## Local Context Files\n\n" +
      "- @context/project-overview.md\n" +
      "- @context/coding-standards.md\n";
    fs.writeFileSync(path.join(tmpDir, "CLAUDE.md"), partialContent);

    const entry = updateClaudeMd(tmpDir, true);

    expect(entry.status).toBe("created");
    expect(entry.detail).toContain("3 missing reference(s)");
    const content = fs.readFileSync(path.join(tmpDir, "CLAUDE.md"), "utf-8");
    expect(content).toContain("@context/ai-interaction.md");
    expect(content).toContain("@context/feature-config.md");
    expect(content).toContain("@context/current-feature.md");
  });

  it("preserves other headings and prose", () => {
    const existing =
      "# My Project\n\nSome description.\n\n## Build\n\nRun `npm build`.\n";
    fs.writeFileSync(path.join(tmpDir, "CLAUDE.md"), existing);

    updateClaudeMd(tmpDir, true);
    const content = fs.readFileSync(path.join(tmpDir, "CLAUDE.md"), "utf-8");
    expect(content).toContain("# My Project");
    expect(content).toContain("Some description.");
    expect(content).toContain("## Build");
    expect(content).toContain("Run `npm build`.");
  });

  it("does not duplicate on repeated execution", () => {
    updateClaudeMd(tmpDir, true);
    const first = fs.readFileSync(path.join(tmpDir, "CLAUDE.md"), "utf-8");
    updateClaudeMd(tmpDir, true);
    const second = fs.readFileSync(path.join(tmpDir, "CLAUDE.md"), "utf-8");
    expect(second).toBe(first);
  });
});
