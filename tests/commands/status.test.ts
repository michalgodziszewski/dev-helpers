import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { CliError } from "../../src/cli/utils/errors.js";

// Disable colors in tests for predictable assertions
const originalNoColor = process.env["NO_COLOR"];
beforeEach(() => { process.env["NO_COLOR"] = "1"; });
afterEach(() => {
  if (originalNoColor === undefined) delete process.env["NO_COLOR"];
  else process.env["NO_COLOR"] = originalNoColor;
});

// Mock the env config before importing status
vi.mock("../../src/cli/config/env.js", () => {
  return {
    FALLBACK_BASE_BRANCH: "trunk",
    loadDevEnv: vi.fn().mockReturnValue({ defaultBaseBranch: "main" }),
    resolveBaseBranch: vi.fn().mockImplementation(
      (cliValue: string | undefined, env: { defaultBaseBranch: string }) =>
        cliValue ?? env.defaultBaseBranch,
    ),
    resetDevEnvCache: vi.fn(),
  };
});

// Mock the git client before importing status
const mockClient = {
  isInsideWorkTree: vi.fn().mockResolvedValue(true),
  repositoryName: vi.fn().mockResolvedValue("my-project"),
  currentBranch: vi.fn().mockResolvedValue("feature/add-status"),
  status: vi.fn().mockResolvedValue(""),
  fetchAndPrune: vi.fn().mockResolvedValue(undefined),
  trackingBranch: vi.fn().mockResolvedValue(undefined),
  aheadBehind: vi.fn().mockResolvedValue({ ahead: 0, behind: 0 }),
  hasLocalBranch: vi.fn().mockResolvedValue(true),
  hasRemoteBranch: vi.fn().mockResolvedValue(true),
};

vi.mock("../../src/cli/git/git-client.js", () => {
  return {
    GitClient: class MockGitClient {
      isInsideWorkTree = mockClient.isInsideWorkTree;
      repositoryName = mockClient.repositoryName;
      currentBranch = mockClient.currentBranch;
      status = mockClient.status;
      fetchAndPrune = mockClient.fetchAndPrune;
      trackingBranch = mockClient.trackingBranch;
      aheadBehind = mockClient.aheadBehind;
      hasLocalBranch = mockClient.hasLocalBranch;
      hasRemoteBranch = mockClient.hasRemoteBranch;
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

import { run } from "../../src/cli/commands/status.js";

const mock = mockClient;
let logSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  vi.clearAllMocks();
  mock.isInsideWorkTree.mockResolvedValue(true);
  mock.repositoryName.mockResolvedValue("my-project");
  mock.currentBranch.mockResolvedValue("feature/add-status");
  mock.status.mockResolvedValue("");
  mock.fetchAndPrune.mockResolvedValue(undefined);
  mock.trackingBranch.mockResolvedValue(undefined);
  mock.aheadBehind.mockResolvedValue({ ahead: 0, behind: 0 });
  mock.hasLocalBranch.mockResolvedValue(true);
  mock.hasRemoteBranch.mockResolvedValue(true);
  logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
});

afterEach(() => {
  logSpy.mockRestore();
});

describe("status command", () => {
  it("shows repository info and clean working tree", async () => {
    await run([]);
    const output = logSpy.mock.calls.map((c) => c[0]).join("\n");
    expect(output).toContain("Repository:");
    expect(output).toContain("my-project");
    expect(output).toContain("Current branch:");
    expect(output).toContain("feature/add-status");
    expect(output).toContain("Base branch:");
    expect(output).toContain("main");
    expect(output).toContain("Working tree:");
    expect(output).toContain("clean");
  });

  it("throws when not in a git repository", async () => {
    mock.isInsideWorkTree.mockResolvedValue(false);
    await expect(run([])).rejects.toThrow(CliError);
  });

  it("shows warning for dirty working tree", async () => {
    mock.status.mockResolvedValue(" M src/index.ts\n M src/app.ts\n");
    await run([]);
    const output = logSpy.mock.calls.map((c) => c[0]).join("\n");
    expect(output).toContain("has local changes");
    expect(output).toContain("2 files");
  });

  it("ignores context/ changes in working tree", async () => {
    mock.status.mockResolvedValue(" M context/current-feature.md\n");
    await run([]);
    const output = logSpy.mock.calls.map((c) => c[0]).join("\n");
    expect(output).toContain("clean");
  });

  it("shows tracking branch when configured", async () => {
    mock.trackingBranch.mockResolvedValue("origin/feature/add-status");
    await run([]);
    const output = logSpy.mock.calls.map((c) => c[0]).join("\n");
    expect(output).toContain("Tracking branch:");
    expect(output).toContain("origin/feature/add-status");
  });

  it("shows warning when tracking branch is not configured", async () => {
    mock.trackingBranch.mockResolvedValue(undefined);
    await run([]);
    const output = logSpy.mock.calls.map((c) => c[0]).join("\n");
    expect(output).toContain("Tracking branch:");
    expect(output).toContain("not configured");
  });

  it("shows remote sync when up to date", async () => {
    mock.trackingBranch.mockResolvedValue("origin/feature/add-status");
    mock.aheadBehind.mockResolvedValue({ ahead: 0, behind: 0 });
    await run([]);
    const output = logSpy.mock.calls.map((c) => c[0]).join("\n");
    expect(output).toContain("Remote sync:");
    expect(output).toContain("up to date");
  });

  it("shows remote sync warning when ahead and behind", async () => {
    mock.trackingBranch.mockResolvedValue("origin/feature/add-status");
    mock.aheadBehind.mockResolvedValue({ ahead: 2, behind: 1 });
    await run([]);
    const output = logSpy.mock.calls.map((c) => c[0]).join("\n");
    expect(output).toContain("2 commits ahead");
    expect(output).toContain("1 commit behind");
  });

  it("shows base comparison ahead count", async () => {
    mock.aheadBehind.mockResolvedValue({ ahead: 3, behind: 0 });
    await run([]);
    const output = logSpy.mock.calls.map((c) => c[0]).join("\n");
    expect(output).toContain("Base comparison:");
    expect(output).toContain("3 commits ahead");
  });

  it("shows error when base branch not found", async () => {
    mock.hasLocalBranch.mockResolvedValue(false);
    mock.hasRemoteBranch.mockResolvedValue(false);
    await run([]);
    const output = logSpy.mock.calls.map((c) => c[0]).join("\n");
    expect(output).toContain("Base branch not found");
  });

  it("uses explicit --base option", async () => {
    await run(["--base", "release-1.78.0"]);
    const output = logSpy.mock.calls.map((c) => c[0]).join("\n");
    expect(output).toContain("release-1.78.0");
  });

  it("throws when --base has no value", async () => {
    await expect(run(["--base"])).rejects.toThrow(/--base requires/);
  });

  it("fetches when --fetch is provided", async () => {
    await run(["--fetch"]);
    expect(mock.fetchAndPrune).toHaveBeenCalled();
    const output = logSpy.mock.calls.map((c) => c[0]).join("\n");
    expect(output).toContain("Fetch:");
    expect(output).toContain("completed");
  });

  it("does not fetch by default", async () => {
    await run([]);
    expect(mock.fetchAndPrune).not.toHaveBeenCalled();
  });

  it("shows fetch error when fetch fails", async () => {
    const { GitError } = await import("../../src/cli/git/git-client.js");
    mock.fetchAndPrune.mockRejectedValue(new GitError("fetch", 1, "network error"));
    await run(["--fetch"]);
    const output = logSpy.mock.calls.map((c) => c[0]).join("\n");
    expect(output).toContain("Fetch failed");
  });

  it("throws on unknown argument", async () => {
    await expect(run(["--unknown"])).rejects.toThrow(/Unknown argument/);
  });

  it("uses --fetch and --base together", async () => {
    await run(["--fetch", "--base", "release-1.78.0"]);
    expect(mock.fetchAndPrune).toHaveBeenCalled();
    const output = logSpy.mock.calls.map((c) => c[0]).join("\n");
    expect(output).toContain("release-1.78.0");
  });

  it("uses singular commit for count of 1", async () => {
    mock.trackingBranch.mockResolvedValue("origin/feature/add-status");
    mock.aheadBehind.mockResolvedValue({ ahead: 1, behind: 0 });
    await run([]);
    const output = logSpy.mock.calls.map((c) => c[0]).join("\n");
    expect(output).toContain("1 commit ahead");
    expect(output).not.toContain("1 commits");
  });
});
