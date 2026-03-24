import "server-only";
import { db } from "@/db";
import { aiMemoryFacts } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import type { AiMemoryFact } from "@/db/schema/ai-memory-facts";

export type { AiMemoryFact };

export async function createMemoryFact(
  userId: string,
  content: string,
  category?: string
): Promise<AiMemoryFact> {
  const [fact] = await db
    .insert(aiMemoryFacts)
    .values({ user_id: userId, content, category: category ?? null })
    .returning();
  return fact;
}

export async function getMemoryFacts(userId: string): Promise<AiMemoryFact[]> {
  return db.query.aiMemoryFacts.findMany({
    where: (f, { eq }) => eq(f.user_id, userId),
    orderBy: (f, { asc }) => asc(f.created_at),
  });
}

export async function deleteMemoryFact(
  userId: string,
  factId: string
): Promise<void> {
  const result = await db
    .delete(aiMemoryFacts)
    .where(and(eq(aiMemoryFacts.id, factId), eq(aiMemoryFacts.user_id, userId)))
    .returning({ id: aiMemoryFacts.id });
  if (result.length === 0) {
    throw new Error("Memory fact not found or access denied");
  }
}

export async function updateMemoryFact(
  userId: string,
  factId: string,
  content: string
): Promise<void> {
  const result = await db
    .update(aiMemoryFacts)
    .set({ content })
    .where(and(eq(aiMemoryFacts.id, factId), eq(aiMemoryFacts.user_id, userId)))
    .returning({ id: aiMemoryFacts.id });
  if (result.length === 0) {
    throw new Error("Memory fact not found or access denied");
  }
}
