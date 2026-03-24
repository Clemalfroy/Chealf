import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ChefHat } from "lucide-react";
import { EmptyState } from "../empty-state";

describe("EmptyState", () => {
  it("renders icon, headline, description, and action", () => {
    render(
      <EmptyState
        icon={ChefHat}
        headline="Nothing here"
        description="Get started by doing something"
        action={<button>Click me</button>}
      />
    );

    expect(screen.getByText("Nothing here")).toBeInTheDocument();
    expect(screen.getByText("Get started by doing something")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Click me" })).toBeInTheDocument();
  });

  it("renders without optional description and action", () => {
    render(<EmptyState icon={ChefHat} headline="Empty" />);

    expect(screen.getByText("Empty")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("applies custom className", () => {
    const { container } = render(
      <EmptyState icon={ChefHat} headline="Test" className="custom-class" />
    );
    expect(container.firstChild).toHaveClass("custom-class");
  });
});
