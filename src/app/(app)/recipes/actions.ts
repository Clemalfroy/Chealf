"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { verifySession } from "@/lib/dal";
import { saveRecipeFull, deleteRecipe, generateRecipeImage, setRecipeImagePrompt } from "@/lib/recipes/service";
import { saveRecipeSchema } from "@/lib/recipes/schemas";
import { saveChatHistory } from "@/lib/chat/service";
import { getRecipeById } from "@/lib/recipes/queries";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/types";
import type { UIMessage } from "ai";

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

export async function setRecipeImagePromptAction(
  recipeId: string,
  prompt: string
): Promise<ActionResult<{ recipeImageId: string }>> {
  const { user } = await verifySession();
  try {
    const { recipeImageId } = await setRecipeImagePrompt(user.id, recipeId, prompt);
    return { success: true, data: { recipeImageId } };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur interne";
    return { success: false, error: message };
  }
}

export async function generateRecipeImageAction(
  recipeImageId: string
): Promise<ActionResult<{ imageUrl: string }>> {
  const { user } = await verifySession();
  const supabase = await createClient();

  try {
    const { imageUrl } = await generateRecipeImage(
      user.id,
      recipeImageId,
      async (buffer, storagePath) => {
        const { error } = await supabase.storage
          .from("recipe-images")
          .upload(storagePath, buffer, {
            contentType: "image/webp",
            upsert: true,
          });
        if (error) throw new Error(`Storage upload failed: ${error.message}`);
        const {
          data: { publicUrl },
        } = supabase.storage.from("recipe-images").getPublicUrl(storagePath);
        return publicUrl;
      }
    );
    return { success: true, data: { imageUrl } };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Erreur lors de la génération";
    return { success: false, error: message };
  }
}

export async function saveChatHistoryAction(
  recipeId: string,
  messages: UIMessage[]
): Promise<void> {
  const { user } = await verifySession();
  // Verify ownership before persisting
  const recipe = await getRecipeById(recipeId);
  if (!recipe || recipe.user_id !== user.id) return;
  await saveChatHistory(recipeId, messages);
}
