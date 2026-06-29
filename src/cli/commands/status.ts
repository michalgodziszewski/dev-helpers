import { CliError } from "../utils/errors.js";
import { GitClient, GitError } from "../git/git-client.js";
import { loadDevEnv, resolveBaseBranch } from "../config/env.js";
import { getCommand } from "../command-registry.js";
import { renderCommandHelp } from "../help/render-help.js";
import {
  formatSuccess,
  formatWarning,
  formatError,
  formatKeyValue,
  formatBranch,
  formatHint,
} from "../format/console.js";

const CONTEXT_PREFIX = "context/";

interface ParsedArgs {
  cliBaseBranch: string | undefined;
  fetch: boolean;
}

function parseArgs(args: string[]): ParsedArgs {
  let cliBaseBranch: string | undefined;
  let fetch = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--base") {
      if (i + 1 >= args.length) {
        throw new CliError("--base requires a branch name argument.");
      }
      cliBaseBranch = args[i + 1];
      i++;
    } else if (args[i] === "--fetch") {
      fetch = true;
    } else if (args[i] === "--help" || args[i] === "-h") {
      const cmd = getCommand("status");
      throw new CliError(cmd ? renderCommandHelp(cmd) : "Usage: dev status [--base <branch>] [--fetch]");
    } else {
      throw new CliError(`Unknown argument: ${args[i]}`);
    }
  }

  return { cliBaseBranch, fetch };
}

function describeWorkingTree(statusOutput: string): { clean: boolean; count: number } {
  if (!statusOutput.trim()) return { clean: true, count: 0 };

  const paths = statusOutput
    .split("\n")
    .filter(Boolean)
    .map((line) => line.slice(3))
    .filter((path) => !path.startsWith(CONTEXT_PREFIX));

  return { clean: paths.length === 0, count: paths.length };
}

function formatAheadBehind(ahead: number, behind: number): string {
  const parts: string[] = [];
  if (ahead > 0) parts.push(`${ahead} commit${ahead === 1 ? "" : "s"} ahead`);
  if (behind > 0) parts.push(`${behind} commit${behind === 1 ? "" : "s"} behind`);
  if (parts.length === 0) return "up to date";
  return parts.join(", ");
}

export async function run(args: string[]): Promise<void> {
  const { cliBaseBranch, fetch } = parseArgs(args);
  const git = new GitClient();

  // Verify we're in a git repository
  if (!(await git.isInsideWorkTree())) {
    throw new CliError(`${formatError("Not a Git repository", process.cwd())}`);
  }

  // Fetch if requested
  if (fetch) {
    try {
      await git.fetchAndPrune();
      console.log(formatSuccess("Fetch", "completed"));
    } catch (err) {
      if (err instanceof GitError) {
        console.log(formatError("Fetch failed", "origin"));
      } else {
        throw err;
      }
    }
  }

  // Repository name
  const repoName = await git.repositoryName();

  // Current branch
  let currentBranch: string;
  try {
    currentBranch = await git.currentBranch();
  } catch {
    throw new CliError(
      `${formatError("Detached HEAD", "not on any branch")}\n` +
      "Switch to a branch before checking status."
    );
  }

  // Resolve base branch
  const env = loadDevEnv();
  const baseBranch = resolveBaseBranch(cliBaseBranch, env);

  // Header
  console.log(formatKeyValue("Repository", repoName));
  console.log(formatKeyValue("Current branch", formatBranch(currentBranch)));
  console.log(formatKeyValue("Base branch", formatBranch(baseBranch)));
  console.log("");

  // Working tree state
  let statusOutput: string;
  try {
    statusOutput = await git.status();
  } catch {
    statusOutput = "";
  }
  const tree = describeWorkingTree(statusOutput);
  if (tree.clean) {
    console.log(formatSuccess("Working tree", "clean"));
  } else {
    console.log(
      formatWarning(
        "Working tree",
        `has local changes (${tree.count} file${tree.count === 1 ? "" : "s"})`
      )
    );
  }

  // Tracking branch
  const tracking = await git.trackingBranch(currentBranch);
  if (tracking) {
    console.log(formatSuccess("Tracking branch", formatBranch(tracking)));

    // Ahead/behind tracking
    const remoteCounts = await git.aheadBehind(currentBranch, tracking);
    if (remoteCounts.ahead === 0 && remoteCounts.behind === 0) {
      console.log(formatSuccess("Remote sync", "up to date"));
    } else {
      console.log(
        formatWarning(
          "Remote sync",
          formatAheadBehind(remoteCounts.ahead, remoteCounts.behind)
        )
      );
    }
  } else {
    console.log(formatWarning("Tracking branch", "not configured"));
  }

  // Base branch comparison
  const hasLocalBase = await git.hasLocalBranch(baseBranch);
  const hasRemoteBase = await git.hasRemoteBranch(baseBranch);
  const baseRef = hasRemoteBase
    ? `origin/${baseBranch}`
    : hasLocalBase
      ? baseBranch
      : undefined;

  if (!baseRef) {
    console.log(formatError("Base branch not found", baseBranch));
  } else {
    const baseCounts = await git.aheadBehind(currentBranch, baseRef);
    if (baseCounts.ahead === 0 && baseCounts.behind === 0) {
      console.log(
        formatSuccess("Base comparison", `up to date with ${formatBranch(baseBranch)}`)
      );
    } else {
      console.log(
        formatSuccess(
          "Base comparison",
          formatAheadBehind(baseCounts.ahead, baseCounts.behind) +
            ` ${formatHint(`(${formatBranch(baseBranch)})`)}`
        )
      );
    }
  }
}
