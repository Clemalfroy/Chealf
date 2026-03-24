import { describe, it, expect } from "vitest";
import { AISLE_SLUGS, DIETARY_TAG_SLUGS } from "../../seed-data";

describe("AISLE_SLUGS seed data", () => {
  it("contains all expected aisle slugs", () => {
    const expected = [
      "fruits_vegetables",
      "butcher",
      "fishmonger",
      "dairy",
      "savory_grocery",
      "sweet_grocery",
      "fresh_products",
      "frozen",
      "beverages",
      "bakery",
      "condiments_sauces",
      "canned_goods",
      "oils_vinegars",
      "pasta_rice_cereals",
      "world_foods",
    ];
    for (const slug of expected) {
      expect(AISLE_SLUGS).toContain(slug);
    }
  });

  it("has no duplicate slugs", () => {
    const unique = new Set(AISLE_SLUGS);
    expect(unique.size).toBe(AISLE_SLUGS.length);
  });

  it("all slugs are lowercase snake_case", () => {
    for (const slug of AISLE_SLUGS) {
      expect(slug).toMatch(/^[a-z0-9_]+$/);
    }
  });
});

describe("DIETARY_TAG_SLUGS seed data", () => {
  it("contains all expected dietary tag slugs", () => {
    const expected = [
      "vegetarian",
      "vegan",
      "gluten_free",
      "lactose_free",
      "pescatarian",
      "halal",
      "kosher",
    ];
    for (const slug of expected) {
      expect(DIETARY_TAG_SLUGS).toContain(slug);
    }
  });

  it("has no duplicate slugs", () => {
    const unique = new Set(DIETARY_TAG_SLUGS);
    expect(unique.size).toBe(DIETARY_TAG_SLUGS.length);
  });

  it("all slugs are lowercase snake_case", () => {
    for (const slug of DIETARY_TAG_SLUGS) {
      expect(slug).toMatch(/^[a-z0-9_]+$/);
    }
  });
});
