import type { InstallResult, StatusEntry, ItemStatus } from "./types.js";
import { bold, dim, green, yellow, red, formatKeyValue } from "../format/console.js";

function colorTag(status: ItemStatus, tag: string): string {
  switch (status) {
    case "created":
    case "copied":
    case "merged":
      return green(tag);
    case "exists":
      return dim(tag);
    case "skipped":
    case "declined":
      return yellow(tag);
    case "blocked":
      return red(tag);
  }
}

function formatEntry(entry: StatusEntry): string {
  const tag = colorTag(entry.status, `[${entry.status}]`.padEnd(10));
  const detail = entry.detail ? dim(` — ${entry.detail}`) : "";
  return `${tag}${entry.path}${detail}`;
}

export function renderSummary(result: InstallResult): string {
  const lines: string[] = [];

  lines.push("");
  lines.push(bold("Feature Skill Installer — Summary"));
  lines.push(dim("=".repeat(40)));
  lines.push("");
  lines.push(formatKeyValue("Skill scope", result.skillScope));
  lines.push(formatKeyValue("Skill destination", result.skillDestination));
  lines.push("");

  for (const entry of result.entries) {
    lines.push(formatEntry(entry));
  }

  if (result.codingStandards !== null) {
    lines.push("");
    lines.push(formatKeyValue("Coding standards", result.codingStandards));
  }

  if (result.incomplete) {
    lines.push("");
    lines.push(yellow("⚠ Installation incomplete. See blocked or skipped items above."));
  }

  lines.push("");
  return lines.join("\n");
}
