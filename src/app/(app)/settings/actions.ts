"use server";

import { revalidatePath } from "next/cache";
import { verifySession } from "@/lib/dal";
import {
  deleteMemoryFact,
  updateMemoryFact,
} from "@/lib/memory/service";
import {
  createGuideline,
  updateGuideline,
  deleteGuideline,
} from "@/lib/guidelines/service";
import { createGuidelineSchema, updateGuidelineSchema } from "@/lib/guidelines/schemas";
import type { ActionResult } from "@/lib/types";

// ─── Memory facts ─────────────────────────────────────────────────────────────

export async function deleteMemoryFactAction(factId: string): Promise<void> {
  const { user } = await verifySession();
  await deleteMemoryFact(user.id, factId);
  revalidatePath("/settings");
}

export async function updateMemoryFactAction(
  factId: string,
  content: string
): Promise<ActionResult> {
  const { user } = await verifySession();
  try {
    await updateMemoryFact(user.id, factId, content);
    revalidatePath("/settings");
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Erreur interne",
    };
  }
}

// ─── Guidelines ───────────────────────────────────────────────────────────────

export async function createGuidelineAction(
  content: string
): Promise<ActionResult<{ id: string }>> {
  const { user } = await verifySession();
  const result = createGuidelineSchema.safeParse({ content });
  if (!result.success) {
    return { success: false, error: "Données invalides" };
  }
  try {
    const guideline = await createGuideline(user.id, result.data);
    revalidatePath("/settings");
    return { success: true, data: { id: guideline.id } };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Erreur interne",
    };
  }
}

export async function updateGuidelineAction(
  guidelineId: string,
  content: string
): Promise<ActionResult> {
  const { user } = await verifySession();
  const result = updateGuidelineSchema.safeParse({ guidelineId, content });
  if (!result.success) {
    return { success: false, error: "Données invalides" };
  }
  try {
    await updateGuideline(user.id, guidelineId, result.data.content);
    revalidatePath("/settings");
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Erreur interne",
    };
  }
}

export async function deleteGuidelineAction(guidelineId: string): Promise<void> {
  const { user } = await verifySession();
  await deleteGuideline(user.id, guidelineId);
  revalidatePath("/settings");
}
