import { describe, it, expect, vi, beforeEach } from "vitest";
import { CliError } from "../../src/cli/utils/errors.js";

// Mock the git client before importing start
const mockClient = {
  status: vi.fn().mockResolvedValue(""),
  hasLocalBranch: vi.fn().mockResolvedValue(false),
  hasRemoteBranch: vi.fn().mockImplementation(async (name: string) => {
    // Base branches exist on origin, work branches do not
    return !(/^(feature|bugfix|fix|hotfix|chore)\//.test(name));
  }),
  fetchAndPrune: vi.fn().mockResolvedValue(undefined),
  switchBranch: vi.fn().mockResolvedValue(undefined),
  createTrackingBranch: vi.fn().mockResolvedValue(undefined),
  pullFastForward: vi.fn().mockResolvedValue(undefined),
  revParse: vi.fn().mockResolvedValue("abc1234"),
  createBranch: vi.fn().mockResolvedValue(undefined),
  currentBranch: vi.fn().mockResolvedValue("feature/LSG-12345"),
  checkRefFormat: vi.fn().mockResolvedValue(true),
};

vi.mock("../../src/cli/git/git-client.js", () => {
  return {
    GitClient: class MockGitClient {
      status = mockClient.status;
      hasLocalBranch = mockClient.hasLocalBranch;
      hasRemoteBranch = mockClient.hasRemoteBranch;
      fetchAndPrune = mockClient.fetchAndPrune;
      switchBranch = mockClient.switchBranch;
      createTrackingBranch = mockClient.createTrackingBranch;
      pullFastForward = mockClient.pullFastForward;
      revParse = mockClient.revParse;
      createBranch = mockClient.createBranch;
      currentBranch = mockClient.currentBranch;
      checkRefFormat = mockClient.checkRefFormat;
    },
    GitError: class GitError extends Error {
      exitCode: number;
      stderr: string;
      constructor(op: string, code: number, stderr: string) {
        super(`Git ${op} failed: ${stderr}`);
        this.name = "GitError";
        this.exitCode = code;
        this.stderr = stderr;
      }
    },
  };
});

import { run } from "../../src/cli/commands/start.js";

const mock = mockClient;

beforeEach(() => {
  vi.clearAllMocks();
  mock.status.mockResolvedValue("");
  mock.hasLocalBranch.mockResolvedValue(false);
  mock.hasRemoteBranch.mockImplementation(async (name: string) => {
    return !(/^(feature|bugfix|fix|hotfix|chore)\//.test(name));
  });
  mock.fetchAndPrune.mockResolvedValue(undefined);
  mock.switchBranch.mockResolvedValue(undefined);
  mock.pullFastForward.mockResolvedValue(undefined);
  mock.revParse.mockResolvedValue("abc1234");
  mock.createBranch.mockResolvedValue(undefined);
  mock.currentBranch.mockResolvedValue("feature/LSG-12345");
  mock.checkRefFormat.mockResolvedValue(true);
});

describe("start command", () => {
  it("throws CliError when no arguments given", async () => {
    await expect(run([])).rejects.toThrow(CliError);
  });

  it("throws CliError for invalid ticket", async () => {
    await expect(run(["invalid"])).rejects.toThrow(CliError);
  });

  it("creates branch without description", async () => {
    mock.currentBranch.mockResolvedValue("feature/LSG-12345");
    await run(["LSG-12345"]);
    expect(mock.createBranch).toHaveBeenCalledWith("feature/LSG-12345");
  });

  it("creates branch with description", async () => {
    mock.currentBranch.mockResolvedValue("feature/LSG-12345-add-user-search");
    await run(["LSG-12345", "add", "user", "search"]);
    expect(mock.createBranch).toHaveBeenCalledWith(
      "feature/LSG-12345-add-user-search"
    );
  });

  it("stops when working tree has changes outside context/", async () => {
    mock.status.mockResolvedValue(" M src/index.ts\n");
    await expect(run(["LSG-12345"])).rejects.toThrow(
      /Working tree is not clean/
    );
    expect(mock.fetchAndPrune).not.toHaveBeenCalled();
  });

  it("allows changes inside context/", async () => {
    mock.status.mockResolvedValue(" M context/current-feature.md\n");
    mock.currentBranch.mockResolvedValue("feature/LSG-12345");
    await run(["LSG-12345"]);
    expect(mock.createBranch).toHaveBeenCalled();
  });

  it("stops when local branch already exists", async () => {
    mock.hasLocalBranch.mockResolvedValue(true);
    await expect(run(["LSG-12345"])).rejects.toThrow(/already exists locally/);
  });

  it("stops when remote branch already exists", async () => {
    mock.hasRemoteBranch.mockResolvedValue(true); // all branches exist on remote
    await expect(run(["LSG-12345"])).rejects.toThrow(
      /already exists on origin/
    );
  });

  it("fetches, switches, pulls, and verifies before creating branch", async () => {
    // hasLocalBranch returns false for the feature branch but true for main
    mock.hasLocalBranch.mockImplementation(async (name: string) => name === "main");
    mock.currentBranch.mockResolvedValue("feature/LSG-12345");
    await run(["LSG-12345"]);

    expect(mock.status).toHaveBeenCalled();
    expect(mock.fetchAndPrune).toHaveBeenCalled();
    expect(mock.switchBranch).toHaveBeenCalledWith("main");
    expect(mock.pullFastForward).toHaveBeenCalledWith("main");
    expect(mock.revParse).toHaveBeenCalledWith("main");
    expect(mock.revParse).toHaveBeenCalledWith("origin/main");
    expect(mock.createBranch).toHaveBeenCalledWith("feature/LSG-12345");
  });

  it("stops when local and remote SHAs differ", async () => {
    mock.revParse
      .mockResolvedValueOnce("aaa1111")
      .mockResolvedValueOnce("bbb2222");
    await expect(run(["LSG-12345"])).rejects.toThrow(/does not match/);
    expect(mock.createBranch).not.toHaveBeenCalled();
  });

  it("uses main as default base when --base is omitted", async () => {
    mock.hasLocalBranch.mockImplementation(async (name: string) => name === "main");
    mock.currentBranch.mockResolvedValue("feature/LSG-12345");
    await run(["LSG-12345"]);
    expect(mock.switchBranch).toHaveBeenCalledWith("main");
    expect(mock.pullFastForward).toHaveBeenCalledWith("main");
  });

  it("uses explicit --base branch", async () => {
    mock.hasLocalBranch.mockImplementation(async (name: string) => name === "release-1.78.0");
    mock.currentBranch.mockResolvedValue("feature/LSG-12346");
    await run(["LSG-12346", "--base", "release-1.78.0"]);
    expect(mock.switchBranch).toHaveBeenCalledWith("release-1.78.0");
    expect(mock.pullFastForward).toHaveBeenCalledWith("release-1.78.0");
    expect(mock.revParse).toHaveBeenCalledWith("release-1.78.0");
    expect(mock.revParse).toHaveBeenCalledWith("origin/release-1.78.0");
  });

  it("uses --base with description", async () => {
    mock.currentBranch.mockResolvedValue("feature/LSG-12347-fix-release-behavior");
    await run(["LSG-12347", "fix", "release", "behavior", "--base", "release-1.78.0"]);
    expect(mock.createBranch).toHaveBeenCalledWith("feature/LSG-12347-fix-release-behavior");
    expect(mock.pullFastForward).toHaveBeenCalledWith("release-1.78.0");
  });

  it("stops when --base has no value", async () => {
    await expect(run(["LSG-12345", "--base"])).rejects.toThrow(/--base requires/);
  });

  it("stops when --base value is invalid git ref", async () => {
    mock.checkRefFormat.mockResolvedValue(false);
    await expect(run(["LSG-12345", "--base", "invalid..name"])).rejects.toThrow(
      /not a valid Git branch name/
    );
  });

  it("stops when base branch does not exist on origin", async () => {
    mock.hasRemoteBranch.mockResolvedValue(false); // nothing exists on remote
    await expect(run(["LSG-12345", "--base", "nonexistent"])).rejects.toThrow(
      /does not exist on origin/
    );
  });

  it("creates tracking branch when base does not exist locally", async () => {
    mock.hasLocalBranch.mockResolvedValue(false); // no local branches
    mock.currentBranch.mockResolvedValue("feature/LSG-12345");
    await run(["LSG-12345"]);
    expect(mock.createTrackingBranch).toHaveBeenCalledWith("main", "origin/main");
  });

  it("uses feature as default type when --type is omitted", async () => {
    mock.currentBranch.mockResolvedValue("feature/LSG-12345");
    await run(["LSG-12345"]);
    expect(mock.createBranch).toHaveBeenCalledWith("feature/LSG-12345");
  });

  it("uses fix type with --type fix", async () => {
    mock.currentBranch.mockResolvedValue("fix/LSG-12348-fix-timeout");
    await run(["LSG-12348", "fix", "timeout", "--type", "fix"]);
    expect(mock.createBranch).toHaveBeenCalledWith("fix/LSG-12348-fix-timeout");
  });

  it("uses --type with --base together", async () => {
    mock.currentBranch.mockResolvedValue("fix/LSG-12348-fix-timeout");
    await run(["LSG-12348", "fix", "timeout", "--type", "fix", "--base", "release-1.78.0"]);
    expect(mock.createBranch).toHaveBeenCalledWith("fix/LSG-12348-fix-timeout");
    expect(mock.pullFastForward).toHaveBeenCalledWith("release-1.78.0");
  });

  it.each(["bugfix", "hotfix", "chore"] as const)("accepts --type %s", async (type) => {
    mock.currentBranch.mockResolvedValue(`${type}/LSG-1`);
    await run(["LSG-1", "--type", type]);
    expect(mock.createBranch).toHaveBeenCalledWith(`${type}/LSG-1`);
  });

  it("stops when --type has no value", async () => {
    await expect(run(["LSG-12345", "--type"])).rejects.toThrow(/--type requires/);
  });

  it("stops when --type value is invalid", async () => {
    await expect(run(["LSG-12345", "--type", "patch"])).rejects.toThrow(
      /Invalid work type/
    );
  });
});
