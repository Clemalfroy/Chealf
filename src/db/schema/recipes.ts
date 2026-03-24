import {
  pgTable,
  uuid,
  text,
  timestamp,
  smallint,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { users } from "./users";

export const recipes = pgTable(
  "recipes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    user_id: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    image_url: text("image_url"), // Supabase Storage path
    prep_time: smallint("prep_time"), // minutes
    servings: smallint("servings"), // recommended number of people
    season_start: smallint("season_start"), // 1-12, nullable (year-round)
    season_end: smallint("season_end"), // 1-12, nullable
    nutrition_score: smallint("nutrition_score"), // 0-100, nullable
    nutrition_data: jsonb("nutrition_data"), // { calories, protein, carbs, fat, fiber, ... }
    created_at: timestamp("created_at").defaultNow().notNull(),
    updated_at: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [index("recipes_user_id_idx").on(t.user_id)]
);

export type Recipe = typeof recipes.$inferSelect;
export type NewRecipe = typeof recipes.$inferInsert;
