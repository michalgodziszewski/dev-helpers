#!/usr/bin/env node

import { run as startCommand } from "../src/cli/commands/start.js";
import { CliError } from "../src/cli/utils/errors.js";

const commands: Record<string, (args: string[]) => Promise<void>> = {
  start: startCommand,
};

function showHelp(): void {
  console.log(
    [
      "Usage: dev <command> [options]",
      "",
      "Commands:",
      "  start <TICKET> [description] [--type <type>] [--base <branch>]   Create a branch",
      "",
      "Run `dev <command>` with no arguments for command-specific help.",
    ].join("\n")
  );
}

async function main(): Promise<void> {
  const [commandName, ...args] = process.argv.slice(2);

  if (!commandName) {
    showHelp();
    process.exit(0);
  }

  const handler = commands[commandName];

  if (!handler) {
    console.error(`Unknown command: ${commandName}\n`);
    showHelp();
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

main();
