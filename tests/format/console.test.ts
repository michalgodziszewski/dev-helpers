import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  colorsEnabled,
  bold,
  dim,
  green,
  yellow,
  red,
  cyan,
  formatKeyValue,
  formatSuccess,
  formatWarning,
  formatError,
  formatBranch,
  formatHint,
  formatInfo,
} from "../../src/cli/format/console.js";

const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";
const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const CYAN = "\x1b[36m";

describe("console formatting", () => {
  let originalNoColor: string | undefined;

  beforeEach(() => {
    originalNoColor = process.env["NO_COLOR"];
    delete process.env["NO_COLOR"];
  });

  afterEach(() => {
    if (originalNoColor === undefined) {
      delete process.env["NO_COLOR"];
    } else {
      process.env["NO_COLOR"] = originalNoColor;
    }
  });

  describe("colorsEnabled", () => {
    it("returns true when NO_COLOR is not set", () => {
      delete process.env["NO_COLOR"];
      expect(colorsEnabled()).toBe(true);
    });

    it("returns false when NO_COLOR is set", () => {
      process.env["NO_COLOR"] = "1";
      expect(colorsEnabled()).toBe(false);
    });

    it("returns false when NO_COLOR is empty string", () => {
      process.env["NO_COLOR"] = "";
      expect(colorsEnabled()).toBe(true);
    });
  });

  describe("style helpers with colors enabled", () => {
    it("bold wraps text", () => {
      expect(bold("hello")).toBe(`${BOLD}hello${RESET}`);
    });

    it("dim wraps text", () => {
      expect(dim("hint")).toBe(`${DIM}hint${RESET}`);
    });

    it("green wraps text", () => {
      expect(green("ok")).toBe(`${GREEN}ok${RESET}`);
    });

    it("yellow wraps text", () => {
      expect(yellow("warn")).toBe(`${YELLOW}warn${RESET}`);
    });

    it("red wraps text", () => {
      expect(red("err")).toBe(`${RED}err${RESET}`);
    });

    it("cyan wraps text", () => {
      expect(cyan("ref")).toBe(`${CYAN}ref${RESET}`);
    });
  });

  describe("style helpers with NO_COLOR", () => {
    beforeEach(() => {
      process.env["NO_COLOR"] = "1";
    });

    it("bold returns plain text", () => {
      expect(bold("hello")).toBe("hello");
    });

    it("dim returns plain text", () => {
      expect(dim("hint")).toBe("hint");
    });

    it("green returns plain text", () => {
      expect(green("ok")).toBe("ok");
    });

    it("yellow returns plain text", () => {
      expect(yellow("warn")).toBe("warn");
    });

    it("red returns plain text", () => {
      expect(red("err")).toBe("err");
    });

    it("cyan returns plain text", () => {
      expect(cyan("ref")).toBe("ref");
    });
  });

  describe("semantic formatters with colors enabled", () => {
    it("formatKeyValue renders bold label and plain value", () => {
      const result = formatKeyValue("Repository", "my-project");
      expect(result).toBe(`${BOLD}Repository:${RESET} my-project`);
    });

    it("formatSuccess renders green marker and value with bold label", () => {
      const result = formatSuccess("Working tree", "clean");
      expect(result).toBe(
        `${GREEN}✓${RESET} ${BOLD}Working tree:${RESET} ${GREEN}clean${RESET}`
      );
    });

    it("formatWarning renders yellow marker and value with bold label", () => {
      const result = formatWarning("Tracking branch", "not configured");
      expect(result).toBe(
        `${YELLOW}!${RESET} ${BOLD}Tracking branch:${RESET} ${YELLOW}not configured${RESET}`
      );
    });

    it("formatError renders red marker and value with bold label", () => {
      const result = formatError("Base branch not found", "trunk");
      expect(result).toBe(
        `${RED}✖${RESET} ${BOLD}Base branch not found:${RESET} ${RED}trunk${RESET}`
      );
    });

    it("formatBranch renders cyan ref", () => {
      const result = formatBranch("feature/LSG-12345-add-user-search");
      expect(result).toBe(
        `${CYAN}feature/LSG-12345-add-user-search${RESET}`
      );
    });

    it("formatHint renders dim text", () => {
      const result = formatHint("Run dev status for details");
      expect(result).toBe(`${DIM}Run dev status for details${RESET}`);
    });

    it("formatInfo renders same as formatKeyValue", () => {
      const info = formatInfo("Count", "42");
      const kv = formatKeyValue("Count", "42");
      expect(info).toBe(kv);
    });
  });

  describe("semantic formatters with NO_COLOR", () => {
    beforeEach(() => {
      process.env["NO_COLOR"] = "1";
    });

    it("formatKeyValue renders plain label and value", () => {
      expect(formatKeyValue("Repository", "my-project")).toBe(
        "Repository: my-project"
      );
    });

    it("formatSuccess still shows ✓ marker", () => {
      const result = formatSuccess("Working tree", "clean");
      expect(result).toBe("✓ Working tree: clean");
    });

    it("formatWarning still shows ! marker", () => {
      const result = formatWarning("Tracking branch", "not configured");
      expect(result).toBe("! Tracking branch: not configured");
    });

    it("formatError still shows ✖ marker", () => {
      const result = formatError("Base branch not found", "trunk");
      expect(result).toBe("✖ Base branch not found: trunk");
    });

    it("formatBranch returns plain ref", () => {
      expect(formatBranch("main")).toBe("main");
    });

    it("formatHint returns plain text", () => {
      expect(formatHint("some hint")).toBe("some hint");
    });
  });

  describe("edge cases", () => {
    it("handles empty label", () => {
      expect(formatKeyValue("", "value")).toBe(`${BOLD}:${RESET} value`);
    });

    it("handles empty value", () => {
      expect(formatKeyValue("Label", "")).toBe(`${BOLD}Label:${RESET} `);
    });

    it("handles special characters in values", () => {
      const result = formatBranch("feature/fix-<issue>");
      expect(result).toBe(`${CYAN}feature/fix-<issue>${RESET}`);
    });
  });
});
