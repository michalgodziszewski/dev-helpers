import fs from "node:fs";
import path from "node:path";
import type { StatusEntry } from "./types.js";
import type { CodingStandardsChoice } from "./prompts.js";

const REQUIRED_DIRS = ["context", "context/features", "context/fixes", "context/screenshots"];

const ASSET_TO_TARGET: ReadonlyArray<{ asset: string; target: string }> = [
  { asset: "ai-interaction-template.md", target: "context/ai-interaction.md" },
  { asset: "current-feature-template.md", target: "context/current-feature.md" },
  { asset: "feature-config-template.md", target: "context/feature-config.md" },
  { asset: "feature-spec-template.md", target: "context/feature-spec.md" },
  { asset: "project-overview-template.md", target: "context/project-overview.md" },
];

export function createContextDirs(projectRoot: string): StatusEntry[] {
  const entries: StatusEntry[] = [];
  for (const dir of REQUIRED_DIRS) {
    const fullPath = path.join(projectRoot, dir);
    if (fs.existsSync(fullPath)) {
      const stat = fs.statSync(fullPath);
      if (!stat.isDirectory()) {
        entries.push({
          status: "blocked",
          path: dir,
          detail: "Path exists but is not a directory",
        });
        continue;
      }
      entries.push({ status: "exists", path: dir });
    } else {
      fs.mkdirSync(fullPath, { recursive: true });
      entries.push({ status: "created", path: dir });
    }
  }
  return entries;
}

export function copyContextFiles(
  projectRoot: string,
  assetsDir: string,
): StatusEntry[] {
  const entries: StatusEntry[] = [];
  for (const { asset, target } of ASSET_TO_TARGET) {
    const targetPath = path.join(projectRoot, target);
    const assetPath = path.join(assetsDir, asset);

    if (fs.existsSync(targetPath)) {
      const stat = fs.statSync(targetPath);
      if (!stat.isFile()) {
        entries.push({
          status: "blocked",
          path: target,
          detail: "Path exists but is not a file",
        });
        continue;
      }
      entries.push({ status: "exists", path: target });
    } else if (!fs.existsSync(assetPath)) {
      entries.push({
        status: "blocked",
        path: target,
        detail: `Source asset missing: ${asset}`,
      });
    } else {
      fs.copyFileSync(assetPath, targetPath);
      entries.push({ status: "copied", path: target });
    }
  }
  return entries;
}

export function discoverCodingStandards(assetsDir: string): CodingStandardsChoice[] {
  const pattern = /^coding-standards-(.+)-template\.md$/;
  const choices: CodingStandardsChoice[] = [];

  for (const file of fs.readdirSync(assetsDir)) {
    const match = pattern.exec(file);
    if (match) {
      const stack = match[1];
      const label = stack
        .replace(/-/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase())
        .replace(/js\b/gi, ".js");
      choices.push({ label, assetFilename: file });
    }
  }

  choices.sort((a, b) => a.label.localeCompare(b.label));
  return choices;
}

export function applyCodingStandards(
  projectRoot: string,
  assetsDir: string,
  choice: CodingStandardsChoice,
): StatusEntry {
  const targetPath = path.join(projectRoot, "context", "coding-standards.md");

  if (choice.assetFilename === null) {
    fs.writeFileSync(targetPath, "", "utf-8");
    return { status: "created", path: "context/coding-standards.md", detail: "Empty file" };
  }

  const assetPath = path.join(assetsDir, choice.assetFilename);
  fs.copyFileSync(assetPath, targetPath);
  return {
    status: "copied",
    path: "context/coding-standards.md",
    detail: choice.label,
  };
}
