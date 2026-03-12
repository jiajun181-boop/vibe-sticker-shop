/**
 * Tests for webhook-helpers.ts — pure functions extracted from webhook-handler.
 */

import {
  toNumberOrNull,
  parseSizeRows,
  parseMetadataItems,
  shapeOrderItem,
  shapeProductionJob,
  buildOrderCreatedTimeline,
  buildSystemNote,
  shouldAutoCreateProof,
  getProofImageUrl,
} from "./webhook-helpers";

describe("toNumberOrNull", () => {
  test("returns number for valid number", () => {
    expect(toNumberOrNull(42)).toBe(42);
    expect(toNumberOrNull(0)).toBe(0);
    expect(toNumberOrNull(-3.5)).toBe(-3.5);
  });
  test("parses string numbers", () => {
    expect(toNumberOrNull("42")).toBe(42);
    expect(toNumberOrNull("3.14")).toBe(3.14);
  });
  test("returns null for invalid inputs", () => {
    expect(toNumberOrNull("abc")).toBeNull();
    expect(toNumberOrNull("")).toBeNull();
    expect(toNumberOrNull(null)).toBeNull();
    expect(toNumberOrNull(undefined)).toBeNull();
    expect(toNumberOrNull(NaN)).toBeNull();
    expect(toNumberOrNull(Infinity)).toBeNull();
  });
});

describe("parseSizeRows", () => {
  test("parses valid size rows", () => {
    const meta = {
      sizeRows: [
        { widthIn: 3, heightIn: 4, quantity: 100 },
        { width: 5, height: 6, quantity: 50 },
      ],
    };
    const result = parseSizeRows(meta);
    expect(result).toEqual([
      { width: 3, height: 4, quantity: 100 },
      { width: 5, height: 6, quantity: 50 },
    ]);
  });

  test("parses JSON string sizeRows", () => {
    const meta = {
      sizeRows: JSON.stringify([{ width: 3, height: 4, quantity: 100 }]),
    };
    const result = parseSizeRows(meta);
    expect(result).toEqual([{ width: 3, height: 4, quantity: 100 }]);
  });

  test("returns null for null/missing meta", () => {
    expect(parseSizeRows(null)).toBeNull();
    expect(parseSizeRows({})).toBeNull();
  });

  test("filters out invalid rows", () => {
    const meta = {
      sizeRows: [
        { width: 3, height: 4, quantity: 100 },
        { width: 0, height: 4, quantity: 100 }, // invalid
        null,
        { width: 3 }, // missing fields
      ],
    };
    const result = parseSizeRows(meta);
    expect(result).toEqual([{ width: 3, height: 4, quantity: 100 }]);
  });
});

describe("parseMetadataItems", () => {
  test("parses valid items JSON", () => {
    const metadata = {
      items: JSON.stringify([{ productId: "abc", name: "Test", quantity: 1 }]),
    };
    const result = parseMetadataItems(metadata);
    expect(result).toHaveLength(1);
    expect(result[0].productId).toBe("abc");
  });

  test("throws on missing metadata", () => {
    expect(() => parseMetadataItems(null)).toThrow("Missing metadata");
    expect(() => parseMetadataItems({})).toThrow("Missing metadata");
  });

  test("throws on corrupted JSON", () => {
    expect(() => parseMetadataItems({ items: "not-json" })).toThrow("Corrupted metadata");
  });
});

describe("shapeOrderItem", () => {
  test("shapes basic item", () => {
    const item = {
      productId: "prod1",
      name: "Die-Cut Sticker",
      quantity: 100,
      unitAmount: 250,
      meta: { width: "3", height: "4", material: "white-vinyl" },
    };
    const result = shapeOrderItem(item);
    expect(result.productId).toBe("prod1");
    expect(result.productName).toBe("Die-Cut Sticker");
    expect(result.quantity).toBe(100);
    expect(result.unitPrice).toBe(250);
    expect(result.totalPrice).toBe(25000);
    expect(result.widthIn).toBe(3);
    expect(result.heightIn).toBe(4);
    expect(result.material).toBe("white-vinyl");
  });

  test("handles missing meta gracefully", () => {
    const item = { productId: "p1", name: "Test", quantity: 1, unitAmount: 500 };
    const result = shapeOrderItem(item);
    expect(result.widthIn).toBeNull();
    expect(result.heightIn).toBeNull();
    expect(result.material).toBeNull();
    expect(result.meta).toBeNull();
  });

  test("extracts editor specs", () => {
    const item = {
      productId: "p1",
      name: "Stamp",
      quantity: 1,
      unitAmount: 3000,
      meta: {
        editorType: "text",
        editorText: "ACME Corp",
        editorFont: "Arial",
        editorColor: "#000",
      },
    };
    const result = shapeOrderItem(item);
    expect(result.specsJson).toBeTruthy();
    expect((result.specsJson as Record<string, unknown>).editor).toBeTruthy();
  });

  test("extracts file info from meta", () => {
    const item = {
      productId: "p1",
      name: "Test",
      quantity: 1,
      unitAmount: 100,
      meta: { artworkUrl: "https://example.com/art.png", artworkKey: "key123", artworkName: "art.png" },
    };
    const result = shapeOrderItem(item);
    expect(result.fileUrl).toBe("https://example.com/art.png");
    expect(result.fileKey).toBe("key123");
    expect(result.fileName).toBe("art.png");
  });
});

describe("shapeProductionJob", () => {
  test("detects rush production", () => {
    const item = { meta: { rushProduction: "true" } };
    const result = shapeProductionJob(item);
    expect(result.isRush).toBe(true);
    // Rush due date: 1 day
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    expect(result.dueAt.toDateString()).toBe(tomorrow.toDateString());
  });

  test("detects two-sided from meta.sides", () => {
    const item = { meta: { sides: "double" } };
    expect(shapeProductionJob(item).isTwoSided).toBe(true);
  });

  test("detects two-sided from meta.doubleSided", () => {
    const item = { meta: { doubleSided: true } };
    expect(shapeProductionJob(item).isTwoSided).toBe(true);
  });

  test("extracts artwork URL from fileUrl first", () => {
    const item = {
      fileUrl: "https://direct.com/file.png",
      meta: { artworkUrl: "https://meta.com/art.png" },
    };
    expect(shapeProductionJob(item).artworkUrl).toBe("https://direct.com/file.png");
  });

  test("falls back to meta artwork URL", () => {
    const item = { meta: { artworkUrl: "https://meta.com/art.png" } };
    expect(shapeProductionJob(item).artworkUrl).toBe("https://meta.com/art.png");
  });

  test("extracts material and finishing labels", () => {
    const item = {
      meta: {
        materialLabel: "Glossy White Vinyl",
        laminationLabel: "Matte Lamination",
      },
    };
    const result = shapeProductionJob(item);
    expect(result.materialLabel).toBe("Glossy White Vinyl");
    expect(result.finishingLabel).toBe("Matte Lamination");
  });

  test("standard due date is 3 days", () => {
    const item = { meta: {} };
    const result = shapeProductionJob(item);
    const threeDays = new Date();
    threeDays.setDate(threeDays.getDate() + 3);
    expect(result.dueAt.toDateString()).toBe(threeDays.toDateString());
  });
});

describe("timeline/note helpers", () => {
  test("buildOrderCreatedTimeline", () => {
    const tl = buildOrderCreatedTimeline("pi_123");
    expect(tl.action).toBe("order_created");
    expect(tl.details).toContain("pi_123");
    expect(tl.actor).toBe("system");
  });

  test("buildSystemNote", () => {
    const note = buildSystemNote("cs_abc");
    expect(note.authorType).toBe("system");
    expect(note.isInternal).toBe(true);
    expect(note.message).toContain("cs_abc");
  });
});

describe("proof helpers", () => {
  test("shouldAutoCreateProof: true when confirmed + has image", () => {
    expect(shouldAutoCreateProof({ proofConfirmed: true, artworkUrl: "https://x.com/img.png" })).toBe(true);
    expect(shouldAutoCreateProof({ proofConfirmed: "true", processedImageUrl: "url" })).toBe(true);
  });

  test("shouldAutoCreateProof: false when not confirmed", () => {
    expect(shouldAutoCreateProof({ proofConfirmed: false, artworkUrl: "url" })).toBe(false);
    expect(shouldAutoCreateProof(null)).toBe(false);
  });

  test("shouldAutoCreateProof: false when no image URL", () => {
    expect(shouldAutoCreateProof({ proofConfirmed: true })).toBe(false);
  });

  test("getProofImageUrl: priority order", () => {
    expect(getProofImageUrl({ processedImageUrl: "a", artworkUrl: "b", fileUrl: "c" })).toBe("a");
    expect(getProofImageUrl({ artworkUrl: "b", fileUrl: "c" })).toBe("b");
    expect(getProofImageUrl({ fileUrl: "c" })).toBe("c");
    expect(getProofImageUrl({})).toBeNull();
  });
});
