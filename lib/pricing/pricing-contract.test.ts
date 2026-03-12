// lib/pricing/pricing-contract.test.ts
// Tests for canonical pricing contract — pure functions + mocked engine calls.

import {
  detectSourceKind,
  extractCostBuckets,
  computeProfit,
  computeCompleteness,
  sumCostBuckets,
  emptyCost,
  getDefaultInput,
  buildExplanation,
  buildPricingContract,
} from "./pricing-contract";

// Mock pricing engine + DB dependencies
jest.mock("./template-resolver", () => ({
  calculatePrice: jest.fn(),
}));
jest.mock("./quote-server", () => ({
  quoteProduct: jest.fn(),
}));
jest.mock("./floor-price", () => ({
  resolveFloorPrice: jest.fn().mockResolvedValue({
    priceCents: 1500,
    policySource: "global",
    policyDetail: "Default: min profit $5.00, min margin 15%",
  }),
  loadFloorSettings: jest.fn().mockResolvedValue({}),
}));
jest.mock("./vendor-cost", () => ({
  lookupVendorCost: jest.fn().mockResolvedValue(null),
}));
jest.mock("@/lib/prisma", () => ({
  prisma: {},
}));

import { calculatePrice } from "./template-resolver";
import { quoteProduct } from "./quote-server";

const mockCalcPrice = calculatePrice as jest.MockedFunction<typeof calculatePrice>;
const mockQuoteProduct = quoteProduct as jest.MockedFunction<typeof quoteProduct>;

// ── detectSourceKind ─────────────────────────────────────────────

describe("detectSourceKind", () => {
  it("detects quote_only", () => {
    expect(detectSourceKind({ template: "quote_only" }, {})).toBe("quote_only");
  });

  it("detects outsourced as fixed_prices", () => {
    expect(detectSourceKind({ template: "outsourced" }, {})).toBe("fixed_prices");
  });

  it("detects poster_fixed as fixed_prices", () => {
    expect(detectSourceKind({ template: "poster_fixed" }, {})).toBe("fixed_prices");
  });

  it("detects sticker_ref", () => {
    expect(detectSourceKind({ template: "sticker_ref" }, {})).toBe("sticker_ref");
  });

  it.each(["vinyl_print", "board_sign", "banner", "paper_print", "canvas", "vinyl_cut"])(
    "detects template: %s",
    (template) => {
      expect(detectSourceKind({ template }, {})).toBe("template");
    }
  );

  it("detects COST_PLUS preset", () => {
    const product = { pricingPreset: { model: "COST_PLUS", key: "cp_1" } };
    expect(detectSourceKind({ template: "preset" }, product)).toBe("cost_plus");
  });

  it("detects QTY_TIERED preset", () => {
    const product = { pricingPreset: { model: "QTY_TIERED", key: "qt_1" } };
    expect(detectSourceKind({ template: "preset" }, product)).toBe("qty_tiered");
  });

  it("detects AREA_TIERED preset", () => {
    const product = { pricingPreset: { model: "AREA_TIERED", key: "at_1" } };
    expect(detectSourceKind({ template: "preset" }, product)).toBe("area_tiered");
  });

  it("detects QTY_OPTIONS preset", () => {
    const product = { pricingPreset: { model: "QTY_OPTIONS", key: "qo_1" } };
    expect(detectSourceKind({ template: "preset" }, product)).toBe("qty_options");
  });

  it("returns legacy for unknown results", () => {
    expect(detectSourceKind({}, {})).toBe("legacy");
    expect(detectSourceKind(null, {})).toBe("legacy");
  });
});

// ── extractCostBuckets ───────────────────────────────────────────

describe("extractCostBuckets", () => {
  it("extracts vinyl_print costs", () => {
    const result = {
      template: "vinyl_print",
      breakdown: { material: 500, ink: 200, cutting: 100, waste: 50, lamination: 80, subtotalCost: 930 },
    };
    const cost = extractCostBuckets("template", result, null);
    expect(cost.material).toBe(500);
    expect(cost.print).toBe(200);
    expect(cost.labor).toBe(100);
    expect(cost.waste).toBe(50);
    expect(cost.finishing).toBe(80);
    expect(sumCostBuckets(cost)).toBe(930);
  });

  it("extracts board_sign costs", () => {
    const result = {
      template: "board_sign",
      breakdown: { board: 400, vinyl: 150, ink: 100, labor: 200, subtotalCost: 850 },
    };
    const cost = extractCostBuckets("template", result, null);
    expect(cost.material).toBe(550); // board + vinyl
    expect(cost.print).toBe(100);
    expect(cost.labor).toBe(200);
    expect(sumCostBuckets(cost)).toBe(850);
  });

  it("extracts banner costs including accessories and setup", () => {
    const result = {
      template: "banner",
      breakdown: {
        material: 800, ink: 300, finishing: 100,
        setupFee: 2800, accessoryCost: 500, accessoryPrice: 1250,
        subtotalCost: 1200,
      },
    };
    const cost = extractCostBuckets("template", result, null);
    expect(cost.material).toBe(800);
    expect(cost.print).toBe(300);
    expect(cost.finishing).toBe(100);
    expect(cost.setup).toBe(2800);
    expect(cost.outsourcing).toBe(500);
    // total = 800 + 300 + 100 + 2800 + 500 = 4500
    expect(sumCostBuckets(cost)).toBe(4500);
  });

  it("extracts paper_print costs", () => {
    const result = {
      template: "paper_print",
      breakdown: { paper: 300, ink: 150, lamination: 80, finishing: 40, subtotalCost: 570 },
    };
    const cost = extractCostBuckets("template", result, null);
    expect(cost.material).toBe(300);
    expect(cost.print).toBe(150);
    expect(cost.finishing).toBe(120); // lamination + finishing
    expect(sumCostBuckets(cost)).toBe(570);
  });

  it("extracts canvas costs", () => {
    const result = {
      template: "canvas",
      breakdown: { canvas: 600, ink: 200, frame: 1500, lamination: 100, subtotalCost: 2400 },
    };
    const cost = extractCostBuckets("template", result, null);
    expect(cost.material).toBe(600);
    expect(cost.print).toBe(200);
    expect(cost.finishing).toBe(1600); // frame + lamination
    expect(sumCostBuckets(cost)).toBe(2400);
  });

  it("extracts vinyl_cut costs", () => {
    const result = {
      template: "vinyl_cut",
      breakdown: { material: 300, cutting: 50, weeding: 80, transfer: 20, subtotalCost: 450 },
    };
    const cost = extractCostBuckets("template", result, null);
    expect(cost.material).toBe(300);
    expect(cost.labor).toBe(130); // cutting + weeding
    expect(cost.transfer).toBe(20);
    expect(cost.print).toBe(0);
    expect(sumCostBuckets(cost)).toBe(450);
  });

  it("extracts COST_PLUS from quoteResult meta", () => {
    const quoteResult = {
      meta: {
        model: "COST_PLUS",
        rawCostCents: 5000,
        materialCostCents: 2000,
        inkCostCents: 1000,
        laborCostCents: 800,
        cuttingCostCents: 400,
        wasteCostCents: 600,
        fileFee: 200,
      },
    };
    const cost = extractCostBuckets("cost_plus", null, quoteResult);
    expect(cost.material).toBe(2000);
    expect(cost.print).toBe(1000);
    expect(cost.labor).toBe(1200); // labor + cutting
    expect(cost.waste).toBe(600);
    expect(cost.setup).toBe(200);
    expect(sumCostBuckets(cost)).toBe(5000);
  });

  it("returns empty cost for unknown source kinds", () => {
    const cost = extractCostBuckets("fixed_prices", null, null);
    expect(sumCostBuckets(cost)).toBe(0);
  });

  it("returns empty cost for sticker_ref", () => {
    const cost = extractCostBuckets("sticker_ref", { template: "sticker_ref" }, null);
    expect(sumCostBuckets(cost)).toBe(0);
  });
});

// ── computeProfit ────────────────────────────────────────────────

describe("computeProfit", () => {
  it("computes correct profit amount and rate", () => {
    // sell=2000, cost=1000 → profit=1000, rate=0.50
    const p = computeProfit(2000, 1000);
    expect(p.amountCents).toBe(1000);
    expect(p.rate).toBe(0.5);
  });

  it("returns zero when cost is 0", () => {
    const p = computeProfit(1000, 0);
    expect(p.amountCents).toBe(0);
    expect(p.rate).toBe(0);
  });

  it("returns zero when sell is 0", () => {
    const p = computeProfit(0, 500);
    expect(p.amountCents).toBe(0);
    expect(p.rate).toBe(0);
  });

  it("handles negative profit (selling below cost)", () => {
    const p = computeProfit(800, 1000);
    expect(p.amountCents).toBe(-200);
    expect(p.rate).toBe(-0.25);
  });

  it("computes correct rate for small margins", () => {
    // sell=10500, cost=10000 → rate=0.0476
    const p = computeProfit(10500, 10000);
    expect(p.amountCents).toBe(500);
    expect(p.rate).toBeCloseTo(0.0476, 3);
  });
});

// ── computeCompleteness ──────────────────────────────────────────

describe("computeCompleteness", () => {
  it("gives 100 for template with full cost data", () => {
    const cost = { material: 500, print: 200, finishing: 80, labor: 100, packaging: 50, outsourcing: 0, setup: 0, waste: 50, transfer: 0 };
    const product = { minPrice: 1000 };
    const c = computeCompleteness("template", cost, product);
    expect(c.score).toBe(100);
    expect(c.missing).toEqual([]);
  });

  it("penalizes missing cost_data", () => {
    const c = computeCompleteness("fixed_prices", emptyCost(), { minPrice: 100 });
    expect(c.missing).toContain("cost_data");
    expect(c.missing).toContain("outsourcing_cost");
    expect(c.score).toBeLessThan(80);
  });

  it("flags cost_model missing for tier presets", () => {
    const c = computeCompleteness("qty_tiered", emptyCost(), {});
    expect(c.missing).toContain("cost_model");
    expect(c.missing).toContain("cost_data");
  });

  it("flags sticker_ref as missing detailed breakdown", () => {
    const c = computeCompleteness("sticker_ref", emptyCost(), {});
    expect(c.missing).toContain("detailed_cost_breakdown");
  });

  it("flags legacy as missing cost model", () => {
    const c = computeCompleteness("legacy", emptyCost(), {});
    expect(c.missing).toContain("cost_model");
  });

  it("warns when no display from price", () => {
    const cost = { material: 100, print: 50, finishing: 0, labor: 0, packaging: 0, outsourcing: 0, setup: 0, waste: 0, transfer: 0 };
    const c = computeCompleteness("template", cost, { minPrice: null });
    expect(c.warnings).toContain("no_display_from_price");
  });

  it("warns when no packaging cost", () => {
    const cost = { material: 100, print: 50, finishing: 0, labor: 0, packaging: 0, outsourcing: 0, setup: 0, waste: 0, transfer: 0 };
    const c = computeCompleteness("template", cost, { minPrice: 100 });
    expect(c.warnings).toContain("no_packaging_cost");
  });

  it("does not penalize quote_only for cost_data", () => {
    const c = computeCompleteness("quote_only", emptyCost(), { minPrice: 100 });
    expect(c.missing).not.toContain("cost_data");
    expect(c.score).toBe(100);
  });
});

// ── getDefaultInput ──────────────────────────────────────────────

describe("getDefaultInput", () => {
  it("returns sticker defaults for stickers-labels-decals", () => {
    const input = getDefaultInput({ category: "stickers-labels-decals" });
    expect(input.quantity).toBe(100);
    expect(input.widthIn).toBe(3);
    expect(input.heightIn).toBe(3);
  });

  it("returns banner defaults for banners-displays", () => {
    const input = getDefaultInput({ category: "banners-displays" });
    expect(input.quantity).toBe(1);
    expect(input.widthIn).toBe(24);
    expect(input.heightIn).toBe(36);
  });

  it("returns sign defaults for signs-rigid-boards", () => {
    const input = getDefaultInput({ category: "signs-rigid-boards" });
    expect(input.widthIn).toBe(18);
    expect(input.heightIn).toBe(24);
  });

  it("returns vehicle defaults", () => {
    const input = getDefaultInput({ category: "vehicle-graphics-fleet" });
    expect(input.widthIn).toBe(48);
  });

  it("returns per_sqft defaults for per_sqft unit", () => {
    const input = getDefaultInput({ pricingUnit: "per_sqft" });
    expect(input.widthIn).toBe(24);
  });

  it("returns generic defaults for unknown categories", () => {
    const input = getDefaultInput({ category: "unknown" });
    expect(input.quantity).toBe(100);
  });
});

// ── buildExplanation ─────────────────────────────────────────────

describe("buildExplanation", () => {
  it("explains template source", () => {
    const exp = buildExplanation("template", { template: "vinyl_print", meta: { marginCategory: "stickers" } }, {});
    expect(exp).toContain("vinyl_print");
    expect(exp).toContain("MARGIN_TIERS");
  });

  it("explains cost_plus source", () => {
    const exp = buildExplanation("cost_plus", {}, { pricingPreset: { key: "cp_banner" } });
    expect(exp).toContain("COST_PLUS");
    expect(exp).toContain("cp_banner");
  });

  it("explains sticker_ref as limited", () => {
    const exp = buildExplanation("sticker_ref", {}, {});
    expect(exp).toContain("sticker_ref");
    expect(exp).toContain("Vendor reference table");
  });

  it("explains fixed_prices", () => {
    const exp = buildExplanation("fixed_prices", {}, {});
    expect(exp).toContain("fixed prices");
    expect(exp).toContain("Hardcoded sell prices");
  });
});

// ── buildPricingContract (integration with mocks) ────────────────

describe("buildPricingContract", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns error contract when product is null", async () => {
    const c = await buildPricingContract(null, { quantity: 100 });
    expect(c.error).toBe("Product not provided");
    expect(c.sellPrice.totalCents).toBe(0);
  });

  it("builds contract for template-based product", async () => {
    mockCalcPrice.mockResolvedValue({
      totalCents: 5000,
      unitCents: 50,
      currency: "CAD",
      template: "vinyl_print",
      breakdown: { material: 1200, ink: 400, cutting: 200, waste: 100, lamination: 0, subtotalCost: 1900, profitMargin: 0.62, finalPrice: 5000 },
      meta: { marginCategory: "stickers" },
      quoteLedger: { engineVersion: "2026-03-05", lines: [] },
    } as any);

    const product = {
      id: "p1", slug: "white-vinyl-sticker", name: "White Vinyl Sticker",
      category: "stickers-labels-decals", pricingUnit: "per_piece", isActive: true,
      minPrice: 2500,
    };

    const c = await buildPricingContract(product, { quantity: 100, widthIn: 3, heightIn: 3 });

    expect(c.error).toBeNull();
    expect(c.source.kind).toBe("template");
    expect(c.source.template).toBe("vinyl_print");
    expect(c.sellPrice.totalCents).toBe(5000);
    expect(c.totalCost).toBe(1900);
    expect(c.profit.amountCents).toBe(3100);
    expect(c.profit.rate).toBeCloseTo(0.62, 1);
    expect(c.completeness.score).toBeGreaterThanOrEqual(90);
    expect(c.quoteLedger).toBeTruthy();
  });

  it("builds contract for COST_PLUS product", async () => {
    mockCalcPrice.mockResolvedValue({
      totalCents: 8000,
      unitCents: 8000,
      currency: "CAD",
      template: "preset",
      breakdown: { presetKey: "cp_1" },
      meta: {},
    } as any);

    mockQuoteProduct.mockReturnValue({
      totalCents: 8000,
      unitCents: 8000,
      currency: "CAD",
      breakdown: [],
      meta: {
        model: "COST_PLUS",
        rawCostCents: 3200,
        materialCostCents: 1500,
        inkCostCents: 800,
        laborCostCents: 400,
        cuttingCostCents: 200,
        wasteCostCents: 300,
        fileFee: 0,
      },
    } as any);

    const product = {
      id: "p2", slug: "custom-banner", name: "Custom Banner",
      category: "banners-displays", pricingUnit: "per_sqft", isActive: true,
      pricingPreset: { model: "COST_PLUS", key: "cp_banner", config: {} },
      pricingPresetId: "preset_1",
    };

    const c = await buildPricingContract(product, { quantity: 1, widthIn: 24, heightIn: 36 });

    expect(c.source.kind).toBe("cost_plus");
    expect(c.cost.material).toBe(1500);
    expect(c.cost.print).toBe(800);
    expect(c.cost.labor).toBe(600); // 400 + 200
    expect(c.cost.waste).toBe(300);
    expect(c.totalCost).toBe(3200);
    expect(c.profit.amountCents).toBe(4800);
  });

  it("builds contract for fixed-price product with no cost", async () => {
    mockCalcPrice.mockResolvedValue({
      totalCents: 3500,
      unitCents: 3500,
      currency: "CAD",
      template: "outsourced",
      breakdown: { fixedPrice: 3500, profitMargin: 0, finalPrice: 3500 },
      meta: { source: "fixedPrices" },
    } as any);

    const product = {
      id: "p3", slug: "outsourced-item", name: "Outsourced Item",
      category: "marketing-business-print", pricingUnit: "per_piece", isActive: true,
      pricingConfig: { fixedPrices: { "100": 3500 } },
    };

    const c = await buildPricingContract(product, { quantity: 100, widthIn: 3.5, heightIn: 2 });

    expect(c.source.kind).toBe("fixed_prices");
    expect(c.totalCost).toBe(0);
    expect(c.profit.amountCents).toBe(0); // can't compute — no cost
    expect(c.completeness.missing).toContain("cost_data");
    expect(c.completeness.missing).toContain("outsourcing_cost");
  });

  it("captures template-resolver error gracefully", async () => {
    mockCalcPrice.mockRejectedValue(new Error("Material not found: xyz"));

    const product = {
      id: "p4", slug: "bad-product", name: "Bad Product",
      category: "stickers-labels-decals", pricingUnit: "per_piece", isActive: true,
    };

    const c = await buildPricingContract(product, { quantity: 100, widthIn: 3, heightIn: 3 });

    expect(c.error).toContain("Material not found");
    expect(c.sellPrice.totalCents).toBe(0);
  });
});
