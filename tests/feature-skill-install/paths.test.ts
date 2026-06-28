import { describe, it, expect } from "vitest";
import path from "node:path";
import { resolveDestinationPath } from "../../src/cli/feature-skill-install/paths.js";

describe("resolveDestinationPath", () => {
  it("resolves global to home/.claude/skills/feature", () => {
    const result = resolveDestinationPath("global", "/project", "/home/user");
    expect(result).toBe(path.join("/home/user", ".claude", "skills", "feature"));
  });

  it("resolves project to project/.claude/skills/feature", () => {
    const result = resolveDestinationPath("project", "/my/project", "/home/user");
    expect(result).toBe(path.join("/my/project", ".claude", "skills", "feature"));
  });
});
