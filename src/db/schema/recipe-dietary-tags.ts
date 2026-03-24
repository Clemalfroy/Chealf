import {
  pgTable,
  uuid,
  timestamp,
  index,
  unique,
} from "drizzle-orm/pg-core";
import { recipes } from "./recipes";
import { dietaryTags } from "./dietary-tags";

export const recipeDietaryTags = pgTable(
  "recipe_dietary_tags",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    recipe_id: uuid("recipe_id")
      .notNull()
      .references(() => recipes.id, { onDelete: "cascade" }),
    dietary_tag_id: uuid("dietary_tag_id")
      .notNull()
      .references(() => dietaryTags.id, { onDelete: "cascade" }),
    created_at: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    index("recipe_dietary_tags_recipe_id_idx").on(t.recipe_id),
    unique("recipe_dietary_tags_recipe_tag_unique").on(
      t.recipe_id,
      t.dietary_tag_id
    ),
  ]
);

export type RecipeDietaryTag = typeof recipeDietaryTags.$inferSelect;
export type NewRecipeDietaryTag = typeof recipeDietaryTags.$inferInsert;
