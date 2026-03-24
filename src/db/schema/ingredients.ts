import { pgTable, uuid, text, timestamp, smallint, index } from "drizzle-orm/pg-core";
import { aisles } from "./aisles";

export const ingredients = pgTable(
  "ingredients",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull().unique(),
    aisle_id: uuid("aisle_id").references(() => aisles.id),
    season_start: smallint("season_start"), // 1-12, nullable (year-round)
    season_end: smallint("season_end"), // 1-12, nullable
    created_at: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("ingredients_name_idx").on(t.name)]
);

export type Ingredient = typeof ingredients.$inferSelect;
export type NewIngredient = typeof ingredients.$inferInsert;
