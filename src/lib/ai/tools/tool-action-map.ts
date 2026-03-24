import type { RecipeEditorState } from "@/components/recipes/recipe-editor";

// Local mirror of the Action union — keeps this module pure (no React import needed)
type SetIdAction = { type: "SET_ID"; payload: string };
type SetTitleAction = { type: "SET_TITLE"; payload: string };
type SetServingsAction = { type: "SET_SERVINGS"; payload: number | null };
type SetPrepTimeAction = { type: "SET_PREP_TIME"; payload: number | null };
type AddIngredientAction = {
  type: "ADD_INGREDIENT";
  payload: {
    tempId: string;
    ingredient_id: string;
    name: string;
    quantity_per_person: number;
    unit: string;
    scaling_factor: number;
  };
};
type UpdateIngredientAction = {
  type: "UPDATE_INGREDIENT";
  tempId: string;
  field: "quantity_per_person" | "unit" | "scaling_factor";
  value: string | number;
};
type RemoveIngredientAction = { type: "REMOVE_INGREDIENT"; tempId: string };
type SetStepsAction = {
  type: "SET_STEPS";
  payload: Array<{
    tempId: string;
    instruction: string;
    step_order: number;
    parallel_group?: number;
  }>;
};
type SetTagsAction = { type: "SET_TAGS"; payload: string[] };

export type MappedAction =
  | SetIdAction
  | SetTitleAction
  | SetServingsAction
  | SetPrepTimeAction
  | AddIngredientAction
  | UpdateIngredientAction
  | RemoveIngredientAction
  | SetStepsAction
  | SetTagsAction;

let tempIdCounter = 1000; // start high to avoid collisions with existing tempIds
function genToolTempId() {
  return `tool-${tempIdCounter++}`;
}

/**
 * Maps an AI tool result to one or more reducer actions.
 * Pure function — takes current state to resolve ingredient_id → tempId.
 */
export function mapToolResultToAction(
  toolName: string,
  result: unknown,
  state: RecipeEditorState
): MappedAction | MappedAction[] | null {
  const r = result as Record<string, unknown>;

  switch (toolName) {
    case "createRecipe": {
      const actions: MappedAction[] = [
        { type: "SET_ID", payload: r.id as string },
        { type: "SET_TITLE", payload: r.title as string },
      ];
      if (r.servings != null)
        actions.push({ type: "SET_SERVINGS", payload: r.servings as number });
      if (r.prep_time != null)
        actions.push({ type: "SET_PREP_TIME", payload: r.prep_time as number });
      return actions;
    }

    case "setRecipeTitle":
      return { type: "SET_TITLE", payload: r.title as string };

    case "setRecipeServings":
      return { type: "SET_SERVINGS", payload: r.servings as number };

    case "setRecipePrepTime":
      return { type: "SET_PREP_TIME", payload: r.prep_time as number };

    case "addIngredient":
      return {
        type: "ADD_INGREDIENT",
        payload: {
          tempId: genToolTempId(),
          ingredient_id: r.ingredient_id as string,
          name: r.name as string,
          quantity_per_person: r.quantity_per_person as number,
          unit: r.unit as string,
          scaling_factor: r.scaling_factor as number,
        },
      };

    case "updateIngredient": {
      const ingredientId = r.ingredient_id as string;
      const ing = state.ingredients.find((i) => i.ingredient_id === ingredientId);
      if (!ing) return null;
      const actions: MappedAction[] = [];
      if (r.quantity_per_person != null)
        actions.push({ type: "UPDATE_INGREDIENT", tempId: ing.tempId, field: "quantity_per_person", value: r.quantity_per_person as number });
      if (r.unit != null)
        actions.push({ type: "UPDATE_INGREDIENT", tempId: ing.tempId, field: "unit", value: r.unit as string });
      if (r.scaling_factor != null)
        actions.push({ type: "UPDATE_INGREDIENT", tempId: ing.tempId, field: "scaling_factor", value: r.scaling_factor as number });
      return actions.length > 0 ? actions : null;
    }

    case "removeIngredient": {
      const ingredientId = r.ingredient_id as string;
      const ing = state.ingredients.find((i) => i.ingredient_id === ingredientId);
      if (!ing) return null;
      return { type: "REMOVE_INGREDIENT", tempId: ing.tempId };
    }

    case "setSteps": {
      const steps = (r.steps as Array<{ instruction: string; step_order: number; parallel_group?: number }>);
      return {
        type: "SET_STEPS",
        payload: steps.map((s) => ({
          tempId: genToolTempId(),
          instruction: s.instruction,
          step_order: s.step_order,
          parallel_group: s.parallel_group,
        })),
      };
    }

    case "setDietaryTags":
      return { type: "SET_TAGS", payload: r.dietary_tag_ids as string[] };

    // searchIngredients is informational only — no state update needed
    case "searchIngredients":
      return null;

    default:
      return null;
  }
}
