import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SuggestionChips } from "../suggestion-chips";

describe("SuggestionChips", () => {
  it("renders all recipe chips", () => {
    render(<SuggestionChips context="recipe" onChipClick={vi.fn()} />);

    expect(screen.getByRole("button", { name: "de saison" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "rapide" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "sain" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "gourmand" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "riche en fer" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "riche en protéines" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "sans gluten" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "végétarien" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "batch cooking" })).toBeInTheDocument();
  });

  it("calls onChipClick with localized label on click", async () => {
    const onChipClick = vi.fn();
    render(<SuggestionChips context="recipe" onChipClick={onChipClick} />);

    await userEvent.click(screen.getByRole("button", { name: "rapide" }));

    expect(onChipClick).toHaveBeenCalledOnce();
    expect(onChipClick).toHaveBeenCalledWith("rapide");
  });

  it("renders nothing for planning context (empty chips)", () => {
    const { container } = render(
      <SuggestionChips context="planning" onChipClick={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });
});
