import { describe, it, expect } from "vitest";
import {
  renderCommandMarkdown,
  renderCommandIndex,
  GENERATED_MARKER,
} from "../../src/cli/docs/render-command-markdown.js";
import type { CommandDefinition } from "../../src/cli/command-definition.js";
import { getCommand, getAllCommands } from "../../src/cli/command-registry.js";

const sampleCommand: CommandDefinition = {
  name: "test-cmd",
  summary: "A test command",
  usage: "dev test-cmd <arg>",
  positionalArgs: [
    { name: "arg", required: true, description: "Test argument." },
  ],
  options: [
    {
      flag: "--opt",
      valueName: "val",
      description: "An option.",
      required: false,
      allowedValues: ["a", "b"],
      defaultValue: "a",
    },
  ],
  examples: [
    { command: "dev test-cmd foo", description: "Runs with foo." },
  ],
  successBehavior: ["Prints result."],
  sideEffects: ["Writes a file."],
  failureCases: ["Invalid arg stops the command."],
  exitBehavior: { success: "Exits 0.", failure: "Exits 1." },
};

describe("renderCommandMarkdown", () => {
  it("starts with generated marker", () => {
    const md = renderCommandMarkdown(sampleCommand, "1.0.0");
    expect(md.startsWith(GENERATED_MARKER)).toBe(true);
  });

  it("includes version comment", () => {
    const md = renderCommandMarkdown(sampleCommand, "2.3.4");
    expect(md).toContain("<!-- Version: 2.3.4 -->");
  });

  it("includes command name as heading", () => {
    const md = renderCommandMarkdown(sampleCommand, "1.0.0");
    expect(md).toContain("# dev test-cmd");
  });

  it("includes usage block", () => {
    const md = renderCommandMarkdown(sampleCommand, "1.0.0");
    expect(md).toContain("dev test-cmd <arg>");
  });

  it("includes arguments table", () => {
    const md = renderCommandMarkdown(sampleCommand, "1.0.0");
    expect(md).toContain("| `arg` | Yes | Test argument. |");
  });

  it("includes options with allowed values", () => {
    const md = renderCommandMarkdown(sampleCommand, "1.0.0");
    expect(md).toContain("`a`, `b`");
  });

  it("includes examples", () => {
    const md = renderCommandMarkdown(sampleCommand, "1.0.0");
    expect(md).toContain("dev test-cmd foo");
    expect(md).toContain("Runs with foo.");
  });

  it("includes failure cases", () => {
    const md = renderCommandMarkdown(sampleCommand, "1.0.0");
    expect(md).toContain("Invalid arg stops the command.");
  });

  it("includes exit behavior", () => {
    const md = renderCommandMarkdown(sampleCommand, "1.0.0");
    expect(md).toContain("**Success:** Exits 0.");
    expect(md).toContain("**Failure:** Exits 1.");
  });

  it("produces stable output across calls", () => {
    const first = renderCommandMarkdown(sampleCommand, "1.0.0");
    const second = renderCommandMarkdown(sampleCommand, "1.0.0");
    expect(first).toBe(second);
  });
});

describe("renderCommandIndex", () => {
  it("starts with generated marker", () => {
    const md = renderCommandIndex([sampleCommand], "1.0.0");
    expect(md.startsWith(GENERATED_MARKER)).toBe(true);
  });

  it("includes version", () => {
    const md = renderCommandIndex([sampleCommand], "1.0.0");
    expect(md).toContain("Version: 1.0.0");
  });

  it("lists commands with links", () => {
    const md = renderCommandIndex([sampleCommand], "1.0.0");
    expect(md).toContain("[`dev test-cmd`](test-cmd.md)");
  });

  it("produces stable output", () => {
    const cmds = getAllCommands();
    const first = renderCommandIndex(cmds, "1.0.0");
    const second = renderCommandIndex(cmds, "1.0.0");
    expect(first).toBe(second);
  });
});

describe("start command documentation content", () => {
  const cmd = getCommand("start")!;
  const md = renderCommandMarkdown(cmd, "0.1.0");

  it("documents usage syntax", () => {
    expect(md).toContain(
      "dev start <TICKET> [description] [--type <type>] [--base <branch>]",
    );
  });

  it("documents required ticket", () => {
    expect(md).toContain("| `TICKET` | Yes |");
  });

  it("documents optional description", () => {
    expect(md).toContain("| `description` | No |");
  });

  it("documents all allowed work types", () => {
    expect(md).toContain("`feature`");
    expect(md).toContain("`bugfix`");
    expect(md).toContain("`fix`");
    expect(md).toContain("`hotfix`");
    expect(md).toContain("`chore`");
  });

  it("documents default base branch", () => {
    expect(md).toContain("`main`");
  });

  it("documents context/ exception", () => {
    expect(md).toContain("`context/`");
  });

  it("documents fetch and prune", () => {
    expect(md).toContain("fetch origin --prune");
  });

  it("documents fast-forward-only", () => {
    expect(md).toContain("fast-forward");
  });

  it("documents tracking branch creation", () => {
    expect(md).toContain("tracking branch");
  });

  it("documents branch not pushed", () => {
    expect(md).toContain("not automatically pushed");
  });

  it("documents exit behavior", () => {
    expect(md).toContain("Exits with code 0");
    expect(md).toContain("Exits with code 1");
  });
});
