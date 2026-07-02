import { describe, it, expect } from "vitest";
import { applyModelOverride } from "../../src/cli/feature-skill-install/model-override.js";

describe("applyModelOverride", () => {
  it("rewrites a sonnet alias to the override literal", () => {
    const content = "---\nname: test\nmodel: sonnet\ncolor: yellow\n---\n";
    const result = applyModelOverride(content, {
      sonnet: "eu.anthropic.claude-sonnet-4-6",
      haiku: "eu.anthropic.claude-haiku-4-5-20251001-v1:0",
    });
    expect(result).toContain("model: eu.anthropic.claude-sonnet-4-6");
    expect(result).not.toContain("model: sonnet");
  });

  it("rewrites a haiku alias to the override literal", () => {
    const content = "---\nname: git-verify\nmodel: haiku\n---\n";
    const result = applyModelOverride(content, {
      sonnet: "eu.anthropic.claude-sonnet-4-6",
      haiku: "eu.anthropic.claude-haiku-4-5-20251001-v1:0",
    });
    expect(result).toContain("model: eu.anthropic.claude-haiku-4-5-20251001-v1:0");
  });

  it("leaves content unchanged when no model line matches", () => {
    const content = "---\nname: docs-sync\ncolor: orange\n---\n";
    const result = applyModelOverride(content, { sonnet: "x", haiku: "y" });
    expect(result).toBe(content);
  });
});
