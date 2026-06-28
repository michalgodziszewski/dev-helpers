import type { CommandDefinition } from "./command-definition.js";
import { WORK_TYPES, DEFAULT_WORK_TYPE } from "./naming/branch-name.js";
import { DEFAULT_BASE_BRANCH } from "./config/git.js";

const startCommand: CommandDefinition = {
  name: "start",
  summary: "Create a Git work branch from a synchronized base",
  usage: "dev start <TICKET> [description] [--type <type>] [--base <branch>]",
  positionalArgs: [
    {
      name: "TICKET",
      required: true,
      description:
        "Jira ticket identifier (e.g. LSG-12345). Normalized to uppercase. " +
        "Must match the pattern: one or more uppercase letters, a hyphen, " +
        "and one or more digits starting with a non-zero digit.",
    },
    {
      name: "description",
      required: false,
      description:
        "Optional description words appended to the branch name as a " +
        "lowercase kebab-case slug. Quoted multi-word strings are split on " +
        "whitespace. A description that becomes empty after normalization " +
        "is treated as omitted.",
    },
  ],
  options: [
    {
      flag: "--type",
      valueName: "type",
      description: "Work type used as the branch prefix.",
      required: false,
      allowedValues: WORK_TYPES,
      defaultValue: DEFAULT_WORK_TYPE,
    },
    {
      flag: "--base",
      valueName: "branch",
      description:
        "Base branch to synchronize and branch from. Validated with " +
        "`git check-ref-format --branch`. Must exist on origin.",
      required: false,
      defaultValue: DEFAULT_BASE_BRANCH,
    },
  ],
  examples: [
    {
      command: "dev start LSG-12345",
      description: "Creates `feature/LSG-12345` from `main`.",
    },
    {
      command: 'dev start LSG-12345 "add user search"',
      description: "Creates `feature/LSG-12345-add-user-search` from `main`.",
    },
    {
      command: "dev start LSG-12346 --base release-1.78.0",
      description:
        "Creates `feature/LSG-12346` from the freshly updated `release-1.78.0`.",
    },
    {
      command:
        'dev start LSG-12347 "fix release behavior" --base release-1.78.0',
      description:
        "Creates `feature/LSG-12347-fix-release-behavior` from " +
        "`release-1.78.0`.",
    },
    {
      command:
        'dev start LSG-12348 "fix timeout" --type fix --base release-1.78.0',
      description:
        "Creates `fix/LSG-12348-fix-timeout` from `release-1.78.0`.",
    },
  ],
  successBehavior: [
    "The new branch is created locally and checked out.",
    "The branch is not automatically pushed to origin.",
    "Success output shows the updated base branch (with short SHA) and the created branch name.",
  ],
  sideEffects: [
    "Runs `git fetch origin --prune` to update remote tracking references.",
    "Switches to the resolved base branch.",
    "Runs `git pull --ff-only` to fast-forward the base branch.",
    "If the base branch does not exist locally but exists on origin, creates a local tracking branch.",
    "Creates a new local branch from the freshly updated base.",
  ],
  failureCases: [
    "Missing or invalid ticket format stops the command before any Git operation.",
    "Any tracked, untracked, staged, or unstaged change outside `context/` blocks branch creation. Changes inside `context/` are ignored.",
    "An existing local target branch stops creation.",
    "An existing remote target branch (detected via `origin/<branch>`) stops creation.",
    "An invalid `--base` value (fails `git check-ref-format --branch`) stops the command.",
    "A base branch that does not exist on origin stops the command.",
    "A diverged base branch that cannot fast-forward stops the command. The base is never merged, rebased, or force-pulled.",
    "A missing `--type` or `--base` value stops the command.",
    "An unrecognized `--type` value stops the command.",
  ],
  exitBehavior: {
    success: "Exits with code 0.",
    failure:
      "Exits with code 1 and prints the failed operation. " +
      "Never claims a branch was created on failure.",
  },
};

const registry: ReadonlyMap<string, CommandDefinition> = new Map([
  [startCommand.name, startCommand],
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
