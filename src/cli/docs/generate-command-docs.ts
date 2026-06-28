import {
  readFileSync,
  writeFileSync,
  existsSync,
  readdirSync,
  unlinkSync,
  mkdirSync,
} from "node:fs";
import { join } from "node:path";
import { getAllCommands } from "../command-registry.js";
import {
  renderCommandMarkdown,
  renderCommandIndex,
  GENERATED_MARKER,
} from "./render-command-markdown.js";

interface GeneratedFile {
  path: string;
  content: string;
}

function hasGeneratedMarker(filePath: string): boolean {
  if (!existsSync(filePath)) return false;
  const content = readFileSync(filePath, "utf8");
  return content.startsWith(GENERATED_MARKER);
}

function readVersion(rootDir: string): string {
  const pkg = JSON.parse(readFileSync(join(rootDir, "package.json"), "utf8"));
  return pkg.version as string;
}

export function computeExpectedFiles(rootDir: string): GeneratedFile[] {
  const version = readVersion(rootDir);
  const commands = getAllCommands();
  const docsDir = join(rootDir, "docs", "commands");
  const files: GeneratedFile[] = [];

  files.push({
    path: join(docsDir, "README.md"),
    content: renderCommandIndex(commands, version),
  });

  for (const cmd of commands) {
    files.push({
      path: join(docsDir, `${cmd.name}.md`),
      content: renderCommandMarkdown(cmd, version),
    });
  }

  return files;
}

function findObsoleteFiles(
  docsDir: string,
  expectedPaths: Set<string>,
): string[] {
  if (!existsSync(docsDir)) return [];

  return readdirSync(docsDir)
    .filter((f) => f.endsWith(".md"))
    .map((f) => join(docsDir, f))
    .filter((p) => !expectedPaths.has(p) && hasGeneratedMarker(p));
}

export interface GenerateResult {
  written: string[];
  removed: string[];
}

export function generate(rootDir: string): GenerateResult {
  const expected = computeExpectedFiles(rootDir);
  const expectedPaths = new Set(expected.map((f) => f.path));
  const docsDir = join(rootDir, "docs", "commands");
  const result: GenerateResult = { written: [], removed: [] };

  // Validate all content before writing
  for (const file of expected) {
    if (existsSync(file.path) && !hasGeneratedMarker(file.path)) {
      throw new Error(
        `Refusing to overwrite "${file.path}" — it does not carry the generated-file marker.`,
      );
    }
  }

  // Create directory if needed
  mkdirSync(docsDir, { recursive: true });

  // Write all files
  for (const file of expected) {
    writeFileSync(file.path, file.content, "utf8");
    result.written.push(file.path);
  }

  // Remove obsolete generated files
  const obsolete = findObsoleteFiles(docsDir, expectedPaths);
  for (const path of obsolete) {
    unlinkSync(path);
    result.removed.push(path);
  }

  return result;
}

export interface CheckResult {
  ok: boolean;
  stale: string[];
  missing: string[];
}

export function check(rootDir: string): CheckResult {
  const expected = computeExpectedFiles(rootDir);
  const result: CheckResult = { ok: true, stale: [], missing: [] };

  for (const file of expected) {
    if (!existsSync(file.path)) {
      result.ok = false;
      result.missing.push(file.path);
      continue;
    }
    const actual = readFileSync(file.path, "utf8");
    if (actual !== file.content) {
      result.ok = false;
      result.stale.push(file.path);
    }
  }

  return result;
}
