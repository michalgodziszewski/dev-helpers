import type { CommandDefinition } from "./command-definition.js";
import { startCommand } from "./command-definitions/start.js";
import { featureSkillInstallCommand } from "./command-definitions/feature-skill-install.js";
import { featureSkillInstallKiroCommand } from "./command-definitions/feature-skill-install-kiro.js";
import { statusCommand } from "./command-definitions/status.js";
import { modelToggleCommand } from "./command-definitions/model-toggle.js";

const registry: ReadonlyMap<string, CommandDefinition> = new Map([
  [startCommand.name, startCommand],
  [featureSkillInstallCommand.name, featureSkillInstallCommand],
  [featureSkillInstallKiroCommand.name, featureSkillInstallKiroCommand],
  [statusCommand.name, statusCommand],
  [modelToggleCommand.name, modelToggleCommand],
]);

export function getCommand(name: string): CommandDefinition | undefined {
  return registry.get(name);
}

export function getAllCommands(): CommandDefinition[] {
  return [...registry.values()];
}

export function getCommandNames(): string[] {
  return [...registry.keys()];
}
