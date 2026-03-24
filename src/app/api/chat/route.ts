import { streamText } from "ai";
import { verifySession } from "@/lib/dal";
import { getDefaultModel, buildSystemPrompt } from "@/lib/ai";

export async function POST(request: Request) {
  await verifySession();

  const { messages } = await request.json();

  const result = streamText({
    model: getDefaultModel(),
    system: buildSystemPrompt(),
    messages,
    // Tools will be added in M1.2 (recipe assistant)
  });

  return result.toTextStreamResponse();
}
