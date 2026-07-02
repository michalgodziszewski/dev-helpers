import { describe, it, expect } from "vitest";
import { renderSummary } from "../../src/cli/feature-skill-install/installation-summary.js";
import type { InstallResult } from "../../src/cli/feature-skill-install/types.js";

describe("renderSummary", () => {
  it("renders a complete summary", () => {
    const result: InstallResult = {
      skillScope: "project",
      skillDestination: "/project/.claude/skills/feature",
      entries: [
        { status: "created", path: ".claude/skills/feature", detail: "Feature skill installed" },
        { status: "exists", path: "context" },
        { status: "copied", path: "context/ai-interaction.md" },
      ],
      codingStandards: "Next.js",
      incomplete: false,
    };

    const output = renderSummary(result);
    expect(output).toContain("project");
    expect(output).toContain("[created]");
    expect(output).toContain("[exists]");
    expect(output).toContain("[copied]");
    expect(output).toContain("Next.js");
  });

  it("shows incomplete warning when items are blocked or skipped", () => {
    const result: InstallResult = {
      skillScope: "global",
      skillDestination: "/home/.claude/skills/feature",
      entries: [{ status: "skipped", path: "context/coding-standards.md", detail: "Selection cancelled" }],
      codingStandards: null,
      incomplete: true,
    };

    const output = renderSummary(result);
    expect(output).toContain("incomplete");
  });
});
