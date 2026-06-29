import type { CommandDefinition } from "../command-definition.js";
import { getAllCommands } from "../command-registry.js";

export function renderTopLevelHelp(): string {
  const commands = getAllCommands();
  const lines: string[] = [
    "Usage: dev <command> [options]",
    "",
    "Commands:",
  ];

  for (const cmd of commands) {
    lines.push(`  ${cmd.usage}   ${cmd.summary}`);
  }

  lines.push("");
  lines.push("Run `dev <command>` with no arguments for command-specific help.");

  return lines.join("\n");
}

export function renderCommandHelp(cmd: CommandDefinition): string {
  const lines: string[] = [cmd.usage, ""];

  lines.push(cmd.summary);
  lines.push("");

  if (cmd.examples.length > 0) {
    lines.push("Examples:");
    for (const ex of cmd.examples) {
      lines.push(`  ${ex.command}`);
    }
  }

  if (cmd.options.length > 0) {
    lines.push("");
    lines.push("Options:");
    for (const opt of cmd.options) {
      let line = opt.valueName
        ? `  ${opt.flag} <${opt.valueName}>`
        : `  ${opt.flag}`;
      if (opt.defaultValue) {
        line += `  (default: ${opt.defaultValue})`;
      }
      lines.push(line);
    }
  }

  return lines.join("\n");
}
