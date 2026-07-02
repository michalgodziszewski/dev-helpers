import fs from "node:fs";
import path from "node:path";
import type { StatusEntry, IgnoreDestination } from "./types.js";

const CONTEXT_RULE = "/context/";
const CONTEXT_PATTERNS = ["/context/", "context/", "/context", "context"];

const CLAUDE_RULE = "/.claude/";
const CLAUDE_PATTERNS = ["/.claude/", ".claude/", "/.claude", ".claude"];

const CLAUDE_MD_RULE = "/CLAUDE.md";

type IgnoreFileDestination = Exclude<IgnoreDestination, "track">;

function resolveIgnoreFilePath(projectRoot: string, destination: IgnoreFileDestination): string {
  return destination === "gitignore"
    ? path.join(projectRoot, ".gitignore")
    : path.join(projectRoot, ".git", "info", "exclude");
}

export function ignoreFileLabel(destination: IgnoreFileDestination): string {
  return destination === "gitignore" ? ".gitignore" : ".git/info/exclude";
}

function hasRule(content: string, patterns: readonly string[]): boolean {
  const lines = content.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("#") || trimmed === "") continue;
    if (patterns.includes(trimmed)) return true;
  }
  return false;
}

function appendRule(filePath: string, rule: string): void {
  if (!fs.existsSync(filePath)) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, rule + "\n", "utf-8");
    return;
  }
  const content = fs.readFileSync(filePath, "utf-8");
  const needsNewline = content.length > 0 && !content.endsWith("\n");
  const separator = needsNewline ? "\n" : "";
  fs.writeFileSync(filePath, content + separator + rule + "\n", "utf-8");
}

export function updateGitignore(
  projectRoot: string,
  destination: IgnoreFileDestination = "gitignore",
): StatusEntry {
  const filePath = resolveIgnoreFilePath(projectRoot, destination);
  const label = ignoreFileLabel(destination);

  if (!fs.existsSync(filePath)) {
    appendRule(filePath, CONTEXT_RULE);
    return { status: "created", path: label, detail: `Added ${CONTEXT_RULE}` };
  }

  if (hasRule(fs.readFileSync(filePath, "utf-8"), CONTEXT_PATTERNS)) {
    return { status: "exists", path: label, detail: `${CONTEXT_RULE} already present` };
  }

  appendRule(filePath, CONTEXT_RULE);
  return { status: "created", path: label, detail: `Appended ${CONTEXT_RULE}` };
}

export function hasClaudeRule(
  projectRoot: string,
  destination: IgnoreFileDestination = "gitignore",
): boolean {
  const filePath = resolveIgnoreFilePath(projectRoot, destination);
  if (!fs.existsSync(filePath)) return false;
  return hasRule(fs.readFileSync(filePath, "utf-8"), CLAUDE_PATTERNS);
}

/** Checks both destinations so a rule set on a previous install run is never re-prompted for. */
export function findClaudeIgnoreDestination(projectRoot: string): IgnoreFileDestination | null {
  if (hasClaudeRule(projectRoot, "gitignore")) return "gitignore";
  if (hasClaudeRule(projectRoot, "exclude")) return "exclude";
  return null;
}

export function addClaudeRule(
  projectRoot: string,
  destination: IgnoreFileDestination = "gitignore",
): StatusEntry {
  const filePath = resolveIgnoreFilePath(projectRoot, destination);
  const label = ignoreFileLabel(destination);
  appendRule(filePath, CLAUDE_RULE);
  return { status: "created", path: label, detail: `Appended ${CLAUDE_RULE}` };
}

export function addClaudeMdIgnoreRule(
  projectRoot: string,
  destination: IgnoreFileDestination,
): StatusEntry {
  const filePath = resolveIgnoreFilePath(projectRoot, destination);
  const label = ignoreFileLabel(destination);
  appendRule(filePath, CLAUDE_MD_RULE);
  return { status: "created", path: label, detail: `Appended ${CLAUDE_MD_RULE}` };
}
