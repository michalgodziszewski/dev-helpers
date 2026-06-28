import os from "node:os";
import path from "node:path";
import fs from "node:fs";
import { CliError } from "../utils/errors.js";
import { getCommand } from "../command-registry.js";
import { renderCommandHelp } from "../help/render-help.js";
import { resolveSourceSkillPath, resolveDestinationPath } from "../feature-skill-install/paths.js";
import { validateSource, installSkill } from "../feature-skill-install/install-skill.js";
import { promptSkillScope, promptCodingStandards, promptCreateClaudeMd } from "../feature-skill-install/prompts.js";
import { createContextDirs, copyContextFiles, discoverCodingStandards, applyCodingStandards } from "../feature-skill-install/initialize-context.js";
import { updateGitignore } from "../feature-skill-install/update-gitignore.js";
import { updateClaudeMd } from "../feature-skill-install/update-claude-md.js";
import { renderSummary } from "../feature-skill-install/installation-summary.js";
import type { StatusEntry, InstallResult, SkillScope } from "../feature-skill-install/types.js";

export async function run(args: string[]): Promise<void> {
  if (args.includes("--help") || args.includes("-h")) {
    const cmd = getCommand("feature-skill-install");
    console.log(cmd ? renderCommandHelp(cmd) : "Usage: dev feature-skill-install");
    return;
  }

  const projectRoot = process.cwd();
  const homeDir = os.homedir();

  // 1. Resolve and validate the packaged source skill
  const sourcePath = resolveSourceSkillPath();
  try {
    validateSource(sourcePath);
  } catch (err) {
    throw new CliError((err as Error).message);
  }

  // 2. Ask for the skill destination
  const scope: SkillScope = await promptSkillScope();
  const destinationPath = resolveDestinationPath(scope, projectRoot, homeDir);

  // 3. Copy the skill or report existing
  const entries: StatusEntry[] = [];
  const skillEntry = installSkill(sourcePath, destinationPath);
  entries.push(skillEntry);

  if (skillEntry.status === "blocked") {
    console.log(renderSummary({
      skillScope: scope,
      skillDestination: destinationPath,
      entries,
      codingStandards: null,
      incomplete: true,
    }));
    throw new CliError(`[blocked] ${destinationPath} exists but is not a valid feature skill`);
  }

  // 4. Check whether CLAUDE.md exists and resolve create/skip choice
  const claudeMdPath = path.join(projectRoot, "CLAUDE.md");
  const claudeMdExists = fs.existsSync(claudeMdPath);
  let createClaudeMd = claudeMdExists;
  if (!claudeMdExists) {
    createClaudeMd = await promptCreateClaudeMd();
  }

  // 5. Create or verify context directories
  entries.push(...createContextDirs(projectRoot));

  // 6. Copy or verify non-coding context files
  const assetsDir = path.join(sourcePath, "assets");
  entries.push(...copyContextFiles(projectRoot, assetsDir));

  // 7. Resolve coding standards only when missing
  let codingStandardsStatus: string | null = null;
  const codingStandardsPath = path.join(projectRoot, "context", "coding-standards.md");
  if (fs.existsSync(codingStandardsPath)) {
    entries.push({ status: "exists", path: "context/coding-standards.md" });
    codingStandardsStatus = "exists";
  } else {
    const choices = discoverCodingStandards(assetsDir);
    const choice = await promptCodingStandards(choices);
    if (choice === null) {
      entries.push({ status: "skipped", path: "context/coding-standards.md", detail: "Selection cancelled" });
      codingStandardsStatus = "cancelled";
    } else {
      const csEntry = applyCodingStandards(projectRoot, assetsDir, choice);
      entries.push(csEntry);
      codingStandardsStatus = choice.label;
    }
  }

  // 8. Ensure .gitignore ignores /context/
  entries.push(updateGitignore(projectRoot));

  // 9. Create or update CLAUDE.md
  entries.push(updateClaudeMd(projectRoot, createClaudeMd));

  // 10. Print the final summary
  const incomplete = entries.some(
    (e) => e.status === "blocked" || e.status === "skipped",
  );

  const result: InstallResult = {
    skillScope: scope,
    skillDestination: destinationPath,
    entries,
    codingStandards: codingStandardsStatus,
    incomplete,
  };

  console.log(renderSummary(result));
}
