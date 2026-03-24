import { t } from "@/lib/i18n";
import type { RecipeWithRelations } from "@/lib/recipes/queries";

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

  if (recipe.recipeIngredients.length > 0) {
    lines.push("Ingrédients:");
    for (const ri of recipe.recipeIngredients) {
      lines.push(
        `- [id:${ri.ingredient_id}] ${ri.ingredient.name}: ${ri.quantity_per_person}${ri.unit}/pers (scaling: ${ri.scaling_factor})`
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
