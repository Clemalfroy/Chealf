export type ChatContext = "recipe" | "planning";

export type SuggestionChipKey =
  | "seasonal"
  | "quick"
  | "healthy"
  | "gourmet"
  | "iron_rich"
  | "protein_rich"
  | "gluten_free"
  | "vegetarian"
  | "batch_cooking";

export const SUGGESTION_CHIPS: Record<ChatContext, SuggestionChipKey[]> = {
  recipe: [
    "seasonal",
    "quick",
    "healthy",
    "gourmet",
    "iron_rich",
    "protein_rich",
    "gluten_free",
    "vegetarian",
    "batch_cooking",
  ],
  planning: [], // populated in M3
};
