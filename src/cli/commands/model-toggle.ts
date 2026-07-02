import path from "node:path";
import { CliError } from "../utils/errors.js";
import { getCommand } from "../command-registry.js";
import { renderCommandHelp } from "../help/render-help.js";
import { readModelProfiles, writeModelProfiles } from "../feature-skill-install/model-profiles.js";
import { applyProfileToAgents } from "../feature-skill-install/model-toggle.js";
import { promptCreateModelProfile } from "../feature-skill-install/prompts.js";
import { formatSuccess, formatKeyValue } from "../format/console.js";

export async function run(args: string[]): Promise<void> {
  if (args.includes("--help") || args.includes("-h")) {
    const cmd = getCommand("model-toggle");
    console.log(cmd ? renderCommandHelp(cmd) : "Usage: dev model-toggle <profile>");
    return;
  }

  const [profileName] = args;
  if (!profileName) {
    throw new CliError("dev model-toggle requires a profile name. Usage: dev model-toggle <profile>");
  }

  const projectRoot = process.cwd();
  const profiles = readModelProfiles(projectRoot);
  if (profiles === null) {
    throw new CliError(
      "No context/model-profiles.md found. Run `dev feature-skill-install` first to create one.",
    );
  }

  let override = profiles.profiles[profileName];
  if (!override) {
    const created = await promptCreateModelProfile(profileName);
    if (created === null) {
      const available = Object.keys(profiles.profiles).join(", ") || "none";
      throw new CliError(`Unknown profile "${profileName}". Available profiles: ${available}`);
    }
    override = created;
    profiles.profiles[profileName] = override;
  }

  const agentsDir = path.join(projectRoot, ".claude", "agents");
  const entries = applyProfileToAgents(agentsDir, override);

  profiles.active = profileName;
  writeModelProfiles(projectRoot, profiles);

  for (const entry of entries) {
    if (entry.status === "created") {
      console.log(formatSuccess(entry.path, entry.detail ?? "updated"));
    } else {
      console.log(formatKeyValue(entry.path, entry.detail ?? entry.status));
    }
  }
  console.log("");
  console.log(formatSuccess("Active profile", profileName));
}
