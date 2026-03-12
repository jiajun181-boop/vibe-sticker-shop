// lib/pricing/vendor-cost.ts
// ═══════════════════════════════════════════════════════════════════
// Vendor / outsourced cost tracking — CRUD for VendorCost model.
// For fixedPrices / outsourced products where we buy from a supplier.
//
// Sub-task 4: Vendor Cost
// ═══════════════════════════════════════════════════════════════════

import { prisma } from "@/lib/prisma";

export interface VendorCostInput {
  productId?: string;
  productSlug?: string;
  productName?: string;
  vendorName: string;
  vendorSku?: string;
  sizeKey?: string;
  qtyTier?: number;
  unitCostCents: number;
  setupFeeCents?: number;
  shippingCents?: number;
  leadTimeDays?: number;
  note?: string;
}

/**
 * Create or update a vendor cost entry.
 * If an entry exists for the same product+vendor+size+qty, update it.
 */
export async function upsertVendorCost(input: VendorCostInput) {
  // Try to find existing
  const existing = await prisma.vendorCost.findFirst({
    where: {
      productSlug: input.productSlug || undefined,
      vendorName: input.vendorName,
      sizeKey: input.sizeKey || null,
      qtyTier: input.qtyTier ?? null,
      isActive: true,
    },
  });

  if (existing) {
    return prisma.vendorCost.update({
      where: { id: existing.id },
      data: {
        unitCostCents: input.unitCostCents,
        setupFeeCents: input.setupFeeCents ?? 0,
        shippingCents: input.shippingCents ?? 0,
        leadTimeDays: input.leadTimeDays ?? null,
        note: input.note || existing.note,
        lastVerified: new Date(),
      },
    });
  }

  return prisma.vendorCost.create({
    data: {
      productId: input.productId || null,
      productSlug: input.productSlug || null,
      productName: input.productName || null,
      vendorName: input.vendorName,
      vendorSku: input.vendorSku || null,
      sizeKey: input.sizeKey || null,
      qtyTier: input.qtyTier ?? null,
      unitCostCents: input.unitCostCents,
      setupFeeCents: input.setupFeeCents ?? 0,
      shippingCents: input.shippingCents ?? 0,
      leadTimeDays: input.leadTimeDays ?? null,
      note: input.note || null,
      lastVerified: new Date(),
    },
  });
}

/**
 * Find vendor costs for a product, sorted by qty tier.
 */
export async function getVendorCosts(productSlug: string) {
  return prisma.vendorCost.findMany({
    where: { productSlug, isActive: true },
    orderBy: [{ vendorName: "asc" }, { sizeKey: "asc" }, { qtyTier: "asc" }],
  });
}

/**
 * List all vendor costs with optional filters.
 */
export async function listVendorCosts(params?: {
  vendorName?: string;
  productSlug?: string;
  page?: number;
  limit?: number;
}) {
  const page = params?.page || 1;
  const limit = Math.min(params?.limit || 50, 200);

  const where: Record<string, unknown> = { isActive: true };
  if (params?.vendorName) where.vendorName = params.vendorName;
  if (params?.productSlug) where.productSlug = params.productSlug;

  const [costs, total] = await Promise.all([
    prisma.vendorCost.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.vendorCost.count({ where }),
  ]);

  return { costs, total, page, limit };
}

/**
 * Soft-delete a vendor cost entry (set isActive = false).
 */
export async function deleteVendorCost(id: string) {
  return prisma.vendorCost.update({ where: { id }, data: { isActive: false } });
}

/**
 * Update a vendor cost entry by id.
 */
export async function updateVendorCost(
  id: string,
  data: Partial<Omit<VendorCostInput, "vendorName">> & { vendorName?: string }
) {
  const updateData: Record<string, unknown> = {};
  if (data.productId !== undefined) updateData.productId = data.productId || null;
  if (data.productSlug !== undefined) updateData.productSlug = data.productSlug || null;
  if (data.productName !== undefined) updateData.productName = data.productName || null;
  if (data.vendorName !== undefined) updateData.vendorName = data.vendorName;
  if (data.vendorSku !== undefined) updateData.vendorSku = data.vendorSku || null;
  if (data.sizeKey !== undefined) updateData.sizeKey = data.sizeKey || null;
  if (data.qtyTier !== undefined) updateData.qtyTier = data.qtyTier ?? null;
  if (data.unitCostCents !== undefined) updateData.unitCostCents = data.unitCostCents;
  if (data.setupFeeCents !== undefined) updateData.setupFeeCents = data.setupFeeCents ?? 0;
  if (data.shippingCents !== undefined) updateData.shippingCents = data.shippingCents ?? 0;
  if (data.leadTimeDays !== undefined) updateData.leadTimeDays = data.leadTimeDays ?? null;
  if (data.note !== undefined) updateData.note = data.note || null;
  updateData.lastVerified = new Date();

  return prisma.vendorCost.update({ where: { id }, data: updateData });
}

/**
 * Look up vendor cost for a product at a given size/qty.
 * Used by pricing-contract to fill outsourcing cost bucket.
 * Returns null if no vendor cost found.
 */
export async function lookupVendorCost(params: {
  productSlug: string;
  sizeKey?: string;
  quantity?: number;
}): Promise<{
  unitCostCents: number;
  setupFeeCents: number;
  shippingCents: number;
  vendorName: string;
  totalForQty: number;
} | null> {
  // Find all active vendor costs for this product
  const costs = await prisma.vendorCost.findMany({
    where: {
      productSlug: params.productSlug,
      isActive: true,
    },
    orderBy: [{ qtyTier: "asc" }],
  });

  if (costs.length === 0) return null;

  // Filter by sizeKey if provided
  let candidates = params.sizeKey
    ? costs.filter((c) => c.sizeKey === params.sizeKey || c.sizeKey === null)
    : costs;

  // Prefer exact sizeKey match over null sizeKey entries
  if (params.sizeKey) {
    const exact = candidates.filter((c) => c.sizeKey === params.sizeKey);
    if (exact.length > 0) candidates = exact;
  }

  if (candidates.length === 0) return null;

  const qty = params.quantity || 1;

  // Find best qtyTier match: highest qtyTier <= quantity
  // Entries with null qtyTier are considered "base" (tier 0)
  let best = candidates.find((c) => c.qtyTier === null || c.qtyTier === 0) || null;

  for (const c of candidates) {
    if (c.qtyTier != null && c.qtyTier > 0 && c.qtyTier <= qty) {
      if (!best || (best.qtyTier != null && c.qtyTier > best.qtyTier) || best.qtyTier === null) {
        best = c;
      }
    }
  }

  // If still no match, take the first candidate
  if (!best) best = candidates[0];

  const totalForQty = best.unitCostCents * qty + best.setupFeeCents + best.shippingCents;

  return {
    unitCostCents: best.unitCostCents,
    setupFeeCents: best.setupFeeCents,
    shippingCents: best.shippingCents,
    vendorName: best.vendorName,
    totalForQty,
  };
}

// ── Match reason type for vendor cost explanation ─────────────────
type MatchReason = "exact_size_qty" | "exact_size_base" | "any_size_qty" | "any_size_base" | "no_match";

/**
 * Helper: find the best tier for a single vendor's cost entries given size/qty.
 * Returns the best entry, computed total, and a match reason describing how it matched.
 */
function findBestTierForVendor(
  entries: Array<{
    vendorName: string;
    sizeKey: string | null;
    qtyTier: number | null;
    unitCostCents: number;
    setupFeeCents: number;
    shippingCents: number;
  }>,
  sizeKey: string | undefined,
  qty: number
): {
  entry: (typeof entries)[0];
  totalForQty: number;
  matchReason: MatchReason;
} | null {
  if (entries.length === 0) return null;

  // Step 1: Separate by size match
  const exactSize = sizeKey ? entries.filter((c) => c.sizeKey === sizeKey) : [];
  const anySize = entries.filter((c) => c.sizeKey === null);
  const allEntries = sizeKey && exactSize.length > 0 ? exactSize : anySize.length > 0 ? anySize : entries;

  const isExactSize = sizeKey != null && exactSize.length > 0 && allEntries === exactSize;

  // Step 2: Find best qty tier from selected entries
  let best = allEntries.find((c) => c.qtyTier === null || c.qtyTier === 0) || null;
  let usedQtyTier = false;

  for (const c of allEntries) {
    if (c.qtyTier != null && c.qtyTier > 0 && c.qtyTier <= qty) {
      if (!best || (best.qtyTier != null && c.qtyTier > best.qtyTier) || best.qtyTier === null) {
        best = c;
        usedQtyTier = true;
      }
    }
  }

  if (!best) best = allEntries[0];

  const totalForQty = best.unitCostCents * qty + best.setupFeeCents + best.shippingCents;

  // Determine match reason
  let matchReason: MatchReason;
  if (isExactSize && usedQtyTier) {
    matchReason = "exact_size_qty";
  } else if (isExactSize) {
    matchReason = "exact_size_base";
  } else if (usedQtyTier) {
    matchReason = "any_size_qty";
  } else {
    matchReason = "any_size_base";
  }

  return { entry: best, totalForQty, matchReason };
}

/**
 * Look up vendor cost with a full multi-vendor comparison and explanation.
 * Unlike lookupVendorCost(), this returns ALL vendors' evaluated costs,
 * the selected best match, and a human-readable explanation.
 */
export async function lookupVendorCostWithExplanation(params: {
  productSlug: string;
  sizeKey?: string;
  quantity?: number;
}): Promise<{
  bestMatch: {
    unitCostCents: number;
    setupFeeCents: number;
    shippingCents: number;
    vendorName: string;
    totalForQty: number;
  } | null;
  allVendors: Array<{
    vendorName: string;
    unitCostCents: number;
    setupFeeCents: number;
    shippingCents: number;
    totalForQty: number;
    sizeKey: string | null;
    qtyTier: number | null;
    isSelected: boolean;
    matchReason: MatchReason;
  }>;
  explanation: string;
}> {
  const costs = await prisma.vendorCost.findMany({
    where: {
      productSlug: params.productSlug,
      isActive: true,
    },
    orderBy: [{ vendorName: "asc" }, { qtyTier: "asc" }],
  });

  if (costs.length === 0) {
    return {
      bestMatch: null,
      allVendors: [],
      explanation: "No vendor cost data available",
    };
  }

  const qty = params.quantity || 1;

  // Group entries by vendor
  const vendorMap = new Map<string, typeof costs>();
  for (const c of costs) {
    const existing = vendorMap.get(c.vendorName) || [];
    existing.push(c);
    vendorMap.set(c.vendorName, existing);
  }

  // Evaluate each vendor's best tier
  const vendorResults: Array<{
    vendorName: string;
    unitCostCents: number;
    setupFeeCents: number;
    shippingCents: number;
    totalForQty: number;
    sizeKey: string | null;
    qtyTier: number | null;
    isSelected: boolean;
    matchReason: MatchReason;
  }> = [];

  for (const [vendorName, entries] of vendorMap) {
    const result = findBestTierForVendor(entries, params.sizeKey, qty);
    if (result) {
      vendorResults.push({
        vendorName,
        unitCostCents: result.entry.unitCostCents,
        setupFeeCents: result.entry.setupFeeCents,
        shippingCents: result.entry.shippingCents,
        totalForQty: result.totalForQty,
        sizeKey: result.entry.sizeKey,
        qtyTier: result.entry.qtyTier,
        isSelected: false, // will set below
        matchReason: result.matchReason,
      });
    } else {
      // Vendor has entries but none matched — include with no_match
      const fallback = entries[0];
      vendorResults.push({
        vendorName,
        unitCostCents: fallback.unitCostCents,
        setupFeeCents: fallback.setupFeeCents,
        shippingCents: fallback.shippingCents,
        totalForQty: fallback.unitCostCents * qty + fallback.setupFeeCents + fallback.shippingCents,
        sizeKey: fallback.sizeKey,
        qtyTier: fallback.qtyTier,
        isSelected: false,
        matchReason: "no_match",
      });
    }
  }

  // Select cheapest vendor by totalForQty
  let bestIdx = 0;
  for (let i = 1; i < vendorResults.length; i++) {
    if (vendorResults[i].totalForQty < vendorResults[bestIdx].totalForQty) {
      bestIdx = i;
    }
  }

  vendorResults[bestIdx].isSelected = true;
  const best = vendorResults[bestIdx];

  const bestMatch = {
    unitCostCents: best.unitCostCents,
    setupFeeCents: best.setupFeeCents,
    shippingCents: best.shippingCents,
    vendorName: best.vendorName,
    totalForQty: best.totalForQty,
  };

  // Build explanation
  let explanation: string;
  const unitStr = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  if (vendorResults.length === 1) {
    explanation = `Single vendor: ${best.vendorName}`;
  } else {
    const others = vendorResults
      .filter((_, i) => i !== bestIdx)
      .map((v) => `${v.vendorName} (${unitStr(v.unitCostCents)}/unit)`)
      .join(", ");
    const sizeLabel = params.sizeKey ? ` at size ${params.sizeKey}` : "";
    explanation = `Selected ${best.vendorName} (${unitStr(best.unitCostCents)}/unit) over ${others} for qty ${qty}${sizeLabel}`;
  }

  return { bestMatch, allVendors: vendorResults, explanation };
}
