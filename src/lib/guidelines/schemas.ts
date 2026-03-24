import { z } from "zod";

export const createGuidelineSchema = z.object({
  content: z.string().min(1).max(2000),
});

export const updateGuidelineSchema = z.object({
  guidelineId: z.string().uuid(),
  content: z.string().min(1).max(2000),
});

export type CreateGuidelineInput = z.infer<typeof createGuidelineSchema>;
export type UpdateGuidelineInput = z.infer<typeof updateGuidelineSchema>;
