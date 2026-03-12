/**
 * Regression tests for production manifest builder.
 *
 * Validates:
 *   R1: Manifest includes artwork intake state per item
 *   R2: Manifest includes pricing provenance where present
 *   R3: Manual order flag propagates from order tags
 *   R4: Service-fee items are excluded from manifest
 *   R5: Text manifest includes artwork and pricing annotations
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const { buildProductionManifest, manifestToText } = require("@/lib/production-manifest") as {
  buildProductionManifest: (order: any) => any;
  manifestToText: (manifest: any) => string;
};

// Minimal mock order structure matching what buildProductionManifest expects
function mockOrder(overrides: Record<string, unknown> = {}) {
  return {
    id: "test-order-001",
    createdAt: new Date("2026-03-10"),
    customerName: "Test Customer",
    customerEmail: "test@example.com",
    priority: 2,
    tags: ["admin_manual"],
    items: [
      {
        id: "item-1",
        productName: "Die Cut Stickers",
        productType: "sticker",
        quantity: 100,
        unitPrice: 500,
        totalPrice: 50000,
        widthIn: 3,
        heightIn: 3,
        material: "white-vinyl",
        finishing: null,
        fileUrl: "https://cdn.example.com/art.png",
        meta: {
          artworkIntent: "provided",
          pricingSource: "calculated",
          pricingQuoteSlug: "custom-stickers",
        },
        specsJson: null,
        productionJob: { id: "job-1", status: "queued" },
      },
    ],
    files: [],
    proofData: [],
    ...overrides,
  };
}

// ── R1: Artwork intake state ─────────────────────────────────────────────────

describe("manifest — artwork intake state", () => {
  it("includes artworkStatus for uploaded item", () => {
    const manifest = buildProductionManifest(mockOrder());
    expect(manifest.items[0].artworkStatus).toBe("uploaded");
  });

  it("includes artworkStatus 'provided' for off-platform artwork", () => {
    const order = mockOrder({
      items: [{
        id: "item-2",
        productName: "Business Cards",
        quantity: 250,
        meta: { artworkIntent: "provided" },
        specsJson: null,
        productionJob: null,
      }],
    });
    const manifest = buildProductionManifest(order);
    expect(manifest.items[0].artworkStatus).toBe("provided");
    expect(manifest.items[0].artworkIntent).toBe("provided");
  });

  it("includes artworkStatus 'design-help' for design-help items", () => {
    const order = mockOrder({
      items: [{
        id: "item-3",
        productName: "Flyers",
        quantity: 500,
        meta: { designHelp: "true", artworkIntent: "design-help" },
        specsJson: null,
        productionJob: null,
      }],
    });
    const manifest = buildProductionManifest(order);
    expect(manifest.items[0].artworkStatus).toBe("design-help");
    expect(manifest.items[0].isDesignHelp).toBe(true);
  });
});

// ── R2: Pricing provenance ───────────────────────────────────────────────────

describe("manifest — pricing provenance", () => {
  it("includes pricingSource and pricingQuoteSlug from item meta", () => {
    const manifest = buildProductionManifest(mockOrder());
    expect(manifest.items[0].pricingSource).toBe("calculated");
    expect(manifest.items[0].pricingQuoteSlug).toBe("custom-stickers");
  });

  it("pricingSource is null when not set in meta", () => {
    const order = mockOrder({
      items: [{
        id: "item-4",
        productName: "Custom Item",
        quantity: 1,
        meta: {},
        specsJson: null,
        productionJob: null,
      }],
    });
    const manifest = buildProductionManifest(order);
    expect(manifest.items[0].pricingSource).toBeNull();
  });
});

// ── R3: Manual order flag ────────────────────────────────────────────────────

describe("manifest — manual order flag", () => {
  it("isManualOrder is true when tags include admin_manual", () => {
    const manifest = buildProductionManifest(mockOrder());
    expect(manifest.isManualOrder).toBe(true);
  });

  it("isManualOrder is false for storefront orders", () => {
    const manifest = buildProductionManifest(mockOrder({ tags: [] }));
    expect(manifest.isManualOrder).toBe(false);
  });
});

// ── R4: Service-fee exclusion ────────────────────────────────────────────────

describe("manifest — service-fee exclusion", () => {
  it("excludes service-fee items from manifest", () => {
    const order = mockOrder({
      items: [
        {
          id: "item-1",
          productName: "Die Cut Stickers",
          quantity: 100,
          fileUrl: "https://cdn.example.com/art.png",
          meta: { pricingSource: "calculated" },
          specsJson: null,
          productionJob: null,
        },
        {
          id: "item-sf",
          productName: "Design Help Service",
          quantity: 1,
          meta: { isServiceFee: "true", feeType: "design-help" },
          specsJson: null,
          productionJob: null,
        },
      ],
    });
    const manifest = buildProductionManifest(order);
    expect(manifest.totalItemCount).toBe(1);
    expect(manifest.items[0].productName).toBe("Die Cut Stickers");
  });
});

// ── R5: Text manifest annotations ────────────────────────────────────────────

describe("manifest text — annotations", () => {
  it("includes Source line for manual orders", () => {
    const manifest = buildProductionManifest(mockOrder());
    const text = manifestToText(manifest);
    expect(text).toContain("Source: Manual (admin)");
  });

  it("shows artwork status for non-uploaded items", () => {
    const order = mockOrder({
      items: [{
        id: "item-5",
        productName: "Posters",
        quantity: 10,
        meta: { artworkIntent: "upload-later" },
        specsJson: null,
        productionJob: null,
      }],
    });
    const manifest = buildProductionManifest(order);
    const text = manifestToText(manifest);
    expect(text).toContain("Artwork: UPLOAD-LATER");
  });

  it("does not show artwork line for uploaded items", () => {
    const manifest = buildProductionManifest(mockOrder());
    const text = manifestToText(manifest);
    // "uploaded" items should not have an Artwork annotation line
    expect(text).not.toContain("Artwork: UPLOADED");
  });
});
