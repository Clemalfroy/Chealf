import {
  pgTable,
  uuid,
  real,
  text,
  timestamp,
  index,
  unique,
} from "drizzle-orm/pg-core";
import { recipes } from "./recipes";
import { ingredients } from "./ingredients";

export const recipeIngredients = pgTable(
  "recipe_ingredients",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    recipe_id: uuid("recipe_id")
      .notNull()
      .references(() => recipes.id, { onDelete: "cascade" }),
    ingredient_id: uuid("ingredient_id")
      .notNull()
      .references(() => ingredients.id),
    quantity_per_person: real("quantity_per_person").notNull(),
    unit: text("unit").notNull(),
    scaling_factor: real("scaling_factor").notNull().default(1.0), // exponent: 1.0=linear, ~0.6=sub-linear, 0.0=fixed
    created_at: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    index("recipe_ingredients_recipe_id_idx").on(t.recipe_id),
    unique("recipe_ingredients_recipe_ingredient_unique").on(
      t.recipe_id,
      t.ingredient_id
    ),
  ]
);

export type RecipeIngredient = typeof recipeIngredients.$inferSelect;
export type NewRecipeIngredient = typeof recipeIngredients.$inferInsert;
