import { BASE_PROMPT } from "./base";
import { RECIPE_BASE_PROMPT } from "./recipe";

/**
 * Available assistant contexts. Each has its own base prompt
 * focused on that domain. New contexts are added per milestone:
 * - "recipe"   → M1 (current)
 * - "planning" → M3
 * - "shopping" → M4
 */
export type AssistantContext = "recipe" | "planning" | "shopping";

const BASE_PROMPTS: Record<AssistantContext, string> = {
  recipe: RECIPE_BASE_PROMPT,
  // Placeholders — will be replaced with focused prompts in their milestones
  planning: BASE_PROMPT,
  shopping: BASE_PROMPT,
};

export type SystemPromptOptions = {
  /** Which assistant context to use (selects the base prompt). Defaults to generic. */
  context?: AssistantContext;
  /** Active user guidelines (e.g. "semaine rapide", "batch cooking") */
  userGuidelines?: string[];
  /** Learned facts about the user extracted from past conversations */
  memoryFacts?: string[];
  /** Compact serialized state of the recipe currently being edited */
  recipeContext?: string;
};

/**
 * Compose the system prompt from base + optional context segments.
 * Each milestone adds new contexts and options.
 */
export function buildSystemPrompt(options: SystemPromptOptions = {}): string {
  const base = options.context
    ? BASE_PROMPTS[options.context]
    : BASE_PROMPT;

  const segments: string[] = [base];

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

  if (options.recipeContext) {
    segments.push(options.recipeContext);
  }

  return segments.join("\n\n");
}
