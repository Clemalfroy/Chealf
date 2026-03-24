import {
  pgTable,
  uuid,
  text,
  boolean,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { recipes } from "./recipes";
import { users } from "./users";

export const recipeImages = pgTable(
  "recipe_images",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    recipe_id: uuid("recipe_id")
      .notNull()
      .references(() => recipes.id, { onDelete: "cascade" }),
    user_id: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    prompt: text("prompt").notNull(),
    image_url: text("image_url"), // null while generating
    status: text("status").notNull().default("generating"), // 'generating' | 'ready' | 'error'
    is_active: boolean("is_active").notNull().default(true),
    created_at: timestamp("created_at").defaultNow().notNull(),
    updated_at: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    index("recipe_images_recipe_id_idx").on(t.recipe_id),
    index("recipe_images_user_id_idx").on(t.user_id),
  ]
);

export type RecipeImage = typeof recipeImages.$inferSelect;
export type NewRecipeImage = typeof recipeImages.$inferInsert;
