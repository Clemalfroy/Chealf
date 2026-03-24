import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { SignupForm } from "../signup/signup-form";

// Mock the server action
vi.mock("../actions", () => ({
  signup: vi.fn(),
}));

// Mock next/link
vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

describe("SignupForm", () => {
  it("renders email, password, and confirm password inputs", () => {
    render(<SignupForm />);

    expect(screen.getByLabelText(/^email$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^mot de passe$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirmer le mot de passe/i)).toBeInTheDocument();
  });

  it("renders the submit button", () => {
    render(<SignupForm />);
    expect(screen.getByRole("button", { name: /créer un compte/i })).toBeInTheDocument();
  });

  it("renders a link to the login page", () => {
    render(<SignupForm />);
    const link = screen.getByRole("link", { name: /se connecter/i });
    expect(link).toHaveAttribute("href", "/login");
  });
});
