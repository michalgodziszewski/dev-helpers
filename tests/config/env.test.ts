import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

const { dotenvConfig, existsSyncSpy } = vi.hoisted(() => {
  const dotenvConfig = vi.fn();
  let existsSyncResult = false;
  let capturedPath: string | undefined;
  const existsSyncSpy = {
    get result() { return existsSyncResult; },
    set result(v: boolean) { existsSyncResult = v; },
    get capturedPath() { return capturedPath; },
    fn: (path: string) => {
      capturedPath = path;
      return existsSyncResult;
    },
    reset() {
      existsSyncResult = false;
      capturedPath = undefined;
    },
  };
  return { dotenvConfig, existsSyncSpy };
});

vi.mock("dotenv", () => ({ config: dotenvConfig }));

vi.mock("node:fs", async () => {
  const actual = await vi.importActual<typeof import("node:fs")>("node:fs");
  return {
    ...actual,
    existsSync: (path: string) => existsSyncSpy.fn(path),
  };
});

import {
  loadDevEnv,
  resolveBaseBranch,
  resetDevEnvCache,
  FALLBACK_BASE_BRANCH,
} from "../../src/cli/config/env.js";

const ENV_KEY = "DEV_DEFAULT_BASE_BRANCH";

describe("env config", () => {
  const originalEnv = process.env[ENV_KEY];

  beforeEach(() => {
    resetDevEnvCache();
    delete process.env[ENV_KEY];
    dotenvConfig.mockReset();
    existsSyncSpy.reset();
  });

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env[ENV_KEY] = originalEnv;
    } else {
      delete process.env[ENV_KEY];
    }
  });

  describe("FALLBACK_BASE_BRANCH", () => {
    it("is trunk", () => {
      expect(FALLBACK_BASE_BRANCH).toBe("trunk");
    });
  });

  describe("loadDevEnv", () => {
    it("returns fallback when no env variable and no .env", () => {
      const env = loadDevEnv();
      expect(env.defaultBaseBranch).toBe("trunk");
    });

    it("returns value from process.env when set", () => {
      process.env[ENV_KEY] = "develop";
      const env = loadDevEnv();
      expect(env.defaultBaseBranch).toBe("develop");
    });

    it("calls dotenv when .env exists", () => {
      existsSyncSpy.result = true;
      loadDevEnv();
      expect(dotenvConfig).toHaveBeenCalledTimes(1);
      expect(dotenvConfig).toHaveBeenCalledWith({
        path: expect.stringContaining(".env"),
      });
    });

    it("does not call dotenv when .env is missing", () => {
      loadDevEnv();
      expect(dotenvConfig).not.toHaveBeenCalled();
    });

    it("resolves .env path to project root, not dist", () => {
      existsSyncSpy.result = true;
      loadDevEnv();
      expect(existsSyncSpy.capturedPath).toBeDefined();
      expect(existsSyncSpy.capturedPath!.endsWith(".env")).toBe(true);
      expect(existsSyncSpy.capturedPath!).not.toContain("dist");
    });

    it("returns fallback when env variable is empty string", () => {
      process.env[ENV_KEY] = "";
      const env = loadDevEnv();
      expect(env.defaultBaseBranch).toBe("trunk");
    });

    it("caches result on second call", () => {
      existsSyncSpy.result = true;
      const first = loadDevEnv();
      const second = loadDevEnv();
      expect(first).toBe(second);
      expect(dotenvConfig).toHaveBeenCalledTimes(1);
    });

    it("reloads after resetDevEnvCache", () => {
      existsSyncSpy.result = true;
      loadDevEnv();
      resetDevEnvCache();
      loadDevEnv();
      expect(dotenvConfig).toHaveBeenCalledTimes(2);
    });

    it("process env takes precedence over dotenv", () => {
      process.env[ENV_KEY] = "from-system";
      existsSyncSpy.result = true;
      const env = loadDevEnv();
      expect(env.defaultBaseBranch).toBe("from-system");
    });
  });

  describe("resolveBaseBranch", () => {
    it("returns CLI value when provided", () => {
      const env = { defaultBaseBranch: "main" };
      expect(resolveBaseBranch("release-1.0", env)).toBe("release-1.0");
    });

    it("returns env default when CLI is undefined", () => {
      const env = { defaultBaseBranch: "main" };
      expect(resolveBaseBranch(undefined, env)).toBe("main");
    });

    it("CLI value wins over env default", () => {
      const env = { defaultBaseBranch: "main" };
      expect(resolveBaseBranch("develop", env)).toBe("develop");
    });
  });
});
