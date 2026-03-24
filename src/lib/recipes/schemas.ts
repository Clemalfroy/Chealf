import { z } from "zod";

// ─── Granular operation schemas (each maps to one AI tool in M1.2) ─────────────

export const createRecipeSchema = z.object({
  title: z.string().min(1).max(200),
  servings: z.number().int().min(1).max(50).optional(),
  prep_time: z.number().int().min(1).max(1440).optional(),
});

export const setRecipeTitleSchema = z.object({
  recipeId: z.string().uuid(),
  title: z.string().min(1).max(200),
});

export const setRecipeServingsSchema = z.object({
  recipeId: z.string().uuid(),
  servings: z.number().int().min(1).max(50),
});

export const setRecipePrepTimeSchema = z.object({
  recipeId: z.string().uuid(),
  prep_time: z.number().int().min(1).max(1440),
});

export const addIngredientSchema = z.object({
  recipeId: z.string().uuid(),
  name: z.string().min(1),
  ingredient_id: z.string().uuid().optional(),
  aisle_id: z.string().uuid().optional(),
  quantity_per_person: z.number().positive(),
  unit: z.string().min(1),
  scaling_factor: z.number().min(0).max(2).default(1.0),
});

export const removeIngredientSchema = z.object({
  recipeId: z.string().uuid(),
  ingredientId: z.string().uuid(),
});

export const setStepsSchema = z.object({
  recipeId: z.string().uuid(),
  steps: z.array(
    z.object({
      instruction: z.string().min(1),
      step_order: z.number().int().min(1),
      parallel_group: z.number().int().optional(),
    })
  ),
});

export const setDietaryTagsSchema = z.object({
  recipeId: z.string().uuid(),
  dietary_tag_ids: z.array(z.string().uuid()),
});

export const updateIngredientSchema = z.object({
  recipeId: z.string().uuid(),
  ingredientId: z.string().uuid(),
  quantity_per_person: z.number().positive().optional(),
  unit: z.string().min(1).optional(),
  scaling_factor: z.number().min(0).max(2).optional(),
});

// ─── Composite schema for form save (batches all operations) ───────────────────

const recipeIngredientInput = z.object({
  name: z.string().min(1),
  ingredient_id: z.string().uuid().optional(),
  aisle_id: z.string().uuid().optional(),
  quantity_per_person: z.number().positive(),
  unit: z.string().min(1),
  scaling_factor: z.number().min(0).max(2).default(1.0),
});

const recipeStepInput = z.object({
  instruction: z.string().min(1),
  step_order: z.number().int().min(1),
  parallel_group: z.number().int().optional(),
});

export const saveRecipeSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(1).max(200),
  servings: z.number().int().min(1).max(50).optional(),
  prep_time: z.number().int().min(1).max(1440).optional(),
  ingredients: z.array(recipeIngredientInput),
  steps: z.array(recipeStepInput),
  dietary_tag_ids: z.array(z.string().uuid()),
});

// ─── Inferred types ────────────────────────────────────────────────────────────

export type CreateRecipeInput = z.infer<typeof createRecipeSchema>;
export type SetRecipeTitleInput = z.infer<typeof setRecipeTitleSchema>;
export type SetRecipeServingsInput = z.infer<typeof setRecipeServingsSchema>;
export type SetRecipePrepTimeInput = z.infer<typeof setRecipePrepTimeSchema>;
export type AddIngredientInput = z.infer<typeof addIngredientSchema>;
export type RemoveIngredientInput = z.infer<typeof removeIngredientSchema>;
export type SetStepsInput = z.infer<typeof setStepsSchema>;
export type SetDietaryTagsInput = z.infer<typeof setDietaryTagsSchema>;
export type SaveRecipeInput = z.infer<typeof saveRecipeSchema>;
export type UpdateIngredientInput = z.infer<typeof updateIngredientSchema>;
