import { CliError } from "../utils/errors.js";
import { validateTicket } from "../utils/ticket.js";
import {
  buildBranchName,
  isWorkType,
  DEFAULT_WORK_TYPE,
  WORK_TYPES,
} from "../naming/branch-name.js";
import type { WorkType } from "../naming/branch-name.js";
import { GitClient, GitError } from "../git/git-client.js";
import { loadDevEnv, resolveBaseBranch } from "../config/env.js";
import { getCommand } from "../command-registry.js";
import { renderCommandHelp } from "../help/render-help.js";

const CONTEXT_PREFIX = "context/";

interface ParsedArgs {
  ticket: string;
  description: string[] | undefined;
  workType: WorkType;
  cliBaseBranch: string | undefined;
}

function parseArgs(args: string[]): ParsedArgs {
  if (args.length === 0) {
    const cmd = getCommand("start");
    throw new CliError(cmd ? renderCommandHelp(cmd) : "Usage: dev start <TICKET>");
  }

  let cliBaseBranch: string | undefined;
  let workType: WorkType = DEFAULT_WORK_TYPE;
  const remaining: string[] = [];

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--base") {
      if (i + 1 >= args.length) {
        throw new CliError("--base requires a branch name argument.");
      }
      cliBaseBranch = args[i + 1];
      i++;
    } else if (args[i] === "--type") {
      if (i + 1 >= args.length) {
        throw new CliError("--type requires a work type argument.");
      }
      const value = args[i + 1];
      if (!isWorkType(value)) {
        throw new CliError(
          `Invalid work type "${value}". Allowed types: ${WORK_TYPES.join(", ")}.`
        );
      }
      workType = value;
      i++;
    } else {
      remaining.push(args[i]);
    }
  }

  if (remaining.length === 0) {
    throw new CliError("A ticket is required. Usage: dev start <TICKET> [description] [--type <type>] [--base <branch>]");
  }

  const ticket = validateTicket(remaining[0]);
  const description = remaining.length > 1 ? remaining.slice(1) : undefined;

  return { ticket, description, workType, cliBaseBranch };
}

function filterDirtyPaths(statusOutput: string): string[] {
  if (!statusOutput.trim()) return [];

  return statusOutput
    .split("\n")
    .filter(Boolean)
    .map((line) => line.slice(3))
    .filter((path) => !path.startsWith(CONTEXT_PREFIX));
}

export async function run(args: string[]): Promise<void> {
  const { ticket, description, workType, cliBaseBranch } = parseArgs(args);
  const env = loadDevEnv();
  const baseBranch = resolveBaseBranch(cliBaseBranch, env);
  const branchName = buildBranchName(workType, ticket, description);
  const git = new GitClient();

  // Validate base branch name
  if (!(await git.checkRefFormat(baseBranch))) {
    throw new CliError(`"${baseBranch}" is not a valid Git branch name.`);
  }

  // Check working tree cleanliness (ignoring context/)
  const statusOutput = await git.status();
  const dirtyPaths = filterDirtyPaths(statusOutput);
  if (dirtyPaths.length > 0) {
    throw new CliError(
      [
        "Working tree is not clean. The following paths block branch creation:",
        ...dirtyPaths.map((p) => `  ${p}`),
        "",
        "Commit, stash, or remove these changes before running this command.",
      ].join("\n")
    );
  }

  // Check if target branch already exists
  if (await git.hasLocalBranch(branchName)) {
    throw new CliError(
      `Branch "${branchName}" already exists locally. Remove it or choose a different name.`
    );
  }

  // Fetch and prune origin
  console.log("Fetching origin...");
  await git.fetchAndPrune();

  if (await git.hasRemoteBranch(branchName)) {
    throw new CliError(
      `Branch "${branchName}" already exists on origin. It was detected via origin/${branchName}.`
    );
  }

  // Verify base branch exists on origin
  if (!(await git.hasRemoteBranch(baseBranch))) {
    throw new CliError(
      `Base branch "${baseBranch}" does not exist on origin. Cannot create a feature branch from a non-existent base.`
    );
  }

  // Switch to base branch and fast-forward
  console.log(`Switching to ${baseBranch}...`);
  try {
    if (await git.hasLocalBranch(baseBranch)) {
      await git.switchBranch(baseBranch);
    } else {
      await git.createTrackingBranch(baseBranch, `origin/${baseBranch}`);
    }
  } catch (err) {
    if (err instanceof GitError) {
      throw new CliError(`Cannot switch to ${baseBranch}: ${err.message}`);
    }
    throw err;
  }

  console.log(`Pulling ${baseBranch} (fast-forward only)...`);
  try {
    await git.pullFastForward(baseBranch);
  } catch (err) {
    if (err instanceof GitError) {
      throw new CliError(
        `Cannot fast-forward ${baseBranch}. The local branch may have diverged from origin. ` +
        `Do not merge, rebase, or force-pull manually.`
      );
    }
    throw err;
  }

  // Verify local equals origin
  const localSha = await git.revParse(baseBranch);
  const remoteSha = await git.revParse(`origin/${baseBranch}`);
  if (localSha !== remoteSha) {
    throw new CliError(
      `Local ${baseBranch} (${localSha.slice(0, 8)}) does not match ` +
      `origin/${baseBranch} (${remoteSha.slice(0, 8)}). Cannot create branch from stale base.`
    );
  }

  // Create the feature branch
  console.log(`Creating branch ${branchName}...`);
  await git.createBranch(branchName);

  // Verify we're on the new branch
  const current = await git.currentBranch();
  if (current !== branchName) {
    throw new CliError(
      `Expected to be on ${branchName} but ended up on ${current}.`
    );
  }

  console.log("");
  console.log(`Base branch: ${baseBranch} (${localSha.slice(0, 8)})`);
  console.log(`Created branch: ${branchName}`);
}
