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
type SetSeasonalityAction = {
  type: "SET_SEASONALITY";
  payload: { season_start: number | null; season_end: number | null };
};
type SetNutritionAction = {
  type: "SET_NUTRITION";
  payload: {
    nutrition_score: number;
    nutrition_data: {
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
      fiber: number;
    };
  };
};
type SetImageGeneratingAction = {
  type: "SET_IMAGE_GENERATING";
  payload: { recipeImageId: string; prompt: string };
};

export type MappedAction =
  | SetIdAction
  | SetTitleAction
  | SetServingsAction
  | SetPrepTimeAction
  | AddIngredientAction
  | UpdateIngredientAction
  | RemoveIngredientAction
  | SetStepsAction
  | SetTagsAction
  | SetSeasonalityAction
  | SetNutritionAction
  | SetImageGeneratingAction;

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

    case "addIngredient": {
      const actions: MappedAction[] = [
        {
          type: "ADD_INGREDIENT",
          payload: {
            tempId: genToolTempId(),
            ingredient_id: r.ingredient_id as string,
            name: r.name as string,
            quantity_per_person: r.quantity_per_person as number,
            unit: r.unit as string,
            scaling_factor: r.scaling_factor as number,
          },
        },
        {
          type: "SET_SEASONALITY",
          payload: {
            season_start: r.season_start as number | null,
            season_end: r.season_end as number | null,
          },
        },
      ];
      return actions;
    }

    case "addIngredients": {
      const { ingredients, season_start, season_end } = result as {
        ingredients: Array<{ ingredient_id: string; name: string; quantity_per_person: number; unit: string; scaling_factor: number }>;
        season_start: number | null;
        season_end: number | null;
      };
      const ingredientActions: MappedAction[] = ingredients.map((item) => ({
        type: "ADD_INGREDIENT" as const,
        payload: {
          tempId: genToolTempId(),
          ingredient_id: item.ingredient_id,
          name: item.name,
          quantity_per_person: item.quantity_per_person,
          unit: item.unit,
          scaling_factor: item.scaling_factor,
        },
      }));
      return [
        ...ingredientActions,
        { type: "SET_SEASONALITY", payload: { season_start, season_end } },
      ];
    }

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
      return [
        { type: "REMOVE_INGREDIENT", tempId: ing.tempId },
        {
          type: "SET_SEASONALITY",
          payload: {
            season_start: r.season_start as number | null,
            season_end: r.season_end as number | null,
          },
        },
      ];
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

    case "setNutrition":
      return {
        type: "SET_NUTRITION",
        payload: {
          nutrition_score: r.nutrition_score as number,
          nutrition_data: r.nutrition_data as {
            calories: number;
            protein: number;
            carbs: number;
            fat: number;
            fiber: number;
          },
        },
      };

    case "generateImage":
      return {
        type: "SET_IMAGE_GENERATING",
        payload: {
          recipeImageId: r.recipeImageId as string,
          prompt: r.prompt as string,
        },
      };

    // Informational tools — no recipe state update needed
    case "searchIngredients":
    case "listDietaryTags":
    case "listMemoryFacts":
    case "extractMemoryFact":
    case "deleteMemoryFact":
      return null;

    default:
      return null;
  }
}
