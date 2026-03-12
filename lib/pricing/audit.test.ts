// lib/pricing/audit.test.ts
// Tests for the pricing audit engine — pure functions, no DB needed.

import {
  classifyPricingSource,
  inferCandidateTemplate,
  deriveCompleteness,
  assessOptionCoverage,
  auditProduct,
  detectMaterialGaps,
  detectHardwareGaps,
  buildTemplateGroups,
  buildAuditReport,
  type ProductInput,
  type MaterialInput,
  type HardwareInput,
} from "./audit";
import {
  PricingSourceKind,
  CandidateCostTemplate,
  CompletenessStatus,
  MissingFieldCode,
} from "./audit-types";

// ── Test fixtures ────────────────────────────────────────────────

function makeProduct(overrides: Partial<ProductInput> = {}): ProductInput {
  return {
    id: "prod_1",
    slug: "test-sticker",
    name: "Test Sticker",
    category: "stickers-labels-decals",
    isActive: true,
    basePrice: 0,
    pricingUnit: "sqin",
    pricingPresetId: null,
    pricingConfig: null,
    optionsConfig: null,
    displayFromPrice: null,
    minPrice: null,
    ...overrides,
  };
}

function makeMaterial(overrides: Partial<MaterialInput> = {}): MaterialInput {
  return {
    id: "mat_1",
    name: "White Vinyl",
    type: "Adhesive Vinyl",
    costPerSqft: 0.32,
    rollCost: 213,
    isActive: true,
    ...overrides,
  };
}

function makeHardware(overrides: Partial<HardwareInput> = {}): HardwareInput {
  return {
    id: "hw_1",
    slug: "h-stakes",
    name: "H-Stakes",
    category: "Sign Accessory",
    priceCents: 150,
    unit: "per_unit",
    isActive: true,
    ...overrides,
  };
}

// ═══════════════════════════════════════════════════════════════════
// 1. Pricing source classification
// ═══════════════════════════════════════════════════════════════════

describe("classifyPricingSource", () => {
  it("returns QUOTE_ONLY for pricingUnit=quote", () => {
    const p = makeProduct({ pricingUnit: "quote" });
    expect(classifyPricingSource(p)).toBe(PricingSourceKind.QUOTE_ONLY);
  });

  it("returns PRESET when pricingPresetId is set", () => {
    const p = makeProduct({ pricingPresetId: "preset_abc" });
    expect(classifyPricingSource(p)).toBe(PricingSourceKind.PRESET);
  });

  it("returns FIXED when pricingConfig has fixedPrices", () => {
    const p = makeProduct({
      pricingConfig: {
        fixedPrices: { "11x17": { 1: 899, 5: 649 } },
      },
    });
    expect(classifyPricingSource(p)).toBe(PricingSourceKind.FIXED);
  });

  it("returns FIXED when pricingConfig is a JSON string with fixedPrices", () => {
    const p = makeProduct({
      pricingConfig: JSON.stringify({
        fixedPrices: { "11x17": { 1: 899 } },
      }),
    });
    expect(classifyPricingSource(p)).toBe(PricingSourceKind.FIXED);
  });

  it("returns TEMPLATE for known category", () => {
    const p = makeProduct({ category: "stickers-labels-decals" });
    expect(classifyPricingSource(p)).toBe(PricingSourceKind.TEMPLATE);
  });

  it("returns LEGACY for positive basePrice with unknown category", () => {
    const p = makeProduct({ category: "some-unknown-cat", basePrice: 1500 });
    expect(classifyPricingSource(p)).toBe(PricingSourceKind.LEGACY);
  });

  it("returns MISSING for zero basePrice with unknown category", () => {
    const p = makeProduct({ category: "some-unknown-cat", basePrice: 0 });
    expect(classifyPricingSource(p)).toBe(PricingSourceKind.MISSING);
  });

  it("PRESET takes precedence over TEMPLATE category", () => {
    const p = makeProduct({
      category: "stickers-labels-decals",
      pricingPresetId: "preset_x",
    });
    expect(classifyPricingSource(p)).toBe(PricingSourceKind.PRESET);
  });

  it("QUOTE_ONLY takes precedence over PRESET", () => {
    const p = makeProduct({
      pricingUnit: "quote",
      pricingPresetId: "preset_x",
    });
    expect(classifyPricingSource(p)).toBe(PricingSourceKind.QUOTE_ONLY);
  });
});

// ═══════════════════════════════════════════════════════════════════
// 2. Candidate template inference
// ═══════════════════════════════════════════════════════════════════

describe("inferCandidateTemplate", () => {
  it("maps stickers to EPSON_WIDE_FORMAT", () => {
    const p = makeProduct({ category: "stickers-labels-decals" });
    expect(inferCandidateTemplate(p)).toBe(CandidateCostTemplate.EPSON_WIDE_FORMAT);
  });

  it("maps signs to BOARD_SIGN", () => {
    const p = makeProduct({ category: "signs-rigid-boards" });
    expect(inferCandidateTemplate(p)).toBe(CandidateCostTemplate.BOARD_SIGN);
  });

  it("maps marketing print to KONICA_C6085_PAPER", () => {
    const p = makeProduct({ category: "marketing-business-print" });
    expect(inferCandidateTemplate(p)).toBe(CandidateCostTemplate.KONICA_C6085_PAPER);
  });

  it("maps vehicle graphics to VEHICLE_VINYL", () => {
    const p = makeProduct({ category: "vehicle-graphics-fleet" });
    expect(inferCandidateTemplate(p)).toBe(CandidateCostTemplate.VEHICLE_VINYL);
  });

  it("maps canvas to CANVAS_STRETCH", () => {
    const p = makeProduct({ category: "canvas-prints" });
    expect(inferCandidateTemplate(p)).toBe(CandidateCostTemplate.CANVAS_STRETCH);
  });

  it("maps banners to BANNER_DISPLAY", () => {
    const p = makeProduct({ category: "banners-displays" });
    expect(inferCandidateTemplate(p)).toBe(CandidateCostTemplate.BANNER_DISPLAY);
  });

  it("overrides slug roll-labels to ROLL_LABEL", () => {
    const p = makeProduct({ slug: "roll-labels", category: "stickers-labels-decals" });
    expect(inferCandidateTemplate(p)).toBe(CandidateCostTemplate.ROLL_LABEL);
  });

  it("overrides slug posters to POSTER", () => {
    const p = makeProduct({ slug: "posters", category: "marketing-business-print" });
    expect(inferCandidateTemplate(p)).toBe(CandidateCostTemplate.POSTER);
  });

  it("returns UNKNOWN for unmapped category", () => {
    const p = makeProduct({ category: "custom-wacky-stuff" });
    expect(inferCandidateTemplate(p)).toBe(CandidateCostTemplate.UNKNOWN);
  });
});

// ═══════════════════════════════════════════════════════════════════
// 3. Completeness status / missing field derivation
// ═══════════════════════════════════════════════════════════════════

describe("deriveCompleteness", () => {
  it("returns COMPLETE when all fields present", () => {
    const p = makeProduct({
      pricingPresetId: "preset_1",
      displayFromPrice: 999,
      minPrice: 500,
    });
    const { status, missingFields } = deriveCompleteness(p, PricingSourceKind.PRESET);
    expect(status).toBe(CompletenessStatus.COMPLETE);
    expect(missingFields).toEqual([]);
  });

  it("returns MISSING when source is MISSING", () => {
    const p = makeProduct({ category: "unknown-cat" });
    const { status, missingFields } = deriveCompleteness(p, PricingSourceKind.MISSING);
    expect(status).toBe(CompletenessStatus.MISSING);
    expect(missingFields).toContain(MissingFieldCode.MISSING_PRICE_SOURCE);
  });

  it("flags missing displayFromPrice", () => {
    const p = makeProduct({ pricingPresetId: "x", minPrice: 100 });
    const { missingFields } = deriveCompleteness(p, PricingSourceKind.PRESET);
    expect(missingFields).toContain(MissingFieldCode.MISSING_DISPLAY_FROM_PRICE);
  });

  it("flags missing floor price policy", () => {
    const p = makeProduct({ pricingPresetId: "x", displayFromPrice: 999 });
    const { missingFields } = deriveCompleteness(p, PricingSourceKind.PRESET);
    expect(missingFields).toContain(MissingFieldCode.MISSING_FLOOR_PRICE_POLICY);
  });

  it("flags LEGACY products as missing readable ledger", () => {
    const p = makeProduct({
      category: "unknown-cat",
      basePrice: 1000,
      displayFromPrice: 999,
      minPrice: 500,
    });
    const { missingFields } = deriveCompleteness(p, PricingSourceKind.LEGACY);
    expect(missingFields).toContain(MissingFieldCode.MISSING_READABLE_LEDGER);
  });

  it("does NOT flag missing ledger for TEMPLATE products", () => {
    const p = makeProduct({
      category: "stickers-labels-decals",
      displayFromPrice: 999,
      minPrice: 500,
    });
    const { missingFields } = deriveCompleteness(p, PricingSourceKind.TEMPLATE);
    expect(missingFields).not.toContain(MissingFieldCode.MISSING_READABLE_LEDGER);
  });

  it("PARTIAL when some fields missing but has price source", () => {
    const p = makeProduct({
      pricingPresetId: "preset_1",
      // missing displayFromPrice and minPrice
    });
    const { status } = deriveCompleteness(p, PricingSourceKind.PRESET);
    expect(status).toBe(CompletenessStatus.PARTIAL);
  });
});

// ═══════════════════════════════════════════════════════════════════
// 4. Suspicious material / hardware detection
// ═══════════════════════════════════════════════════════════════════

describe("detectMaterialGaps", () => {
  it("flags zero-cost materials", () => {
    const materials = [
      makeMaterial({ id: "m1", name: "3M Floor Graphics", costPerSqft: 0, rollCost: 0 }),
      makeMaterial({ id: "m2", name: "White Vinyl", costPerSqft: 0.32, rollCost: 213 }),
    ];
    const gaps = detectMaterialGaps(materials);
    expect(gaps).toHaveLength(1);
    expect(gaps[0].issue).toBe("zero_cost");
    expect(gaps[0].name).toBe("3M Floor Graphics");
  });

  it("flags placeholder materials", () => {
    const materials = [makeMaterial({ name: "New Material", costPerSqft: 0, rollCost: 0 })];
    const gaps = detectMaterialGaps(materials);
    expect(gaps).toHaveLength(1);
    expect(gaps[0].issue).toBe("placeholder");
  });

  it("flags suspiciously low cost", () => {
    const materials = [makeMaterial({ costPerSqft: 0.02, rollCost: 10 })];
    const gaps = detectMaterialGaps(materials);
    expect(gaps).toHaveLength(1);
    expect(gaps[0].issue).toBe("suspiciously_low");
  });

  it("skips inactive materials", () => {
    const materials = [makeMaterial({ isActive: false, costPerSqft: 0, rollCost: 0 })];
    expect(detectMaterialGaps(materials)).toHaveLength(0);
  });

  it("returns empty for healthy materials", () => {
    const materials = [makeMaterial({ costPerSqft: 0.32, rollCost: 213 })];
    expect(detectMaterialGaps(materials)).toHaveLength(0);
  });
});

describe("detectHardwareGaps", () => {
  it("flags zero-price non-included items", () => {
    const hw = [makeHardware({ priceCents: 0, unit: "per_unit" })];
    const gaps = detectHardwareGaps(hw);
    expect(gaps).toHaveLength(1);
    expect(gaps[0].issue).toBe("zero_price");
  });

  it("skips included-unit items at $0", () => {
    const hw = [makeHardware({ priceCents: 0, unit: "included" })];
    expect(detectHardwareGaps(hw)).toHaveLength(0);
  });

  it("flags suspiciously low per_unit prices (< $0.50)", () => {
    const hw = [makeHardware({ priceCents: 35 })];
    const gaps = detectHardwareGaps(hw);
    expect(gaps).toHaveLength(1);
    expect(gaps[0].issue).toBe("suspiciously_low");
  });

  it("returns empty for normal hardware", () => {
    const hw = [makeHardware({ priceCents: 150 })];
    expect(detectHardwareGaps(hw)).toHaveLength(0);
  });
});

// ═══════════════════════════════════════════════════════════════════
// 5. Template candidate grouping
// ═══════════════════════════════════════════════════════════════════

describe("buildTemplateGroups", () => {
  it("groups products by candidate template", () => {
    const rows = [
      auditProduct(makeProduct({ slug: "die-cut", category: "stickers-labels-decals" })),
      auditProduct(makeProduct({ slug: "kiss-cut", category: "stickers-labels-decals" })),
      auditProduct(makeProduct({ slug: "yard-signs", category: "signs-rigid-boards" })),
    ];
    const groups = buildTemplateGroups(rows);
    const epson = groups.find((g) => g.template === CandidateCostTemplate.EPSON_WIDE_FORMAT);
    const board = groups.find((g) => g.template === CandidateCostTemplate.BOARD_SIGN);
    expect(epson?.productCount).toBe(2);
    expect(board?.productCount).toBe(1);
  });

  it("puts UNKNOWN last", () => {
    const rows = [
      auditProduct(makeProduct({ slug: "unknown-thing", category: "magic" })),
      auditProduct(makeProduct({ slug: "sticker", category: "stickers-labels-decals" })),
    ];
    const groups = buildTemplateGroups(rows);
    expect(groups[groups.length - 1].template).toBe(CandidateCostTemplate.UNKNOWN);
  });

  it("excludes inactive products", () => {
    const rows = [
      auditProduct(makeProduct({ slug: "inactive", category: "stickers-labels-decals", isActive: false })),
    ];
    const groups = buildTemplateGroups(rows);
    expect(groups).toHaveLength(0);
  });
});

// ═══════════════════════════════════════════════════════════════════
// 6. Full audit report integration
// ═══════════════════════════════════════════════════════════════════

describe("buildAuditReport", () => {
  it("produces a complete report with all sections", () => {
    const report = buildAuditReport({
      products: [
        makeProduct({ id: "p1", slug: "die-cut", category: "stickers-labels-decals", isActive: true }),
        makeProduct({ id: "p2", slug: "biz-cards", pricingPresetId: "preset_1", category: "marketing-business-print", isActive: true }),
        makeProduct({ id: "p3", slug: "vehicle-wrap", pricingUnit: "quote", category: "vehicle-graphics-fleet", isActive: true }),
        makeProduct({ id: "p4", slug: "old-product", category: "stickers-labels-decals", isActive: false }),
      ],
      materials: [
        makeMaterial({ id: "m1", name: "White Vinyl", costPerSqft: 0.32, rollCost: 213 }),
        makeMaterial({ id: "m2", name: "New Material", costPerSqft: 0, rollCost: 0 }),
      ],
      hardware: [
        makeHardware({ id: "h1", priceCents: 150 }),
        makeHardware({ id: "h2", slug: "retractable-standard", name: "Retractable Standard", priceCents: 35 }),
      ],
      presets: [{ id: "preset_1", key: "biz_cards", name: "Business Cards", model: "QTY_OPTIONS", isActive: true }],
    });

    // Summary
    expect(report.summary.activeProductCount).toBe(3); // excludes inactive
    expect(report.summary.pricingSourceBreakdown.template).toBe(1);
    expect(report.summary.pricingSourceBreakdown.preset).toBe(1);
    expect(report.summary.pricingSourceBreakdown.quoteOnly).toBe(1);

    // Product rows — only active
    expect(report.productRows).toHaveLength(3);

    // Material gaps
    expect(report.materialGaps).toHaveLength(1);
    expect(report.materialGaps[0].name).toBe("New Material");

    // Hardware gaps
    expect(report.hardwareGaps).toHaveLength(1);
    expect(report.hardwareGaps[0].slug).toBe("retractable-standard");

    // Template groups
    expect(report.templateGroups.length).toBeGreaterThan(0);

    // Timestamp
    expect(report.generatedAt).toBeTruthy();
  });

  it("handles empty input gracefully", () => {
    const report = buildAuditReport({
      products: [],
      materials: [],
      hardware: [],
      presets: [],
    });
    expect(report.summary.activeProductCount).toBe(0);
    expect(report.productRows).toHaveLength(0);
    expect(report.materialGaps).toHaveLength(0);
    expect(report.hardwareGaps).toHaveLength(0);
    expect(report.templateGroups).toHaveLength(0);
  });
});

// ═══════════════════════════════════════════════════════════════════
// 7. Option impact coverage
// ═══════════════════════════════════════════════════════════════════

describe("assessOptionCoverage", () => {
  it("returns n/a when no optionsConfig", () => {
    expect(assessOptionCoverage(makeProduct())).toBe("n/a");
  });

  it("returns full for preset-based product with options", () => {
    const p = makeProduct({
      pricingPresetId: "preset_1",
      optionsConfig: { sizes: [{ id: "2x2" }], quantities: [25, 50] },
    });
    expect(assessOptionCoverage(p)).toBe("full");
  });

  it("returns full for template-based product with options", () => {
    const p = makeProduct({
      category: "stickers-labels-decals",
      optionsConfig: { materials: [{ id: "white-vinyl" }] },
    });
    expect(assessOptionCoverage(p)).toBe("full");
  });

  it("returns partial for fixedPrices with fewer keys than sizes", () => {
    const p = makeProduct({
      category: "some-cat",
      optionsConfig: { sizes: [{ id: "11x17" }, { id: "18x24" }, { id: "24x36" }] },
      pricingConfig: { fixedPrices: { "11x17": { 1: 899 } } },
    });
    expect(assessOptionCoverage(p)).toBe("partial");
  });
});
