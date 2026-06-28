#!/usr/bin/env node

import { run as startCommand } from "../src/cli/commands/start.js";
import { CliError } from "../src/cli/utils/errors.js";

const commands = {
  start: startCommand,
};

function showHelp() {
  console.log(
    [
      "Usage: dev <command> [options]",
      "",
      "Commands:",
      "  start [<type>] <TICKET> <description...>   Generate a branch name",
      "",
      "Run `dev <command>` with no arguments for command-specific help.",
    ].join("\n")
  );
}

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
  handler(args);
} catch (err) {
  if (err instanceof CliError) {
    console.error(err.message);
    process.exit(1);
  }
  throw err;
}
