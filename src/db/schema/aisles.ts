import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";

export const aisles = pgTable("aisles", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(), // i18n key, e.g. "fruits_vegetables"
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export type Aisle = typeof aisles.$inferSelect;
export type NewAisle = typeof aisles.$inferInsert;
