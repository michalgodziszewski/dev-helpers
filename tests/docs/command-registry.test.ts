import { describe, it, expect } from "vitest";
import {
  getCommand,
  getAllCommands,
  getCommandNames,
} from "../../src/cli/command-registry.js";
import { WORK_TYPES, DEFAULT_WORK_TYPE } from "../../src/cli/naming/branch-name.js";
import { FALLBACK_BASE_BRANCH } from "../../src/cli/config/env.js";

describe("command registry", () => {
  it("returns the start command by name", () => {
    const cmd = getCommand("start");
    expect(cmd).toBeDefined();
    expect(cmd!.name).toBe("start");
  });

  it("returns undefined for unknown command", () => {
    expect(getCommand("nonexistent")).toBeUndefined();
  });

  it("lists all registered commands", () => {
    const commands = getAllCommands();
    expect(commands.length).toBeGreaterThan(0);
    expect(commands.map((c) => c.name)).toContain("start");
  });

  it("lists all command names", () => {
    const names = getCommandNames();
    expect(names).toContain("start");
  });

  it("start command references runtime WORK_TYPES constant", () => {
    const cmd = getCommand("start")!;
    const typeOption = cmd.options.find((o) => o.flag === "--type");
    expect(typeOption).toBeDefined();
    expect(typeOption!.allowedValues).toBe(WORK_TYPES);
  });

  it("start command references runtime DEFAULT_WORK_TYPE constant", () => {
    const cmd = getCommand("start")!;
    const typeOption = cmd.options.find((o) => o.flag === "--type");
    expect(typeOption!.defaultValue).toBe(DEFAULT_WORK_TYPE);
  });

  it("start command references runtime FALLBACK_BASE_BRANCH constant", () => {
    const cmd = getCommand("start")!;
    const baseOption = cmd.options.find((o) => o.flag === "--base");
    expect(baseOption).toBeDefined();
    expect(baseOption!.defaultValue).toBe(FALLBACK_BASE_BRANCH);
  });

  it("every command has required metadata fields", () => {
    for (const cmd of getAllCommands()) {
      expect(cmd.name).toBeTruthy();
      expect(cmd.summary).toBeTruthy();
      expect(cmd.usage).toBeTruthy();
      expect(cmd.examples.length).toBeGreaterThan(0);
      expect(cmd.exitBehavior.success).toBeTruthy();
      expect(cmd.exitBehavior.failure).toBeTruthy();
    }
  });
});
