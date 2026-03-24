import { db } from "@/db";
import {
  recipes,
  ingredients,
  recipeIngredients,
  recipeSteps,
  recipeDietaryTags,
  recipeImages,
} from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { generateImage } from "ai";
import { getImageModel } from "@/lib/ai/provider";
import { buildImagePrompt } from "@/lib/ai/prompts/image";
import sharp from "sharp";
import { intersectSeasons } from "./seasonality";
import type { SeasonRange } from "./seasonality";
import type {
  CreateRecipeInput,
  AddIngredientInput,
  SetStepsInput,
  SaveRecipeInput,
  UpdateIngredientInput,
  NutritionData,
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
  opts: {
    name: string;
    ingredient_id?: string;
    aisle_id?: string;
    season_start?: number | null;
    season_end?: number | null;
  }
): Promise<string> {
  if (opts.ingredient_id) return opts.ingredient_id;

  const existing = await tx.query.ingredients.findFirst({
    where: (i, { eq }) => eq(i.name, opts.name),
    columns: { id: true },
  });
  if (existing) return existing.id;

  const [created] = await tx
    .insert(ingredients)
    .values({
      name: opts.name,
      aisle_id: opts.aisle_id ?? null,
      season_start: opts.season_start ?? null,
      season_end: opts.season_end ?? null,
    })
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

async function _recomputeSeasonality(tx: DbOrTx, recipeId: string): Promise<SeasonRange> {
  const rows = await tx.query.recipeIngredients.findMany({
    where: (ri, { eq }) => eq(ri.recipe_id, recipeId),
    with: {
      ingredient: { columns: { season_start: true, season_end: true } },
    },
  });

  const { season_start, season_end } = intersectSeasons(
    rows.map((r) => ({
      season_start: r.ingredient.season_start,
      season_end: r.ingredient.season_end,
    }))
  );

  await tx
    .update(recipes)
    .set({ season_start, season_end })
    .where(eq(recipes.id, recipeId));

  return { season_start, season_end };
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
): Promise<typeof recipeIngredients.$inferSelect & SeasonRange> {
  await assertOwnership(userId, recipeId);

  const ingredientId = await _upsertIngredient(db, {
    name: data.name,
    ingredient_id: data.ingredient_id,
    aisle_id: data.aisle_id,
    season_start: data.season_start,
    season_end: data.season_end,
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

  const seasonality = await _recomputeSeasonality(db, recipeId);
  return { ...row, ...seasonality };
}

export async function addIngredientsToRecipe(
  userId: string,
  recipeId: string,
  items: Array<Omit<AddIngredientInput, "recipeId">>
): Promise<{ ingredients: Array<{ ingredient_id: string; name: string; quantity_per_person: number; unit: string; scaling_factor: number }> } & SeasonRange> {
  if (items.length === 0) return { ingredients: [], season_start: null, season_end: null };
  await assertOwnership(userId, recipeId);

  // Resolve ingredient IDs sequentially — upsert must be serial to avoid
  // race conditions when two items share the same ingredient name.
  const resolved: Array<{ ingredient_id: string; name: string; quantity_per_person: number; unit: string; scaling_factor: number }> = [];
  for (const item of items) {
    const ingredientId = await _upsertIngredient(db, {
      name: item.name,
      ingredient_id: item.ingredient_id,
      aisle_id: item.aisle_id,
      season_start: item.season_start,
      season_end: item.season_end,
    });
    resolved.push({
      ingredient_id: ingredientId,
      name: item.name,
      quantity_per_person: item.quantity_per_person,
      unit: item.unit,
      scaling_factor: item.scaling_factor,
    });
  }

  // Single batch insert for all recipe_ingredients rows
  await db
    .insert(recipeIngredients)
    .values(
      resolved.map((item) => ({
        recipe_id: recipeId,
        ingredient_id: item.ingredient_id,
        quantity_per_person: item.quantity_per_person,
        unit: item.unit,
        scaling_factor: item.scaling_factor,
      }))
    )
    .onConflictDoNothing();

  const seasonality = await _recomputeSeasonality(db, recipeId);
  return { ingredients: resolved, ...seasonality };
}

export async function removeIngredientFromRecipe(
  userId: string,
  recipeId: string,
  ingredientId: string
): Promise<SeasonRange> {
  await assertOwnership(userId, recipeId);
  await db
    .delete(recipeIngredients)
    .where(
      and(
        eq(recipeIngredients.recipe_id, recipeId),
        eq(recipeIngredients.ingredient_id, ingredientId)
      )
    );
  return _recomputeSeasonality(db, recipeId);
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

// ─── Seasonality + nutrition operations ───────────────────────────────────────

export async function setRecipeSeasonality(
  userId: string,
  recipeId: string,
  seasonStart: number | null,
  seasonEnd: number | null
): Promise<void> {
  await assertOwnership(userId, recipeId);
  await db
    .update(recipes)
    .set({
      season_start: seasonStart,
      season_end: seasonEnd,
      updated_at: new Date(),
    })
    .where(eq(recipes.id, recipeId));
}

export async function setRecipeNutrition(
  userId: string,
  recipeId: string,
  score: number,
  data: NutritionData
): Promise<void> {
  await assertOwnership(userId, recipeId);
  await db
    .update(recipes)
    .set({
      nutrition_score: score,
      nutrition_data: data,
      updated_at: new Date(),
    })
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
          season_start: data.season_start ?? null,
          season_end: data.season_end ?? null,
          nutrition_score: data.nutrition_score ?? null,
          nutrition_data: data.nutrition_data ?? null,
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
          season_start: data.season_start ?? null,
          season_end: data.season_end ?? null,
          nutrition_score: data.nutrition_score ?? null,
          nutrition_data: data.nutrition_data ?? null,
        })
        .returning({ id: recipes.id });
      recipeId = recipe.id;
    }

    // Insert ingredients, steps, tags
    await _insertRecipeIngredients(tx, recipeId, data.ingredients);
    await _insertRecipeSteps(tx, recipeId, data.steps);
    await _insertRecipeDietaryTags(tx, recipeId, data.dietary_tag_ids);
    await _recomputeSeasonality(tx, recipeId);

    return { id: recipeId };
  });
}

// ─── Image operations ─────────────────────────────────────────────────────────

export async function setRecipeImagePrompt(
  userId: string,
  recipeId: string,
  prompt: string
): Promise<{ recipeImageId: string }> {
  await assertOwnership(userId, recipeId);

  // Deactivate previous active images
  await db
    .update(recipeImages)
    .set({ is_active: false, updated_at: new Date() })
    .where(
      and(eq(recipeImages.recipe_id, recipeId), eq(recipeImages.is_active, true))
    );

  const [row] = await db
    .insert(recipeImages)
    .values({
      recipe_id: recipeId,
      user_id: userId,
      prompt,
      status: "generating",
      is_active: true,
    })
    .returning({ id: recipeImages.id });

  return { recipeImageId: row.id };
}

export async function generateRecipeImage(
  userId: string,
  recipeImageId: string,
  uploadImage: (buffer: Buffer, storagePath: string) => Promise<string>
): Promise<{ imageUrl: string }> {
  // Load the recipe_images row and verify ownership
  const row = await db.query.recipeImages.findFirst({
    where: (ri, { eq, and }) =>
      and(eq(ri.id, recipeImageId), eq(ri.user_id, userId)),
  });
  if (!row) throw new Error("Image record not found or access denied");

  // Server-side rate limit: reject if another image is already generating for this recipe
  const generating = await db.query.recipeImages.findFirst({
    where: (ri, { eq, and, ne }) =>
      and(
        eq(ri.recipe_id, row.recipe_id),
        eq(ri.status, "generating"),
        ne(ri.id, recipeImageId)
      ),
    columns: { id: true },
  });
  if (generating) {
    throw new Error("Image generation already in progress for this recipe");
  }

  try {
    const result = await generateImage({
      model: getImageModel(),
      prompt: buildImagePrompt(row.prompt),
      size: "1792x1024",
    });

    const webpBuffer = await sharp(result.image.uint8Array)
      .webp({ quality: 85 })
      .toBuffer();

    const storagePath = `${userId}/${row.recipe_id}/${recipeImageId}.webp`;
    const imageUrl = await uploadImage(webpBuffer, storagePath);

    await db
      .update(recipeImages)
      .set({ image_url: imageUrl, status: "ready", updated_at: new Date() })
      .where(eq(recipeImages.id, recipeImageId));

    await db
      .update(recipes)
      .set({ image_url: imageUrl, updated_at: new Date() })
      .where(eq(recipes.id, row.recipe_id));

    return { imageUrl };
  } catch (err) {
    console.error("[generateRecipeImage] failed:", err);
    await db
      .update(recipeImages)
      .set({ status: "error", updated_at: new Date() })
      .where(eq(recipeImages.id, recipeImageId));
    const message = err instanceof Error ? err.message : "Image generation failed";
    throw new Error(`Image generation failed: ${message}`);
  }
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
