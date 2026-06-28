import { execFile } from "node:child_process";

export interface GitResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

export class GitError extends Error {
  readonly exitCode: number;
  readonly stderr: string;

  constructor(operation: string, exitCode: number, stderr: string) {
    const detail = stderr.trim() || `exit code ${exitCode}`;
    super(`Git ${operation} failed: ${detail}`);
    this.name = "GitError";
    this.exitCode = exitCode;
    this.stderr = stderr;
  }
}

export class GitClient {
  private readonly cwd: string;

  constructor(cwd?: string) {
    this.cwd = cwd ?? process.cwd();
  }

  private run(args: string[]): Promise<GitResult> {
    return new Promise((resolve, reject) => {
      execFile("git", args, { cwd: this.cwd }, (error, stdout, stderr) => {
        if (error && error.code === "ENOENT") {
          reject(new Error("git is not installed or not in PATH"));
          return;
        }
        const exitCode = error?.code != null && typeof error.code === "number"
          ? error.code
          : (error ? 1 : 0);
        resolve({ stdout: stdout.toString(), stderr: stderr.toString(), exitCode });
      });
    });
  }

  private async runOrThrow(operation: string, args: string[]): Promise<string> {
    const result = await this.run(args);
    if (result.exitCode !== 0) {
      throw new GitError(operation, result.exitCode, result.stderr);
    }
    return result.stdout.trimEnd();
  }

  async fetchAndPrune(): Promise<void> {
    await this.runOrThrow("fetch", ["fetch", "origin", "--prune"]);
  }

  async switchBranch(branch: string): Promise<void> {
    await this.runOrThrow("switch", ["switch", branch]);
  }

  async createTrackingBranch(branch: string, remote: string): Promise<void> {
    await this.runOrThrow("create tracking branch", [
      "switch", "--track", "-c", branch, remote,
    ]);
  }

  async pullFastForward(branch: string): Promise<void> {
    await this.runOrThrow("pull", ["pull", "--ff-only", "origin", branch]);
  }

  async revParse(ref: string): Promise<string> {
    return this.runOrThrow("rev-parse", ["rev-parse", ref]);
  }

  async createBranch(name: string): Promise<void> {
    await this.runOrThrow("create branch", ["switch", "-c", name]);
  }

  async hasLocalBranch(name: string): Promise<boolean> {
    const result = await this.run(["rev-parse", "--verify", `refs/heads/${name}`]);
    return result.exitCode === 0;
  }

  async hasRemoteBranch(name: string): Promise<boolean> {
    const result = await this.run(["rev-parse", "--verify", `refs/remotes/origin/${name}`]);
    return result.exitCode === 0;
  }

  async status(): Promise<string> {
    return this.runOrThrow("status", ["status", "--porcelain"]);
  }

  async currentBranch(): Promise<string> {
    return this.runOrThrow("current branch", ["branch", "--show-current"]);
  }

  async checkRefFormat(name: string): Promise<boolean> {
    const result = await this.run(["check-ref-format", "--branch", name]);
    return result.exitCode === 0;
  }
}
