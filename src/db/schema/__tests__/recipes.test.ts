import { describe, it, expect } from "vitest";
import { getTableColumns, getTableName } from "drizzle-orm";
import { recipes } from "../recipes";
import { recipeIngredients } from "../recipe-ingredients";
import { recipeSteps } from "../recipe-steps";
import { recipeDietaryTags } from "../recipe-dietary-tags";

describe("recipes table", () => {
  it("has the correct table name", () => {
    expect(getTableName(recipes)).toBe("recipes");
  });

  it("has all required columns", () => {
    const cols = getTableColumns(recipes);
    expect(cols).toHaveProperty("id");
    expect(cols).toHaveProperty("user_id");
    expect(cols).toHaveProperty("title");
    expect(cols).toHaveProperty("image_url");
    expect(cols).toHaveProperty("prep_time");
    expect(cols).toHaveProperty("servings");
    expect(cols).toHaveProperty("season_start");
    expect(cols).toHaveProperty("season_end");
    expect(cols).toHaveProperty("nutrition_score");
    expect(cols).toHaveProperty("nutrition_data");
    expect(cols).toHaveProperty("created_at");
    expect(cols).toHaveProperty("updated_at");
  });

  it("title is not null", () => {
    const { title } = getTableColumns(recipes);
    expect(title.notNull).toBe(true);
  });

  it("user_id is not null", () => {
    const { user_id } = getTableColumns(recipes);
    expect(user_id.notNull).toBe(true);
  });

  it("nullable columns are nullable", () => {
    const cols = getTableColumns(recipes);
    expect(cols.image_url.notNull).toBeFalsy();
    expect(cols.prep_time.notNull).toBeFalsy();
    expect(cols.servings.notNull).toBeFalsy();
    expect(cols.season_start.notNull).toBeFalsy();
    expect(cols.season_end.notNull).toBeFalsy();
    expect(cols.nutrition_score.notNull).toBeFalsy();
    expect(cols.nutrition_data.notNull).toBeFalsy();
  });
});

describe("recipe_ingredients table", () => {
  it("has the correct table name", () => {
    expect(getTableName(recipeIngredients)).toBe("recipe_ingredients");
  });

  it("has all required columns", () => {
    const cols = getTableColumns(recipeIngredients);
    expect(cols).toHaveProperty("id");
    expect(cols).toHaveProperty("recipe_id");
    expect(cols).toHaveProperty("ingredient_id");
    expect(cols).toHaveProperty("quantity_per_person");
    expect(cols).toHaveProperty("unit");
    expect(cols).toHaveProperty("scaling_factor");
    expect(cols).toHaveProperty("created_at");
  });

  it("required columns are not null", () => {
    const cols = getTableColumns(recipeIngredients);
    expect(cols.recipe_id.notNull).toBe(true);
    expect(cols.ingredient_id.notNull).toBe(true);
    expect(cols.quantity_per_person.notNull).toBe(true);
    expect(cols.unit.notNull).toBe(true);
    expect(cols.scaling_factor.notNull).toBe(true);
  });

  it("scaling_factor defaults to 1.0", () => {
    const { scaling_factor } = getTableColumns(recipeIngredients);
    expect(scaling_factor.default).toBe(1.0);
  });
});

describe("recipe_steps table", () => {
  it("has the correct table name", () => {
    expect(getTableName(recipeSteps)).toBe("recipe_steps");
  });

  it("has all required columns", () => {
    const cols = getTableColumns(recipeSteps);
    expect(cols).toHaveProperty("id");
    expect(cols).toHaveProperty("recipe_id");
    expect(cols).toHaveProperty("step_order");
    expect(cols).toHaveProperty("parallel_group");
    expect(cols).toHaveProperty("instruction");
    expect(cols).toHaveProperty("created_at");
  });

  it("step_order and instruction are not null", () => {
    const cols = getTableColumns(recipeSteps);
    expect(cols.step_order.notNull).toBe(true);
    expect(cols.instruction.notNull).toBe(true);
  });

  it("parallel_group is nullable", () => {
    const { parallel_group } = getTableColumns(recipeSteps);
    expect(parallel_group.notNull).toBeFalsy();
  });
});

describe("recipe_dietary_tags table", () => {
  it("has the correct table name", () => {
    expect(getTableName(recipeDietaryTags)).toBe("recipe_dietary_tags");
  });

  it("has all required columns", () => {
    const cols = getTableColumns(recipeDietaryTags);
    expect(cols).toHaveProperty("id");
    expect(cols).toHaveProperty("recipe_id");
    expect(cols).toHaveProperty("dietary_tag_id");
    expect(cols).toHaveProperty("created_at");
  });

  it("recipe_id and dietary_tag_id are not null", () => {
    const cols = getTableColumns(recipeDietaryTags);
    expect(cols.recipe_id.notNull).toBe(true);
    expect(cols.dietary_tag_id.notNull).toBe(true);
  });
});
