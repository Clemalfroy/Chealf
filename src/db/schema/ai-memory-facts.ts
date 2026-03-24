import {
  pgTable,
  uuid,
  text,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { users } from "./users";

export const aiMemoryFacts = pgTable(
  "ai_memory_facts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    user_id: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    category: text("category"), // allergy | preference | household | lifestyle | diet | equipment | habit
    created_at: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("ai_memory_facts_user_id_idx").on(t.user_id)]
);

export type AiMemoryFact = typeof aiMemoryFacts.$inferSelect;
export type NewAiMemoryFact = typeof aiMemoryFacts.$inferInsert;
