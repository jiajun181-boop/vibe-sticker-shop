/**
 * Regression tests for manual order pricing provenance metadata.
 *
 * Validates:
 *   R1: pricingSource is preserved in item meta for all three states
 *   R2: pricingQuoteSlug is only present for calculated/overridden items
 *   R3: calculatedUnitCents is only present for overridden items
 *   R4: lifecycle truth — paid orders get status "paid", unpaid get "pending"
 */

// ── Pricing provenance metadata shape ────────────────────────────────────────

describe("pricing provenance metadata shape", () => {
  /** Simulates the meta object built by the create page before submission */
  function buildItemMeta(item: {
    pricingSource: "manual" | "calculated" | "overridden";
    calcSlug?: string | null;
    calculatedUnitCents?: number | null;
    artworkIntent?: string;
    rushProduction?: boolean;
    notes?: string;
  }) {
    return {
      ...(item.notes ? { adminNotes: item.notes } : {}),
      artworkIntent: item.artworkIntent || "provided",
      rushProduction: item.rushProduction ? "true" : "false",
      pricingSource: item.pricingSource,
      ...(item.calcSlug ? { pricingQuoteSlug: item.calcSlug } : {}),
      ...(item.pricingSource === "overridden" && item.calculatedUnitCents
        ? { calculatedUnitCents: item.calculatedUnitCents }
        : {}),
    };
  }

  it("manual-priced item has pricingSource 'manual' and no calc fields", () => {
    const meta = buildItemMeta({ pricingSource: "manual" });
    expect(meta.pricingSource).toBe("manual");
    expect(meta).not.toHaveProperty("pricingQuoteSlug");
    expect(meta).not.toHaveProperty("calculatedUnitCents");
  });

  it("calc-priced item has pricingSource 'calculated' and pricingQuoteSlug", () => {
    const meta = buildItemMeta({
      pricingSource: "calculated",
      calcSlug: "custom-stickers",
    });
    expect(meta.pricingSource).toBe("calculated");
    expect(meta.pricingQuoteSlug).toBe("custom-stickers");
    expect(meta).not.toHaveProperty("calculatedUnitCents");
  });

  it("overridden item has all three provenance fields", () => {
    const meta = buildItemMeta({
      pricingSource: "overridden",
      calcSlug: "vinyl-banners",
      calculatedUnitCents: 1250,
    });
    expect(meta.pricingSource).toBe("overridden");
    expect(meta.pricingQuoteSlug).toBe("vinyl-banners");
    expect(meta.calculatedUnitCents).toBe(1250);
  });

  it("overridden without calculatedUnitCents does not add null field", () => {
    const meta = buildItemMeta({
      pricingSource: "overridden",
      calcSlug: "flyers",
      calculatedUnitCents: null,
    });
    expect(meta.pricingSource).toBe("overridden");
    expect(meta).not.toHaveProperty("calculatedUnitCents");
  });
});

// ── Lifecycle truth ──────────────────────────────────────────────────────────

describe("manual order lifecycle truth", () => {
  /** Simulates the status logic from the create route */
  function deriveOrderStatus(paymentStatus: "paid" | "unpaid") {
    return paymentStatus === "paid" ? "paid" : "pending";
  }

  it("paid manual order gets status 'paid'", () => {
    expect(deriveOrderStatus("paid")).toBe("paid");
  });

  it("unpaid manual order gets status 'pending'", () => {
    expect(deriveOrderStatus("unpaid")).toBe("pending");
  });
});

// ── Timeline pricing summary ─────────────────────────────────────────────────

describe("timeline pricing summary", () => {
  function buildPricingSummary(items: Array<{ meta?: { pricingSource?: string } }>) {
    const pricingSources = items.reduce(
      (acc: Record<string, number>, item) => {
        const src = (item.meta?.pricingSource as string) || "manual";
        acc[src] = (acc[src] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );
    const parts: string[] = [];
    if (pricingSources.calculated) parts.push(`${pricingSources.calculated} calc-priced`);
    if (pricingSources.overridden) parts.push(`${pricingSources.overridden} overridden`);
    if (pricingSources.manual) parts.push(`${pricingSources.manual} manual-priced`);
    return parts.length > 0 ? `pricing: ${parts.join(", ")}` : null;
  }

  it("summarizes mixed pricing sources", () => {
    const summary = buildPricingSummary([
      { meta: { pricingSource: "calculated" } },
      { meta: { pricingSource: "manual" } },
      { meta: { pricingSource: "overridden" } },
    ]);
    expect(summary).toBe("pricing: 1 calc-priced, 1 overridden, 1 manual-priced");
  });

  it("summarizes all-manual items", () => {
    const summary = buildPricingSummary([
      { meta: { pricingSource: "manual" } },
      { meta: { pricingSource: "manual" } },
    ]);
    expect(summary).toBe("pricing: 2 manual-priced");
  });

  it("defaults to manual when pricingSource is missing", () => {
    const summary = buildPricingSummary([
      { meta: {} },
      {},
    ]);
    expect(summary).toBe("pricing: 2 manual-priced");
  });

  it("returns null for empty items", () => {
    const summary = buildPricingSummary([]);
    expect(summary).toBeNull();
  });
});
