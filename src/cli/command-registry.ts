import type { CommandDefinition } from "./command-definition.js";
import { WORK_TYPES, DEFAULT_WORK_TYPE } from "./naming/branch-name.js";
import { FALLBACK_BASE_BRANCH } from "./config/env.js";

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
        "`git check-ref-format --branch`. Must exist on origin. " +
        "When omitted, uses `DEV_DEFAULT_BASE_BRANCH` from the " +
        "environment or `.env` file, falling back to `trunk`.",
      required: false,
      defaultValue: FALLBACK_BASE_BRANCH,
    },
  ],
  examples: [
    {
      command: "dev start LSG-12345",
      description:
        "Creates `feature/LSG-12345` from the default base branch " +
        "(`DEV_DEFAULT_BASE_BRANCH` or `trunk`).",
    },
    {
      command: 'dev start LSG-12345 "add user search"',
      description:
        "Creates `feature/LSG-12345-add-user-search` from the default base branch.",
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

const featureSkillInstallCommand: CommandDefinition = {
  name: "feature-skill-install",
  summary: "Install the feature skill and initialize project context",
  usage: "dev feature-skill-install",
  positionalArgs: [],
  options: [],
  examples: [
    {
      command: "dev feature-skill-install",
      description:
        "Interactively install the feature skill (global or project) " +
        "and initialize the project context structure.",
    },
  ],
  successBehavior: [
    "The feature skill is copied to the selected destination (global or project).",
    "Project context directories and files are created when missing.",
    "Subagent templates are installed into the project's `.claude/agents/` directory when missing.",
    "The Claude Code permission allowlist is present in `.claude/settings.json` (copied or merged).",
    "`.gitignore` contains `/context/`, and optionally `/.claude/` when requested.",
    "`CLAUDE.md` contains the Local Context Files section when authorized.",
    "A summary lists every created, copied, existing, skipped, and blocked item.",
  ],
  sideEffects: [
    "Copies the packaged feature skill to `~/.claude/skills/feature/` (global) or `<project>/.claude/skills/feature/` (project).",
    "Creates `context/`, `context/features/`, `context/fixes/`, and `context/screenshots/` directories.",
    "Copies asset-backed context files (`ai-interaction.md`, `current-feature.md`, `feature-config.md`, `feature-spec.md`, `project-overview.md`) when missing. All templates except `current-feature-template.md` are sourced from the package-root `assets/` directory.",
    "Prompts for a coding-standards template when `context/coding-standards.md` is missing.",
    "Prompts for a code-review subagent stack when `.claude/agents/code-review.md` is missing, and copies stack-agnostic subagent templates (`test`, `explain`, `git-verify`, `plan-research`, `docs-sync`) from `assets/subagents/` into `.claude/agents/` when missing.",
    "Copies the packaged `.claude/settings.json` permission allowlist, or merges missing `permissions.allow` rules into an existing file while preserving other settings.",
    "Creates or appends to `.gitignore` to ensure `/context/` is ignored.",
    "Asks whether `.claude/` should also be ignored (default Yes); the question is skipped when the rule already exists.",
    "Creates or updates `CLAUDE.md` with the Local Context Files section.",
    "Never runs Git commands, installs dependencies, or makes network requests.",
  ],
  failureCases: [
    "The packaged source skill is missing or invalid — stops before any project changes.",
    "The selected destination exists but is not a valid feature skill — stops before context initialization.",
    "A path-type conflict (e.g. file where a directory is expected) is reported and skipped.",
    "Permission errors on filesystem operations report the exact path and operation.",
  ],
  exitBehavior: {
    success: "Exits with code 0 and prints a complete summary.",
    failure:
      "Exits with code 1 and identifies the failed operation. " +
      "Existing files are never deleted or overwritten.",
  },
};

const statusCommand: CommandDefinition = {
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

const registry: ReadonlyMap<string, CommandDefinition> = new Map([
  [startCommand.name, startCommand],
  [featureSkillInstallCommand.name, featureSkillInstallCommand],
  [statusCommand.name, statusCommand],
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
