import { describe, it, expect } from "vitest";
import { buildBranchName, isWorkType } from "../../src/cli/naming/branch-name.js";

describe("buildBranchName", () => {
  it("returns feature/<TICKET> when no description is given", () => {
    expect(buildBranchName("feature", "LSG-12345")).toBe("feature/LSG-12345");
  });

  it("returns feature/<TICKET> when description is empty array", () => {
    expect(buildBranchName("feature", "LSG-12345", [])).toBe("feature/LSG-12345");
  });

  it("appends normalized description", () => {
    expect(buildBranchName("feature", "LSG-12345", ["add", "user", "search"])).toBe(
      "feature/LSG-12345-add-user-search"
    );
  });

  it("lowercases description words", () => {
    expect(buildBranchName("feature", "BOL-1", ["Fix", "Login", "BUG"])).toBe(
      "feature/BOL-1-fix-login-bug"
    );
  });

  it("strips special characters from description", () => {
    expect(buildBranchName("feature", "LSG-1", ["hello!", "world@#"])).toBe(
      "feature/LSG-1-hello-world"
    );
  });

  it("treats description that normalizes to empty as omitted", () => {
    expect(buildBranchName("feature", "LSG-1", ["!!!", "@#$"])).toBe("feature/LSG-1");
  });

  it("uses fix prefix for fix type", () => {
    expect(buildBranchName("fix", "LSG-12348", ["fix", "timeout"])).toBe(
      "fix/LSG-12348-fix-timeout"
    );
  });

  it("uses bugfix prefix", () => {
    expect(buildBranchName("bugfix", "LSG-1")).toBe("bugfix/LSG-1");
  });

  it("uses hotfix prefix", () => {
    expect(buildBranchName("hotfix", "LSG-1", ["urgent"])).toBe("hotfix/LSG-1-urgent");
  });

  it("uses chore prefix", () => {
    expect(buildBranchName("chore", "LSG-1")).toBe("chore/LSG-1");
  });
});

describe("isWorkType", () => {
  it.each(["feature", "bugfix", "fix", "hotfix", "chore"])("accepts %s", (type) => {
    expect(isWorkType(type)).toBe(true);
  });

  it.each(["feat", "bug", "patch", "release", ""])("rejects %s", (type) => {
    expect(isWorkType(type)).toBe(false);
  });
});
