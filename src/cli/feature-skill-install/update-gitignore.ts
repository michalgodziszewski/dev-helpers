import fs from "node:fs";
import path from "node:path";
import type { StatusEntry } from "./types.js";

const CONTEXT_RULE = "/context/";
const COMPATIBLE_PATTERNS = ["/context/", "context/", "/context", "context"];

function hasContextRule(content: string): boolean {
  const lines = content.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("#") || trimmed === "") continue;
    if (COMPATIBLE_PATTERNS.includes(trimmed)) return true;
  }
  return false;
}

export function updateGitignore(projectRoot: string): StatusEntry {
  const gitignorePath = path.join(projectRoot, ".gitignore");

  if (!fs.existsSync(gitignorePath)) {
    fs.writeFileSync(gitignorePath, CONTEXT_RULE + "\n", "utf-8");
    return { status: "created", path: ".gitignore", detail: `Added ${CONTEXT_RULE}` };
  }

  const content = fs.readFileSync(gitignorePath, "utf-8");

  if (hasContextRule(content)) {
    return { status: "exists", path: ".gitignore", detail: `${CONTEXT_RULE} already present` };
  }

  const needsNewline = content.length > 0 && !content.endsWith("\n");
  const separator = needsNewline ? "\n" : "";
  fs.writeFileSync(gitignorePath, content + separator + CONTEXT_RULE + "\n", "utf-8");
  return { status: "created", path: ".gitignore", detail: `Appended ${CONTEXT_RULE}` };
}
