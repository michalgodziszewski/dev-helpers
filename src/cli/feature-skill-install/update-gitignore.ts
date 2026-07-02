import fs from "node:fs";
import path from "node:path";
import type { StatusEntry } from "./types.js";

const CONTEXT_RULE = "/context/";
const CONTEXT_PATTERNS = ["/context/", "context/", "/context", "context"];

const CLAUDE_RULE = "/.claude/";
const CLAUDE_PATTERNS = ["/.claude/", ".claude/", "/.claude", ".claude"];

function hasRule(content: string, patterns: readonly string[]): boolean {
  const lines = content.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("#") || trimmed === "") continue;
    if (patterns.includes(trimmed)) return true;
  }
  return false;
}

function appendRule(gitignorePath: string, rule: string): void {
  if (!fs.existsSync(gitignorePath)) {
    fs.writeFileSync(gitignorePath, rule + "\n", "utf-8");
    return;
  }
  const content = fs.readFileSync(gitignorePath, "utf-8");
  const needsNewline = content.length > 0 && !content.endsWith("\n");
  const separator = needsNewline ? "\n" : "";
  fs.writeFileSync(gitignorePath, content + separator + rule + "\n", "utf-8");
}

export function updateGitignore(projectRoot: string): StatusEntry {
  const gitignorePath = path.join(projectRoot, ".gitignore");

  if (!fs.existsSync(gitignorePath)) {
    appendRule(gitignorePath, CONTEXT_RULE);
    return { status: "created", path: ".gitignore", detail: `Added ${CONTEXT_RULE}` };
  }

  if (hasRule(fs.readFileSync(gitignorePath, "utf-8"), CONTEXT_PATTERNS)) {
    return { status: "exists", path: ".gitignore", detail: `${CONTEXT_RULE} already present` };
  }

  appendRule(gitignorePath, CONTEXT_RULE);
  return { status: "created", path: ".gitignore", detail: `Appended ${CONTEXT_RULE}` };
}

export function hasClaudeRule(projectRoot: string): boolean {
  const gitignorePath = path.join(projectRoot, ".gitignore");
  if (!fs.existsSync(gitignorePath)) return false;
  return hasRule(fs.readFileSync(gitignorePath, "utf-8"), CLAUDE_PATTERNS);
}

export function addClaudeRule(projectRoot: string): StatusEntry {
  const gitignorePath = path.join(projectRoot, ".gitignore");
  appendRule(gitignorePath, CLAUDE_RULE);
  return { status: "created", path: ".gitignore", detail: `Appended ${CLAUDE_RULE}` };
}
