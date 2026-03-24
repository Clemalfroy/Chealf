import "server-only";
import { db } from "@/db";
import { recipeChatMessages } from "@/db/schema";
import { eq } from "drizzle-orm";
import type { UIMessage } from "ai";

const MAX_MESSAGES = 50;

export async function saveChatHistory(
  recipeId: string,
  messages: UIMessage[]
): Promise<void> {
  const truncated = messages.slice(-MAX_MESSAGES);

  await db
    .insert(recipeChatMessages)
    .values({
      recipe_id: recipeId,
      messages: truncated as unknown[],
    })
    .onConflictDoUpdate({
      target: recipeChatMessages.recipe_id,
      set: {
        messages: truncated as unknown[],
        updated_at: new Date(),
      },
    });
}

export async function getChatHistory(
  recipeId: string
): Promise<UIMessage[] | null> {
  const row = await db.query.recipeChatMessages.findFirst({
    where: (r, { eq }) => eq(r.recipe_id, recipeId),
    columns: { messages: true },
  });
  if (!row) return null;
  return row.messages as UIMessage[];
}
