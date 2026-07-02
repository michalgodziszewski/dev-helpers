#!/usr/bin/env node

import { run as startCommand } from "../src/cli/commands/start.js";
import { run as featureSkillInstallCommand } from "../src/cli/commands/feature-skill-install.js";
import { run as statusCommand } from "../src/cli/commands/status.js";
import { run as modelToggleCommand } from "../src/cli/commands/model-toggle.js";
import { CliError } from "../src/cli/utils/errors.js";
import { getCommandNames } from "../src/cli/command-registry.js";
import { renderTopLevelHelp } from "../src/cli/help/render-help.js";

const handlers: Record<string, (args: string[]) => Promise<void>> = {
  start: startCommand,
  "feature-skill-install": featureSkillInstallCommand,
  status: statusCommand,
  "model-toggle": modelToggleCommand,
};

async function main(): Promise<void> {
  const [commandName, ...args] = process.argv.slice(2);

  if (!commandName || commandName === "--help" || commandName === "-h") {
    console.log(renderTopLevelHelp());
    process.exit(0);
  }

  const handler = handlers[commandName];

  if (!handler) {
    console.error(`Unknown command: ${commandName}\n`);
    console.log(renderTopLevelHelp());
    process.exit(1);
  }

  try {
    await handler(args);
  } catch (err) {
    if (err instanceof CliError) {
      console.error(err.message);
      process.exit(1);
    }
    throw err;
  }
}

// Verify registry and handlers are in sync
const registryNames = new Set(getCommandNames());
const handlerNames = new Set(Object.keys(handlers));
for (const name of registryNames) {
  if (!handlerNames.has(name)) {
    throw new Error(`Command "${name}" is in registry but has no handler.`);
  }
}
for (const name of handlerNames) {
  if (!registryNames.has(name)) {
    throw new Error(`Handler "${name}" exists but is not in the registry.`);
  }
}

main();
