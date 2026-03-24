import { describe, it, expect } from "vitest";
import { mapToolResultToAction } from "../tool-action-map";
import type { RecipeEditorState } from "@/components/recipes/recipe-editor";

const uuid1 = "550e8400-e29b-41d4-a716-446655440001";
const uuid2 = "550e8400-e29b-41d4-a716-446655440002";

const emptyState: RecipeEditorState = {
  id: null,
  title: "",
  servings: null,
  prep_time: null,
  season_start: null,
  season_end: null,
  nutrition_score: null,
  nutrition_data: null,
  ingredients: [],
  steps: [],
  dietary_tag_ids: [],
  isDirty: false,
  image_url: null,
  image_status: "idle",
  image_prompt: null,
  recipe_image_id: null,
};

const stateWithIngredient: RecipeEditorState = {
  ...emptyState,
  id: uuid1,
  ingredients: [
    {
      tempId: "tmp-1",
      ingredient_id: uuid2,
      name: "Poulet",
      quantity_per_person: 200,
      unit: "g",
      scaling_factor: 1,
    },
  ],
  image_url: null,
  image_status: "idle",
  image_prompt: null,
  recipe_image_id: null,
};

describe("mapToolResultToAction", () => {
  // ─── createRecipe ──────────────────────────────────────────────────────────

  it("createRecipe → returns array with SET_ID and SET_TITLE", () => {
    const result = mapToolResultToAction(
      "createRecipe",
      { id: uuid1, title: "Poulet curry", servings: null, prep_time: null },
      emptyState
    );
    expect(Array.isArray(result)).toBe(true);
    const list = result as Array<{ type: string; payload?: unknown }>;
    expect(list).toContainEqual({ type: "SET_ID", payload: uuid1 });
    expect(list).toContainEqual({ type: "SET_TITLE", payload: "Poulet curry" });
  });

  it("createRecipe → includes SET_SERVINGS when servings provided", () => {
    const result = mapToolResultToAction(
      "createRecipe",
      { id: uuid1, title: "Poulet", servings: 4, prep_time: null },
      emptyState
    ) as Array<{ type: string; payload?: unknown }>;
    expect(result).toContainEqual({ type: "SET_SERVINGS", payload: 4 });
  });

  it("createRecipe → includes SET_PREP_TIME when prep_time provided", () => {
    const result = mapToolResultToAction(
      "createRecipe",
      { id: uuid1, title: "Poulet", servings: null, prep_time: 30 },
      emptyState
    ) as Array<{ type: string; payload?: unknown }>;
    expect(result).toContainEqual({ type: "SET_PREP_TIME", payload: 30 });
  });

  it("createRecipe → does not include SET_SERVINGS when null", () => {
    const result = mapToolResultToAction(
      "createRecipe",
      { id: uuid1, title: "Poulet", servings: null, prep_time: null },
      emptyState
    ) as Array<{ type: string }>;
    expect(result.some((a) => a.type === "SET_SERVINGS")).toBe(false);
  });

  // ─── setRecipeTitle ────────────────────────────────────────────────────────

  it("setRecipeTitle → SET_TITLE with title", () => {
    const result = mapToolResultToAction(
      "setRecipeTitle",
      { title: "Risotto" },
      emptyState
    );
    expect(result).toEqual({ type: "SET_TITLE", payload: "Risotto" });
  });

  // ─── setRecipeServings ─────────────────────────────────────────────────────

  it("setRecipeServings → SET_SERVINGS", () => {
    const result = mapToolResultToAction(
      "setRecipeServings",
      { servings: 6 },
      emptyState
    );
    expect(result).toEqual({ type: "SET_SERVINGS", payload: 6 });
  });

  // ─── setRecipePrepTime ─────────────────────────────────────────────────────

  it("setRecipePrepTime → SET_PREP_TIME", () => {
    const result = mapToolResultToAction(
      "setRecipePrepTime",
      { prep_time: 45 },
      emptyState
    );
    expect(result).toEqual({ type: "SET_PREP_TIME", payload: 45 });
  });

  // ─── addIngredient ─────────────────────────────────────────────────────────

  it("addIngredient → [ADD_INGREDIENT, SET_SEASONALITY] with computed season", () => {
    const result = mapToolResultToAction(
      "addIngredient",
      {
        ingredient_id: uuid2,
        name: "Riz",
        quantity_per_person: 80,
        unit: "g",
        scaling_factor: 1.0,
        season_start: null,
        season_end: null,
      },
      emptyState
    ) as Array<{ type: string; payload?: unknown; tempId?: string }>;
    expect(Array.isArray(result)).toBe(true);
    expect(result[0].type).toBe("ADD_INGREDIENT");
    expect((result[0].payload as { ingredient_id: string }).ingredient_id).toBe(uuid2);
    expect((result[0].payload as { tempId: string }).tempId).toMatch(/^tool-/);
    expect(result[1].type).toBe("SET_SEASONALITY");
    expect(result[1].payload).toEqual({ season_start: null, season_end: null });
  });

  // ─── addIngredients ────────────────────────────────────────────────────────

  it("addIngredients → [ADD_INGREDIENT×N, SET_SEASONALITY] with computed season", () => {
    const result = mapToolResultToAction(
      "addIngredients",
      {
        ingredients: [
          { ingredient_id: uuid1, name: "Riz", quantity_per_person: 80, unit: "g", scaling_factor: 1.0 },
          { ingredient_id: uuid2, name: "Tomate", quantity_per_person: 1, unit: "unité", scaling_factor: 0.6 },
        ],
        season_start: 6,
        season_end: 9,
      },
      emptyState
    ) as Array<{ type: string; payload: { tempId?: string; ingredient_id?: string; season_start?: number | null; season_end?: number | null } }>;
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(3); // 2 ingredients + 1 seasonality
    expect(result[0].type).toBe("ADD_INGREDIENT");
    expect(result[0].payload.ingredient_id).toBe(uuid1);
    expect(result[0].payload.tempId).toMatch(/^tool-/);
    expect(result[1].type).toBe("ADD_INGREDIENT");
    expect(result[1].payload.ingredient_id).toBe(uuid2);
    expect(result[0].payload.tempId).not.toBe(result[1].payload.tempId);
    expect(result[2].type).toBe("SET_SEASONALITY");
    expect(result[2].payload).toEqual({ season_start: 6, season_end: 9 });
  });

  // ─── updateIngredient ──────────────────────────────────────────────────────

  it("updateIngredient → UPDATE_INGREDIENT actions resolved by ingredient_id", () => {
    const result = mapToolResultToAction(
      "updateIngredient",
      {
        ingredient_id: uuid2,
        quantity_per_person: 150,
        unit: "g",
      },
      stateWithIngredient
    ) as Array<{ type: string; tempId: string; field: string; value: unknown }>;
    expect(Array.isArray(result)).toBe(true);
    expect(result[0].type).toBe("UPDATE_INGREDIENT");
    expect(result[0].tempId).toBe("tmp-1");
    expect(result.some((a) => a.field === "quantity_per_person" && a.value === 150)).toBe(true);
    expect(result.some((a) => a.field === "unit" && a.value === "g")).toBe(true);
  });

  it("updateIngredient → returns null when ingredient_id not found in state", () => {
    const result = mapToolResultToAction(
      "updateIngredient",
      { ingredient_id: "00000000-0000-0000-0000-000000000000", quantity_per_person: 100 },
      emptyState
    );
    expect(result).toBeNull();
  });

  it("updateIngredient → returns null when no fields provided", () => {
    const result = mapToolResultToAction(
      "updateIngredient",
      { ingredient_id: uuid2 },
      stateWithIngredient
    );
    expect(result).toBeNull();
  });

  // ─── removeIngredient ──────────────────────────────────────────────────────

  it("removeIngredient → [REMOVE_INGREDIENT, SET_SEASONALITY] resolved by ingredient_id", () => {
    const result = mapToolResultToAction(
      "removeIngredient",
      { ingredient_id: uuid2, season_start: null, season_end: null },
      stateWithIngredient
    ) as Array<{ type: string; tempId?: string; payload?: unknown }>;
    expect(Array.isArray(result)).toBe(true);
    expect(result[0].type).toBe("REMOVE_INGREDIENT");
    expect(result[0].tempId).toBe("tmp-1");
    expect(result[1].type).toBe("SET_SEASONALITY");
    expect(result[1].payload).toEqual({ season_start: null, season_end: null });
  });

  it("removeIngredient → returns null when ingredient_id not found", () => {
    const result = mapToolResultToAction(
      "removeIngredient",
      { ingredient_id: "00000000-0000-0000-0000-000000000000", season_start: null, season_end: null },
      emptyState
    );
    expect(result).toBeNull();
  });

  // ─── setSteps ──────────────────────────────────────────────────────────────

  it("setSteps → SET_STEPS with generated tempIds", () => {
    const result = mapToolResultToAction(
      "setSteps",
      {
        steps: [
          { instruction: "Couper", step_order: 1 },
          { instruction: "Cuire", step_order: 2, parallel_group: 1 },
        ],
      },
      emptyState
    ) as { type: string; payload: Array<{ tempId: string; instruction: string; step_order: number; parallel_group?: number }> };
    expect(result.type).toBe("SET_STEPS");
    expect(result.payload).toHaveLength(2);
    expect(result.payload[0].instruction).toBe("Couper");
    expect(result.payload[0].tempId).toMatch(/^tool-/);
    expect(result.payload[1].parallel_group).toBe(1);
  });

  // ─── setDietaryTags ────────────────────────────────────────────────────────

  it("setDietaryTags → SET_TAGS with tag ids", () => {
    const result = mapToolResultToAction(
      "setDietaryTags",
      { dietary_tag_ids: [uuid1, uuid2] },
      emptyState
    );
    expect(result).toEqual({ type: "SET_TAGS", payload: [uuid1, uuid2] });
  });

  // ─── setNutrition ──────────────────────────────────────────────────────────

  it("setNutrition → SET_NUTRITION with score and data", () => {
    const nutritionData = { calories: 450, protein: 25, carbs: 30, fat: 20, fiber: 8 };
    const result = mapToolResultToAction(
      "setNutrition",
      { nutrition_score: 72, nutrition_data: nutritionData },
      emptyState
    );
    expect(result).toEqual({
      type: "SET_NUTRITION",
      payload: { nutrition_score: 72, nutrition_data: nutritionData },
    });
  });

  // ─── informational / memory tools → null ───────────────────────────────────

  it("searchIngredients → returns null (informational only)", () => {
    const result = mapToolResultToAction(
      "searchIngredients",
      [{ id: uuid1, name: "Poulet", aisle: "butcher" }],
      emptyState
    );
    expect(result).toBeNull();
  });

  it("listDietaryTags → returns null (informational only)", () => {
    const result = mapToolResultToAction(
      "listDietaryTags",
      [{ id: uuid1, slug: "vegetarian" }],
      emptyState
    );
    expect(result).toBeNull();
  });

  it("extractMemoryFact → returns null (no recipe state change)", () => {
    const result = mapToolResultToAction(
      "extractMemoryFact",
      { id: uuid1, content: "Allergique aux noix", category: "allergy" },
      emptyState
    );
    expect(result).toBeNull();
  });

  it("deleteMemoryFact → returns null (no recipe state change)", () => {
    const result = mapToolResultToAction(
      "deleteMemoryFact",
      { deleted: true },
      emptyState
    );
    expect(result).toBeNull();
  });

  it("listMemoryFacts → returns null (informational only)", () => {
    const result = mapToolResultToAction(
      "listMemoryFacts",
      [{ id: uuid1, content: "Végétarien", category: "diet" }],
      emptyState
    );
    expect(result).toBeNull();
  });

  // ─── generateImage ─────────────────────────────────────────────────────────

  it("generateImage → returns SET_IMAGE_GENERATING with recipeImageId and prompt", () => {
    const result = mapToolResultToAction(
      "generateImage",
      { recipeImageId: uuid1, prompt: "A bowl of creamy soup", status: "generating" },
      emptyState
    );
    expect(result).toEqual({
      type: "SET_IMAGE_GENERATING",
      payload: { recipeImageId: uuid1, prompt: "A bowl of creamy soup" },
    });
  });

  // ─── unknown tool ──────────────────────────────────────────────────────────

  it("unknown tool name → returns null", () => {
    const result = mapToolResultToAction("unknownTool", {}, emptyState);
    expect(result).toBeNull();
  });
});
