import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock server-only so it doesn't throw in test environment
vi.mock("server-only", () => ({}));

// Mock next/navigation redirect
const mockRedirect = vi.fn();
vi.mock("next/navigation", () => ({ redirect: mockRedirect }));

// Mock supabase server client
const mockGetUser = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: mockGetUser },
  }),
}));

describe("verifySession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset the React.cache by re-importing the module
    vi.resetModules();
  });

  it("returns the user when authenticated", async () => {
    const fakeUser = { id: "user-1", email: "test@example.com" };
    mockGetUser.mockResolvedValue({ data: { user: fakeUser }, error: null });

    const { verifySession } = await import("../dal");
    const result = await verifySession();

    expect(result.user).toEqual(fakeUser);
    expect(mockRedirect).not.toHaveBeenCalled();
  });

  it("redirects to /login when not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

    const { verifySession } = await import("../dal");
    await verifySession();

    expect(mockRedirect).toHaveBeenCalledWith("/login");
  });

  it("redirects to /login when getUser returns an error", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: new Error("Token expired"),
    });

    const { verifySession } = await import("../dal");
    await verifySession();

    expect(mockRedirect).toHaveBeenCalledWith("/login");
  });
});
