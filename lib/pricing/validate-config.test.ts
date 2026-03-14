/**
 * Tests for lib/pricing/validate-config.js — pricing preset schema validation.
 *
 * Covers all 4 pricing models (AREA_TIERED, QTY_TIERED, QTY_OPTIONS, COST_PLUS)
 * plus common field validation and unknown model rejection.
 */

import { validatePresetConfig } from "./validate-config";

// ── Common validation ───────────────────────────────────────────────────────

describe("Common validation", () => {
  test("rejects null config", () => {
    const result = validatePresetConfig("AREA_TIERED", null);
    expect(result.valid).toBe(false);
    expect(result.errors[0].field).toBe("config");
  });

  test("rejects non-object config", () => {
    const result = validatePresetConfig("AREA_TIERED", "string");
    expect(result.valid).toBe(false);
  });

  test("rejects unknown pricing model", () => {
    const result = validatePresetConfig("BOGUS_MODEL", { tiers: [] });
    expect(result.valid).toBe(false);
    expect(result.errors[0].field).toBe("model");
    expect(result.errors[0].message).toContain("BOGUS_MODEL");
  });

  test("rejects negative fileFee", () => {
    const result = validatePresetConfig("AREA_TIERED", {
      tiers: [{ upToSqft: 1, rate: 100 }],
      fileFee: -5,
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e: { field: string }) => e.field === "fileFee")).toBe(true);
  });

  test("rejects negative minimumPrice", () => {
    const result = validatePresetConfig("AREA_TIERED", {
      tiers: [{ upToSqft: 1, rate: 100 }],
      minimumPrice: -1,
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e: { field: string }) => e.field === "minimumPrice")).toBe(true);
  });
});

// ── AREA_TIERED ─────────────────────────────────────────────────────────────

describe("AREA_TIERED", () => {
  test("accepts valid config", () => {
    const result = validatePresetConfig("AREA_TIERED", {
      tiers: [
        { upToSqft: 1, rate: 500 },
        { upToSqft: 4, rate: 400 },
        { upToSqft: 999, rate: 300 },
      ],
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test("rejects empty tiers array", () => {
    const result = validatePresetConfig("AREA_TIERED", { tiers: [] });
    expect(result.valid).toBe(false);
    expect(result.errors[0].field).toBe("tiers");
  });

  test("rejects missing tiers", () => {
    const result = validatePresetConfig("AREA_TIERED", {});
    expect(result.valid).toBe(false);
  });

  test("rejects tier with zero upToSqft", () => {
    const result = validatePresetConfig("AREA_TIERED", {
      tiers: [{ upToSqft: 0, rate: 100 }],
    });
    expect(result.valid).toBe(false);
    expect(result.errors[0].field).toBe("tiers[0].upToSqft");
  });

  test("rejects tier with negative rate", () => {
    const result = validatePresetConfig("AREA_TIERED", {
      tiers: [{ upToSqft: 1, rate: -10 }],
    });
    expect(result.valid).toBe(false);
    expect(result.errors[0].field).toBe("tiers[0].rate");
  });
});

// ── QTY_TIERED ──────────────────────────────────────────────────────────────

describe("QTY_TIERED", () => {
  test("accepts valid config", () => {
    const result = validatePresetConfig("QTY_TIERED", {
      tiers: [
        { minQty: 1, unitPrice: 200 },
        { minQty: 50, unitPrice: 150 },
        { minQty: 100, unitPrice: 100 },
      ],
    });
    expect(result.valid).toBe(true);
  });

  test("rejects empty tiers", () => {
    const result = validatePresetConfig("QTY_TIERED", { tiers: [] });
    expect(result.valid).toBe(false);
  });

  test("rejects non-integer minQty", () => {
    const result = validatePresetConfig("QTY_TIERED", {
      tiers: [{ minQty: 1.5, unitPrice: 100 }],
    });
    expect(result.valid).toBe(false);
    expect(result.errors[0].field).toBe("tiers[0].minQty");
  });

  test("rejects zero unitPrice", () => {
    const result = validatePresetConfig("QTY_TIERED", {
      tiers: [{ minQty: 1, unitPrice: 0 }],
    });
    expect(result.valid).toBe(false);
    expect(result.errors[0].field).toBe("tiers[0].unitPrice");
  });
});

// ── QTY_OPTIONS ─────────────────────────────────────────────────────────────

describe("QTY_OPTIONS", () => {
  test("accepts valid config", () => {
    const result = validatePresetConfig("QTY_OPTIONS", {
      sizes: [
        {
          label: "2x2",
          tiers: [
            { qty: 50, unitPrice: 150 },
            { qty: 100, unitPrice: 100 },
          ],
        },
      ],
    });
    expect(result.valid).toBe(true);
  });

  test("rejects empty sizes array", () => {
    const result = validatePresetConfig("QTY_OPTIONS", { sizes: [] });
    expect(result.valid).toBe(false);
  });

  test("rejects size with empty label", () => {
    const result = validatePresetConfig("QTY_OPTIONS", {
      sizes: [{ label: "", tiers: [{ qty: 1, unitPrice: 100 }] }],
    });
    expect(result.valid).toBe(false);
    expect(result.errors[0].field).toBe("sizes[0].label");
  });

  test("rejects size with empty tiers", () => {
    const result = validatePresetConfig("QTY_OPTIONS", {
      sizes: [{ label: "2x2", tiers: [] }],
    });
    expect(result.valid).toBe(false);
    expect(result.errors[0].field).toBe("sizes[0].tiers");
  });

  test("rejects tier with zero qty", () => {
    const result = validatePresetConfig("QTY_OPTIONS", {
      sizes: [{ label: "2x2", tiers: [{ qty: 0, unitPrice: 100 }] }],
    });
    expect(result.valid).toBe(false);
    expect(result.errors[0].field).toBe("sizes[0].tiers[0].qty");
  });
});

// ── COST_PLUS ───────────────────────────────────────────────────────────────

describe("COST_PLUS", () => {
  const validConfig = {
    materials: {
      vinyl: { costPerSqft: 50 },
      pvc: { costPerSqft: 80 },
    },
    inkCosts: {
      cmyk: { inkPerSqft: 20 },
      whiteInk: { inkPerSqft: 35 },
    },
    markup: { retail: 2.5, b2b: 1.8 },
  };

  test("accepts valid config", () => {
    const result = validatePresetConfig("COST_PLUS", validConfig);
    expect(result.valid).toBe(true);
  });

  test("rejects empty materials", () => {
    const result = validatePresetConfig("COST_PLUS", {
      ...validConfig,
      materials: {},
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e: { field: string }) => e.field === "materials")).toBe(true);
  });

  test("rejects missing inkCosts", () => {
    const result = validatePresetConfig("COST_PLUS", {
      materials: validConfig.materials,
      markup: validConfig.markup,
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e: { field: string }) => e.field === "inkCosts")).toBe(true);
  });

  test("rejects missing markup", () => {
    const result = validatePresetConfig("COST_PLUS", {
      materials: validConfig.materials,
      inkCosts: validConfig.inkCosts,
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e: { field: string }) => e.field === "markup")).toBe(true);
  });

  test("rejects negative costPerSqft", () => {
    const result = validatePresetConfig("COST_PLUS", {
      ...validConfig,
      materials: { vinyl: { costPerSqft: -1 } },
    });
    expect(result.valid).toBe(false);
    expect(result.errors[0].field).toBe("materials.vinyl.costPerSqft");
  });

  test("rejects zero markup.retail", () => {
    const result = validatePresetConfig("COST_PLUS", {
      ...validConfig,
      markup: { retail: 0, b2b: 1.5 },
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e: { field: string }) => e.field === "markup.retail")).toBe(true);
  });

  test("accepts optional machineLabor", () => {
    const result = validatePresetConfig("COST_PLUS", {
      ...validConfig,
      machineLabor: { hourlyRate: 85 },
    });
    expect(result.valid).toBe(true);
  });

  test("rejects invalid machineLabor.hourlyRate", () => {
    const result = validatePresetConfig("COST_PLUS", {
      ...validConfig,
      machineLabor: { hourlyRate: 0 },
    });
    expect(result.valid).toBe(false);
    expect(result.errors[0].field).toBe("machineLabor.hourlyRate");
  });
});
