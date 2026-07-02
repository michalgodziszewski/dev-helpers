import os from "node:os";
import path from "node:path";
import fs from "node:fs";
import { CliError } from "../utils/errors.js";
import { getCommand } from "../command-registry.js";
import { renderCommandHelp } from "../help/render-help.js";
import { resolveSourceSkillPath, resolveRootAssetsPath, resolveSubagentsPath, resolveSourceSettingsPath, resolveDestinationPath } from "../feature-skill-install/paths.js";
import { validateSource, installSkill } from "../feature-skill-install/install-skill.js";
import { promptSkillScope, promptCodingStandards, promptCodeReviewStack, promptCreateClaudeMd, promptIgnoreClaudeDir, promptModelOverride } from "../feature-skill-install/prompts.js";
import { createContextDirs, copyContextFiles, discoverCodingStandards, applyCodingStandards } from "../feature-skill-install/initialize-context.js";
import { discoverCodeReviewStacks, installSubagents } from "../feature-skill-install/install-subagents.js";
import type { SubagentStackChoice } from "../feature-skill-install/install-subagents.js";
import { resolveInstallerModelOverride, upsertActiveProfile, DEFAULT_PROFILE_NAME, DEFAULT_PROFILE } from "../feature-skill-install/model-profiles.js";
import type { ModelOverride } from "../feature-skill-install/model-override.js";
import { installSettings } from "../feature-skill-install/install-settings.js";
import { updateGitignore, hasClaudeRule, addClaudeRule } from "../feature-skill-install/update-gitignore.js";
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
  const rootAssetsDir = resolveRootAssetsPath();
  const skillAssetsDir = path.join(sourcePath, "assets");
  entries.push(...copyContextFiles(projectRoot, rootAssetsDir, skillAssetsDir));

  // 7. Resolve coding standards only when missing
  let codingStandardsStatus: string | null = null;
  const codingStandardsPath = path.join(projectRoot, "context", "coding-standards.md");
  if (fs.existsSync(codingStandardsPath)) {
    entries.push({ status: "exists", path: "context/coding-standards.md" });
    codingStandardsStatus = "exists";
  } else {
    const choices = discoverCodingStandards(rootAssetsDir);
    const choice = await promptCodingStandards(choices);
    if (choice === null) {
      entries.push({ status: "skipped", path: "context/coding-standards.md", detail: "Selection cancelled" });
      codingStandardsStatus = "cancelled";
    } else {
      const csEntry = applyCodingStandards(projectRoot, rootAssetsDir, choice);
      entries.push(csEntry);
      codingStandardsStatus = choice.label;
    }
  }

  // 8. Install subagents into the project's .claude/agents/
  const subagentsDir = resolveSubagentsPath();
  const codeReviewPath = path.join(projectRoot, ".claude", "agents", "code-review.md");
  let codeReviewChoice: SubagentStackChoice | null = null;
  if (!fs.existsSync(codeReviewPath)) {
    const stacks = discoverCodeReviewStacks(subagentsDir);
    if (stacks.length > 0) {
      codeReviewChoice = await promptCodeReviewStack(stacks);
    }
  }
  // Only prompt for a model-naming profile on first install. Re-running the installer must
  // never silently reset an already-configured active profile back to the default aliases.
  const modelDecision = resolveInstallerModelOverride(projectRoot);
  let activeOverride: ModelOverride | null = modelDecision.override;
  if (modelDecision.skipPrompt) {
    entries.push({ status: "exists", path: "context/model-profiles.md" });
  } else {
    const modelOverrideChoice = await promptModelOverride();
    if (modelOverrideChoice !== null) {
      upsertActiveProfile(projectRoot, modelOverrideChoice.name, modelOverrideChoice.override);
      activeOverride = modelOverrideChoice.override;
    } else {
      upsertActiveProfile(projectRoot, DEFAULT_PROFILE_NAME, DEFAULT_PROFILE);
    }
  }
  entries.push(
    ...installSubagents(projectRoot, subagentsDir, codeReviewChoice, activeOverride),
  );

  // 9. Install or merge the Claude Code permission allowlist
  entries.push(installSettings(projectRoot, resolveSourceSettingsPath()));

  // 10. Ensure .gitignore ignores /context/
  entries.push(updateGitignore(projectRoot));

  // 11. Optionally ignore .claude/ (skip the question when already ignored)
  if (hasClaudeRule(projectRoot)) {
    entries.push({ status: "exists", path: ".gitignore", detail: "/.claude/ already present" });
  } else if (await promptIgnoreClaudeDir()) {
    entries.push(addClaudeRule(projectRoot));
  } else {
    entries.push({ status: "declined", path: ".gitignore", detail: "/.claude/ not added" });
  }

  // 12. Create or update CLAUDE.md
  entries.push(updateClaudeMd(projectRoot, createClaudeMd));

  // 13. Print the final summary
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
