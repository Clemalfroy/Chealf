import { describe, it, expect } from "vitest";
import { buildSystemPrompt } from "../prompts";

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
});
