import { tool } from "ai";
import { z } from "zod";
import * as service from "@/lib/recipes/service";
import * as queries from "@/lib/recipes/queries";
import {
  createMemoryFact,
  deleteMemoryFact,
  getMemoryFacts,
} from "@/lib/memory/service";
import { t } from "@/lib/i18n";
import type { AiMemoryFact } from "@/db/schema/ai-memory-facts";

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
          aisle_id: r.aisle_id ?? null,
          aisle: r.aisle?.slug ?? null,
          season_start: r.season_start ?? null,
          season_end: r.season_end ?? null,
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
          .describe("ID du rayon de supermarché (de la liste 'Rayons disponibles' dans le prompt)"),
        season_start: z
          .number()
          .int()
          .min(1)
          .max(12)
          .nullable()
          .optional()
          .describe("Début de saison de l'ingrédient (1=jan, 12=déc). null si disponible toute l'année."),
        season_end: z
          .number()
          .int()
          .min(1)
          .max(12)
          .nullable()
          .optional()
          .describe("Fin de saison de l'ingrédient (1=jan, 12=déc). null si disponible toute l'année."),
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
          season_start: row.season_start,
          season_end: row.season_end,
        };
      },
    }),

    addIngredients: tool({
      description:
        "Ajoute plusieurs ingrédients à la recette en une seule opération. Préférer cet outil à addIngredient répété lors de la création initiale.",
      inputSchema: z.object({
        ingredients: z.array(
          z.object({
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
              .describe("ID du rayon de supermarché (de la liste 'Rayons disponibles' dans le prompt)"),
            season_start: z
              .number()
              .int()
              .min(1)
              .max(12)
              .nullable()
              .optional()
              .describe("Début de saison de l'ingrédient (1=jan, 12=déc). null si disponible toute l'année."),
            season_end: z
              .number()
              .int()
              .min(1)
              .max(12)
              .nullable()
              .optional()
              .describe("Fin de saison de l'ingrédient (1=jan, 12=déc). null si disponible toute l'année."),
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
          })
        ).min(1).describe("Liste des ingrédients à ajouter"),
      }),
      execute: async (input) => {
        const id = requireRecipeId();
        return service.addIngredientsToRecipe(userId, id, input.ingredients);
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
        const seasonality = await service.removeIngredientFromRecipe(userId, id, input.ingredient_id);
        return { ingredient_id: input.ingredient_id, ...seasonality };
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

    listDietaryTags: tool({
      description:
        "Retourne la liste de tous les tags de régime alimentaire disponibles avec leurs IDs. Utilise cet outil avant setDietaryTags pour connaître les IDs.",
      inputSchema: z.object({}),
      execute: async () => {
        const tags = await queries.getAllDietaryTags();
        return tags.map((tag) => ({
          id: tag.id,
          slug: tag.slug,
          label: t("dietary_tags", tag.slug as Parameters<typeof t>[1]),
        }));
      },
    }),

    setNutrition: tool({
      description:
        "Définit le score nutritionnel et les macros estimées de la recette par portion. Ces valeurs sont des estimations IA.",
      inputSchema: z.object({
        nutrition_score: z
          .number()
          .int()
          .min(0)
          .max(100)
          .describe("Score de santé global (0-100). 80+=très sain, 60-79=équilibré, 40-59=correct, <40=à modérer."),
        nutrition_data: z
          .object({
            calories: z.number().int().min(0).describe("Calories par portion (kcal)"),
            protein: z.number().int().min(0).describe("Protéines par portion (g)"),
            carbs: z.number().int().min(0).describe("Glucides par portion (g)"),
            fat: z.number().int().min(0).describe("Lipides par portion (g)"),
            fiber: z.number().int().min(0).describe("Fibres par portion (g)"),
          })
          .describe("Macros estimées par portion"),
      }),
      execute: async (input) => {
        const id = requireRecipeId();
        await service.setRecipeNutrition(userId, id, input.nutrition_score, input.nutrition_data);
        return { nutrition_score: input.nutrition_score, nutrition_data: input.nutrition_data };
      },
    }),

    extractMemoryFact: tool({
      description:
        "Mémorise un fait sur l'utilisateur (préférence, allergie, habitude, etc.) pour les futures conversations.",
      inputSchema: z.object({
        content: z
          .string()
          .min(1)
          .max(500)
          .describe("Le fait à mémoriser, en français, de façon concise"),
        category: z
          .enum(["allergy", "preference", "household", "lifestyle", "diet", "equipment", "habit"])
          .optional()
          .describe("Catégorie du fait"),
      }),
      execute: async (input) => {
        const fact = await createMemoryFact(userId, input.content, input.category);
        return { id: fact.id, content: fact.content, category: fact.category };
      },
    }),

    deleteMemoryFact: tool({
      description:
        "Supprime un fait mémorisé sur l'utilisateur. Utilise listMemoryFacts d'abord pour obtenir l'ID.",
      inputSchema: z.object({
        factId: z.string().uuid().describe("ID du fait à supprimer"),
      }),
      execute: async (input) => {
        await deleteMemoryFact(userId, input.factId);
        return { deleted: true, factId: input.factId };
      },
    }),

    listMemoryFacts: tool({
      description:
        "Retourne tous les faits mémorisés sur l'utilisateur avec leurs IDs. Utilise cet outil avant deleteMemoryFact.",
      inputSchema: z.object({}),
      execute: async () => {
        const facts: AiMemoryFact[] = await getMemoryFacts(userId);
        return facts.map((f) => ({ id: f.id, content: f.content, category: f.category }));
      },
    }),

    generateImage: tool({
      description:
        "Génère une image pour la recette. Appelle cet outil après avoir créé la recette (ingrédients, étapes, etc.). Décris le plat fini de façon visuelle et appétissante.",
      inputSchema: z.object({
        prompt: z
          .string()
          .min(10)
          .max(1000)
          .describe(
            "Description visuelle du plat : présentation, dressage, garnitures, couleurs. Ex: 'A bowl of creamy tomato soup garnished with fresh basil and a swirl of olive oil, served with crusty bread on the side.'"
          ),
      }),
      execute: async (input) => {
        const id = requireRecipeId();
        const { recipeImageId } = await service.setRecipeImagePrompt(userId, id, input.prompt);
        return { recipeImageId, prompt: input.prompt, status: "generating" };
      },
    }),
  };
}

export type RecipeTools = ReturnType<typeof createRecipeTools>;
