import { db } from "@/db";
import { ingredients, aisles, dietaryTags } from "@/db/schema";
import { eq, ilike } from "drizzle-orm";

// ─── Full recipe with all relations ───────────────────────────────────────────

export async function getRecipeById(id: string) {
  return db.query.recipes.findFirst({
    where: (recipes, { eq }) => eq(recipes.id, id),
    with: {
      recipeIngredients: {
        with: {
          ingredient: {
            with: {
              aisle: true,
            },
          },
        },
      },
      recipeSteps: {
        orderBy: (steps, { asc }) => [asc(steps.step_order)],
      },
      recipeDietaryTags: {
        with: {
          dietaryTag: true,
        },
      },
    },
  }) ?? null;
}

export type RecipeWithRelations = NonNullable<
  Awaited<ReturnType<typeof getRecipeById>>
>;

// ─── Lean list query (card fields + tags only) ────────────────────────────────

export async function getRecipesByUserId(userId: string) {
  return db.query.recipes.findMany({
    where: (recipes, { eq }) => eq(recipes.user_id, userId),
    columns: {
      id: true,
      title: true,
      image_url: true,
      prep_time: true,
      servings: true,
      season_start: true,
      season_end: true,
      nutrition_score: true,
      updated_at: true,
    },
    with: {
      recipeDietaryTags: {
        with: {
          dietaryTag: true,
        },
      },
    },
    orderBy: (recipes, { desc }) => [desc(recipes.updated_at)],
  });
}

export type RecipeCard = Awaited<ReturnType<typeof getRecipesByUserId>>[number];

// ─── Ingredient search (ready for M1.2 AI tool) ───────────────────────────────

export async function searchIngredients(query: string, limit = 10) {
  return db
    .select({
      id: ingredients.id,
      name: ingredients.name,
      aisle_id: ingredients.aisle_id,
      season_start: ingredients.season_start,
      season_end: ingredients.season_end,
      aisle: {
        id: aisles.id,
        slug: aisles.slug,
      },
    })
    .from(ingredients)
    .leftJoin(aisles, eq(ingredients.aisle_id, aisles.id))
    .where(ilike(ingredients.name, `%${query}%`))
    .limit(limit);
}

// ─── Lookup tables ─────────────────────────────────────────────────────────────

export async function getAllDietaryTags() {
  return db.select().from(dietaryTags);
}

export async function getAllAisles() {
  return db.select().from(aisles);
}
