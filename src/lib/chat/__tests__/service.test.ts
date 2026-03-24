import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

// ─── DB mock ──────────────────────────────────────────────────────────────────

const mocks = vi.hoisted(() => {
  const findFirst = vi.fn();
  const returning = vi.fn();
  const onConflictDoUpdate = vi.fn();
  const values = vi.fn(() => ({ returning, onConflictDoUpdate }));
  const insert = vi.fn(() => ({ values }));
  return { insert, values, returning, onConflictDoUpdate, findFirst };
});

vi.mock("@/db", () => ({
  db: {
    insert: mocks.insert,
    query: {
      recipeChatMessages: { findFirst: mocks.findFirst },
    },
  },
}));

vi.mock("@/db/schema", () => ({
  recipeChatMessages: { recipe_id: "recipe_id" },
}));

import { saveChatHistory, getChatHistory } from "../service";
import type { UIMessage } from "ai";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeMessage(id: string, role: "user" | "assistant" = "user"): UIMessage {
  return {
    id,
    role,
    parts: [{ type: "text", text: `message ${id}` }],
    metadata: {},
  } as unknown as UIMessage;
}

const RECIPE_ID = "550e8400-e29b-41d4-a716-446655440000";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.onConflictDoUpdate.mockResolvedValue(undefined);
});

// ─── saveChatHistory ──────────────────────────────────────────────────────────

describe("saveChatHistory", () => {
  it("calls insert with the messages array", async () => {
    mocks.onConflictDoUpdate.mockResolvedValue(undefined);
    const messages = [makeMessage("1"), makeMessage("2")];
    await saveChatHistory(RECIPE_ID, messages);
    expect(mocks.insert).toHaveBeenCalledOnce();
    expect(mocks.values).toHaveBeenCalledWith(
      expect.objectContaining({ recipe_id: RECIPE_ID })
    );
    expect(mocks.onConflictDoUpdate).toHaveBeenCalledOnce();
  });

  it("truncates to the last 50 messages when given more than 50", async () => {
    mocks.onConflictDoUpdate.mockResolvedValue(undefined);
    const messages = Array.from({ length: 60 }, (_, i) => makeMessage(String(i)));
    await saveChatHistory(RECIPE_ID, messages);
    const savedMessages = mocks.values.mock.calls[0][0].messages as UIMessage[];
    expect(savedMessages).toHaveLength(50);
    // Should be the last 50 (indices 10–59)
    expect(savedMessages[0].id).toBe("10");
    expect(savedMessages[49].id).toBe("59");
  });

  it("does not truncate when 50 messages or fewer", async () => {
    mocks.onConflictDoUpdate.mockResolvedValue(undefined);
    const messages = Array.from({ length: 50 }, (_, i) => makeMessage(String(i)));
    await saveChatHistory(RECIPE_ID, messages);
    const savedMessages = mocks.values.mock.calls[0][0].messages as UIMessage[];
    expect(savedMessages).toHaveLength(50);
  });

  it("saves empty array without error", async () => {
    mocks.onConflictDoUpdate.mockResolvedValue(undefined);
    await expect(saveChatHistory(RECIPE_ID, [])).resolves.toBeUndefined();
    const savedMessages = mocks.values.mock.calls[0][0].messages as UIMessage[];
    expect(savedMessages).toHaveLength(0);
  });
});

// ─── getChatHistory ───────────────────────────────────────────────────────────

describe("getChatHistory", () => {
  it("returns messages when a row exists", async () => {
    const messages = [makeMessage("1"), makeMessage("2")];
    mocks.findFirst.mockResolvedValue({ messages });
    const result = await getChatHistory(RECIPE_ID);
    expect(result).toEqual(messages);
  });

  it("returns null when no row exists", async () => {
    mocks.findFirst.mockResolvedValue(undefined);
    const result = await getChatHistory(RECIPE_ID);
    expect(result).toBeNull();
  });
});
