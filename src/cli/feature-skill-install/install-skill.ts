import fs from "node:fs";
import path from "node:path";
import type { StatusEntry } from "./types.js";

function isValidFeatureSkill(dir: string): boolean {
  const skillMdPath = path.join(dir, "SKILL.md");
  if (!fs.existsSync(skillMdPath)) return false;
  const content = fs.readFileSync(skillMdPath, "utf-8");
  return /^name:\s*feature\s*$/m.test(content);
}

function copyDirRecursive(src: string, dest: string): void {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

export function validateSource(sourcePath: string): void {
  const skillMd = path.join(sourcePath, "SKILL.md");
  if (!fs.existsSync(skillMd)) {
    throw new Error(
      `Packaged feature skill not found. Expected SKILL.md at: ${sourcePath}`,
    );
  }
  if (!isValidFeatureSkill(sourcePath)) {
    throw new Error(
      `Source SKILL.md does not declare name: feature at: ${sourcePath}`,
    );
  }
}

export function installSkill(
  sourcePath: string,
  destinationPath: string,
): StatusEntry {
  if (fs.existsSync(destinationPath)) {
    if (isValidFeatureSkill(destinationPath)) {
      return {
        status: "exists",
        path: destinationPath,
        detail: "Feature skill is already installed",
      };
    }
    return {
      status: "blocked",
      path: destinationPath,
      detail:
        "Directory exists but is not a valid feature skill (missing or invalid SKILL.md)",
    };
  }

  copyDirRecursive(sourcePath, destinationPath);
  return {
    status: "created",
    path: destinationPath,
    detail: "Feature skill installed",
  };
}
