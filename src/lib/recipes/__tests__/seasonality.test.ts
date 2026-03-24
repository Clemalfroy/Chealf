import { describe, it, expect } from "vitest";
import { intersectSeasons } from "../seasonality";

describe("intersectSeasons", () => {
  it("returns null/null when all ingredients are year-round", () => {
    expect(intersectSeasons([
      { season_start: null, season_end: null },
      { season_start: null, season_end: null },
    ])).toEqual({ season_start: null, season_end: null });
  });

  it("returns null/null for empty input", () => {
    expect(intersectSeasons([])).toEqual({ season_start: null, season_end: null });
  });

  it("year-round ingredients do not restrict the range", () => {
    expect(intersectSeasons([
      { season_start: null, season_end: null },
      { season_start: 6, season_end: 9 },
    ])).toEqual({ season_start: 6, season_end: 9 });
  });

  it("returns the single ingredient season when only one is seasonal", () => {
    expect(intersectSeasons([
      { season_start: 6, season_end: 9 },
    ])).toEqual({ season_start: 6, season_end: 9 });
  });

  it("intersects overlapping seasons (simple ranges)", () => {
    expect(intersectSeasons([
      { season_start: 4, season_end: 10 },
      { season_start: 6, season_end: 9 },
    ])).toEqual({ season_start: 6, season_end: 9 });
  });

  it("returns null/null when seasons are disjoint (empty intersection)", () => {
    expect(intersectSeasons([
      { season_start: 3, season_end: 6 },
      { season_start: 9, season_end: 12 },
    ])).toEqual({ season_start: null, season_end: null });
  });

  it("handles wrapping season (e.g. Nov–Feb)", () => {
    expect(intersectSeasons([
      { season_start: 11, season_end: 2 },
    ])).toEqual({ season_start: 11, season_end: 2 });
  });

  it("intersects two wrapping seasons correctly", () => {
    // Nov-Mar ∩ Oct-Feb = Nov-Feb
    expect(intersectSeasons([
      { season_start: 11, season_end: 3 },
      { season_start: 10, season_end: 2 },
    ])).toEqual({ season_start: 11, season_end: 2 });
  });

  it("intersects a wrapping and a non-wrapping season", () => {
    // Dec-Feb ∩ Jan-Jun = Jan-Feb
    expect(intersectSeasons([
      { season_start: 12, season_end: 2 },
      { season_start: 1, season_end: 6 },
    ])).toEqual({ season_start: 1, season_end: 2 });
  });

  it("returns null/null when resulting intersection is non-contiguous", () => {
    // Spring + Autumn with a summer-only ingredient in between → gaps
    expect(intersectSeasons([
      { season_start: 3, season_end: 5 },  // Mar–May
      { season_start: 9, season_end: 11 }, // Sep–Nov
    ])).toEqual({ season_start: null, season_end: null });
  });

  it("full overlap returns the narrower range", () => {
    expect(intersectSeasons([
      { season_start: 1, season_end: 12 },
      { season_start: 5, season_end: 8 },
    ])).toEqual({ season_start: 5, season_end: 8 });
  });
});
