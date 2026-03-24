import { describe, it, expect } from "vitest";
import { serializeRecipeContext } from "../recipe-prompt";
import type { RecipeWithRelations } from "@/lib/recipes/queries";

const uuid = "550e8400-e29b-41d4-a716-446655440000";

function makeRecipe(
  overrides: Partial<RecipeWithRelations> = {}
): RecipeWithRelations {
  return {
    id: uuid,
    user_id: uuid,
    title: "Poulet curry",
    servings: 4,
    prep_time: 30,
    image_url: null,
    nutrition_score: null,
    nutrition_data: null,
    created_at: new Date(),
    updated_at: new Date(),
    recipeIngredients: [],
    recipeSteps: [],
    recipeDietaryTags: [],
    ...overrides,
  };
}

describe("serializeRecipeContext", () => {
  it("includes recipe id and title", () => {
    const out = serializeRecipeContext(makeRecipe());
    expect(out).toContain(`ID: ${uuid}`);
    expect(out).toContain("Poulet curry");
  });

  it("includes servings and prep_time when present", () => {
    const out = serializeRecipeContext(makeRecipe({ servings: 4, prep_time: 30 }));
    expect(out).toContain("Portions: 4");
    expect(out).toContain("Préparation: 30 min");
  });

  it("omits meta line when servings and prep_time are null", () => {
    const out = serializeRecipeContext(
      makeRecipe({ servings: null, prep_time: null })
    );
    expect(out).not.toContain("Portions:");
    expect(out).not.toContain("Préparation:");
  });

  it("includes ingredients with id, name, quantity, unit and scaling", () => {
    const ingId = "550e8400-e29b-41d4-a716-446655440001";
    const out = serializeRecipeContext(
      makeRecipe({
        recipeIngredients: [
          {
            recipe_id: uuid,
            ingredient_id: ingId,
            quantity_per_person: 200,
            unit: "g",
            scaling_factor: 1,
            ingredient: {
              id: ingId,
              name: "Poulet",
              aisle_id: null,
              season_start: null,
              season_end: null,
            },
          },
        ],
      })
    );
    expect(out).toContain(`[id:${ingId}]`);
    expect(out).toContain("Poulet");
    expect(out).toContain("200g/pers");
    expect(out).toContain("scaling: 1");
  });

  it("omits Ingrédients section when empty", () => {
    const out = serializeRecipeContext(makeRecipe({ recipeIngredients: [] }));
    expect(out).not.toContain("Ingrédients:");
  });

  it("includes steps with order and instruction", () => {
    const out = serializeRecipeContext(
      makeRecipe({
        recipeSteps: [
          {
            id: uuid,
            recipe_id: uuid,
            instruction: "Couper le poulet",
            step_order: 1,
            parallel_group: null,
          },
        ],
      })
    );
    expect(out).toContain("1.");
    expect(out).toContain("Couper le poulet");
  });

  it("marks parallel steps", () => {
    const out = serializeRecipeContext(
      makeRecipe({
        recipeSteps: [
          {
            id: uuid,
            recipe_id: uuid,
            instruction: "Faire cuire le riz",
            step_order: 2,
            parallel_group: 1,
          },
        ],
      })
    );
    expect(out).toContain("parallèle");
  });

  it("omits Étapes section when empty", () => {
    const out = serializeRecipeContext(makeRecipe({ recipeSteps: [] }));
    expect(out).not.toContain("Étapes:");
  });

  it("includes the searchIngredients instruction", () => {
    const out = serializeRecipeContext(makeRecipe());
    expect(out).toContain("searchIngredients");
  });
});
