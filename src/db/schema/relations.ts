import { relations } from "drizzle-orm";
import { aisles } from "./aisles";
import { ingredients } from "./ingredients";
import { recipes } from "./recipes";
import { recipeIngredients } from "./recipe-ingredients";
import { recipeSteps } from "./recipe-steps";
import { dietaryTags } from "./dietary-tags";
import { recipeDietaryTags } from "./recipe-dietary-tags";
import { recipeChatMessages } from "./recipe-chat-messages";
import { recipeImages } from "./recipe-images";
import { aiMemoryFacts } from "./ai-memory-facts";
import { userGuidelines } from "./user-guidelines";
import { users } from "./users";

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

export const usersRelations = relations(users, ({ many }) => ({
  aiMemoryFacts: many(aiMemoryFacts),
  userGuidelines: many(userGuidelines),
}));

export const aiMemoryFactsRelations = relations(aiMemoryFacts, ({ one }) => ({
  user: one(users, {
    fields: [aiMemoryFacts.user_id],
    references: [users.id],
  }),
}));

export const userGuidelinesRelations = relations(
  userGuidelines,
  ({ one }) => ({
    user: one(users, {
      fields: [userGuidelines.user_id],
      references: [users.id],
    }),
  })
);

export const recipesRelations = relations(recipes, ({ many, one }) => ({
  recipeIngredients: many(recipeIngredients),
  recipeSteps: many(recipeSteps),
  recipeDietaryTags: many(recipeDietaryTags),
  recipeChatMessages: one(recipeChatMessages),
  recipeImages: many(recipeImages),
}));

export const recipeImagesRelations = relations(recipeImages, ({ one }) => ({
  recipe: one(recipes, {
    fields: [recipeImages.recipe_id],
    references: [recipes.id],
  }),
}));

export const recipeChatMessagesRelations = relations(
  recipeChatMessages,
  ({ one }) => ({
    recipe: one(recipes, {
      fields: [recipeChatMessages.recipe_id],
      references: [recipes.id],
    }),
  })
);

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
