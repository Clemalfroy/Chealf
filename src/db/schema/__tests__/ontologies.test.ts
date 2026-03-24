import { describe, it, expect } from "vitest";
import { getTableColumns, getTableName } from "drizzle-orm";
import { aisles } from "../aisles";
import { ingredients } from "../ingredients";
import { dietaryTags } from "../dietary-tags";

describe("aisles table", () => {
  it("has the correct table name", () => {
    expect(getTableName(aisles)).toBe("aisles");
  });

  it("has all required columns", () => {
    const cols = getTableColumns(aisles);
    expect(cols).toHaveProperty("id");
    expect(cols).toHaveProperty("slug");
    expect(cols).toHaveProperty("created_at");
  });

  it("slug is not null", () => {
    const { slug } = getTableColumns(aisles);
    expect(slug.notNull).toBe(true);
  });
});

describe("ingredients table", () => {
  it("has the correct table name", () => {
    expect(getTableName(ingredients)).toBe("ingredients");
  });

  it("has all required columns", () => {
    const cols = getTableColumns(ingredients);
    expect(cols).toHaveProperty("id");
    expect(cols).toHaveProperty("name");
    expect(cols).toHaveProperty("aisle_id");
    expect(cols).toHaveProperty("season_start");
    expect(cols).toHaveProperty("season_end");
    expect(cols).toHaveProperty("created_at");
  });

  it("name is not null", () => {
    const { name } = getTableColumns(ingredients);
    expect(name.notNull).toBe(true);
  });

  it("nullable columns are nullable", () => {
    const cols = getTableColumns(ingredients);
    expect(cols.aisle_id.notNull).toBeFalsy();
    expect(cols.season_start.notNull).toBeFalsy();
    expect(cols.season_end.notNull).toBeFalsy();
  });
});

describe("dietary_tags table", () => {
  it("has the correct table name", () => {
    expect(getTableName(dietaryTags)).toBe("dietary_tags");
  });

  it("has all required columns", () => {
    const cols = getTableColumns(dietaryTags);
    expect(cols).toHaveProperty("id");
    expect(cols).toHaveProperty("slug");
    expect(cols).toHaveProperty("created_at");
  });

  it("slug is not null", () => {
    const { slug } = getTableColumns(dietaryTags);
    expect(slug.notNull).toBe(true);
  });
});
