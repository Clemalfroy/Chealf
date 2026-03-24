import { streamText, convertToModelMessages } from "ai";
import type { UIMessage } from "ai";
import { verifySession } from "@/lib/dal";
import { getDefaultModel, buildSystemPrompt } from "@/lib/ai";

export async function POST(request: Request) {
  await verifySession();

  const body = await request.json();
  const messages: UIMessage[] = body.messages ?? [];

  const result = streamText({
    model: getDefaultModel(),
    system: buildSystemPrompt(),
    messages: await convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
}
