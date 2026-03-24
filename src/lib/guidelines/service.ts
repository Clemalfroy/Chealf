import "server-only";
import { db } from "@/db";
import { userGuidelines } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import type { UserGuideline } from "@/db/schema/user-guidelines";
import type { CreateGuidelineInput } from "./schemas";

export type { UserGuideline };

export async function createGuideline(
  userId: string,
  data: CreateGuidelineInput
): Promise<UserGuideline> {
  const [guideline] = await db
    .insert(userGuidelines)
    .values({ user_id: userId, content: data.content })
    .returning();
  return guideline;
}

export async function getGuidelines(
  userId: string
): Promise<UserGuideline[]> {
  return db.query.userGuidelines.findMany({
    where: (g, { eq }) => eq(g.user_id, userId),
    orderBy: (g, { asc }) => asc(g.created_at),
  });
}

export async function updateGuideline(
  userId: string,
  guidelineId: string,
  content: string
): Promise<void> {
  const result = await db
    .update(userGuidelines)
    .set({ content, updated_at: new Date() })
    .where(
      and(
        eq(userGuidelines.id, guidelineId),
        eq(userGuidelines.user_id, userId)
      )
    )
    .returning({ id: userGuidelines.id });
  if (result.length === 0) {
    throw new Error("Guideline not found or access denied");
  }
}

export async function deleteGuideline(
  userId: string,
  guidelineId: string
): Promise<void> {
  const result = await db
    .delete(userGuidelines)
    .where(
      and(
        eq(userGuidelines.id, guidelineId),
        eq(userGuidelines.user_id, userId)
      )
    )
    .returning({ id: userGuidelines.id });
  if (result.length === 0) {
    throw new Error("Guideline not found or access denied");
  }
}
