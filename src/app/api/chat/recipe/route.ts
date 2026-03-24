import { streamText, convertToModelMessages, stepCountIs } from "ai";
import type { UIMessage } from "ai";
import { verifySession } from "@/lib/dal";
import { getDefaultModel, buildSystemPrompt } from "@/lib/ai";
import { createRecipeTools } from "@/lib/ai/tools/recipe-tools";
import { serializeRecipeContext } from "@/lib/ai/tools/recipe-prompt";
import { getRecipeById, getAllAisles } from "@/lib/recipes/queries";
import { getMemoryFacts } from "@/lib/memory/service";
import { getGuidelines } from "@/lib/guidelines/service";
import { t } from "@/lib/i18n";

export async function POST(request: Request) {
  const { user } = await verifySession();

  const body = await request.json();
  const messages: UIMessage[] = body.messages ?? [];
  const recipeId: string | null = body.recipeId ?? null;

  const [recipe, memoryFacts, guidelines, aisleRows] = await Promise.all([
    recipeId ? getRecipeById(recipeId) : Promise.resolve(null),
    getMemoryFacts(user.id),
    getGuidelines(user.id),
    getAllAisles(),
  ]);

  let recipeContext: string | undefined;
  if (recipe && recipe.user_id === user.id) {
    recipeContext = serializeRecipeContext(recipe);
  }

  const tools = createRecipeTools(user.id, recipeId);

  const result = streamText({
    model: getDefaultModel(),
    system: buildSystemPrompt({
      context: "recipe",
      recipeContext,
      memoryFacts: memoryFacts.map((f) => f.content),
      userGuidelines: guidelines.map((g) => g.content),
      aisles: aisleRows.map((a) => ({
        id: a.id,
        slug: a.slug,
        label: t("aisles", a.slug as Parameters<typeof t<"aisles">>[1]),
      })),
    }),
    messages: await convertToModelMessages(messages),
    tools,
    stopWhen: stepCountIs(25),
  });

  return result.toUIMessageStreamResponse({
    onError: (error) => {
      if (error instanceof Error) return error.message;
      return String(error);
    },
  });
}
