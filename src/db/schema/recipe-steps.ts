import {
  pgTable,
  uuid,
  text,
  timestamp,
  smallint,
  index,
} from "drizzle-orm/pg-core";
import { recipes } from "./recipes";

export const recipeSteps = pgTable(
  "recipe_steps",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    recipe_id: uuid("recipe_id")
      .notNull()
      .references(() => recipes.id, { onDelete: "cascade" }),
    step_order: smallint("step_order").notNull(),
    parallel_group: smallint("parallel_group"), // nullable: steps with same group can be done simultaneously
    instruction: text("instruction").notNull(),
    created_at: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("recipe_steps_recipe_id_idx").on(t.recipe_id)]
);

export type RecipeStep = typeof recipeSteps.$inferSelect;
export type NewRecipeStep = typeof recipeSteps.$inferInsert;
