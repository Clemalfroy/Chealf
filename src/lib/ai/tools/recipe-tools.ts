import { tool } from "ai";
import { z } from "zod";
import * as service from "@/lib/recipes/service";
import * as queries from "@/lib/recipes/queries";

/**
 * Creates AI tool definitions for recipe creation and editing.
 * Each tool maps 1:1 to a service function.
 *
 * recipeId management: createRecipe updates currentRecipeId via closure.
 * Multi-step tool calling is sequential within a single streamText call,
 * so subsequent tools safely read the updated ID.
 */
export function createRecipeTools(userId: string, recipeId: string | null) {
  let currentRecipeId = recipeId;

  function requireRecipeId(): string {
    if (!currentRecipeId) {
      throw new Error(
        "Aucune recette en cours. Appelle createRecipe en premier."
      );
    }
    return currentRecipeId;
  }

  return {
    createRecipe: tool({
      description:
        "Crée une nouvelle recette vide. Doit être appelé en premier avant tout autre outil.",
      inputSchema: z.object({
        title: z.string().min(1).max(200).describe("Titre de la recette"),
        servings: z
          .number()
          .int()
          .min(1)
          .max(50)
          .optional()
          .describe("Nombre de portions recommandées"),
        prep_time: z
          .number()
          .int()
          .min(1)
          .max(1440)
          .optional()
          .describe("Temps de préparation en minutes"),
      }),
      execute: async (input) => {
        const result = await service.createRecipe(userId, input);
        currentRecipeId = result.id;
        return { id: result.id, title: input.title, servings: input.servings ?? null, prep_time: input.prep_time ?? null };
      },
    }),

    setRecipeTitle: tool({
      description: "Modifie le titre de la recette.",
      inputSchema: z.object({
        title: z.string().min(1).max(200).describe("Nouveau titre"),
      }),
      execute: async (input) => {
        const id = requireRecipeId();
        await service.setRecipeTitle(userId, id, input.title);
        return { title: input.title };
      },
    }),

    setRecipeServings: tool({
      description: "Définit le nombre de portions recommandées.",
      inputSchema: z.object({
        servings: z.number().int().min(1).max(50).describe("Nombre de portions"),
      }),
      execute: async (input) => {
        const id = requireRecipeId();
        await service.setRecipeServings(userId, id, input.servings);
        return { servings: input.servings };
      },
    }),

    setRecipePrepTime: tool({
      description: "Définit le temps de préparation en minutes.",
      inputSchema: z.object({
        prep_time: z
          .number()
          .int()
          .min(1)
          .max(1440)
          .describe("Temps de préparation en minutes"),
      }),
      execute: async (input) => {
        const id = requireRecipeId();
        await service.setRecipePrepTime(userId, id, input.prep_time);
        return { prep_time: input.prep_time };
      },
    }),

    searchIngredients: tool({
      description:
        "Recherche des ingrédients existants par nom. Utilise cet outil avant addIngredient pour réutiliser un ingrédient existant et éviter les doublons.",
      inputSchema: z.object({
        query: z.string().min(1).describe("Nom ou partie du nom de l'ingrédient"),
      }),
      execute: async (input) => {
        const results = await queries.searchIngredients(input.query, 5);
        return results.map((r) => ({
          id: r.id,
          name: r.name,
          aisle: r.aisle?.slug ?? null,
        }));
      },
    }),

    addIngredient: tool({
      description:
        "Ajoute un ingrédient à la recette. Si l'ingrédient existe déjà (via searchIngredients), passe son ingredient_id pour éviter les doublons.",
      inputSchema: z.object({
        name: z.string().min(1).describe("Nom de l'ingrédient"),
        ingredient_id: z
          .string()
          .uuid()
          .optional()
          .describe("ID d'un ingrédient existant (de searchIngredients)"),
        aisle_id: z
          .string()
          .uuid()
          .optional()
          .describe("ID du rayon de supermarché"),
        quantity_per_person: z
          .number()
          .positive()
          .describe("Quantité par personne"),
        unit: z.string().min(1).describe("Unité (g, ml, unité, c.à.s, etc.)"),
        scaling_factor: z
          .number()
          .min(0)
          .max(2)
          .default(1.0)
          .describe(
            "Facteur de scaling: 1.0=linéaire, 0.6=sous-linéaire (épices), 0.0=fixe"
          ),
      }),
      execute: async (input) => {
        const id = requireRecipeId();
        const row = await service.addIngredientToRecipe(userId, id, input);
        return {
          ingredient_id: row.ingredient_id,
          name: input.name,
          quantity_per_person: input.quantity_per_person,
          unit: input.unit,
          scaling_factor: input.scaling_factor,
        };
      },
    }),

    updateIngredient: tool({
      description:
        "Modifie la quantité, l'unité ou le scaling d'un ingrédient existant dans la recette.",
      inputSchema: z.object({
        ingredient_id: z
          .string()
          .uuid()
          .describe("ID de l'ingrédient à modifier (visible dans le contexte)"),
        quantity_per_person: z
          .number()
          .positive()
          .optional()
          .describe("Nouvelle quantité par personne"),
        unit: z.string().min(1).optional().describe("Nouvelle unité"),
        scaling_factor: z
          .number()
          .min(0)
          .max(2)
          .optional()
          .describe("Nouveau facteur de scaling"),
      }),
      execute: async (input) => {
        const id = requireRecipeId();
        await service.updateRecipeIngredient(userId, id, input.ingredient_id, {
          quantity_per_person: input.quantity_per_person,
          unit: input.unit,
          scaling_factor: input.scaling_factor,
        });
        return {
          ingredient_id: input.ingredient_id,
          quantity_per_person: input.quantity_per_person,
          unit: input.unit,
          scaling_factor: input.scaling_factor,
        };
      },
    }),

    removeIngredient: tool({
      description: "Supprime un ingrédient de la recette.",
      inputSchema: z.object({
        ingredient_id: z
          .string()
          .uuid()
          .describe("ID de l'ingrédient à supprimer (visible dans le contexte)"),
      }),
      execute: async (input) => {
        const id = requireRecipeId();
        await service.removeIngredientFromRecipe(userId, id, input.ingredient_id);
        return { ingredient_id: input.ingredient_id };
      },
    }),

    setSteps: tool({
      description:
        "Remplace toutes les étapes de la recette. Fournit la liste complète et ordonnée des étapes.",
      inputSchema: z.object({
        steps: z.array(
          z.object({
            instruction: z.string().min(1).describe("Description de l'étape"),
            step_order: z
              .number()
              .int()
              .min(1)
              .describe("Numéro de l'étape (1, 2, 3...)"),
            parallel_group: z
              .number()
              .int()
              .optional()
              .describe(
                "Groupe de parallélisme — les étapes avec le même groupe se font simultanément"
              ),
          })
        ),
      }),
      execute: async (input) => {
        const id = requireRecipeId();
        await service.setRecipeSteps(userId, id, input.steps);
        return { steps: input.steps };
      },
    }),

    setDietaryTags: tool({
      description:
        "Définit les tags de régime alimentaire de la recette (végétarien, vegan, sans gluten, etc.).",
      inputSchema: z.object({
        dietary_tag_ids: z
          .array(z.string().uuid())
          .describe("Liste des IDs des tags de régime alimentaire"),
      }),
      execute: async (input) => {
        const id = requireRecipeId();
        await service.setRecipeDietaryTags(userId, id, input.dietary_tag_ids);
        return { dietary_tag_ids: input.dietary_tag_ids };
      },
    }),
  };
}

export type RecipeTools = ReturnType<typeof createRecipeTools>;
