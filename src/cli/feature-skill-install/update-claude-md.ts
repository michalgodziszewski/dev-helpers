import fs from "node:fs";
import path from "node:path";
import type { StatusEntry } from "./types.js";

const SECTION_HEADING = "## Local Context Files";

const SECTION_PROSE =
  "The context/ directory contains personal, ignored workflow state and may not exist in a fresh clone. The feature skill initializes its required local state automatically. Read the following files only when they exist locally:";

export const REFERENCES = [
  "- @context/project-overview.md",
  "- @context/coding-standards.md",
  "- @context/ai-interaction.md",
  "- @context/feature-config.md",
  "- @context/current-feature.md",
];

const FULL_SECTION = [
  SECTION_HEADING,
  "",
  SECTION_PROSE,
  "",
  ...REFERENCES,
].join("\n");

export function updateClaudeMd(
  projectRoot: string,
  createIfMissing: boolean,
): StatusEntry {
  const claudeMdPath = path.join(projectRoot, "CLAUDE.md");

  if (!fs.existsSync(claudeMdPath)) {
    if (!createIfMissing) {
      return { status: "declined", path: "CLAUDE.md", detail: "Creation declined" };
    }
    fs.writeFileSync(claudeMdPath, "# CLAUDE.md\n\n" + FULL_SECTION + "\n", "utf-8");
    return { status: "created", path: "CLAUDE.md" };
  }

  const content = fs.readFileSync(claudeMdPath, "utf-8");

  if (!content.includes(SECTION_HEADING)) {
    const separator = content.endsWith("\n") ? "\n" : "\n\n";
    fs.writeFileSync(claudeMdPath, content + separator + FULL_SECTION + "\n", "utf-8");
    return { status: "created", path: "CLAUDE.md", detail: "Added Local Context Files section" };
  }

  const sectionStart = content.indexOf(SECTION_HEADING);
  const afterHeading = content.slice(sectionStart);
  const nextHeadingMatch = afterHeading.slice(SECTION_HEADING.length).search(/^## /m);
  const sectionEnd =
    nextHeadingMatch === -1
      ? content.length
      : sectionStart + SECTION_HEADING.length + nextHeadingMatch;
  const sectionContent = content.slice(sectionStart, sectionEnd);

  const missingRefs = REFERENCES.filter((ref) => !sectionContent.includes(ref));
  if (missingRefs.length === 0) {
    return { status: "exists", path: "CLAUDE.md", detail: "Local Context Files section complete" };
  }

  const insertPoint = sectionEnd;
  const refsBlock = "\n" + missingRefs.join("\n");
  const before = content.slice(0, insertPoint).trimEnd();
  const after = content.slice(insertPoint);
  const trailingGap = after.length > 0 ? "\n" : "";
  const updated = before + refsBlock + "\n" + trailingGap + after;
  fs.writeFileSync(claudeMdPath, updated, "utf-8");
  return {
    status: "created",
    path: "CLAUDE.md",
    detail: `Added ${missingRefs.length} missing reference(s)`,
  };
}
