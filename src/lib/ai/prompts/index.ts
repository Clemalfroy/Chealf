import { BASE_PROMPT } from "./base";

export type SystemPromptOptions = {
  /** Active user guidelines (e.g. "semaine rapide", "batch cooking") */
  userGuidelines?: string[];
  /** Learned facts about the user extracted from past conversations */
  memoryFacts?: string[];
};

/**
 * Compose the system prompt from base + optional context segments.
 * Each milestone adds new options (e.g., recipeContext in M1, planningContext in M3).
 */
export function buildSystemPrompt(options: SystemPromptOptions = {}): string {
  const segments: string[] = [BASE_PROMPT];

  if (options.memoryFacts && options.memoryFacts.length > 0) {
    segments.push(
      `## Ce que tu sais sur l'utilisateur\n${options.memoryFacts.map((f) => `- ${f}`).join("\n")}`
    );
  }

  if (options.userGuidelines && options.userGuidelines.length > 0) {
    segments.push(
      `## Guidelines actives\n${options.userGuidelines.map((g) => `- ${g}`).join("\n")}`
    );
  }

  return segments.join("\n\n");
}
