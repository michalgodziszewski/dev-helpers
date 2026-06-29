import { describe, it, expect } from "vitest";
import { renderTopLevelHelp, renderCommandHelp } from "../../src/cli/help/render-help.js";
import { getCommand } from "../../src/cli/command-registry.js";

describe("renderTopLevelHelp", () => {
  it("includes usage line", () => {
    expect(renderTopLevelHelp()).toContain("Usage: dev <command>");
  });

  it("includes start command from registry", () => {
    const help = renderTopLevelHelp();
    expect(help).toContain("start");
    expect(help).toContain("Create a Git work branch");
  });

  it("includes footer", () => {
    expect(renderTopLevelHelp()).toContain("Run `dev <command>`");
  });
});

describe("renderCommandHelp", () => {
  const cmd = getCommand("start")!;

  it("includes usage line", () => {
    const help = renderCommandHelp(cmd);
    expect(help).toContain(cmd.usage);
  });

  it("includes summary", () => {
    const help = renderCommandHelp(cmd);
    expect(help).toContain(cmd.summary);
  });

  it("includes examples", () => {
    const help = renderCommandHelp(cmd);
    for (const ex of cmd.examples) {
      expect(help).toContain(ex.command);
    }
  });

  it("includes option defaults", () => {
    const help = renderCommandHelp(cmd);
    expect(help).toContain("default: trunk");
    expect(help).toContain("default: feature");
  });
});
