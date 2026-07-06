import type { CommandDefinition } from "../command-definition.js";

export const featureSkillInstallKiroCommand: CommandDefinition = {
  name: "feature-skill-install-kiro",
  summary: "Install the feature skill for Kiro and initialize project context",
  usage: "dev feature-skill-install-kiro",
  positionalArgs: [],
  options: [],
  examples: [
    {
      command: "dev feature-skill-install-kiro",
      description:
        "Interactively install the feature skill for Kiro (global or project steering) " +
        "and initialize the project context structure.",
    },
  ],
  successBehavior: [
    "The shared, provider-neutral skill content (actions/, docs/, assets/) is present at the project's or home directory's skills/feature/ — created if missing, reused if another provider's installer already created it in this same project.",
    "A Kiro entry-point steering file (.kiro/steering/feature.md, inclusion: manual) and a project-context steering file (.kiro/steering/project-context.md, inclusion: always) are installed.",
    "Project context directories and files are created when missing.",
    "A code-review guidance steering file is installed for the selected stack, used inline instead of a Claude Code subagent.",
    "`.gitignore` (or `.git/info/exclude`) contains `/context/`, and optionally `/.kiro/` and `/skills/` together when requested.",
    "A summary lists every created, copied, existing, skipped, and blocked item.",
  ],
  sideEffects: [
    "Copies the packaged shared skill content to `<project>/skills/feature/` (project scope) or `~/skills/feature/` (global scope), skipping the copy if it already exists (installed there by this command or by `dev feature-skill-install`).",
    "Writes `.kiro/steering/feature.md` and `.kiro/steering/project-context.md` under the chosen scope's steering directory.",
    "Creates `context/`, `context/features/`, `context/fixes/`, and `context/screenshots/` directories.",
    "Copies asset-backed context files (`ai-interaction.md`, `current-feature.md`, `feature-config.md`, `feature-spec.md`, `project-overview.md`) when missing. All templates except `current-feature-template.md` are sourced from the package-root `assets/` directory.",
    "Prompts for a coding-standards template when `context/coding-standards.md` is missing.",
    "Prompts for a code-review guidance stack when `.kiro/steering/feature-code-review-guidance.md` is missing, translating the Claude Code subagent template's frontmatter into Kiro's manual-inclusion steering format.",
    "Creates or appends to `.gitignore` (or `.git/info/exclude`) to ensure `/context/` is ignored.",
    "Asks once whether `.kiro/` and `skills/feature/` should also be ignored together (default Yes); the question is skipped when a rule for either already exists (set by this command or by `dev feature-skill-install`), reusing that destination for whichever rule is still missing.",
    "Never runs Git commands, installs dependencies, or makes network requests.",
    "Never modifies the existing `dev feature-skill-install` command's Claude Code artifacts (`.claude/skills/feature/SKILL.md`, `.claude/agents/`, `.claude/settings.json`, `CLAUDE.md`).",
  ],
  failureCases: [
    "The selected shared-content destination exists but does not look like the shared skill content (missing actions/ or docs/) — stops before any further changes.",
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
