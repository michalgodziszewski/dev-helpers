import { describe, it, expect } from "vitest";
import { validateTicket } from "../../src/cli/utils/ticket.js";
import { CliError } from "../../src/cli/utils/errors.js";

describe("validateTicket", () => {
  it("accepts valid uppercase ticket", () => {
    expect(validateTicket("LSG-12345")).toBe("LSG-12345");
  });

  it("normalizes lowercase to uppercase", () => {
    expect(validateTicket("lsg-12345")).toBe("LSG-12345");
  });

  it("accepts single-digit ticket number", () => {
    expect(validateTicket("DEV-1")).toBe("DEV-1");
  });

  it("accepts ticket with digits in project key", () => {
    expect(validateTicket("A2B-99")).toBe("A2B-99");
  });

  it("rejects ticket with leading zero", () => {
    expect(() => validateTicket("LSG-01")).toThrow(CliError);
  });

  it("rejects ticket without dash", () => {
    expect(() => validateTicket("LSG12345")).toThrow(CliError);
  });

  it("rejects ticket with zero-only number", () => {
    expect(() => validateTicket("LSG-0")).toThrow(CliError);
  });

  it("rejects empty string", () => {
    expect(() => validateTicket("")).toThrow(CliError);
  });

  it("rejects ticket starting with digit", () => {
    expect(() => validateTicket("1LSG-123")).toThrow(CliError);
  });
});
