import { describe, it, expect } from "vitest";
import {
  promptModelOverride,
  promptCreateModelProfile,
  BEDROCK_EU_DEFAULT_OVERRIDE,
} from "../../src/cli/feature-skill-install/prompts.js";

function scriptedAsk(answers: string[]): (question: string) => Promise<string> {
  let i = 0;
  return async () => answers[i++] ?? "";
}

describe("promptModelOverride", () => {
  it("returns null when the user declines an override", async () => {
    const choice = await promptModelOverride(scriptedAsk(["n"]));
    expect(choice).toBeNull();
  });

  it("fills in the Bedrock EU defaults when the user presses Enter on every follow-up", async () => {
    const choice = await promptModelOverride(scriptedAsk(["y", "", "", ""]));
    expect(choice).toEqual({ name: "org", override: BEDROCK_EU_DEFAULT_OVERRIDE });
  });

  it("uses explicit answers when the user types them instead of accepting defaults", async () => {
    const choice = await promptModelOverride(
      scriptedAsk(["y", "custom.sonnet", "custom.haiku", "acme"]),
    );
    expect(choice).toEqual({
      name: "acme",
      override: { sonnet: "custom.sonnet", haiku: "custom.haiku" },
    });
  });
});

describe("promptCreateModelProfile", () => {
  it("returns null when the user declines creating a missing profile", async () => {
    const override = await promptCreateModelProfile("org", scriptedAsk(["n"]));
    expect(override).toBeNull();
  });

  it("creates the profile with Bedrock defaults when the user accepts and presses Enter", async () => {
    const override = await promptCreateModelProfile("org", scriptedAsk(["y", "", ""]));
    expect(override).toEqual(BEDROCK_EU_DEFAULT_OVERRIDE);
  });

  it("creates the profile with explicit values when provided", async () => {
    const override = await promptCreateModelProfile(
      "acme",
      scriptedAsk(["y", "acme.sonnet", "acme.haiku"]),
    );
    expect(override).toEqual({ sonnet: "acme.sonnet", haiku: "acme.haiku" });
  });
});
