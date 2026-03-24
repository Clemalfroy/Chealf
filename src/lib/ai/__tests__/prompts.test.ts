import { describe, it, expect } from "vitest";
import { buildSystemPrompt } from "../prompts";
import { RECIPE_BASE_PROMPT } from "../prompts/recipe";

describe("buildSystemPrompt", () => {
  it("includes the base prompt by default", () => {
    const prompt = buildSystemPrompt();
    expect(prompt).toContain("Chealf");
    expect(prompt).toContain("français");
  });

  it("includes memory facts when provided", () => {
    const prompt = buildSystemPrompt({
      memoryFacts: ["Allergique aux arachides", "Préfère les plats végétariens"],
    });
    expect(prompt).toContain("Allergique aux arachides");
    expect(prompt).toContain("Préfère les plats végétariens");
    expect(prompt).toContain("Ce que tu sais sur l'utilisateur");
  });

  it("includes user guidelines when provided", () => {
    const prompt = buildSystemPrompt({
      userGuidelines: ["semaine rapide", "batch cooking"],
    });
    expect(prompt).toContain("semaine rapide");
    expect(prompt).toContain("batch cooking");
    expect(prompt).toContain("Guidelines actives");
  });

  it("includes both memory facts and guidelines when both are provided", () => {
    const prompt = buildSystemPrompt({
      memoryFacts: ["Végétarien"],
      userGuidelines: ["semaine rapide"],
    });
    expect(prompt).toContain("Végétarien");
    expect(prompt).toContain("semaine rapide");
  });

  it("produces clean output with no memory or guidelines", () => {
    const prompt = buildSystemPrompt({ memoryFacts: [], userGuidelines: [] });
    expect(prompt).not.toContain("Ce que tu sais");
    expect(prompt).not.toContain("Guidelines actives");
  });

  it("includes recipeContext when provided", () => {
    const prompt = buildSystemPrompt({
      recipeContext: "## Recette en cours\nTitre: Poulet",
    });
    expect(prompt).toContain("## Recette en cours");
    expect(prompt).toContain("Titre: Poulet");
  });

  it("omits recipeContext section when not provided", () => {
    const prompt = buildSystemPrompt();
    expect(prompt).not.toContain("## Recette en cours");
  });
});

describe("buildSystemPrompt context selection", () => {
  it("uses recipe-specific base prompt when context is 'recipe'", () => {
    const prompt = buildSystemPrompt({ context: "recipe" });
    // Recipe prompt includes specific recipe-focused instructions
    expect(prompt).toContain(RECIPE_BASE_PROMPT.substring(0, 30));
  });

  it("recipe context includes searchIngredients instruction", () => {
    const prompt = buildSystemPrompt({ context: "recipe" });
    expect(prompt).toContain("searchIngredients");
  });

  it("no context → generic base prompt (mentions all domains)", () => {
    const prompt = buildSystemPrompt();
    // Generic base prompt covers all three domains
    expect(prompt).toContain("Chealf");
  });

  it("recipe context + recipeContext → both appear in prompt", () => {
    const prompt = buildSystemPrompt({
      context: "recipe",
      recipeContext: "## Recette en cours\nTitre: Risotto",
    });
    expect(prompt).toContain("Risotto");
    expect(prompt).toContain(RECIPE_BASE_PROMPT.substring(0, 30));
  });
});
