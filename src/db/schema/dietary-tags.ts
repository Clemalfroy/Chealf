import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";

export const dietaryTags = pgTable("dietary_tags", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(), // i18n key, e.g. "vegetarian"
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export type DietaryTag = typeof dietaryTags.$inferSelect;
export type NewDietaryTag = typeof dietaryTags.$inferInsert;
