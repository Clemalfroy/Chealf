import { describe, it, expect } from "vitest";
import { formatQuantity } from "../format";

describe("formatQuantity", () => {
  it("returns '0' for zero", () => {
    expect(formatQuantity(0)).toBe("0");
  });

  it("returns integer strings as-is", () => {
    expect(formatQuantity(1)).toBe("1");
    expect(formatQuantity(2)).toBe("2");
    expect(formatQuantity(10)).toBe("10");
  });

  it("converts 0.5 to ½", () => {
    expect(formatQuantity(0.5)).toBe("½");
  });

  it("converts 0.25 to ¼", () => {
    expect(formatQuantity(0.25)).toBe("¼");
  });

  it("converts 0.333 to ⅓", () => {
    expect(formatQuantity(1 / 3)).toBe("⅓");
  });

  it("converts 0.667 to ⅔", () => {
    expect(formatQuantity(2 / 3)).toBe("⅔");
  });

  it("converts 0.75 to ¾", () => {
    expect(formatQuantity(0.75)).toBe("¾");
  });

  it("converts 0.125 to ⅛", () => {
    expect(formatQuantity(0.125)).toBe("⅛");
  });

  it("combines whole + fraction: 1.5 → '1 ½'", () => {
    expect(formatQuantity(1.5)).toBe("1 ½");
  });

  it("combines whole + fraction: 2.25 → '2 ¼'", () => {
    expect(formatQuantity(2.25)).toBe("2 ¼");
  });

  it("combines whole + fraction: 3.75 → '3 ¾'", () => {
    expect(formatQuantity(3.75)).toBe("3 ¾");
  });

  it("falls back to 1 decimal for non-matching fractions", () => {
    expect(formatQuantity(1.7)).toBe("1.7");
    expect(formatQuantity(0.6)).toBe("0.6");
  });

  it("rounds near-integers correctly", () => {
    expect(formatQuantity(1.99)).toBe("2");
    expect(formatQuantity(2.01)).toBe("2");
  });

  it("handles negative values without crashing", () => {
    expect(formatQuantity(-1)).toBe("-1");
  });

  it("matches within tolerance (0.02)", () => {
    expect(formatQuantity(0.51)).toBe("½");
    expect(formatQuantity(0.49)).toBe("½");
  });
});
