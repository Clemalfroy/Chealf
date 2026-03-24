import { describe, it, expect } from "vitest";
import { scaleQuantity } from "../scaling";

describe("scaleQuantity", () => {
  it("linear (sf=1.0): same servings returns base total", () => {
    expect(scaleQuantity(100, 4, 4, 1.0)).toBeCloseTo(400);
  });

  it("linear (sf=1.0): double servings doubles quantity", () => {
    expect(scaleQuantity(100, 4, 8, 1.0)).toBeCloseTo(800);
  });

  it("linear (sf=1.0): half servings halves quantity", () => {
    expect(scaleQuantity(100, 4, 2, 1.0)).toBeCloseTo(200);
  });

  it("fixed (sf=0.0): quantity stays constant regardless of servings", () => {
    expect(scaleQuantity(1, 4, 8, 0.0)).toBeCloseTo(4);
    expect(scaleQuantity(1, 4, 2, 0.0)).toBeCloseTo(4);
    expect(scaleQuantity(1, 4, 12, 0.0)).toBeCloseTo(4);
  });

  it("sub-linear (sf=0.6): scales slower than linear", () => {
    // 1 * 4 * (8/4)^0.6 = 4 * 2^0.6 ≈ 4 * 1.516 ≈ 6.06
    expect(scaleQuantity(1, 4, 8, 0.6)).toBeCloseTo(6.06, 1);
  });

  it("sub-linear is less than linear for same inputs", () => {
    const linear = scaleQuantity(1, 4, 8, 1.0);
    const subLinear = scaleQuantity(1, 4, 8, 0.6);
    expect(subLinear).toBeLessThan(linear);
  });

  it("returns qtyPerPerson when baseServings is 0", () => {
    expect(scaleQuantity(100, 0, 4, 1.0)).toBe(100);
  });

  it("returns qtyPerPerson when displayServings is 0", () => {
    expect(scaleQuantity(100, 4, 0, 1.0)).toBe(100);
  });

  it("returns qtyPerPerson when baseServings is negative", () => {
    expect(scaleQuantity(100, -1, 4, 1.0)).toBe(100);
  });

  it("handles single serving base", () => {
    // qty_per_person=50, base=1, display=4, sf=1.0 → 50 * 1 * 4 = 200
    expect(scaleQuantity(50, 1, 4, 1.0)).toBeCloseTo(200);
  });
});
