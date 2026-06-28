import { describe, it, expect } from "vitest";
import { getCommandNames } from "../../src/cli/command-registry.js";
import { run as startCommand } from "../../src/cli/commands/start.js";
import { run as featureSkillInstallCommand } from "../../src/cli/commands/feature-skill-install.js";

// Mirror the handler map from bin/dev.ts
const handlers: Record<string, unknown> = {
  start: startCommand,
  "feature-skill-install": featureSkillInstallCommand,
};

describe("registry and handler sync", () => {
  it("every registry command has a handler", () => {
    for (const name of getCommandNames()) {
      expect(handlers[name], `handler missing for registry command "${name}"`).toBeDefined();
    }
  });

  it("every handler has a registry entry", () => {
    const registryNames = new Set(getCommandNames());
    for (const name of Object.keys(handlers)) {
      expect(registryNames.has(name), `registry missing for handler "${name}"`).toBe(true);
    }
  });
});
