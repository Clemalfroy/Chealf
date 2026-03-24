import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

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
      userGuidelines: { findMany: mocks.findMany },
    },
  },
}));

vi.mock("@/db/schema", () => ({
  userGuidelines: { id: "id", user_id: "user_id" },
}));

import {
  createGuideline,
  getGuidelines,
  updateGuideline,
  deleteGuideline,
} from "../service";

const USER_ID      = "550e8400-e29b-41d4-a716-446655440001";
const GUIDELINE_ID = "550e8400-e29b-41d4-a716-446655440002";

function makeGuideline(overrides = {}) {
  return {
    id: GUIDELINE_ID,
    user_id: USER_ID,
    content: "Recettes en moins de 30 minutes",
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  };
}

beforeEach(() => vi.clearAllMocks());

describe("createGuideline", () => {
  it("inserts and returns the created guideline", async () => {
    const guideline = makeGuideline();
    mocks.returning.mockResolvedValue([guideline]);
    const result = await createGuideline(USER_ID, { content: "Recettes en moins de 30 minutes" });
    expect(mocks.insert).toHaveBeenCalledOnce();
    expect(mocks.insertValues).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: USER_ID, content: "Recettes en moins de 30 minutes" })
    );
    expect(result).toEqual(guideline);
  });
});

describe("getGuidelines", () => {
  it("returns all guidelines for user", async () => {
    const list = [makeGuideline(), makeGuideline({ id: "other" })];
    mocks.findMany.mockResolvedValue(list);
    expect(await getGuidelines(USER_ID)).toEqual(list);
  });

  it("returns empty array when none exist", async () => {
    mocks.findMany.mockResolvedValue([]);
    expect(await getGuidelines(USER_ID)).toEqual([]);
  });
});

describe("updateGuideline", () => {
  it("updates content with ownership check", async () => {
    mocks.updateReturning.mockResolvedValue([{ id: GUIDELINE_ID }]);
    await expect(updateGuideline(USER_ID, GUIDELINE_ID, "Nouveau contenu")).resolves.toBeUndefined();
    expect(mocks.updateSet).toHaveBeenCalledWith(
      expect.objectContaining({ content: "Nouveau contenu" })
    );
  });

  it("throws when guideline not found or wrong owner", async () => {
    mocks.updateReturning.mockResolvedValue([]);
    await expect(updateGuideline(USER_ID, GUIDELINE_ID, "x")).rejects.toThrow(
      "Guideline not found or access denied"
    );
  });
});

describe("deleteGuideline", () => {
  it("deletes with ownership check", async () => {
    mocks.deleteReturning.mockResolvedValue([{ id: GUIDELINE_ID }]);
    await expect(deleteGuideline(USER_ID, GUIDELINE_ID)).resolves.toBeUndefined();
  });

  it("throws when guideline not found or wrong owner", async () => {
    mocks.deleteReturning.mockResolvedValue([]);
    await expect(deleteGuideline(USER_ID, GUIDELINE_ID)).rejects.toThrow(
      "Guideline not found or access denied"
    );
  });
});
