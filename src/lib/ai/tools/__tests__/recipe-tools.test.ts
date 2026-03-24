import { describe, it, expect, vi, beforeEach } from "vitest";

// Hoisted mock objects — must be created before vi.mock calls are evaluated
const mockService = vi.hoisted(() => ({
  createRecipe: vi.fn(),
  setRecipeTitle: vi.fn(),
  setRecipeServings: vi.fn(),
  setRecipePrepTime: vi.fn(),
  addIngredientToRecipe: vi.fn(),
  updateRecipeIngredient: vi.fn(),
  removeIngredientFromRecipe: vi.fn(),
  setRecipeSteps: vi.fn(),
  setRecipeDietaryTags: vi.fn(),
  setRecipeImagePrompt: vi.fn(),
}));

const mockQueries = vi.hoisted(() => ({
  searchIngredients: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/db", () => ({ db: {} }));
vi.mock("@/lib/recipes/service", () => mockService);
vi.mock("@/lib/recipes/queries", () => mockQueries);

const uuid = "550e8400-e29b-41d4-a716-446655440000";
const uuid2 = "550e8400-e29b-41d4-a716-446655440001";

import { createRecipeTools } from "../recipe-tools";

describe("createRecipeTools", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ─── createRecipe ──────────────────────────────────────────────────────────

  it("createRecipe: calls service.createRecipe and returns id + inputs", async () => {
    mockService.createRecipe.mockResolvedValue({ id: uuid });

    const tools = createRecipeTools("user-1", null);
    const result = await tools.createRecipe.execute(
      { title: "Poulet curry", servings: 4, prep_time: 30 },
      {} as never
    );

    expect(mockService.createRecipe).toHaveBeenCalledWith("user-1", {
      title: "Poulet curry",
      servings: 4,
      prep_time: 30,
    });
    expect(result).toEqual({
      id: uuid,
      title: "Poulet curry",
      servings: 4,
      prep_time: 30,
    });
  });

  it("createRecipe: updates internal recipeId for subsequent tool calls", async () => {
    mockService.createRecipe.mockResolvedValue({ id: uuid });
    mockService.setRecipeTitle.mockResolvedValue(undefined);

    const tools = createRecipeTools("user-1", null);
    await tools.createRecipe.execute({ title: "Poulet" }, {} as never);
    await tools.setRecipeTitle.execute({ title: "Poulet curry" }, {} as never);

    expect(mockService.setRecipeTitle).toHaveBeenCalledWith(
      "user-1",
      uuid,
      "Poulet curry"
    );
  });

  it("createRecipe: returns null servings/prep_time when not provided", async () => {
    mockService.createRecipe.mockResolvedValue({ id: uuid });
    const tools = createRecipeTools("user-1", null);
    const result = await tools.createRecipe.execute(
      { title: "Poulet" },
      {} as never
    );
    expect(result).toMatchObject({ servings: null, prep_time: null });
  });

  // ─── requireRecipeId guard ─────────────────────────────────────────────────

  it("setRecipeTitle: throws descriptive error when no recipeId", async () => {
    const tools = createRecipeTools("user-1", null);
    await expect(
      tools.setRecipeTitle.execute({ title: "Poulet" }, {} as never)
    ).rejects.toThrow("createRecipe");
  });

  it("setRecipeServings: throws when no recipeId", async () => {
    const tools = createRecipeTools("user-1", null);
    await expect(
      tools.setRecipeServings.execute({ servings: 4 }, {} as never)
    ).rejects.toThrow();
  });

  // ─── setRecipeTitle ────────────────────────────────────────────────────────

  it("setRecipeTitle: calls service with correct args", async () => {
    mockService.setRecipeTitle.mockResolvedValue(undefined);
    const tools = createRecipeTools("user-1", uuid);
    const result = await tools.setRecipeTitle.execute(
      { title: "Risotto" },
      {} as never
    );
    expect(mockService.setRecipeTitle).toHaveBeenCalledWith(
      "user-1",
      uuid,
      "Risotto"
    );
    expect(result).toEqual({ title: "Risotto" });
  });

  // ─── setRecipeServings ─────────────────────────────────────────────────────

  it("setRecipeServings: calls service and returns servings", async () => {
    mockService.setRecipeServings.mockResolvedValue(undefined);
    const tools = createRecipeTools("user-1", uuid);
    const result = await tools.setRecipeServings.execute(
      { servings: 6 },
      {} as never
    );
    expect(mockService.setRecipeServings).toHaveBeenCalledWith(
      "user-1",
      uuid,
      6
    );
    expect(result).toEqual({ servings: 6 });
  });

  // ─── setRecipePrepTime ─────────────────────────────────────────────────────

  it("setRecipePrepTime: calls service and returns prep_time", async () => {
    mockService.setRecipePrepTime.mockResolvedValue(undefined);
    const tools = createRecipeTools("user-1", uuid);
    const result = await tools.setRecipePrepTime.execute(
      { prep_time: 45 },
      {} as never
    );
    expect(mockService.setRecipePrepTime).toHaveBeenCalledWith(
      "user-1",
      uuid,
      45
    );
    expect(result).toEqual({ prep_time: 45 });
  });

  // ─── searchIngredients ─────────────────────────────────────────────────────

  it("searchIngredients: calls queries.searchIngredients and returns enriched shape", async () => {
    mockQueries.searchIngredients.mockResolvedValue([
      {
        id: uuid,
        name: "Poulet",
        aisle_id: uuid2,
        season_start: null,
        season_end: null,
        aisle: { id: uuid2, slug: "butcher" },
      },
    ]);
    const tools = createRecipeTools("user-1", null);
    const result = await tools.searchIngredients.execute(
      { query: "poulet" },
      {} as never
    );
    expect(mockQueries.searchIngredients).toHaveBeenCalledWith("poulet", 5);
    expect(result).toEqual([
      {
        id: uuid,
        name: "Poulet",
        aisle_id: uuid2,
        aisle: "butcher",
        season_start: null,
        season_end: null,
      },
    ]);
  });

  it("searchIngredients: returns null aisle_id and aisle when ingredient has no aisle", async () => {
    mockQueries.searchIngredients.mockResolvedValue([
      { id: uuid, name: "Sel", aisle_id: null, season_start: null, season_end: null, aisle: null },
    ]);
    const tools = createRecipeTools("user-1", null);
    const result = (await tools.searchIngredients.execute(
      { query: "sel" },
      {} as never
    )) as Array<{ aisle_id: string | null; aisle: string | null }>;
    expect(result[0].aisle_id).toBeNull();
    expect(result[0].aisle).toBeNull();
  });

  // ─── addIngredient ─────────────────────────────────────────────────────────

  it("addIngredient: calls service and returns ingredient data", async () => {
    mockService.addIngredientToRecipe.mockResolvedValue({
      ingredient_id: uuid2,
    });
    const tools = createRecipeTools("user-1", uuid);
    const result = await tools.addIngredient.execute(
      {
        name: "Riz",
        quantity_per_person: 80,
        unit: "g",
        scaling_factor: 1.0,
      },
      {} as never
    );
    expect(mockService.addIngredientToRecipe).toHaveBeenCalledWith(
      "user-1",
      uuid,
      expect.objectContaining({ name: "Riz", quantity_per_person: 80 })
    );
    expect(result).toMatchObject({
      ingredient_id: uuid2,
      name: "Riz",
      quantity_per_person: 80,
      unit: "g",
      scaling_factor: 1.0,
    });
  });

  // ─── updateIngredient ──────────────────────────────────────────────────────

  it("updateIngredient: calls service with correct args", async () => {
    mockService.updateRecipeIngredient.mockResolvedValue(undefined);
    const tools = createRecipeTools("user-1", uuid);
    const result = await tools.updateIngredient.execute(
      {
        ingredient_id: uuid2,
        quantity_per_person: 120,
        unit: "g",
      },
      {} as never
    );
    expect(mockService.updateRecipeIngredient).toHaveBeenCalledWith(
      "user-1",
      uuid,
      uuid2,
      { quantity_per_person: 120, unit: "g", scaling_factor: undefined }
    );
    expect(result).toMatchObject({
      ingredient_id: uuid2,
      quantity_per_person: 120,
    });
  });

  // ─── removeIngredient ──────────────────────────────────────────────────────

  it("removeIngredient: calls service and returns ingredient_id", async () => {
    mockService.removeIngredientFromRecipe.mockResolvedValue(undefined);
    const tools = createRecipeTools("user-1", uuid);
    const result = await tools.removeIngredient.execute(
      { ingredient_id: uuid2 },
      {} as never
    );
    expect(mockService.removeIngredientFromRecipe).toHaveBeenCalledWith(
      "user-1",
      uuid,
      uuid2
    );
    expect(result).toEqual({ ingredient_id: uuid2 });
  });

  // ─── setSteps ──────────────────────────────────────────────────────────────

  it("setSteps: calls service with steps array", async () => {
    mockService.setRecipeSteps.mockResolvedValue(undefined);
    const tools = createRecipeTools("user-1", uuid);
    const steps = [
      { instruction: "Couper", step_order: 1 },
      { instruction: "Cuire", step_order: 2 },
    ];
    const result = await tools.setSteps.execute({ steps }, {} as never);
    expect(mockService.setRecipeSteps).toHaveBeenCalledWith(
      "user-1",
      uuid,
      steps
    );
    expect(result).toEqual({ steps });
  });

  // ─── setDietaryTags ────────────────────────────────────────────────────────

  it("setDietaryTags: calls service and returns tag ids", async () => {
    mockService.setRecipeDietaryTags.mockResolvedValue(undefined);
    const tools = createRecipeTools("user-1", uuid);
    const result = await tools.setDietaryTags.execute(
      { dietary_tag_ids: [uuid, uuid2] },
      {} as never
    );
    expect(mockService.setRecipeDietaryTags).toHaveBeenCalledWith(
      "user-1",
      uuid,
      [uuid, uuid2]
    );
    expect(result).toEqual({ dietary_tag_ids: [uuid, uuid2] });
  });

  // ─── generateImage ─────────────────────────────────────────────────────────

  it("generateImage: throws when no recipe id", async () => {
    const tools = createRecipeTools("user-1", null);
    await expect(
      tools.generateImage.execute(
        { prompt: "A golden roast chicken with herbs" },
        {} as never
      )
    ).rejects.toThrow();
  });

  it("generateImage: calls setRecipeImagePrompt and returns recipeImageId + prompt", async () => {
    mockService.setRecipeImagePrompt.mockResolvedValue({ recipeImageId: uuid2 });
    const tools = createRecipeTools("user-1", uuid);
    const result = await tools.generateImage.execute(
      { prompt: "A golden roast chicken with herbs" },
      {} as never
    );
    expect(mockService.setRecipeImagePrompt).toHaveBeenCalledWith(
      "user-1",
      uuid,
      "A golden roast chicken with herbs"
    );
    expect(result).toEqual({
      recipeImageId: uuid2,
      prompt: "A golden roast chicken with herbs",
      status: "generating",
    });
  });
});
