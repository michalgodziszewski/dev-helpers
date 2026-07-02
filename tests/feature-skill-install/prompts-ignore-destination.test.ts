import { describe, it, expect } from "vitest";
import {
  promptContextIgnoreDestination,
  promptClaudeIgnoreDestination,
  promptClaudeMdDestination,
} from "../../src/cli/feature-skill-install/prompts.js";

function scriptedAsk(answers: string[]): (question: string) => Promise<string> {
  let i = 0;
  return async () => answers[i++] ?? "";
}

describe("promptContextIgnoreDestination", () => {
  it("returns gitignore for choice 1", async () => {
    expect(await promptContextIgnoreDestination(scriptedAsk(["1"]))).toBe("gitignore");
  });

  it("returns exclude for choice 2", async () => {
    expect(await promptContextIgnoreDestination(scriptedAsk(["2"]))).toBe("exclude");
  });

  it("reprompts on an invalid choice", async () => {
    expect(await promptContextIgnoreDestination(scriptedAsk(["x", "2"]))).toBe("exclude");
  });
});

describe("promptClaudeIgnoreDestination", () => {
  it("returns track for choice 1", async () => {
    expect(await promptClaudeIgnoreDestination(scriptedAsk(["1"]))).toBe("track");
  });

  it("returns gitignore for choice 2", async () => {
    expect(await promptClaudeIgnoreDestination(scriptedAsk(["2"]))).toBe("gitignore");
  });

  it("returns exclude for choice 3", async () => {
    expect(await promptClaudeIgnoreDestination(scriptedAsk(["3"]))).toBe("exclude");
  });

  it("reprompts on an invalid choice", async () => {
    expect(await promptClaudeIgnoreDestination(scriptedAsk(["x", "1"]))).toBe("track");
  });
});

describe("promptClaudeMdDestination", () => {
  it("returns track for choice 1", async () => {
    expect(await promptClaudeMdDestination(scriptedAsk(["1"]))).toBe("track");
  });

  it("returns gitignore for choice 2", async () => {
    expect(await promptClaudeMdDestination(scriptedAsk(["2"]))).toBe("gitignore");
  });

  it("returns exclude for choice 3", async () => {
    expect(await promptClaudeMdDestination(scriptedAsk(["3"]))).toBe("exclude");
  });
});
