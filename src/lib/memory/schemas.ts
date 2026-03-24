import { z } from "zod";

export const createMemoryFactSchema = z.object({
  content: z.string().min(1).max(500),
  category: z.string().optional(),
});

export const updateMemoryFactSchema = z.object({
  factId: z.string().uuid(),
  content: z.string().min(1).max(500),
});

export type CreateMemoryFactInput = z.infer<typeof createMemoryFactSchema>;
export type UpdateMemoryFactInput = z.infer<typeof updateMemoryFactSchema>;
