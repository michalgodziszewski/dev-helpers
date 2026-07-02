import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { applyProfileToAgents } from "../../src/cli/feature-skill-install/model-toggle.js";

let tmpDir: string;
let agentsDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "fsi-mt-"));
  agentsDir = path.join(tmpDir, ".claude", "agents");
  fs.mkdirSync(agentsDir, { recursive: true });
  fs.writeFileSync(path.join(agentsDir, "test.md"), "---\nmodel: sonnet\n---\n");
  fs.writeFileSync(path.join(agentsDir, "git-verify.md"), "---\nmodel: haiku\n---\n");
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe("applyProfileToAgents", () => {
  it("rewrites model: lines according to each agent's fixed alias role", () => {
    const entries = applyProfileToAgents(agentsDir, {
      sonnet: "eu.anthropic.claude-sonnet-4-6",
      haiku: "eu.anthropic.claude-haiku-4-5-20251001-v1:0",
    });

    expect(fs.readFileSync(path.join(agentsDir, "test.md"), "utf-8")).toContain(
      "model: eu.anthropic.claude-sonnet-4-6",
    );
    expect(fs.readFileSync(path.join(agentsDir, "git-verify.md"), "utf-8")).toContain(
      "model: eu.anthropic.claude-haiku-4-5-20251001-v1:0",
    );
    expect(entries.find((e) => e.path === ".claude/agents/test.md")?.status).toBe("created");
  });

  it("switches back to plain aliases when applying the default profile", () => {
    applyProfileToAgents(agentsDir, { sonnet: "eu.anthropic.claude-sonnet-4-6", haiku: "eu.anthropic.claude-haiku-4-5-20251001-v1:0" });
    applyProfileToAgents(agentsDir, { sonnet: "sonnet", haiku: "haiku" });

    expect(fs.readFileSync(path.join(agentsDir, "test.md"), "utf-8")).toContain("model: sonnet");
    expect(fs.readFileSync(path.join(agentsDir, "git-verify.md"), "utf-8")).toContain("model: haiku");
  });

  it("reports skipped for agents not installed", () => {
    const entries = applyProfileToAgents(agentsDir, { sonnet: "s", haiku: "h" });
    const explain = entries.find((e) => e.path === ".claude/agents/explain.md");
    expect(explain?.status).toBe("skipped");
  });

  it("reports blocked when the agents directory does not exist", () => {
    const entries = applyProfileToAgents(path.join(tmpDir, "missing"), { sonnet: "s", haiku: "h" });
    expect(entries).toHaveLength(1);
    expect(entries[0].status).toBe("blocked");
  });
});
