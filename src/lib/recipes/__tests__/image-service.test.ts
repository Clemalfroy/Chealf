import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Hoisted mocks ─────────────────────────────────────────────────────────────

const mockDb = vi.hoisted(() => ({
  query: {
    recipeImages: {
      findFirst: vi.fn(),
    },
    recipes: {
      findFirst: vi.fn(),
    },
  },
  insert: vi.fn(() => mockDb),
  update: vi.fn(() => mockDb),
  delete: vi.fn(() => mockDb),
  values: vi.fn(() => mockDb),
  set: vi.fn(() => mockDb),
  where: vi.fn(() => mockDb),
  returning: vi.fn(() => mockDb),
  then: undefined as unknown,
}));

const mockGenerateImage = vi.hoisted(() => vi.fn());
const mockGetImageModel = vi.hoisted(() => vi.fn(() => ({})));
const mockSharp = vi.hoisted(() => {
  const chain = {
    webp: vi.fn(() => chain),
    toBuffer: vi.fn(async () => Buffer.from("fake-webp")),
  };
  return vi.fn(() => chain);
});

vi.mock("server-only", () => ({}));
vi.mock("@/db", () => ({ db: mockDb }));
vi.mock("ai", () => ({ generateImage: mockGenerateImage }));
vi.mock("@/lib/ai/provider", () => ({ getImageModel: mockGetImageModel }));
vi.mock("sharp", () => ({ default: mockSharp }));
vi.mock("@/lib/ai/prompts/image", () => ({
  buildImagePrompt: (prompt: string) => `STYLE: ${prompt}`,
}));

const uuid = "550e8400-e29b-41d4-a716-446655440000";
const uuid2 = "550e8400-e29b-41d4-a716-446655440001";
const recipeId = "550e8400-e29b-41d4-a716-446655440002";

import { generateRecipeImage } from "../service";

describe("generateRecipeImage", () => {
  const mockUpload = vi.fn<[Buffer, string], Promise<string>>();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUpload.mockReset();
  });

  it("throws when recipe_images row not found", async () => {
    mockDb.query.recipeImages.findFirst.mockResolvedValueOnce(null);
    await expect(
      generateRecipeImage("user-1", uuid, mockUpload)
    ).rejects.toThrow("Image record not found or access denied");
  });

  it("throws when another generation is already in progress", async () => {
    mockDb.query.recipeImages.findFirst
      .mockResolvedValueOnce({ id: uuid, recipe_id: recipeId, user_id: "user-1", prompt: "A dish" })
      .mockResolvedValueOnce({ id: uuid2 }); // concurrent generating row found
    await expect(
      generateRecipeImage("user-1", uuid, mockUpload)
    ).rejects.toThrow("Image generation already in progress");
  });

  it("calls generateImage, converts to webp, uploads, updates DB", async () => {
    mockDb.query.recipeImages.findFirst
      .mockResolvedValueOnce({ id: uuid, recipe_id: recipeId, user_id: "user-1", prompt: "A dish" })
      .mockResolvedValueOnce(null); // no concurrent generation

    const fakeUint8 = new Uint8Array([1, 2, 3]);
    mockGenerateImage.mockResolvedValue({
      image: { uint8Array: fakeUint8 },
    });
    mockUpload.mockResolvedValue("https://cdn.example.com/image.webp");

    // DB update calls — chain returns itself
    mockDb.update.mockReturnValue(mockDb);
    mockDb.set.mockReturnValue(mockDb);
    mockDb.where.mockResolvedValue(undefined);

    const result = await generateRecipeImage("user-1", uuid, mockUpload);

    expect(mockGenerateImage).toHaveBeenCalledWith(
      expect.objectContaining({
        prompt: "STYLE: A dish",
        size: "1792x1024",
      })
    );
    expect(mockSharp).toHaveBeenCalledWith(fakeUint8);
    expect(mockUpload).toHaveBeenCalledWith(
      expect.any(Buffer),
      `user-1/${recipeId}/${uuid}.webp`
    );
    expect(result).toEqual({ imageUrl: "https://cdn.example.com/image.webp" });
  });

  it("sets status to error and rethrows when DALL-E fails", async () => {
    mockDb.query.recipeImages.findFirst
      .mockResolvedValueOnce({ id: uuid, recipe_id: recipeId, user_id: "user-1", prompt: "A dish" })
      .mockResolvedValueOnce(null);

    mockGenerateImage.mockRejectedValue(new Error("DALL-E quota exceeded"));
    mockDb.update.mockReturnValue(mockDb);
    mockDb.set.mockReturnValue(mockDb);
    mockDb.where.mockResolvedValue(undefined);

    await expect(
      generateRecipeImage("user-1", uuid, mockUpload)
    ).rejects.toThrow("Image generation failed");

    // Should have attempted to set status = error
    expect(mockDb.update).toHaveBeenCalled();
  });

  it("sets status to error and rethrows when upload fails", async () => {
    mockDb.query.recipeImages.findFirst
      .mockResolvedValueOnce({ id: uuid, recipe_id: recipeId, user_id: "user-1", prompt: "A dish" })
      .mockResolvedValueOnce(null);

    mockGenerateImage.mockResolvedValue({ image: { uint8Array: new Uint8Array([1]) } });
    mockUpload.mockRejectedValue(new Error("Storage full"));
    mockDb.update.mockReturnValue(mockDb);
    mockDb.set.mockReturnValue(mockDb);
    mockDb.where.mockResolvedValue(undefined);

    await expect(
      generateRecipeImage("user-1", uuid, mockUpload)
    ).rejects.toThrow("Image generation failed");

    expect(mockDb.update).toHaveBeenCalled();
  });

  it("uses correct storage path format", async () => {
    mockDb.query.recipeImages.findFirst
      .mockResolvedValueOnce({ id: uuid2, recipe_id: recipeId, user_id: "user-42", prompt: "dish" })
      .mockResolvedValueOnce(null);

    mockGenerateImage.mockResolvedValue({ image: { uint8Array: new Uint8Array([1]) } });
    mockUpload.mockResolvedValue("https://cdn.example.com/image.webp");
    mockDb.update.mockReturnValue(mockDb);
    mockDb.set.mockReturnValue(mockDb);
    mockDb.where.mockResolvedValue(undefined);

    await generateRecipeImage("user-42", uuid2, mockUpload);

    expect(mockUpload).toHaveBeenCalledWith(
      expect.any(Buffer),
      `user-42/${recipeId}/${uuid2}.webp`
    );
  });
});
