/**
 * Regression tests for artwork detection utilities.
 *
 * Validates:
 *   R1: "provided" status recognized by getArtworkStatus / scanOrderArtwork
 *   R2: itemNeedsArtwork excludes provided / design-help / service-fee items
 *   R3: design-help tag normalization (hyphen, not underscore)
 *   R4: auto-tag computeAutoTags excludes provided from missing-artwork
 *   R5: service-fee rows never treated as needing artwork
 *   R6: itemIsDesignHelp boolean/string consistency
 */

import {
  hasArtworkUrl,
  getArtworkStatus,
  scanOrderArtwork,
  itemHasArtwork,
  itemIsDesignHelp,
  itemIsArtworkProvided,
  itemNeedsArtwork,
} from "@/lib/artwork-detection";

import { computeAutoTags } from "@/lib/auto-tag";

// ── getArtworkStatus ────────────────────────────────────────────────────────

describe("getArtworkStatus", () => {
  it("returns 'uploaded' when item has artworkUrl", () => {
    expect(getArtworkStatus({ meta: { artworkUrl: "https://cdn.example.com/file.png" } })).toBe("uploaded");
  });

  it("returns 'uploaded' when item has fileUrl column", () => {
    expect(getArtworkStatus({ fileUrl: "https://cdn.example.com/file.png", meta: {} })).toBe("uploaded");
  });

  it("returns 'provided' when artworkIntent is 'provided'", () => {
    expect(getArtworkStatus({ meta: { artworkIntent: "provided" } })).toBe("provided");
  });

  it("returns 'provided' even when no URL exists", () => {
    expect(getArtworkStatus({ meta: { artworkIntent: "provided" }, fileUrl: null })).toBe("provided");
  });

  it("returns 'uploaded' when artworkIntent is 'provided' BUT a URL also exists", () => {
    // URL takes precedence — "uploaded" is better than "provided"
    expect(getArtworkStatus({ meta: { artworkIntent: "provided", artworkUrl: "https://cdn.example.com/file.png" } })).toBe("uploaded");
  });

  it("returns 'design-help' when designHelp is true", () => {
    expect(getArtworkStatus({ meta: { designHelp: true } })).toBe("design-help");
  });

  it("returns 'design-help' when designHelp is string 'true'", () => {
    expect(getArtworkStatus({ meta: { designHelp: "true" } })).toBe("design-help");
  });

  it("returns 'design-help' when artworkIntent is 'design-help'", () => {
    expect(getArtworkStatus({ meta: { artworkIntent: "design-help" } })).toBe("design-help");
  });

  it("returns 'upload-later' for upload-later intent", () => {
    expect(getArtworkStatus({ meta: { artworkIntent: "upload-later" } })).toBe("upload-later");
  });

  it("returns 'file-name-only' when fileName present but no URL", () => {
    expect(getArtworkStatus({ meta: { fileName: "logo.pdf" } })).toBe("file-name-only");
  });

  it("returns 'missing' for empty item", () => {
    expect(getArtworkStatus({ meta: {} })).toBe("missing");
  });

  it("returns 'missing' for null item", () => {
    expect(getArtworkStatus(null as unknown as Record<string, unknown>)).toBe("missing");
  });
});

// ── scanOrderArtwork ────────────────────────────────────────────────────────

describe("scanOrderArtwork", () => {
  it("flags PROVIDED for provided items", () => {
    const result = scanOrderArtwork([
      { meta: { artworkIntent: "provided" } },
    ]);
    expect(result.flags.has("PROVIDED")).toBe(true);
    expect(result.flags.has("NO_ART")).toBe(false);
    expect(result.worst).toBe("provided");
  });

  it("worst is 'missing' when mixed provided+missing", () => {
    const result = scanOrderArtwork([
      { meta: { artworkIntent: "provided" } },
      { meta: {} },
    ]);
    expect(result.worst).toBe("missing");
    expect(result.flags.has("PROVIDED")).toBe(true);
    expect(result.flags.has("NO_ART")).toBe(true);
  });

  it("worst is 'provided' when mixed provided+uploaded", () => {
    const result = scanOrderArtwork([
      { meta: { artworkIntent: "provided" } },
      { meta: { artworkUrl: "https://cdn.example.com/file.png" } },
    ]);
    expect(result.worst).toBe("provided");
    expect(result.hasArt).toBe(true);
    expect(result.allArt).toBe(false);
  });
});

// ── itemIsArtworkProvided ───────────────────────────────────────────────────

describe("itemIsArtworkProvided", () => {
  it("returns true for provided intent", () => {
    expect(itemIsArtworkProvided({ meta: { artworkIntent: "provided" } })).toBe(true);
  });

  it("returns false for upload-later", () => {
    expect(itemIsArtworkProvided({ meta: { artworkIntent: "upload-later" } })).toBe(false);
  });

  it("returns false for no meta", () => {
    expect(itemIsArtworkProvided({})).toBe(false);
  });
});

// ── itemNeedsArtwork ────────────────────────────────────────────────────────

describe("itemNeedsArtwork", () => {
  it("returns false for items with artwork URL", () => {
    expect(itemNeedsArtwork({ fileUrl: "https://cdn.example.com/file.png" })).toBe(false);
  });

  it("returns false for design-help items", () => {
    expect(itemNeedsArtwork({ meta: { designHelp: true } })).toBe(false);
  });

  it("returns false for artwork-provided items (P1 fix)", () => {
    expect(itemNeedsArtwork({ meta: { artworkIntent: "provided" } })).toBe(false);
  });

  it("returns true for upload-later with no file", () => {
    expect(itemNeedsArtwork({ meta: { artworkIntent: "upload-later" } })).toBe(true);
  });

  it("returns true for items with no artwork and no intent", () => {
    expect(itemNeedsArtwork({ meta: {} })).toBe(true);
  });

  it("returns true for null meta", () => {
    expect(itemNeedsArtwork({})).toBe(true);
  });
});

// ── computeAutoTags: missing-artwork exclusion ──────────────────────────────

describe("computeAutoTags — missing-artwork tag", () => {
  it("does NOT add missing-artwork for provided items (P2 fix)", () => {
    const tags = computeAutoTags({
      totalAmount: 5000,
      customerEmail: "test@example.com",
      items: [
        { productName: "Die Cut Sticker", quantity: 100, meta: { artworkIntent: "provided" } },
      ],
    });
    expect(tags).not.toContain("missing-artwork");
  });

  it("does NOT add missing-artwork for design-help items", () => {
    const tags = computeAutoTags({
      totalAmount: 5000,
      customerEmail: "test@example.com",
      items: [
        { productName: "Die Cut Sticker", quantity: 100, meta: { designHelp: true } },
      ],
    });
    expect(tags).not.toContain("missing-artwork");
  });

  it("adds missing-artwork for items with no file and no special intent", () => {
    const tags = computeAutoTags({
      totalAmount: 5000,
      customerEmail: "test@example.com",
      items: [
        { productName: "Die Cut Sticker", quantity: 100, meta: {} },
      ],
    });
    expect(tags).toContain("missing-artwork");
  });

  it("does NOT add missing-artwork when item has fileUrl", () => {
    const tags = computeAutoTags({
      totalAmount: 5000,
      customerEmail: "test@example.com",
      items: [
        { productName: "Die Cut Sticker", quantity: 100, meta: { artworkUrl: "https://cdn.example.com/file.png" } },
      ],
    });
    expect(tags).not.toContain("missing-artwork");
  });
});

// ── design-help tag normalization ────────────────────────────────────────────

describe("design-help tag normalization", () => {
  it("computeAutoTags uses hyphenated 'design-help' tag", () => {
    const tags = computeAutoTags({
      totalAmount: 5000,
      customerEmail: "test@example.com",
      items: [
        { productName: "Banner", quantity: 1, meta: { designHelp: true } },
      ],
    });
    expect(tags).toContain("design-help");
    expect(tags).not.toContain("design_help");
  });
});

// ── R5: service-fee rows never treated as needing artwork ───────────────────

describe("service-fee rows — artwork exclusion", () => {
  const designHelpServiceFee = {
    meta: { isServiceFee: "true", feeType: "design-help" },
  };

  const genericServiceFee = {
    meta: { isServiceFee: "true", feeType: "rush-surcharge" },
  };

  it("itemNeedsArtwork returns false for design-help service-fee row", () => {
    expect(itemNeedsArtwork(designHelpServiceFee)).toBe(false);
  });

  it("itemNeedsArtwork returns false for generic service-fee row", () => {
    expect(itemNeedsArtwork(genericServiceFee)).toBe(false);
  });

  it("service-fee row without designHelp flag is still excluded", () => {
    // The critical case: meta has isServiceFee but no artworkIntent/designHelp
    // Without the fix, this would return true (needs artwork)
    expect(itemNeedsArtwork({ meta: { isServiceFee: "true" } })).toBe(false);
  });

  it("regular product item with no artwork still needs artwork", () => {
    expect(itemNeedsArtwork({ meta: { material: "vinyl" } })).toBe(true);
  });

  it("service-fee row is not detected as having artwork", () => {
    expect(itemHasArtwork(designHelpServiceFee)).toBe(false);
  });

  it("service-fee row is not detected as design-help (it is a fee, not a product)", () => {
    // The service fee has feeType: "design-help" but NOT artworkIntent or designHelp
    expect(itemIsDesignHelp(designHelpServiceFee)).toBe(false);
  });
});

// ── R6: itemIsDesignHelp boolean/string consistency ─────────────────────────

describe("itemIsDesignHelp — boolean/string consistency", () => {
  it("returns true for designHelp: true (boolean)", () => {
    expect(itemIsDesignHelp({ meta: { designHelp: true } })).toBe(true);
  });

  it("returns true for designHelp: 'true' (string)", () => {
    // Admin create page sets designHelp: "true" as string
    expect(itemIsDesignHelp({ meta: { designHelp: "true" } })).toBe(true);
  });

  it("returns true for artworkIntent: 'design-help'", () => {
    expect(itemIsDesignHelp({ meta: { artworkIntent: "design-help" } })).toBe(true);
  });

  it("returns false for designHelp: false", () => {
    expect(itemIsDesignHelp({ meta: { designHelp: false } })).toBe(false);
  });

  it("returns false for designHelp: 'false' (string)", () => {
    expect(itemIsDesignHelp({ meta: { designHelp: "false" } })).toBe(false);
  });

  it("returns false for no meta", () => {
    expect(itemIsDesignHelp({})).toBe(false);
  });
});

// ── R7: computeAutoTags — service-fee exclusion from missing-artwork ─────────

describe("computeAutoTags — service-fee rows excluded from missing-artwork", () => {
  it("does NOT add missing-artwork when only item is a service-fee row", () => {
    const tags = computeAutoTags({
      totalAmount: 4500,
      customerEmail: "test@example.com",
      items: [
        { productName: "Design Help Service", quantity: 1, meta: { isServiceFee: "true", feeType: "design-help" } },
      ],
    });
    expect(tags).not.toContain("missing-artwork");
  });

  it("adds missing-artwork for product item alongside service-fee row", () => {
    const tags = computeAutoTags({
      totalAmount: 9500,
      customerEmail: "test@example.com",
      items: [
        { productName: "Die Cut Sticker", quantity: 100, meta: {} },
        { productName: "Design Help Service", quantity: 1, meta: { isServiceFee: "true", feeType: "design-help" } },
      ],
    });
    expect(tags).toContain("missing-artwork");
  });

  it("does NOT add missing-artwork when product has artwork + service-fee row", () => {
    const tags = computeAutoTags({
      totalAmount: 9500,
      customerEmail: "test@example.com",
      items: [
        { productName: "Die Cut Sticker", quantity: 100, meta: { artworkUrl: "https://cdn.example.com/file.png" } },
        { productName: "Design Help Service", quantity: 1, meta: { isServiceFee: "true", feeType: "design-help" } },
      ],
    });
    expect(tags).not.toContain("missing-artwork");
  });

  it("does NOT add upload-later for service-fee row with upload-later feeType", () => {
    // Edge case: a service-fee row should never contribute to upload-later tag
    const tags = computeAutoTags({
      totalAmount: 4500,
      customerEmail: "test@example.com",
      items: [
        { productName: "Rush Surcharge", quantity: 1, meta: { isServiceFee: "true", artworkIntent: "upload-later" } },
      ],
    });
    expect(tags).not.toContain("upload-later");
  });
});

// ── R8: computeAutoTags — designHelp string "true" consistency ───────────────

describe("computeAutoTags — designHelp string 'true' excludes missing-artwork", () => {
  it("does NOT add missing-artwork when designHelp is string 'true'", () => {
    const tags = computeAutoTags({
      totalAmount: 5000,
      customerEmail: "test@example.com",
      items: [
        { productName: "Banner", quantity: 1, meta: { designHelp: "true" } },
      ],
    });
    expect(tags).not.toContain("missing-artwork");
  });

  it("adds design-help tag for designHelp string 'true'", () => {
    const tags = computeAutoTags({
      totalAmount: 5000,
      customerEmail: "test@example.com",
      items: [
        { productName: "Banner", quantity: 1, meta: { designHelp: "true" } },
      ],
    });
    expect(tags).toContain("design-help");
  });
});

// ── R9: preflight — provided intent and service-fee handling ─────────────────

describe("preflight — provided and service-fee handling", () => {
  // Import preflight dynamically since it's a JS module
  let preflightItem: (item: Record<string, unknown>) => Array<{ level: string; code: string; message: string }>;

  beforeAll(async () => {
    const mod = await import("@/lib/preflight");
    preflightItem = mod.preflightItem;
  });

  it("does NOT generate no_artwork for artworkIntent 'provided'", () => {
    const issues = preflightItem({
      productName: "Die Cut Sticker",
      meta: { artworkIntent: "provided" },
    });
    const codes = issues.map((i: { code: string }) => i.code);
    expect(codes).not.toContain("no_artwork");
    expect(codes).toContain("artwork_provided");
  });

  it("generates artwork_provided info for provided intent", () => {
    const issues = preflightItem({
      productName: "Die Cut Sticker",
      meta: { artworkIntent: "provided" },
    });
    const provided = issues.find((i: { code: string }) => i.code === "artwork_provided");
    expect(provided).toBeDefined();
    expect(provided!.level).toBe("info");
  });

  it("returns empty issues for service-fee rows", () => {
    const issues = preflightItem({
      productName: "Design Help Service",
      meta: { isServiceFee: "true", feeType: "design-help" },
    });
    expect(issues).toHaveLength(0);
  });

  it("still generates no_artwork for regular missing-art items", () => {
    const issues = preflightItem({
      productName: "Die Cut Sticker",
      meta: {},
    });
    const codes = issues.map((i: { code: string }) => i.code);
    expect(codes).toContain("no_artwork");
  });

  it("does NOT generate no_artwork for design-help items", () => {
    const issues = preflightItem({
      productName: "Die Cut Sticker",
      meta: { designHelp: true },
    });
    const codes = issues.map((i: { code: string }) => i.code);
    expect(codes).not.toContain("no_artwork");
    expect(codes).toContain("design_help");
  });
});
