import { streamText, convertToModelMessages, stepCountIs } from "ai";
import type { UIMessage } from "ai";
import { verifySession } from "@/lib/dal";
import { getDefaultModel, buildSystemPrompt } from "@/lib/ai";
import { createRecipeTools } from "@/lib/ai/tools/recipe-tools";
import { serializeRecipeContext } from "@/lib/ai/tools/recipe-prompt";
import { getRecipeById } from "@/lib/recipes/queries";

export async function POST(request: Request) {
  const { user } = await verifySession();

  const body = await request.json();
  const messages: UIMessage[] = body.messages ?? [];
  const recipeId: string | null = body.recipeId ?? null;

  let recipeContext: string | undefined;
  if (recipeId) {
    const recipe = await getRecipeById(recipeId);
    if (recipe && recipe.user_id === user.id) {
      recipeContext = serializeRecipeContext(recipe);
    }
  }

  const tools = createRecipeTools(user.id, recipeId);

  const result = streamText({
    model: getDefaultModel(),
    system: buildSystemPrompt({ context: "recipe", recipeContext }),
    messages: await convertToModelMessages(messages),
    tools,
    stopWhen: stepCountIs(10),
  });

  return result.toUIMessageStreamResponse({
    onError: (error) => {
      // Forward the actual error so the client can display it
      if (error instanceof Error) return error.message;
      return String(error);
    },
  });
}
