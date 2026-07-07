import os from "node:os";
import path from "node:path";
import fs from "node:fs";
import { CliError } from "../utils/errors.js";
import { getCommand } from "../command-registry.js";
import { renderCommandHelp } from "../help/render-help.js";
import {
  resolveRootAssetsPath,
  resolveSubagentsPath,
  resolveSourceSharedSkillPath,
  resolveDestinationSharedSkillPath,
  resolveKiroSteeringDestinationPath,
} from "../feature-skill-install/paths.js";
import { installSharedSkillContent } from "../feature-skill-install/install-skill.js";
import {
  installKiroFeatureEntryPoint,
  installKiroProjectContext,
  installKiroCodeReviewGuidance,
  CODE_REVIEW_GUIDANCE_FILENAME,
} from "../feature-skill-install/install-kiro-steering.js";
import {
  promptKiroScope,
  promptCodingStandards,
  promptCodeReviewStack,
  promptKiroIgnoreDestination,
  promptContextIgnoreDestination,
} from "../feature-skill-install/prompts.js";
import {
  createContextDirs,
  copyContextFiles,
  discoverCodingStandards,
  applyCodingStandards,
} from "../feature-skill-install/initialize-context.js";
import { discoverCodeReviewStacks } from "../feature-skill-install/install-subagents.js";
import type { SubagentStackChoice } from "../feature-skill-install/install-subagents.js";
import {
  updateGitignore,
  addKiroRule,
  findKiroIgnoreDestination,
  addSkillsRule,
  findSkillsIgnoreDestination,
  ignoreFileLabel,
} from "../feature-skill-install/update-gitignore.js";
import { renderSummary } from "../feature-skill-install/installation-summary.js";
import type { StatusEntry, InstallResult, SkillScope } from "../feature-skill-install/types.js";

export async function run(args: string[]): Promise<void> {
  if (args.includes("--help") || args.includes("-h")) {
    const cmd = getCommand("feature-skill-install-kiro");
    console.log(cmd ? renderCommandHelp(cmd) : "Usage: dev feature-skill-install-kiro");
    return;
  }

  const projectRoot = process.cwd();
  const homeDir = os.homedir();

  // 1. Ask for the steering destination (workspace vs. global)
  const scope: SkillScope = await promptKiroScope();
  const steeringDir = resolveKiroSteeringDestinationPath(scope, projectRoot, homeDir);

  // 2. Install the shared, provider-neutral skill content (actions/, docs/, assets/), or report
  // existing when the Claude Code installer already created it in this same project.
  const entries: StatusEntry[] = [];
  const sharedSourcePath = resolveSourceSharedSkillPath();
  const sharedDestinationPath = resolveDestinationSharedSkillPath(scope, projectRoot, homeDir);
  const sharedEntry = installSharedSkillContent(sharedSourcePath, sharedDestinationPath);
  entries.push(sharedEntry);

  if (sharedEntry.status === "blocked") {
    console.log(renderSummary({
      skillScope: scope,
      skillDestination: steeringDir,
      entries,
      codingStandards: null,
      incomplete: true,
    }));
    throw new CliError(`[blocked] ${sharedDestinationPath} exists but is not valid shared skill content`);
  }

  // 3. Install the Kiro entry point and project-context steering files
  entries.push(installKiroFeatureEntryPoint(steeringDir));
  entries.push(installKiroProjectContext(steeringDir));

  // 4. Create or verify context directories
  entries.push(...createContextDirs(projectRoot));

  // 5. Copy or verify non-coding context files
  const rootAssetsDir = resolveRootAssetsPath();
  const skillAssetsDir = path.join(sharedSourcePath, "assets");
  entries.push(...copyContextFiles(projectRoot, rootAssetsDir, skillAssetsDir));

  // 6. Resolve coding standards only when missing
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

  // 7. Ask which code-review guidance stack to install as inline steering content — Kiro has no
  // on-demand subagent delegation, so this replaces the .claude/agents/code-review.md subagent.
  const subagentsDir = resolveSubagentsPath();
  const codeReviewGuidancePath = path.join(steeringDir, CODE_REVIEW_GUIDANCE_FILENAME);
  const codeReviewGuidanceLabel = `.kiro/steering/${CODE_REVIEW_GUIDANCE_FILENAME}`;
  if (fs.existsSync(codeReviewGuidancePath)) {
    entries.push({ status: "exists", path: codeReviewGuidanceLabel });
  } else {
    const stacks = discoverCodeReviewStacks(subagentsDir);
    let codeReviewChoice: SubagentStackChoice | null = null;
    if (stacks.length > 0) {
      codeReviewChoice = await promptCodeReviewStack(stacks);
    }
    if (codeReviewChoice === null || codeReviewChoice.assetFilename === null) {
      entries.push({
        status: "declined",
        path: codeReviewGuidanceLabel,
        detail: "No code-review stack selected",
      });
    } else {
      entries.push(
        installKiroCodeReviewGuidance(subagentsDir, codeReviewChoice.assetFilename, steeringDir),
      );
    }
  }

  // 8. Ask where the context/ ignore rule should be written (always ignored, no track option)
  const contextDestination = await promptContextIgnoreDestination();
  entries.push(updateGitignore(projectRoot, contextDestination));

  // 9. Resolve .kiro/ and skills/feature/ tracking together, as one combined choice. Skip the
  // question when either rule already exists (set by this installer or by
  // feature-skill-install on a previous run in this same project), reusing that same
  // destination for whichever rule is still missing.
  const existingKiroDestination = findKiroIgnoreDestination(projectRoot);
  const existingSkillsDestination = findSkillsIgnoreDestination(projectRoot);
  const existingCombinedDestination = existingKiroDestination ?? existingSkillsDestination;

  if (existingCombinedDestination !== null) {
    if (existingKiroDestination !== null) {
      entries.push({
        status: "exists",
        path: ignoreFileLabel(existingKiroDestination),
        detail: "/.kiro/ already present",
      });
    } else {
      entries.push(addKiroRule(projectRoot, existingCombinedDestination));
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
    const kiroDestination = await promptKiroIgnoreDestination();
    if (kiroDestination === "track") {
      entries.push({ status: "declined", path: ".kiro/", detail: "left tracked by Git" });
      entries.push({ status: "declined", path: "skills/feature/", detail: "left tracked by Git" });
    } else {
      entries.push(addKiroRule(projectRoot, kiroDestination));
      entries.push(addSkillsRule(projectRoot, kiroDestination));
    }
  }

  // 10. Print the final summary
  const incomplete = entries.some(
    (e) => e.status === "blocked" || e.status === "skipped",
  );

  const result: InstallResult = {
    skillScope: scope,
    skillDestination: steeringDir,
    entries,
    codingStandards: codingStandardsStatus,
    incomplete,
  };

  console.log(renderSummary(result));
}
