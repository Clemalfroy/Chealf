import { t } from "@/lib/i18n";
import type { RecipeWithRelations } from "@/lib/recipes/queries";
import type { NutritionData } from "@/lib/recipes/schemas";

const MONTH_NAMES = [
  "", // index 0 unused
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre",
];

function formatSeasonContext(start: number | null, end: number | null): string {
  if (start == null || end == null) return "Toute l'année";
  return `${MONTH_NAMES[start]}–${MONTH_NAMES[end]}`;
}

/**
 * Serialize a recipe into a compact human-readable string for the AI system prompt.
 * Uses ingredient IDs so the AI can reference them in updateIngredient / removeIngredient tools.
 */
export function serializeRecipeContext(recipe: RecipeWithRelations): string {
  const lines: string[] = [
    `## Recette en cours d'édition (ID: ${recipe.id})`,
    `Titre: ${recipe.title}`,
  ];

  const meta: string[] = [];
  if (recipe.servings) meta.push(`Portions: ${recipe.servings}`);
  if (recipe.prep_time) meta.push(`Préparation: ${recipe.prep_time} min`);
  if (meta.length > 0) lines.push(meta.join(" | "));

  lines.push(`Saisonnalité: ${formatSeasonContext(recipe.season_start, recipe.season_end)}`);

  if (recipe.nutrition_score != null) {
    lines.push(`Score nutritionnel: ${recipe.nutrition_score}/100`);
  } else {
    lines.push("Score nutritionnel: Non calculé");
  }

  if (recipe.nutrition_data) {
    const n = recipe.nutrition_data as NutritionData;
    lines.push(
      `Nutrition estimée: ~${n.calories} kcal, ${n.protein}g prot, ${n.carbs}g gluc, ${n.fat}g lip, ${n.fiber}g fibres`
    );
  }

  if (recipe.recipeIngredients.length > 0) {
    lines.push("Ingrédients:");
    for (const ri of recipe.recipeIngredients) {
      const seasonPart =
        ri.ingredient.season_start != null && ri.ingredient.season_end != null
          ? ` [saison: ${ri.ingredient.season_start}-${ri.ingredient.season_end}]`
          : "";
      lines.push(
        `- [id:${ri.ingredient_id}] ${ri.ingredient.name}: ${ri.quantity_per_person}${ri.unit}/pers (scaling: ${ri.scaling_factor})${seasonPart}`
      );
    }
  }

  if (recipe.recipeSteps.length > 0) {
    lines.push("Étapes:");
    for (const step of recipe.recipeSteps) {
      const prefix = step.parallel_group != null ? "  [parallèle] " : "";
      lines.push(`${step.step_order}. ${prefix}${step.instruction}`);
    }
  }

  const tags = recipe.recipeDietaryTags.map((rdt) =>
    t("dietary_tags", rdt.dietaryTag.slug as Parameters<typeof t>[1])
  );
  if (tags.length > 0) {
    lines.push(`Tags: ${tags.join(", ")}`);
  }

  lines.push(
    "\nAvant d'ajouter un ingrédient, utilise searchIngredients pour vérifier s'il existe déjà. Si oui, passe ingredient_id à addIngredient. Cela évite les doublons."
  );

  return lines.join("\n");
}
