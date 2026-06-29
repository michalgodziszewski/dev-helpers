import type { CommandDefinition } from "../command-definition.js";

export const GENERATED_MARKER =
  "<!-- Generated file. Do not edit manually. -->";

export function renderCommandMarkdown(
  cmd: CommandDefinition,
  version: string,
): string {
  const lines: string[] = [];

  lines.push(GENERATED_MARKER);
  lines.push(`<!-- Version: ${version} -->`);
  lines.push("");
  lines.push(`# dev ${cmd.name}`);
  lines.push("");
  lines.push(cmd.summary);
  lines.push("");

  // Usage
  lines.push("## Usage");
  lines.push("");
  lines.push("```text");
  lines.push(cmd.usage);
  lines.push("```");
  lines.push("");

  // Arguments
  if (cmd.positionalArgs.length > 0) {
    lines.push("## Arguments");
    lines.push("");
    lines.push("| Argument | Required | Description |");
    lines.push("|---|---|---|");
    for (const arg of cmd.positionalArgs) {
      lines.push(
        `| \`${arg.name}\` | ${arg.required ? "Yes" : "No"} | ${arg.description} |`,
      );
    }
    lines.push("");
  }

  // Options
  if (cmd.options.length > 0) {
    lines.push("## Options");
    lines.push("");
    lines.push("| Option | Required | Default | Description |");
    lines.push("|---|---|---|---|");
    for (const opt of cmd.options) {
      const allowed = opt.allowedValues
        ? ` Allowed values: ${opt.allowedValues.map((v) => `\`${v}\``).join(", ")}.`
        : "";
      const optLabel = opt.valueName
        ? `${opt.flag} <${opt.valueName}>`
        : opt.flag;
      lines.push(
        `| \`${optLabel}\` | ${opt.required ? "Yes" : "No"} | \`${opt.defaultValue ?? "—"}\` | ${opt.description}${allowed} |`,
      );
    }
    lines.push("");
  }

  // Examples
  if (cmd.examples.length > 0) {
    lines.push("## Examples");
    lines.push("");
    for (const ex of cmd.examples) {
      lines.push("```bash");
      lines.push(ex.command);
      lines.push("```");
      lines.push("");
      lines.push(ex.description);
      lines.push("");
    }
  }

  // Behavior
  if (cmd.successBehavior.length > 0) {
    lines.push("## Behavior");
    lines.push("");
    for (const b of cmd.successBehavior) {
      lines.push(`- ${b}`);
    }
    lines.push("");
  }

  // Side effects
  if (cmd.sideEffects.length > 0) {
    lines.push("## Git Side Effects");
    lines.push("");
    for (const s of cmd.sideEffects) {
      lines.push(`- ${s}`);
    }
    lines.push("");
  }

  // Failure cases
  if (cmd.failureCases.length > 0) {
    lines.push("## Failure Cases");
    lines.push("");
    for (const f of cmd.failureCases) {
      lines.push(`- ${f}`);
    }
    lines.push("");
  }

  // Exit behavior
  lines.push("## Exit Behavior");
  lines.push("");
  lines.push(`- **Success:** ${cmd.exitBehavior.success}`);
  lines.push(`- **Failure:** ${cmd.exitBehavior.failure}`);
  lines.push("");

  return lines.join("\n");
}

export function renderCommandIndex(
  commands: CommandDefinition[],
  version: string,
): string {
  const lines: string[] = [];

  lines.push(GENERATED_MARKER);
  lines.push(`<!-- Version: ${version} -->`);
  lines.push("");
  lines.push("# CLI Command Reference");
  lines.push("");
  lines.push(`Version: ${version}`);
  lines.push("");
  lines.push("## Commands");
  lines.push("");
  lines.push("| Command | Description |");
  lines.push("|---|---|");
  for (const cmd of commands) {
    lines.push(`| [\`dev ${cmd.name}\`](${cmd.name}.md) | ${cmd.summary} |`);
  }
  lines.push("");

  return lines.join("\n");
}
