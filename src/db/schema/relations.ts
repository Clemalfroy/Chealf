import { relations } from "drizzle-orm";
import { aisles } from "./aisles";
import { ingredients } from "./ingredients";
import { recipes } from "./recipes";
import { recipeIngredients } from "./recipe-ingredients";
import { recipeSteps } from "./recipe-steps";
import { dietaryTags } from "./dietary-tags";
import { recipeDietaryTags } from "./recipe-dietary-tags";

export const aislesRelations = relations(aisles, ({ many }) => ({
  ingredients: many(ingredients),
}));

export const ingredientsRelations = relations(ingredients, ({ one, many }) => ({
  aisle: one(aisles, {
    fields: [ingredients.aisle_id],
    references: [aisles.id],
  }),
  recipeIngredients: many(recipeIngredients),
}));

export const recipesRelations = relations(recipes, ({ many }) => ({
  recipeIngredients: many(recipeIngredients),
  recipeSteps: many(recipeSteps),
  recipeDietaryTags: many(recipeDietaryTags),
}));

export const recipeIngredientsRelations = relations(
  recipeIngredients,
  ({ one }) => ({
    recipe: one(recipes, {
      fields: [recipeIngredients.recipe_id],
      references: [recipes.id],
    }),
    ingredient: one(ingredients, {
      fields: [recipeIngredients.ingredient_id],
      references: [ingredients.id],
    }),
  })
);

export const recipeStepsRelations = relations(recipeSteps, ({ one }) => ({
  recipe: one(recipes, {
    fields: [recipeSteps.recipe_id],
    references: [recipes.id],
  }),
}));

export const dietaryTagsRelations = relations(dietaryTags, ({ many }) => ({
  recipeDietaryTags: many(recipeDietaryTags),
}));

export const recipeDietaryTagsRelations = relations(
  recipeDietaryTags,
  ({ one }) => ({
    recipe: one(recipes, {
      fields: [recipeDietaryTags.recipe_id],
      references: [recipes.id],
    }),
    dietaryTag: one(dietaryTags, {
      fields: [recipeDietaryTags.dietary_tag_id],
      references: [dietaryTags.id],
    }),
  })
);
