import {
  pgTable,
  uuid,
  jsonb,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";
import { recipes } from "./recipes";

export const recipeChatMessages = pgTable(
  "recipe_chat_messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    recipe_id: uuid("recipe_id")
      .notNull()
      .references(() => recipes.id, { onDelete: "cascade" }),
    // Raw UIMessage[] array — serialized directly from Vercel AI SDK
    messages: jsonb("messages").notNull().$type<unknown[]>(),
    created_at: timestamp("created_at").defaultNow().notNull(),
    updated_at: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [unique("recipe_chat_messages_recipe_id_unique").on(t.recipe_id)]
);

export type RecipeChatMessages = typeof recipeChatMessages.$inferSelect;
