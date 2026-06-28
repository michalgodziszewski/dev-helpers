import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  mkdtempSync,
  rmSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  existsSync,
} from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { generate, check } from "../../src/cli/docs/generate-command-docs.js";
import { GENERATED_MARKER } from "../../src/cli/docs/render-command-markdown.js";

function createTempProject(version = "1.0.0"): string {
  const dir = mkdtempSync(join(tmpdir(), "docs-test-"));
  writeFileSync(
    join(dir, "package.json"),
    JSON.stringify({ version }),
    "utf8",
  );
  return dir;
}

describe("generate", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = createTempProject();
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it("creates docs/commands/ directory and files", () => {
    const result = generate(tmpDir);
    expect(result.written.length).toBeGreaterThan(0);
    expect(existsSync(join(tmpDir, "docs", "commands", "README.md"))).toBe(true);
    expect(existsSync(join(tmpDir, "docs", "commands", "start.md"))).toBe(true);
  });

  it("generated files start with marker", () => {
    generate(tmpDir);
    const readme = readFileSync(join(tmpDir, "docs", "commands", "README.md"), "utf8");
    const start = readFileSync(join(tmpDir, "docs", "commands", "start.md"), "utf8");
    expect(readme.startsWith(GENERATED_MARKER)).toBe(true);
    expect(start.startsWith(GENERATED_MARKER)).toBe(true);
  });

  it("includes package version", () => {
    generate(tmpDir);
    const readme = readFileSync(join(tmpDir, "docs", "commands", "README.md"), "utf8");
    expect(readme).toContain("Version: 1.0.0");
  });

  it("is idempotent — second run produces identical content", () => {
    generate(tmpDir);
    const firstReadme = readFileSync(join(tmpDir, "docs", "commands", "README.md"), "utf8");
    const firstStart = readFileSync(join(tmpDir, "docs", "commands", "start.md"), "utf8");

    generate(tmpDir);
    const secondReadme = readFileSync(join(tmpDir, "docs", "commands", "README.md"), "utf8");
    const secondStart = readFileSync(join(tmpDir, "docs", "commands", "start.md"), "utf8");

    expect(firstReadme).toBe(secondReadme);
    expect(firstStart).toBe(secondStart);
  });

  it("refuses to overwrite a file without the generated marker", () => {
    mkdirSync(join(tmpDir, "docs", "commands"), { recursive: true });
    writeFileSync(join(tmpDir, "docs", "commands", "start.md"), "# Manual docs\n");
    expect(() => generate(tmpDir)).toThrow(/does not carry the generated-file marker/);
  });

  it("removes obsolete generated files", () => {
    mkdirSync(join(tmpDir, "docs", "commands"), { recursive: true });
    const obsoletePath = join(tmpDir, "docs", "commands", "old-command.md");
    writeFileSync(obsoletePath, `${GENERATED_MARKER}\n# Old\n`);

    const result = generate(tmpDir);
    expect(result.removed).toContain(obsoletePath);
    expect(existsSync(obsoletePath)).toBe(false);
  });

  it("does not remove non-generated manual files", () => {
    mkdirSync(join(tmpDir, "docs", "commands"), { recursive: true });
    const manualPath = join(tmpDir, "docs", "commands", "manual-guide.md");
    writeFileSync(manualPath, "# Manual Guide\n");

    generate(tmpDir);
    expect(existsSync(manualPath)).toBe(true);
  });
});

describe("check", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = createTempProject();
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it("passes after generation", () => {
    generate(tmpDir);
    const result = check(tmpDir);
    expect(result.ok).toBe(true);
    expect(result.missing).toHaveLength(0);
    expect(result.stale).toHaveLength(0);
  });

  it("fails when files are missing", () => {
    const result = check(tmpDir);
    expect(result.ok).toBe(false);
    expect(result.missing.length).toBeGreaterThan(0);
  });

  it("fails when content is stale", () => {
    generate(tmpDir);
    const startPath = join(tmpDir, "docs", "commands", "start.md");
    writeFileSync(startPath, `${GENERATED_MARKER}\n# Tampered\n`);

    const result = check(tmpDir);
    expect(result.ok).toBe(false);
    expect(result.stale).toContain(startPath);
  });

  it("does not modify any files", () => {
    generate(tmpDir);
    const readmeBefore = readFileSync(join(tmpDir, "docs", "commands", "README.md"), "utf8");
    const startBefore = readFileSync(join(tmpDir, "docs", "commands", "start.md"), "utf8");

    check(tmpDir);

    const readmeAfter = readFileSync(join(tmpDir, "docs", "commands", "README.md"), "utf8");
    const startAfter = readFileSync(join(tmpDir, "docs", "commands", "start.md"), "utf8");

    expect(readmeAfter).toBe(readmeBefore);
    expect(startAfter).toBe(startBefore);
  });
});
