import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { GitClient } from "../../src/cli/git/git-client.js";

function git(cwd: string, ...args: string[]): string {
  return execFileSync("git", args, { cwd, encoding: "utf8" }).trimEnd();
}

function createBareRemote(): string {
  const dir = mkdtempSync(join(tmpdir(), "remote-"));
  git(dir, "init", "--bare");
  return dir;
}

function cloneRepo(remote: string): string {
  const dir = mkdtempSync(join(tmpdir(), "clone-"));
  git(dir, "clone", remote, ".");
  git(dir, "config", "user.email", "test@test.com");
  git(dir, "config", "user.name", "Test");
  // Create initial commit on main
  writeFileSync(join(dir, "README.md"), "# Test\n");
  git(dir, "add", ".");
  git(dir, "commit", "-m", "initial");
  git(dir, "push", "origin", "HEAD:main");
  git(dir, "branch", "-M", "main");
  git(dir, "branch", "--set-upstream-to=origin/main", "main");
  return dir;
}

describe("start command integration", () => {
  let remote: string;
  let local: string;
  let client: GitClient;

  beforeEach(() => {
    remote = createBareRemote();
    local = cloneRepo(remote);
    client = new GitClient(local);
  });

  afterEach(() => {
    rmSync(remote, { recursive: true, force: true });
    rmSync(local, { recursive: true, force: true });
  });

  it("creates a branch from a freshly synchronized main", async () => {
    await client.fetchAndPrune();
    await client.pullFastForward("main");
    const localSha = await client.revParse("main");
    const remoteSha = await client.revParse("origin/main");
    expect(localSha).toBe(remoteSha);

    await client.createBranch("feature/LSG-12345");
    const current = await client.currentBranch();
    expect(current).toBe("feature/LSG-12345");
  });

  it("detects dirty working tree", async () => {
    writeFileSync(join(local, "dirty.txt"), "uncommitted");
    const status = await client.status();
    expect(status).toContain("dirty.txt");
  });

  it("ignores context/ changes in status filtering", async () => {
    mkdirSync(join(local, "context"), { recursive: true });
    writeFileSync(join(local, "context", "state.md"), "runtime");
    const status = await client.status();
    const lines = status
      .split("\n")
      .filter(Boolean)
      .map((l) => l.slice(3))
      .filter((p) => !p.startsWith("context/"));
    expect(lines).toHaveLength(0);
  });

  it("detects existing local branch", async () => {
    git(local, "branch", "feature/LSG-999");
    const exists = await client.hasLocalBranch("feature/LSG-999");
    expect(exists).toBe(true);
  });

  it("detects existing remote branch", async () => {
    git(local, "checkout", "-b", "feature/LSG-999");
    git(local, "push", "origin", "feature/LSG-999");
    git(local, "checkout", "main");
    await client.fetchAndPrune();
    const exists = await client.hasRemoteBranch("feature/LSG-999");
    expect(exists).toBe(true);
  });

  it("reports non-existent local branch as false", async () => {
    const exists = await client.hasLocalBranch("feature/NOPE-1");
    expect(exists).toBe(false);
  });

  it("fast-forward pull succeeds when up to date", async () => {
    await client.fetchAndPrune();
    await expect(client.pullFastForward("main")).resolves.not.toThrow();
  });

  it("fast-forward pull succeeds when behind origin", async () => {
    // Push a new commit from another clone that reuses the existing remote
    const otherDir = mkdtempSync(join(tmpdir(), "other-"));
    git(otherDir, "clone", remote, ".");
    git(otherDir, "checkout", "main");
    git(otherDir, "config", "user.email", "test@test.com");
    git(otherDir, "config", "user.name", "Test");
    writeFileSync(join(otherDir, "new.txt"), "data");
    git(otherDir, "add", ".");
    git(otherDir, "commit", "-m", "new commit");
    git(otherDir, "push", "origin", "main");
    rmSync(otherDir, { recursive: true, force: true });

    await client.fetchAndPrune();
    await expect(client.pullFastForward("main")).resolves.not.toThrow();
  });
});
