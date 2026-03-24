"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { verifySession } from "@/lib/dal";
import { saveRecipeFull, deleteRecipe } from "@/lib/recipes/service";
import { saveRecipeSchema } from "@/lib/recipes/schemas";
import type { ActionResult } from "@/lib/types";

export async function saveRecipeAction(
  _prevState: ActionResult<{ id: string }>,
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  const { user } = await verifySession();

  const raw = formData.get("recipe");
  if (!raw || typeof raw !== "string") {
    return { success: false, error: "Données manquantes" };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { success: false, error: "Données invalides" };
  }

  const result = saveRecipeSchema.safeParse(parsed);
  if (!result.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const [key, issues] of Object.entries(
      result.error.flatten().fieldErrors
    )) {
      fieldErrors[key] = issues ?? [];
    }
    return {
      success: false,
      error: "Validation échouée",
      fieldErrors,
    };
  }

  try {
    const { id } = await saveRecipeFull(user.id, result.data);
    revalidatePath("/recipes");
    revalidatePath(`/recipes/${id}`);
    return { success: true, data: { id } };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Erreur interne du serveur";
    return { success: false, error: message };
  }
}

export async function deleteRecipeAction(id: string): Promise<void> {
  const { user } = await verifySession();
  await deleteRecipe(user.id, id);
  revalidatePath("/recipes");
  redirect("/recipes");
}
