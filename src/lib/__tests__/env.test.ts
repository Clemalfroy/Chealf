import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { requireEnv } from "../env";

describe("requireEnv", () => {
  const ORIGINAL_ENV = { ...process.env };

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  it("returns the value when the env var is set", () => {
    process.env.TEST_VAR = "hello";
    expect(requireEnv("TEST_VAR")).toBe("hello");
  });

  it("throws with the variable name when env var is missing", () => {
    delete process.env.MISSING_VAR;
    expect(() => requireEnv("MISSING_VAR")).toThrow(
      "Missing required environment variable: MISSING_VAR"
    );
  });

  it("throws when env var is an empty string", () => {
    process.env.EMPTY_VAR = "";
    expect(() => requireEnv("EMPTY_VAR")).toThrow(
      "Missing required environment variable: EMPTY_VAR"
    );
  });
});
