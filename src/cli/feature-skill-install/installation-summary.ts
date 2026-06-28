import type { InstallResult, StatusEntry } from "./types.js";

function formatEntry(entry: StatusEntry): string {
  const tag = `[${entry.status}]`.padEnd(10);
  const detail = entry.detail ? ` — ${entry.detail}` : "";
  return `${tag}${entry.path}${detail}`;
}

export function renderSummary(result: InstallResult): string {
  const lines: string[] = [];

  lines.push("");
  lines.push("Feature Skill Installer — Summary");
  lines.push("=".repeat(40));
  lines.push("");
  lines.push(`Skill scope:       ${result.skillScope}`);
  lines.push(`Skill destination: ${result.skillDestination}`);
  lines.push("");

  for (const entry of result.entries) {
    lines.push(formatEntry(entry));
  }

  if (result.codingStandards !== null) {
    lines.push("");
    lines.push(`Coding standards:  ${result.codingStandards}`);
  }

  if (result.incomplete) {
    lines.push("");
    lines.push("⚠ Installation incomplete. See blocked or skipped items above.");
  }

  lines.push("");
  return lines.join("\n");
}
