import type { CommandDefinition } from "../command-definition.js";
import { FALLBACK_BASE_BRANCH } from "../config/env.js";

export const statusCommand: CommandDefinition = {
  name: "status",
  summary: "Show repository and branch status",
  usage: "dev status [--base <branch>] [--fetch]",
  positionalArgs: [],
  options: [
    {
      flag: "--base",
      valueName: "branch",
      description:
        "Base branch to compare against. " +
        "When omitted, uses `DEV_DEFAULT_BASE_BRANCH` from the " +
        "environment or `.env` file, falling back to `trunk`.",
      required: false,
      defaultValue: FALLBACK_BASE_BRANCH,
    },
    {
      flag: "--fetch",
      description:
        "Fetch from origin before checking status. " +
        "Without this flag, status uses only local data.",
      required: false,
    },
  ],
  examples: [
    {
      command: "dev status",
      description:
        "Show repository status against the default base branch " +
        "(`DEV_DEFAULT_BASE_BRANCH` or `trunk`).",
    },
    {
      command: "dev status --base release-1.78.0",
      description: "Show status compared against `release-1.78.0`.",
    },
    {
      command: "dev status --fetch",
      description:
        "Fetch from origin first, then show status with up-to-date remote data.",
    },
    {
      command: "dev status --base release-1.78.0 --fetch",
      description:
        "Fetch from origin and show status compared against `release-1.78.0`.",
    },
  ],
  successBehavior: [
    "Prints a readable summary of repository path, current branch, base branch, " +
    "working tree state, tracking branch, remote sync, and ahead/behind counts.",
    "The command is read-only — it never modifies branches, working tree, or remote state.",
  ],
  sideEffects: [
    "When `--fetch` is provided, runs `git fetch origin --prune` before status checks.",
    "Without `--fetch`, no network operations are performed.",
  ],
  failureCases: [
    "Current directory is not inside a Git repository.",
    "Git is not available.",
    "Fetch fails when `--fetch` is used.",
    "Base branch cannot be found for comparison.",
  ],
  exitBehavior: {
    success: "Exits with code 0.",
    failure:
      "Exits with code 1 and prints the error. " +
      "Partial output may be shown before the error when possible.",
  },
};
