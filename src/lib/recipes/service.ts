import { db } from "@/db";
import {
  recipes,
  ingredients,
  recipeIngredients,
  recipeSteps,
  recipeDietaryTags,
} from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import type {
  CreateRecipeInput,
  AddIngredientInput,
  SetStepsInput,
  SaveRecipeInput,
  UpdateIngredientInput,
} from "./schemas";

// Covers both the top-level db client and a transaction object
type DbOrTx = typeof db | Parameters<Parameters<typeof db.transaction>[0]>[0];

// ─── Ownership guard ──────────────────────────────────────────────────────────

async function assertOwnership(userId: string, recipeId: string) {
  const recipe = await db.query.recipes.findFirst({
    where: (r, { eq, and }) => and(eq(r.id, recipeId), eq(r.user_id, userId)),
    columns: { id: true },
  });
  if (!recipe) {
    throw new Error("Recipe not found or access denied");
  }
}

// ─── Shared low-level helpers (used by both granular ops and saveRecipeFull) ──

async function _upsertIngredient(
  tx: DbOrTx,
  opts: { name: string; ingredient_id?: string; aisle_id?: string }
): Promise<string> {
  if (opts.ingredient_id) return opts.ingredient_id;

  const existing = await tx.query.ingredients.findFirst({
    where: (i, { eq }) => eq(i.name, opts.name),
    columns: { id: true },
  });
  if (existing) return existing.id;

  const [created] = await tx
    .insert(ingredients)
    .values({ name: opts.name, aisle_id: opts.aisle_id ?? null })
    .returning({ id: ingredients.id });
  return created.id;
}

async function _insertRecipeIngredients(
  tx: DbOrTx,
  recipeId: string,
  items: Array<{
    name: string;
    ingredient_id?: string;
    aisle_id?: string;
    quantity_per_person: number;
    unit: string;
    scaling_factor: number;
  }>
) {
  for (const item of items) {
    const ingredientId = await _upsertIngredient(tx, item);
    await tx
      .insert(recipeIngredients)
      .values({
        recipe_id: recipeId,
        ingredient_id: ingredientId,
        quantity_per_person: item.quantity_per_person,
        unit: item.unit,
        scaling_factor: item.scaling_factor,
      })
      .onConflictDoNothing();
  }
}

async function _insertRecipeSteps(
  tx: DbOrTx,
  recipeId: string,
  steps: Array<{
    instruction: string;
    step_order: number;
    parallel_group?: number;
  }>
) {
  if (steps.length === 0) return;
  await tx.insert(recipeSteps).values(
    steps.map((s) => ({
      recipe_id: recipeId,
      instruction: s.instruction,
      step_order: s.step_order,
      parallel_group: s.parallel_group ?? null,
    }))
  );
}

async function _insertRecipeDietaryTags(
  tx: DbOrTx,
  recipeId: string,
  tagIds: string[]
) {
  if (tagIds.length === 0) return;
  await tx.insert(recipeDietaryTags).values(
    tagIds.map((tagId) => ({
      recipe_id: recipeId,
      dietary_tag_id: tagId,
    }))
  ).onConflictDoNothing();
}

// ─── Recipe lifecycle ─────────────────────────────────────────────────────────

export async function createRecipe(
  userId: string,
  data: CreateRecipeInput
): Promise<{ id: string }> {
  const [recipe] = await db
    .insert(recipes)
    .values({
      user_id: userId,
      title: data.title,
      servings: data.servings ?? null,
      prep_time: data.prep_time ?? null,
    })
    .returning({ id: recipes.id });
  return recipe;
}

export async function deleteRecipe(
  userId: string,
  recipeId: string
): Promise<void> {
  await assertOwnership(userId, recipeId);
  await db.delete(recipes).where(eq(recipes.id, recipeId));
}

// ─── Granular field operations (each = 1 AI tool in M1.2) ────────────────────

export async function setRecipeTitle(
  userId: string,
  recipeId: string,
  title: string
): Promise<void> {
  await assertOwnership(userId, recipeId);
  await db
    .update(recipes)
    .set({ title, updated_at: new Date() })
    .where(eq(recipes.id, recipeId));
}

export async function setRecipeServings(
  userId: string,
  recipeId: string,
  servings: number
): Promise<void> {
  await assertOwnership(userId, recipeId);
  await db
    .update(recipes)
    .set({ servings, updated_at: new Date() })
    .where(eq(recipes.id, recipeId));
}

export async function setRecipePrepTime(
  userId: string,
  recipeId: string,
  prepTime: number
): Promise<void> {
  await assertOwnership(userId, recipeId);
  await db
    .update(recipes)
    .set({ prep_time: prepTime, updated_at: new Date() })
    .where(eq(recipes.id, recipeId));
}

// ─── Ingredient operations ────────────────────────────────────────────────────

export async function addIngredientToRecipe(
  userId: string,
  recipeId: string,
  data: Omit<AddIngredientInput, "recipeId">
) {
  await assertOwnership(userId, recipeId);

  const ingredientId = await _upsertIngredient(db, {
    name: data.name,
    ingredient_id: data.ingredient_id,
    aisle_id: data.aisle_id,
  });

  const [row] = await db
    .insert(recipeIngredients)
    .values({
      recipe_id: recipeId,
      ingredient_id: ingredientId,
      quantity_per_person: data.quantity_per_person,
      unit: data.unit,
      scaling_factor: data.scaling_factor,
    })
    .onConflictDoNothing()
    .returning();
  return row;
}

export async function removeIngredientFromRecipe(
  userId: string,
  recipeId: string,
  ingredientId: string
): Promise<void> {
  await assertOwnership(userId, recipeId);
  await db
    .delete(recipeIngredients)
    .where(
      and(
        eq(recipeIngredients.recipe_id, recipeId),
        eq(recipeIngredients.ingredient_id, ingredientId)
      )
    );
}

export async function updateRecipeIngredient(
  userId: string,
  recipeId: string,
  ingredientId: string,
  data: Pick<UpdateIngredientInput, "quantity_per_person" | "unit" | "scaling_factor">
): Promise<void> {
  await assertOwnership(userId, recipeId);
  const updates: Partial<typeof recipeIngredients.$inferInsert> = {};
  if (data.quantity_per_person !== undefined)
    updates.quantity_per_person = data.quantity_per_person;
  if (data.unit !== undefined) updates.unit = data.unit;
  if (data.scaling_factor !== undefined) updates.scaling_factor = data.scaling_factor;
  if (Object.keys(updates).length === 0) return;
  await db
    .update(recipeIngredients)
    .set(updates)
    .where(
      and(
        eq(recipeIngredients.recipe_id, recipeId),
        eq(recipeIngredients.ingredient_id, ingredientId)
      )
    );
}

// ─── Step operations ──────────────────────────────────────────────────────────

export async function setRecipeSteps(
  userId: string,
  recipeId: string,
  steps: SetStepsInput["steps"]
): Promise<void> {
  await assertOwnership(userId, recipeId);
  await db.delete(recipeSteps).where(eq(recipeSteps.recipe_id, recipeId));
  await _insertRecipeSteps(db, recipeId, steps);
  await db
    .update(recipes)
    .set({ updated_at: new Date() })
    .where(eq(recipes.id, recipeId));
}

// ─── Tag operations ───────────────────────────────────────────────────────────

export async function setRecipeDietaryTags(
  userId: string,
  recipeId: string,
  tagIds: string[]
): Promise<void> {
  await assertOwnership(userId, recipeId);
  await db
    .delete(recipeDietaryTags)
    .where(eq(recipeDietaryTags.recipe_id, recipeId));
  await _insertRecipeDietaryTags(db, recipeId, tagIds);
  await db
    .update(recipes)
    .set({ updated_at: new Date() })
    .where(eq(recipes.id, recipeId));
}

// ─── Batch operation (single transaction — used by form save) ─────────────────

export async function saveRecipeFull(
  userId: string,
  data: SaveRecipeInput
): Promise<{ id: string }> {
  return db.transaction(async (tx) => {
    let recipeId: string;

    if (data.id) {
      // Update: verify ownership first
      const existing = await tx.query.recipes.findFirst({
        where: (r, { eq, and }) =>
          and(eq(r.id, data.id!), eq(r.user_id, userId)),
        columns: { id: true },
      });
      if (!existing) throw new Error("Recipe not found or access denied");

      recipeId = data.id;
      await tx
        .update(recipes)
        .set({
          title: data.title,
          servings: data.servings ?? null,
          prep_time: data.prep_time ?? null,
          updated_at: new Date(),
        })
        .where(eq(recipes.id, recipeId));

      // Replace ingredients, steps, tags
      await tx
        .delete(recipeIngredients)
        .where(eq(recipeIngredients.recipe_id, recipeId));
      await tx
        .delete(recipeSteps)
        .where(eq(recipeSteps.recipe_id, recipeId));
      await tx
        .delete(recipeDietaryTags)
        .where(eq(recipeDietaryTags.recipe_id, recipeId));
    } else {
      // Create new recipe
      const [recipe] = await tx
        .insert(recipes)
        .values({
          user_id: userId,
          title: data.title,
          servings: data.servings ?? null,
          prep_time: data.prep_time ?? null,
        })
        .returning({ id: recipes.id });
      recipeId = recipe.id;
    }

    // Insert ingredients, steps, tags
    await _insertRecipeIngredients(tx, recipeId, data.ingredients);
    await _insertRecipeSteps(tx, recipeId, data.steps);
    await _insertRecipeDietaryTags(tx, recipeId, data.dietary_tag_ids);

    return { id: recipeId };
  });
}

// ─── Consistency validation ────────────────────────────────────────────────────

export type ConsistencyWarning = {
  type: "duplicate_ingredient" | "step_order_gap" | "missing_ingredient_ref";
  message: string;
};

export async function validateRecipeConsistency(
  recipeId: string
): Promise<ConsistencyWarning[]> {
  const warnings: ConsistencyWarning[] = [];

  // Check for duplicate ingredient_id in recipe_ingredients
  const dupResult = await db.execute(sql`
    SELECT ingredient_id, COUNT(*) as count
    FROM recipe_ingredients
    WHERE recipe_id = ${recipeId}
    GROUP BY ingredient_id
    HAVING COUNT(*) > 1
  `);
  if (dupResult.length > 0) {
    warnings.push({
      type: "duplicate_ingredient",
      message: `Recipe has ${dupResult.length} duplicate ingredient(s)`,
    });
  }

  // Check step_order is sequential (1, 2, 3, ...)
  const steps = await db.query.recipeSteps.findMany({
    where: (s, { eq }) => eq(s.recipe_id, recipeId),
    orderBy: (s, { asc }) => asc(s.step_order),
    columns: { step_order: true },
  });
  const expectedOrders = steps.map((_, i) => i + 1);
  const hasGap = steps.some((s, i) => s.step_order !== expectedOrders[i]);
  if (hasGap) {
    warnings.push({
      type: "step_order_gap",
      message: "Recipe steps have non-sequential step_order values",
    });
  }

  return warnings;
}
