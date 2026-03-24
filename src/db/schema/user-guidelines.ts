import {
  pgTable,
  uuid,
  text,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { users } from "./users";

export const userGuidelines = pgTable(
  "user_guidelines",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    user_id: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    created_at: timestamp("created_at").defaultNow().notNull(),
    updated_at: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [index("user_guidelines_user_id_idx").on(t.user_id)]
);

export type UserGuideline = typeof userGuidelines.$inferSelect;
export type NewUserGuideline = typeof userGuidelines.$inferInsert;
