import { describe, it, expect } from "vitest";
import { slugify } from "../../src/cli/utils/slugify.js";

describe("slugify", () => {
  it("joins words with hyphens", () => {
    expect(slugify(["add", "user", "search"])).toBe("add-user-search");
  });

  it("lowercases words", () => {
    expect(slugify(["Fix", "Login"])).toBe("fix-login");
  });

  it("strips non-alphanumeric characters except hyphens", () => {
    expect(slugify(["hello!", "world@#"])).toBe("hello-world");
  });

  it("filters out empty words after stripping", () => {
    expect(slugify(["!!!", "valid"])).toBe("valid");
  });

  it("returns empty string for all-special-char input", () => {
    expect(slugify(["!!!", "@#$"])).toBe("");
  });

  it("returns empty string for empty array", () => {
    expect(slugify([])).toBe("");
  });

  it("preserves digits", () => {
    expect(slugify(["v2", "beta3"])).toBe("v2-beta3");
  });

  it("preserves existing hyphens", () => {
    expect(slugify(["pre-release"])).toBe("pre-release");
  });

  it("splits a quoted multi-word argument into separate slugs", () => {
    expect(slugify(["Z opisem asdasd"])).toBe("z-opisem-asdasd");
  });

  it("splits mixed separate and quoted arguments", () => {
    expect(slugify(["add", "user search"])).toBe("add-user-search");
  });
});
