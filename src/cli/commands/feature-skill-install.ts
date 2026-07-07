import os from "node:os";
import path from "node:path";
import fs from "node:fs";
import { CliError } from "../utils/errors.js";
import { getCommand } from "../command-registry.js";
import { renderCommandHelp } from "../help/render-help.js";
import { resolveSourceSkillPath, resolveRootAssetsPath, resolveSubagentsPath, resolveSourceSettingsPath, resolveDestinationPath, resolveSourceSharedSkillPath, resolveDestinationSharedSkillPath } from "../feature-skill-install/paths.js";
import { validateSource, installSkill, installSharedSkillContent } from "../feature-skill-install/install-skill.js";
import { promptSkillScope, promptCodingStandards, promptCodeReviewStack, promptClaudeMdDestination, promptClaudeIgnoreDestination, promptContextIgnoreDestination, promptModelOverride } from "../feature-skill-install/prompts.js";
import { createContextDirs, copyContextFiles, discoverCodingStandards, applyCodingStandards } from "../feature-skill-install/initialize-context.js";
import { discoverCodeReviewStacks, installSubagents } from "../feature-skill-install/install-subagents.js";
import type { SubagentStackChoice } from "../feature-skill-install/install-subagents.js";
import { resolveInstallerModelOverride, upsertActiveProfile, DEFAULT_PROFILE_NAME, DEFAULT_PROFILE } from "../feature-skill-install/model-profiles.js";
import type { ModelOverride } from "../feature-skill-install/model-override.js";
import { installSettings } from "../feature-skill-install/install-settings.js";
import { updateGitignore, addClaudeRule, findClaudeIgnoreDestination, addClaudeMdIgnoreRule, addSkillsRule, findSkillsIgnoreDestination, ignoreFileLabel } from "../feature-skill-install/update-gitignore.js";
import { updateClaudeMd } from "../feature-skill-install/update-claude-md.js";
import { renderSummary } from "../feature-skill-install/installation-summary.js";
import type { StatusEntry, InstallResult, SkillScope, IgnoreDestination } from "../feature-skill-install/types.js";

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

  // 3. Copy the skill entry point, or report existing
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

  // 4. Copy the shared, provider-neutral skill content (actions/, docs/, assets/), or report
  // existing when another provider's installer already created it in this same project.
  const sharedSourcePath = resolveSourceSharedSkillPath();
  const sharedDestinationPath = resolveDestinationSharedSkillPath(scope, projectRoot, homeDir);
  const sharedEntry = installSharedSkillContent(sharedSourcePath, sharedDestinationPath);
  entries.push(sharedEntry);

  if (sharedEntry.status === "blocked") {
    console.log(renderSummary({
      skillScope: scope,
      skillDestination: destinationPath,
      entries,
      codingStandards: null,
      incomplete: true,
    }));
    throw new CliError(`[blocked] ${sharedDestinationPath} exists but is not valid shared skill content`);
  }

  // 5. Check whether CLAUDE.md exists and resolve its tracking destination when it does not
  const claudeMdPath = path.join(projectRoot, "CLAUDE.md");
  const claudeMdExists = fs.existsSync(claudeMdPath);
  let claudeMdDestination: IgnoreDestination = "track";
  if (!claudeMdExists) {
    claudeMdDestination = await promptClaudeMdDestination();
  }

  // 6. Create or verify context directories
  entries.push(...createContextDirs(projectRoot));

  // 7. Copy or verify non-coding context files
  const rootAssetsDir = resolveRootAssetsPath();
  const skillAssetsDir = path.join(sharedSourcePath, "assets");
  entries.push(...copyContextFiles(projectRoot, rootAssetsDir, skillAssetsDir));

  // 8. Resolve coding standards only when missing
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

  // 9. Install subagents into the project's .claude/agents/
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

  // 10. Install or merge the Claude Code permission allowlist
  entries.push(installSettings(projectRoot, resolveSourceSettingsPath()));

  // 11. Ask where the context/ ignore rule should be written (always ignored, no track option)
  const contextDestination = await promptContextIgnoreDestination();

  // 12. Ensure the chosen ignore file excludes /context/
  entries.push(updateGitignore(projectRoot, contextDestination));

  // 13. Resolve .claude/ and skills/feature/ tracking together, as one combined choice. Skip
  // the question when either rule already exists (set by this installer or by
  // feature-skill-install-kiro on a previous run in this same project), reusing that same
  // destination for whichever rule is still missing.
  const existingClaudeDestination = findClaudeIgnoreDestination(projectRoot);
  const existingSkillsDestination = findSkillsIgnoreDestination(projectRoot);
  const existingCombinedDestination = existingClaudeDestination ?? existingSkillsDestination;

  if (existingCombinedDestination !== null) {
    if (existingClaudeDestination !== null) {
      entries.push({
        status: "exists",
        path: ignoreFileLabel(existingClaudeDestination),
        detail: "/.claude/ already present",
      });
    } else {
      entries.push(addClaudeRule(projectRoot, existingCombinedDestination));
    }
    if (existingSkillsDestination !== null) {
      entries.push({
        status: "exists",
        path: ignoreFileLabel(existingSkillsDestination),
        detail: "/skills/ already present",
      });
    } else {
      entries.push(addSkillsRule(projectRoot, existingCombinedDestination));
    }
  } else {
    const claudeDestination = await promptClaudeIgnoreDestination();
    if (claudeDestination === "track") {
      entries.push({ status: "declined", path: ".claude/", detail: "left tracked by Git" });
      entries.push({ status: "declined", path: "skills/feature/", detail: "left tracked by Git" });
    } else {
      entries.push(addClaudeRule(projectRoot, claudeDestination));
      entries.push(addSkillsRule(projectRoot, claudeDestination));
    }
  }

  // 14. Create CLAUDE.md when missing (always creating it now that the tracking choice is
  // resolved), or update an existing one in place; apply its ignore rule only for a fresh file.
  entries.push(updateClaudeMd(projectRoot, true));
  if (!claudeMdExists) {
    if (claudeMdDestination === "gitignore" || claudeMdDestination === "exclude") {
      entries.push(addClaudeMdIgnoreRule(projectRoot, claudeMdDestination));
    } else {
      entries.push({ status: "declined", path: "CLAUDE.md", detail: "left tracked by Git" });
    }
  }

  // 15. Print the final summary
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
