import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

// ─── DB mock ──────────────────────────────────────────────────────────────────

const mocks = vi.hoisted(() => {
  const returning = vi.fn();
  const insertValues = vi.fn(() => ({ returning }));
  const insert = vi.fn(() => ({ values: insertValues }));

  const deleteReturning = vi.fn();
  const deleteWhere = vi.fn(() => ({ returning: deleteReturning }));
  const deleteFn = vi.fn(() => ({ where: deleteWhere }));

  const updateReturning = vi.fn();
  const updateWhere = vi.fn(() => ({ returning: updateReturning }));
  const updateSet = vi.fn(() => ({ where: updateWhere }));
  const update = vi.fn(() => ({ set: updateSet }));

  const findMany = vi.fn();

  return {
    insert, insertValues, returning,
    deleteFn, deleteWhere, deleteReturning,
    update, updateSet, updateWhere, updateReturning,
    findMany,
  };
});

vi.mock("@/db", () => ({
  db: {
    insert: mocks.insert,
    delete: mocks.deleteFn,
    update: mocks.update,
    query: {
      aiMemoryFacts: { findMany: mocks.findMany },
    },
  },
}));

vi.mock("@/db/schema", () => ({
  aiMemoryFacts: { id: "id", user_id: "user_id" },
}));

import {
  createMemoryFact,
  getMemoryFacts,
  deleteMemoryFact,
  updateMemoryFact,
} from "../service";

const USER_ID = "550e8400-e29b-41d4-a716-446655440001";
const FACT_ID  = "550e8400-e29b-41d4-a716-446655440002";

beforeEach(() => vi.clearAllMocks());

// ─── createMemoryFact ─────────────────────────────────────────────────────────

describe("createMemoryFact", () => {
  it("inserts and returns the created fact", async () => {
    const fact = { id: FACT_ID, user_id: USER_ID, content: "Végétarien", category: "diet", created_at: new Date() };
    mocks.returning.mockResolvedValue([fact]);
    const result = await createMemoryFact(USER_ID, "Végétarien", "diet");
    expect(mocks.insert).toHaveBeenCalledOnce();
    expect(mocks.insertValues).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: USER_ID, content: "Végétarien", category: "diet" })
    );
    expect(result).toEqual(fact);
  });

  it("stores null category when category is omitted", async () => {
    const fact = { id: FACT_ID, user_id: USER_ID, content: "Sportif", category: null, created_at: new Date() };
    mocks.returning.mockResolvedValue([fact]);
    await createMemoryFact(USER_ID, "Sportif");
    expect(mocks.insertValues).toHaveBeenCalledWith(
      expect.objectContaining({ category: null })
    );
  });
});

// ─── getMemoryFacts ───────────────────────────────────────────────────────────

describe("getMemoryFacts", () => {
  it("returns all facts for user in order", async () => {
    const facts = [
      { id: FACT_ID, user_id: USER_ID, content: "Végétarien", category: "diet", created_at: new Date() },
    ];
    mocks.findMany.mockResolvedValue(facts);
    const result = await getMemoryFacts(USER_ID);
    expect(result).toEqual(facts);
    expect(mocks.findMany).toHaveBeenCalledOnce();
  });

  it("returns empty array when no facts exist", async () => {
    mocks.findMany.mockResolvedValue([]);
    const result = await getMemoryFacts(USER_ID);
    expect(result).toEqual([]);
  });
});

// ─── deleteMemoryFact ─────────────────────────────────────────────────────────

describe("deleteMemoryFact", () => {
  it("deletes the fact with ownership check", async () => {
    mocks.deleteReturning.mockResolvedValue([{ id: FACT_ID }]);
    await expect(deleteMemoryFact(USER_ID, FACT_ID)).resolves.toBeUndefined();
    expect(mocks.deleteFn).toHaveBeenCalledOnce();
    expect(mocks.deleteWhere).toHaveBeenCalledOnce();
  });

  it("throws when fact not found or wrong owner", async () => {
    mocks.deleteReturning.mockResolvedValue([]);
    await expect(deleteMemoryFact(USER_ID, FACT_ID)).rejects.toThrow(
      "Memory fact not found or access denied"
    );
  });
});

// ─── updateMemoryFact ─────────────────────────────────────────────────────────

describe("updateMemoryFact", () => {
  it("updates content with ownership check", async () => {
    mocks.updateReturning.mockResolvedValue([{ id: FACT_ID }]);
    await expect(updateMemoryFact(USER_ID, FACT_ID, "Mise à jour")).resolves.toBeUndefined();
    expect(mocks.update).toHaveBeenCalledOnce();
    expect(mocks.updateSet).toHaveBeenCalledWith(expect.objectContaining({ content: "Mise à jour" }));
  });

  it("throws when fact not found or wrong owner", async () => {
    mocks.updateReturning.mockResolvedValue([]);
    await expect(updateMemoryFact(USER_ID, FACT_ID, "x")).rejects.toThrow(
      "Memory fact not found or access denied"
    );
  });
});
