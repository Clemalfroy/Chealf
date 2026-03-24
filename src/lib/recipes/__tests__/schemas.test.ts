import { describe, it, expect } from "vitest";
import {
  createRecipeSchema,
  setRecipeTitleSchema,
  setRecipeServingsSchema,
  setRecipePrepTimeSchema,
  addIngredientSchema,
  removeIngredientSchema,
  setStepsSchema,
  setDietaryTagsSchema,
  updateIngredientSchema,
  saveRecipeSchema,
} from "../schemas";

const uuid = "550e8400-e29b-41d4-a716-446655440000";

// ─── createRecipeSchema ───────────────────────────────────────────────────────

describe("createRecipeSchema", () => {
  it("accepts title only", () => {
    const result = createRecipeSchema.safeParse({ title: "Poulet rôti" });
    expect(result.success).toBe(true);
  });

  it("accepts all fields", () => {
    const result = createRecipeSchema.safeParse({
      title: "Poulet rôti",
      servings: 4,
      prep_time: 30,
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty title", () => {
    const result = createRecipeSchema.safeParse({ title: "" });
    expect(result.success).toBe(false);
  });

  it("rejects title over 200 chars", () => {
    const result = createRecipeSchema.safeParse({ title: "a".repeat(201) });
    expect(result.success).toBe(false);
  });

  it("rejects servings = 0", () => {
    const result = createRecipeSchema.safeParse({ title: "x", servings: 0 });
    expect(result.success).toBe(false);
  });

  it("rejects servings > 50", () => {
    const result = createRecipeSchema.safeParse({ title: "x", servings: 51 });
    expect(result.success).toBe(false);
  });

  it("rejects non-integer servings", () => {
    const result = createRecipeSchema.safeParse({ title: "x", servings: 2.5 });
    expect(result.success).toBe(false);
  });

  it("rejects prep_time = 0", () => {
    const result = createRecipeSchema.safeParse({ title: "x", prep_time: 0 });
    expect(result.success).toBe(false);
  });

  it("rejects prep_time > 1440", () => {
    const result = createRecipeSchema.safeParse({ title: "x", prep_time: 1441 });
    expect(result.success).toBe(false);
  });
});

// ─── setRecipeTitleSchema ─────────────────────────────────────────────────────

describe("setRecipeTitleSchema", () => {
  it("accepts valid input", () => {
    const result = setRecipeTitleSchema.safeParse({ recipeId: uuid, title: "New title" });
    expect(result.success).toBe(true);
  });

  it("rejects invalid uuid", () => {
    const result = setRecipeTitleSchema.safeParse({ recipeId: "not-a-uuid", title: "x" });
    expect(result.success).toBe(false);
  });

  it("rejects empty title", () => {
    const result = setRecipeTitleSchema.safeParse({ recipeId: uuid, title: "" });
    expect(result.success).toBe(false);
  });
});

// ─── setRecipeServingsSchema ──────────────────────────────────────────────────

describe("setRecipeServingsSchema", () => {
  it("accepts valid input", () => {
    const result = setRecipeServingsSchema.safeParse({ recipeId: uuid, servings: 4 });
    expect(result.success).toBe(true);
  });

  it("rejects servings > 50", () => {
    const result = setRecipeServingsSchema.safeParse({ recipeId: uuid, servings: 51 });
    expect(result.success).toBe(false);
  });

  it("rejects servings < 1", () => {
    const result = setRecipeServingsSchema.safeParse({ recipeId: uuid, servings: 0 });
    expect(result.success).toBe(false);
  });
});

// ─── setRecipePrepTimeSchema ──────────────────────────────────────────────────

describe("setRecipePrepTimeSchema", () => {
  it("accepts valid input", () => {
    const result = setRecipePrepTimeSchema.safeParse({ recipeId: uuid, prep_time: 45 });
    expect(result.success).toBe(true);
  });

  it("rejects prep_time > 1440", () => {
    const result = setRecipePrepTimeSchema.safeParse({ recipeId: uuid, prep_time: 1441 });
    expect(result.success).toBe(false);
  });

  it("rejects prep_time < 1", () => {
    const result = setRecipePrepTimeSchema.safeParse({ recipeId: uuid, prep_time: 0 });
    expect(result.success).toBe(false);
  });
});

// ─── addIngredientSchema ──────────────────────────────────────────────────────

describe("addIngredientSchema", () => {
  it("accepts minimal valid input", () => {
    const result = addIngredientSchema.safeParse({
      recipeId: uuid,
      name: "Poulet",
      quantity_per_person: 150,
      unit: "g",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.scaling_factor).toBe(1.0); // default
    }
  });

  it("accepts optional fields", () => {
    const result = addIngredientSchema.safeParse({
      recipeId: uuid,
      name: "Sel",
      quantity_per_person: 1,
      unit: "pincée",
      ingredient_id: uuid,
      aisle_id: uuid,
      scaling_factor: 0.0,
    });
    expect(result.success).toBe(true);
  });

  it("rejects negative quantity_per_person", () => {
    const result = addIngredientSchema.safeParse({
      recipeId: uuid,
      name: "Sel",
      quantity_per_person: -1,
      unit: "g",
    });
    expect(result.success).toBe(false);
  });

  it("rejects zero quantity_per_person", () => {
    const result = addIngredientSchema.safeParse({
      recipeId: uuid,
      name: "Sel",
      quantity_per_person: 0,
      unit: "g",
    });
    expect(result.success).toBe(false);
  });

  it("rejects scaling_factor > 2", () => {
    const result = addIngredientSchema.safeParse({
      recipeId: uuid,
      name: "Sel",
      quantity_per_person: 1,
      unit: "g",
      scaling_factor: 2.1,
    });
    expect(result.success).toBe(false);
  });

  it("rejects scaling_factor < 0", () => {
    const result = addIngredientSchema.safeParse({
      recipeId: uuid,
      name: "Sel",
      quantity_per_person: 1,
      unit: "g",
      scaling_factor: -0.1,
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty unit", () => {
    const result = addIngredientSchema.safeParse({
      recipeId: uuid,
      name: "Sel",
      quantity_per_person: 1,
      unit: "",
    });
    expect(result.success).toBe(false);
  });
});

// ─── removeIngredientSchema ───────────────────────────────────────────────────

describe("removeIngredientSchema", () => {
  it("accepts valid input", () => {
    const result = removeIngredientSchema.safeParse({
      recipeId: uuid,
      ingredientId: uuid,
    });
    expect(result.success).toBe(true);
  });

  it("rejects non-uuid ingredientId", () => {
    const result = removeIngredientSchema.safeParse({
      recipeId: uuid,
      ingredientId: "not-a-uuid",
    });
    expect(result.success).toBe(false);
  });
});

// ─── setStepsSchema ───────────────────────────────────────────────────────────

describe("setStepsSchema", () => {
  it("accepts valid steps", () => {
    const result = setStepsSchema.safeParse({
      recipeId: uuid,
      steps: [
        { instruction: "Éplucher", step_order: 1 },
        { instruction: "Faire revenir", step_order: 2, parallel_group: 1 },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("accepts empty steps array", () => {
    const result = setStepsSchema.safeParse({ recipeId: uuid, steps: [] });
    expect(result.success).toBe(true);
  });

  it("rejects empty instruction", () => {
    const result = setStepsSchema.safeParse({
      recipeId: uuid,
      steps: [{ instruction: "", step_order: 1 }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects step_order < 1", () => {
    const result = setStepsSchema.safeParse({
      recipeId: uuid,
      steps: [{ instruction: "x", step_order: 0 }],
    });
    expect(result.success).toBe(false);
  });
});

// ─── setDietaryTagsSchema ─────────────────────────────────────────────────────

describe("setDietaryTagsSchema", () => {
  it("accepts empty tags array", () => {
    const result = setDietaryTagsSchema.safeParse({
      recipeId: uuid,
      dietary_tag_ids: [],
    });
    expect(result.success).toBe(true);
  });

  it("accepts valid tag ids", () => {
    const result = setDietaryTagsSchema.safeParse({
      recipeId: uuid,
      dietary_tag_ids: [uuid, uuid],
    });
    expect(result.success).toBe(true);
  });

  it("rejects non-uuid tag id", () => {
    const result = setDietaryTagsSchema.safeParse({
      recipeId: uuid,
      dietary_tag_ids: ["not-a-uuid"],
    });
    expect(result.success).toBe(false);
  });
});

// ─── saveRecipeSchema ─────────────────────────────────────────────────────────

describe("saveRecipeSchema", () => {
  const validPayload = {
    title: "Poulet rôti",
    servings: 4,
    prep_time: 45,
    ingredients: [
      { name: "Poulet", quantity_per_person: 200, unit: "g", scaling_factor: 1.0 },
    ],
    steps: [
      { instruction: "Préchauffer le four", step_order: 1 },
    ],
    dietary_tag_ids: [],
  };

  it("accepts a complete valid recipe", () => {
    const result = saveRecipeSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
  });

  it("accepts an existing recipe id (update path)", () => {
    const result = saveRecipeSchema.safeParse({ ...validPayload, id: uuid });
    expect(result.success).toBe(true);
  });

  it("accepts empty ingredients and steps", () => {
    const result = saveRecipeSchema.safeParse({
      ...validPayload,
      ingredients: [],
      steps: [],
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing title", () => {
    const { title: _title, ...rest } = validPayload;
    const result = saveRecipeSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects invalid ingredient quantity", () => {
    const result = saveRecipeSchema.safeParse({
      ...validPayload,
      ingredients: [{ name: "x", quantity_per_person: -1, unit: "g", scaling_factor: 1 }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects prep_time > 1440", () => {
    const result = saveRecipeSchema.safeParse({ ...validPayload, prep_time: 1441 });
    expect(result.success).toBe(false);
  });

  it("rejects servings > 50", () => {
    const result = saveRecipeSchema.safeParse({ ...validPayload, servings: 51 });
    expect(result.success).toBe(false);
  });
});

// ─── updateIngredientSchema ───────────────────────────────────────────────────

describe("updateIngredientSchema", () => {
  it("accepts all optional fields", () => {
    const result = updateIngredientSchema.safeParse({
      recipeId: uuid,
      ingredientId: uuid,
      quantity_per_person: 150,
      unit: "g",
      scaling_factor: 0.6,
    });
    expect(result.success).toBe(true);
  });

  it("accepts with only recipeId and ingredientId", () => {
    const result = updateIngredientSchema.safeParse({
      recipeId: uuid,
      ingredientId: uuid,
    });
    expect(result.success).toBe(true);
  });

  it("rejects negative quantity_per_person", () => {
    const result = updateIngredientSchema.safeParse({
      recipeId: uuid,
      ingredientId: uuid,
      quantity_per_person: -1,
    });
    expect(result.success).toBe(false);
  });

  it("rejects scaling_factor > 2", () => {
    const result = updateIngredientSchema.safeParse({
      recipeId: uuid,
      ingredientId: uuid,
      scaling_factor: 3,
    });
    expect(result.success).toBe(false);
  });

  it("rejects non-uuid recipeId", () => {
    const result = updateIngredientSchema.safeParse({
      recipeId: "not-a-uuid",
      ingredientId: uuid,
    });
    expect(result.success).toBe(false);
  });
});
