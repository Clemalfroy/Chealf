import { describe, it, expect, vi } from "vitest";

// Mock server-only (imported transitively via actions → dal)
vi.mock("server-only", () => ({}));
// Mock next/navigation (used by RecipeEditor component)
vi.mock("next/navigation", () => ({ useRouter: vi.fn(() => ({ push: vi.fn() })) }));
// Mock the server actions so we don't need supabase in tests
vi.mock("@/app/(app)/recipes/actions", () => ({
  saveRecipeAction: vi.fn(),
  deleteRecipeAction: vi.fn(),
  generateRecipeImageAction: vi.fn(),
  setRecipeImagePromptAction: vi.fn(),
}));

import {
  recipeEditorReducer,
  type RecipeEditorState,
} from "../recipe-editor";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeState(overrides?: Partial<RecipeEditorState>): RecipeEditorState {
  return {
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
    ...overrides,
  };
}

function makeIngredient(overrides?: object) {
  return {
    tempId: "t1",
    name: "Poulet",
    quantity_per_person: 150,
    unit: "g",
    scaling_factor: 1.0,
    ...overrides,
  };
}

function makeStep(overrides?: object) {
  return {
    tempId: "s1",
    instruction: "Préchauffer le four",
    step_order: 1,
    ...overrides,
  };
}

// ─── Title ────────────────────────────────────────────────────────────────────

describe("SET_TITLE", () => {
  it("updates title", () => {
    const state = recipeEditorReducer(makeState(), {
      type: "SET_TITLE",
      payload: "Poulet rôti",
    });
    expect(state.title).toBe("Poulet rôti");
  });

  it("sets isDirty", () => {
    const state = recipeEditorReducer(makeState(), {
      type: "SET_TITLE",
      payload: "x",
    });
    expect(state.isDirty).toBe(true);
  });
});

// ─── Servings ─────────────────────────────────────────────────────────────────

describe("SET_SERVINGS", () => {
  it("updates servings", () => {
    const state = recipeEditorReducer(makeState(), {
      type: "SET_SERVINGS",
      payload: 4,
    });
    expect(state.servings).toBe(4);
    expect(state.isDirty).toBe(true);
  });

  it("accepts null (clearing servings)", () => {
    const state = recipeEditorReducer(makeState({ servings: 4 }), {
      type: "SET_SERVINGS",
      payload: null,
    });
    expect(state.servings).toBeNull();
  });
});

// ─── Prep time ────────────────────────────────────────────────────────────────

describe("SET_PREP_TIME", () => {
  it("updates prep_time", () => {
    const state = recipeEditorReducer(makeState(), {
      type: "SET_PREP_TIME",
      payload: 30,
    });
    expect(state.prep_time).toBe(30);
    expect(state.isDirty).toBe(true);
  });

  it("accepts null (clearing prep_time)", () => {
    const state = recipeEditorReducer(makeState({ prep_time: 30 }), {
      type: "SET_PREP_TIME",
      payload: null,
    });
    expect(state.prep_time).toBeNull();
  });
});

// ─── Ingredients ──────────────────────────────────────────────────────────────

describe("ADD_INGREDIENT", () => {
  it("appends ingredient to list", () => {
    const ing = makeIngredient();
    const state = recipeEditorReducer(makeState(), {
      type: "ADD_INGREDIENT",
      payload: ing,
    });
    expect(state.ingredients).toHaveLength(1);
    expect(state.ingredients[0]).toEqual(ing);
    expect(state.isDirty).toBe(true);
  });
});

describe("UPDATE_INGREDIENT", () => {
  it("updates a field on the matching ingredient", () => {
    const ing = makeIngredient({ tempId: "t1" });
    const initial = makeState({ ingredients: [ing] });
    const state = recipeEditorReducer(initial, {
      type: "UPDATE_INGREDIENT",
      tempId: "t1",
      field: "name",
      value: "Saumon",
    });
    expect(state.ingredients[0].name).toBe("Saumon");
    expect(state.isDirty).toBe(true);
  });

  it("does not affect other ingredients", () => {
    const a = makeIngredient({ tempId: "t1", name: "A" });
    const b = makeIngredient({ tempId: "t2", name: "B" });
    const initial = makeState({ ingredients: [a, b] });
    const state = recipeEditorReducer(initial, {
      type: "UPDATE_INGREDIENT",
      tempId: "t1",
      field: "name",
      value: "A2",
    });
    expect(state.ingredients[1].name).toBe("B");
  });
});

describe("REMOVE_INGREDIENT", () => {
  it("removes the matching ingredient", () => {
    const a = makeIngredient({ tempId: "t1" });
    const b = makeIngredient({ tempId: "t2" });
    const initial = makeState({ ingredients: [a, b] });
    const state = recipeEditorReducer(initial, {
      type: "REMOVE_INGREDIENT",
      tempId: "t1",
    });
    expect(state.ingredients).toHaveLength(1);
    expect(state.ingredients[0].tempId).toBe("t2");
    expect(state.isDirty).toBe(true);
  });
});

// ─── Steps ────────────────────────────────────────────────────────────────────

describe("ADD_STEP", () => {
  it("appends a step with correct order", () => {
    const initial = makeState({
      steps: [makeStep({ tempId: "s1", step_order: 1 })],
    });
    const state = recipeEditorReducer(initial, { type: "ADD_STEP" });
    expect(state.steps).toHaveLength(2);
    expect(state.steps[1].step_order).toBe(2);
    expect(state.steps[1].instruction).toBe("");
    expect(state.isDirty).toBe(true);
  });
});

describe("UPDATE_STEP", () => {
  it("updates the instruction of the matching step", () => {
    const step = makeStep({ tempId: "s1" });
    const initial = makeState({ steps: [step] });
    const state = recipeEditorReducer(initial, {
      type: "UPDATE_STEP",
      tempId: "s1",
      instruction: "Faire revenir à feu vif",
    });
    expect(state.steps[0].instruction).toBe("Faire revenir à feu vif");
    expect(state.isDirty).toBe(true);
  });
});

describe("REMOVE_STEP", () => {
  it("removes the step and recalculates step_order", () => {
    const steps = [
      makeStep({ tempId: "s1", step_order: 1 }),
      makeStep({ tempId: "s2", step_order: 2 }),
      makeStep({ tempId: "s3", step_order: 3 }),
    ];
    const initial = makeState({ steps });
    const state = recipeEditorReducer(initial, {
      type: "REMOVE_STEP",
      tempId: "s2",
    });
    expect(state.steps).toHaveLength(2);
    expect(state.steps[0].step_order).toBe(1);
    expect(state.steps[1].step_order).toBe(2);
    expect(state.isDirty).toBe(true);
  });
});

describe("REORDER_STEP", () => {
  it("moves a step up", () => {
    const steps = [
      makeStep({ tempId: "s1", step_order: 1, instruction: "First" }),
      makeStep({ tempId: "s2", step_order: 2, instruction: "Second" }),
    ];
    const state = recipeEditorReducer(makeState({ steps }), {
      type: "REORDER_STEP",
      tempId: "s2",
      direction: "up",
    });
    expect(state.steps[0].tempId).toBe("s2");
    expect(state.steps[1].tempId).toBe("s1");
    expect(state.steps[0].step_order).toBe(1);
    expect(state.steps[1].step_order).toBe(2);
    expect(state.isDirty).toBe(true);
  });

  it("moves a step down", () => {
    const steps = [
      makeStep({ tempId: "s1", step_order: 1 }),
      makeStep({ tempId: "s2", step_order: 2 }),
    ];
    const state = recipeEditorReducer(makeState({ steps }), {
      type: "REORDER_STEP",
      tempId: "s1",
      direction: "down",
    });
    expect(state.steps[0].tempId).toBe("s2");
    expect(state.steps[1].tempId).toBe("s1");
  });

  it("does nothing when moving first step up", () => {
    const steps = [makeStep({ tempId: "s1", step_order: 1 })];
    const initial = makeState({ steps });
    const state = recipeEditorReducer(initial, {
      type: "REORDER_STEP",
      tempId: "s1",
      direction: "up",
    });
    expect(state).toBe(initial); // same reference
  });

  it("does nothing when moving last step down", () => {
    const steps = [makeStep({ tempId: "s1", step_order: 1 })];
    const initial = makeState({ steps });
    const state = recipeEditorReducer(initial, {
      type: "REORDER_STEP",
      tempId: "s1",
      direction: "down",
    });
    expect(state).toBe(initial);
  });
});

describe("SET_STEPS", () => {
  it("replaces steps entirely", () => {
    const initial = makeState({
      steps: [makeStep({ tempId: "s1" })],
    });
    const newSteps = [
      makeStep({ tempId: "sA", instruction: "A", step_order: 1 }),
      makeStep({ tempId: "sB", instruction: "B", step_order: 2 }),
    ];
    const state = recipeEditorReducer(initial, {
      type: "SET_STEPS",
      payload: newSteps,
    });
    expect(state.steps).toEqual(newSteps);
    expect(state.isDirty).toBe(true);
  });
});

// ─── Parallel group ───────────────────────────────────────────────────────────

describe("TOGGLE_PARALLEL", () => {
  it("assigns a new parallel_group to a sequential step", () => {
    const step = makeStep({ tempId: "s1" });
    const state = recipeEditorReducer(makeState({ steps: [step] }), {
      type: "TOGGLE_PARALLEL",
      tempId: "s1",
    });
    expect(state.steps[0].parallel_group).toBe(1);
    expect(state.isDirty).toBe(true);
  });

  it("removes parallel_group from a parallel step", () => {
    const step = makeStep({ tempId: "s1", parallel_group: 1 });
    const state = recipeEditorReducer(makeState({ steps: [step] }), {
      type: "TOGGLE_PARALLEL",
      tempId: "s1",
    });
    expect(state.steps[0].parallel_group).toBeUndefined();
  });

  it("increments parallel_group from existing groups", () => {
    const steps = [
      makeStep({ tempId: "s1", parallel_group: 1 }),
      makeStep({ tempId: "s2" }),
    ];
    const state = recipeEditorReducer(makeState({ steps }), {
      type: "TOGGLE_PARALLEL",
      tempId: "s2",
    });
    expect(state.steps[1].parallel_group).toBe(2);
  });
});

// ─── Tags ─────────────────────────────────────────────────────────────────────

describe("TOGGLE_TAG", () => {
  it("adds a tag when not selected", () => {
    const state = recipeEditorReducer(makeState(), {
      type: "TOGGLE_TAG",
      tagId: "tag-1",
    });
    expect(state.dietary_tag_ids).toContain("tag-1");
    expect(state.isDirty).toBe(true);
  });

  it("removes a tag when already selected", () => {
    const initial = makeState({ dietary_tag_ids: ["tag-1", "tag-2"] });
    const state = recipeEditorReducer(initial, {
      type: "TOGGLE_TAG",
      tagId: "tag-1",
    });
    expect(state.dietary_tag_ids).not.toContain("tag-1");
    expect(state.dietary_tag_ids).toContain("tag-2");
  });
});

describe("SET_TAGS", () => {
  it("replaces tag ids", () => {
    const initial = makeState({ dietary_tag_ids: ["old-1"] });
    const state = recipeEditorReducer(initial, {
      type: "SET_TAGS",
      payload: ["new-1", "new-2"],
    });
    expect(state.dietary_tag_ids).toEqual(["new-1", "new-2"]);
    expect(state.isDirty).toBe(true);
  });
});

// ─── LOAD_RECIPE ──────────────────────────────────────────────────────────────

describe("LOAD_RECIPE", () => {
  it("replaces state and resets isDirty", () => {
    const dirty = makeState({ title: "Old", isDirty: true });
    const loaded: RecipeEditorState = {
      id: "recipe-id",
      title: "Poulet rôti",
      servings: 4,
      prep_time: 30,
      season_start: null,
      season_end: null,
      nutrition_score: null,
      nutrition_data: null,
      ingredients: [makeIngredient()],
      steps: [makeStep()],
      dietary_tag_ids: ["tag-1"],
      isDirty: false,
      image_url: null,
      image_status: "idle",
      image_prompt: null,
      recipe_image_id: null,
    };
    const state = recipeEditorReducer(dirty, {
      type: "LOAD_RECIPE",
      payload: loaded,
    });
    expect(state).toEqual({ ...loaded, isDirty: false });
  });

  it("does not carry over dirty flag from payload", () => {
    const loaded: RecipeEditorState = {
      ...makeState(),
      id: "x",
      isDirty: true, // even if payload says dirty
    };
    const state = recipeEditorReducer(makeState(), {
      type: "LOAD_RECIPE",
      payload: loaded,
    });
    expect(state.isDirty).toBe(false);
  });
});

// ─── Seasonality ──────────────────────────────────────────────────────────────

describe("SET_SEASONALITY", () => {
  it("sets season_start and season_end", () => {
    const state = recipeEditorReducer(makeState(), {
      type: "SET_SEASONALITY",
      payload: { season_start: 6, season_end: 9 },
    });
    expect(state.season_start).toBe(6);
    expect(state.season_end).toBe(9);
    expect(state.isDirty).toBe(true);
  });

  it("accepts null values (clearing seasonality)", () => {
    const initial = makeState({ season_start: 6, season_end: 9 });
    const state = recipeEditorReducer(initial, {
      type: "SET_SEASONALITY",
      payload: { season_start: null, season_end: null },
    });
    expect(state.season_start).toBeNull();
    expect(state.season_end).toBeNull();
  });

  it("handles cross-year range (e.g. nov–feb)", () => {
    const state = recipeEditorReducer(makeState(), {
      type: "SET_SEASONALITY",
      payload: { season_start: 11, season_end: 2 },
    });
    expect(state.season_start).toBe(11);
    expect(state.season_end).toBe(2);
  });
});

// ─── Nutrition ────────────────────────────────────────────────────────────────

describe("SET_NUTRITION", () => {
  const nutritionData = { calories: 450, protein: 25, carbs: 30, fat: 20, fiber: 8 };

  it("sets nutrition_score and nutrition_data", () => {
    const state = recipeEditorReducer(makeState(), {
      type: "SET_NUTRITION",
      payload: { nutrition_score: 72, nutrition_data: nutritionData },
    });
    expect(state.nutrition_score).toBe(72);
    expect(state.nutrition_data).toEqual(nutritionData);
    expect(state.isDirty).toBe(true);
  });

  it("overwrites existing nutrition values", () => {
    const initial = makeState({
      nutrition_score: 50,
      nutrition_data: { calories: 300, protein: 10, carbs: 40, fat: 10, fiber: 3 },
    });
    const state = recipeEditorReducer(initial, {
      type: "SET_NUTRITION",
      payload: { nutrition_score: 80, nutrition_data: nutritionData },
    });
    expect(state.nutrition_score).toBe(80);
    expect(state.nutrition_data?.calories).toBe(450);
  });
});

// ─── Image ─────────────────────────────────────────────────────────────────────

const imageId = "550e8400-e29b-41d4-a716-446655440099";

describe("SET_IMAGE_GENERATING", () => {
  it("sets status to generating and stores imageId + prompt", () => {
    const state = recipeEditorReducer(makeState(), {
      type: "SET_IMAGE_GENERATING",
      payload: { recipeImageId: imageId, prompt: "A golden roast chicken" },
    });
    expect(state.image_status).toBe("generating");
    expect(state.image_prompt).toBe("A golden roast chicken");
    expect(state.recipe_image_id).toBe(imageId);
  });

  it("does not set isDirty", () => {
    const state = recipeEditorReducer(makeState(), {
      type: "SET_IMAGE_GENERATING",
      payload: { recipeImageId: imageId, prompt: "prompt" },
    });
    expect(state.isDirty).toBe(false);
  });
});

describe("SET_IMAGE", () => {
  it("sets image_url, status ready, clears recipe_image_id", () => {
    const initial = makeState({
      image_status: "generating",
      recipe_image_id: imageId,
    });
    const state = recipeEditorReducer(initial, {
      type: "SET_IMAGE",
      payload: "https://cdn.example.com/image.webp",
    });
    expect(state.image_url).toBe("https://cdn.example.com/image.webp");
    expect(state.image_status).toBe("ready");
    expect(state.recipe_image_id).toBeNull();
  });
});

describe("SET_IMAGE_ERROR", () => {
  it("sets status to error and clears recipe_image_id", () => {
    const initial = makeState({
      image_status: "generating",
      recipe_image_id: imageId,
    });
    const state = recipeEditorReducer(initial, { type: "SET_IMAGE_ERROR" });
    expect(state.image_status).toBe("error");
    expect(state.recipe_image_id).toBeNull();
  });

  it("does not clear existing image_url", () => {
    const initial = makeState({
      image_url: "https://cdn.example.com/old.webp",
      image_status: "generating",
    });
    const state = recipeEditorReducer(initial, { type: "SET_IMAGE_ERROR" });
    expect(state.image_url).toBe("https://cdn.example.com/old.webp");
  });
});
