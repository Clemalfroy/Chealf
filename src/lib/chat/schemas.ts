import { z } from "zod";

export const saveChatHistorySchema = z.object({
  recipeId: z.string().uuid(),
  messages: z.array(z.unknown()),
});

export type SaveChatHistoryInput = z.infer<typeof saveChatHistorySchema>;
