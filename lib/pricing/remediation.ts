// lib/pricing/remediation.ts
// =================================================================
// Data remediation engine — plan + execute fixes for pricing data
// quality issues discovered by the audit system.
//
// Every action supports dry-run (preview only) mode.
// Every mutation goes through the approval gate and logs to
// PriceChangeLog.
//
// Workstream 6: Data Remediation Tools
// =================================================================

import { prisma } from "@/lib/prisma";

// ── Types ────────────────────────────────────────────────────────

export type RemediationAction =
  | "backfill_display_from_price"
  | "fix_placeholder_materials"
  | "fix_zero_cost_materials"
  | "fix_suspicious_hardware"
  | "backfill_floor_policy"
  | "flag_fixed_missing_vendor_cost";

export interface RemediationItem {
  id: string;
  identifier: string; // slug or name
  currentValue: unknown;
  proposedValue: unknown;
  reason: string;
}

export interface RemediationPlan {
  action: RemediationAction;
  dryRun: boolean;
  affectedCount: number;
  items: RemediationItem[];
  summary: string;
}

export interface RemediationResult {
  applied: number;
  skipped: number;
  errors: string[];
}

// ── Action metadata ──────────────────────────────────────────────

export const ACTION_META: Record<
  RemediationAction,
  { label: string; description: string; readOnly: boolean }
> = {
  backfill_display_from_price: {
    label: "Backfill Display From Price",
    description: "Set displayFromPrice for products where it's missing",
    readOnly: false,
  },
  fix_placeholder_materials: {
    label: "Flag Placeholder Materials",
    description: "Flag materials with placeholder names for review",
    readOnly: true,
  },
  fix_zero_cost_materials: {
    label: "Flag Zero-Cost Materials",
    description: "Flag materials with zero cost for review",
    readOnly: false,
  },
  fix_suspicious_hardware: {
    label: "Flag Suspicious Hardware",
    description: "Flag hardware with suspicious prices for review",
    readOnly: true,
  },
  backfill_floor_policy: {
    label: "Backfill Floor Prices",
    description: "Set floor prices for products without minimum pricing",
    readOnly: false,
  },
  flag_fixed_missing_vendor_cost: {
    label: "Flag Missing Vendor Costs",
    description: "Identify outsourced products missing vendor cost data",
    readOnly: true,
  },
};

// ── Plan remediation (dry-run) ───────────────────────────────────

export async function planRemediation(
  action: RemediationAction
): Promise<RemediationPlan> {
  switch (action) {
    case "backfill_display_from_price":
      return planBackfillDisplayFromPrice();
    case "fix_placeholder_materials":
      return planFixPlaceholderMaterials();
    case "fix_zero_cost_materials":
      return planFixZeroCostMaterials();
    case "fix_suspicious_hardware":
      return planFixSuspiciousHardware();
    case "backfill_floor_policy":
      return planBackfillFloorPolicy();
    case "flag_fixed_missing_vendor_cost":
      return planFlagMissingVendorCost();
    default:
      return {
        action,
        dryRun: true,
        affectedCount: 0,
        items: [],
        summary: `Unknown action: ${action}`,
      };
  }
}

// ── Execute remediation ──────────────────────────────────────────

export async function executeRemediation(
  plan: RemediationPlan,
  operator: { id: string; name: string },
  itemIds?: string[]
): Promise<RemediationResult> {
  // Filter to specific items if requested
  const items = itemIds
    ? plan.items.filter((i) => itemIds.includes(i.id))
    : plan.items;

  switch (plan.action) {
    case "backfill_display_from_price":
      return executeBackfillDisplayFromPrice(items, operator);
    case "fix_zero_cost_materials":
      return executeFixZeroCostMaterials(items, operator);
    case "backfill_floor_policy":
      return executeBackfillFloorPolicy(items, operator);
    // Read-only actions — nothing to execute
    case "fix_placeholder_materials":
    case "fix_suspicious_hardware":
    case "flag_fixed_missing_vendor_cost":
      return { applied: 0, skipped: items.length, errors: ["This action is read-only (flag only)"] };
    default:
      return { applied: 0, skipped: 0, errors: [`Unknown action: ${plan.action}`] };
  }
}

// ══════════════════════════════════════════════════════════════════
// Plan builders
// ══════════════════════════════════════════════════════════════════

async function planBackfillDisplayFromPrice(): Promise<RemediationPlan> {
  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      OR: [{ displayFromPrice: null }, { displayFromPrice: 0 }],
    },
    select: {
      id: true,
      slug: true,
      name: true,
      basePrice: true,
      pricingConfig: true,
    },
  });

  const items: RemediationItem[] = [];

  for (const p of products) {
    const fixedMin = getMinFixedPrice(p.pricingConfig);

    if (fixedMin && fixedMin > 0) {
      items.push({
        id: p.id,
        identifier: p.slug,
        currentValue: null,
        proposedValue: fixedMin,
        reason: `Use minimum fixed price ($${(fixedMin / 100).toFixed(2)})`,
      });
    } else if (p.basePrice > 0) {
      items.push({
        id: p.id,
        identifier: p.slug,
        currentValue: null,
        proposedValue: p.basePrice,
        reason: `Copy from basePrice ($${(p.basePrice / 100).toFixed(2)})`,
      });
    }
    // If both are 0/null, skip — nothing useful to backfill
  }

  return {
    action: "backfill_display_from_price",
    dryRun: true,
    affectedCount: items.length,
    items,
    summary: `${items.length} product(s) missing displayFromPrice can be backfilled`,
  };
}

async function planFixPlaceholderMaterials(): Promise<RemediationPlan> {
  const materials = await prisma.material.findMany({
    where: {
      isActive: true,
      OR: [{ name: "New Material" }, { name: "" }],
    },
    select: { id: true, name: true, type: true, costPerSqft: true, rollCost: true },
  });

  const items: RemediationItem[] = materials.map((m) => ({
    id: m.id,
    identifier: m.name || "(empty)",
    currentValue: m.name || "(empty)",
    proposedValue: "NEEDS_REVIEW",
    reason: `Placeholder name "${m.name || "(empty)"}" — type: ${m.type}`,
  }));

  return {
    action: "fix_placeholder_materials",
    dryRun: true,
    affectedCount: items.length,
    items,
    summary: `${items.length} material(s) with placeholder names need review`,
  };
}

async function planFixZeroCostMaterials(): Promise<RemediationPlan> {
  const materials = await prisma.material.findMany({
    where: {
      isActive: true,
      costPerSqft: { lte: 0 },
      rollCost: { lte: 0 },
    },
    select: { id: true, name: true, type: true, costPerSqft: true, rollCost: true },
  });

  // Filter out placeholder-name materials (handled by fix_placeholder_materials)
  const zeroCost = materials.filter(
    (m) => m.name !== "New Material" && m.name.trim() !== ""
  );

  const items: RemediationItem[] = zeroCost.map((m) => ({
    id: m.id,
    identifier: m.name,
    currentValue: { costPerSqft: m.costPerSqft, rollCost: m.rollCost },
    proposedValue: "Deactivate if unused",
    reason: `Zero cost — costPerSqft: $${m.costPerSqft}, rollCost: $${m.rollCost}`,
  }));

  return {
    action: "fix_zero_cost_materials",
    dryRun: true,
    affectedCount: items.length,
    items,
    summary: `${items.length} material(s) have zero cost and may need deactivation`,
  };
}

async function planFixSuspiciousHardware(): Promise<RemediationPlan> {
  const hardware = await prisma.hardwareItem.findMany({
    where: {
      isActive: true,
      NOT: { unit: "included" },
    },
    select: { id: true, slug: true, name: true, category: true, priceCents: true, unit: true },
  });

  const items: RemediationItem[] = [];

  for (const h of hardware) {
    if (h.priceCents <= 0) {
      items.push({
        id: h.id,
        identifier: h.slug,
        currentValue: h.priceCents,
        proposedValue: "NEEDS_REVIEW",
        reason: `Zero price — ${h.name} (${h.category})`,
      });
    } else if (h.priceCents < 50 && h.unit === "per_unit") {
      items.push({
        id: h.id,
        identifier: h.slug,
        currentValue: h.priceCents,
        proposedValue: "NEEDS_REVIEW",
        reason: `Suspiciously low: $${(h.priceCents / 100).toFixed(2)} — ${h.name} (${h.category})`,
      });
    }
  }

  return {
    action: "fix_suspicious_hardware",
    dryRun: true,
    affectedCount: items.length,
    items,
    summary: `${items.length} hardware item(s) with suspicious prices need review`,
  };
}

async function planBackfillFloorPolicy(): Promise<RemediationPlan> {
  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      OR: [{ minPrice: null }, { minPrice: 0 }],
    },
    select: {
      id: true,
      slug: true,
      name: true,
      basePrice: true,
      minPrice: true,
      pricingConfig: true,
    },
  });

  const items: RemediationItem[] = [];

  for (const p of products) {
    const fixedMin = getMinFixedPrice(p.pricingConfig);

    if (fixedMin && fixedMin > 0) {
      // For fixed-price products: 70% of min fixed price as floor
      const floor = Math.round(fixedMin * 0.7);
      items.push({
        id: p.id,
        identifier: p.slug,
        currentValue: p.minPrice ?? null,
        proposedValue: floor,
        reason: `70% of min fixed price ($${(fixedMin / 100).toFixed(2)}) = $${(floor / 100).toFixed(2)}`,
      });
    } else if (p.basePrice > 0) {
      // For other products: 80% of basePrice
      const floor = Math.round(p.basePrice * 0.8);
      items.push({
        id: p.id,
        identifier: p.slug,
        currentValue: p.minPrice ?? null,
        proposedValue: floor,
        reason: `80% of basePrice ($${(p.basePrice / 100).toFixed(2)}) = $${(floor / 100).toFixed(2)}`,
      });
    }
    // Skip products with basePrice=0 and no fixedPrices — nothing useful
  }

  return {
    action: "backfill_floor_policy",
    dryRun: true,
    affectedCount: items.length,
    items,
    summary: `${items.length} product(s) missing floor price can be backfilled`,
  };
}

async function planFlagMissingVendorCost(): Promise<RemediationPlan> {
  // Find all FIXED-source products (those with fixedPrices in pricingConfig)
  const products = await prisma.product.findMany({
    where: { isActive: true },
    select: { id: true, slug: true, name: true, pricingConfig: true },
  });

  // Filter to fixed-source products
  const fixedProducts = products.filter((p) => hasFixedPrices(p.pricingConfig));

  if (fixedProducts.length === 0) {
    return {
      action: "flag_fixed_missing_vendor_cost",
      dryRun: true,
      affectedCount: 0,
      items: [],
      summary: "No FIXED-source products found",
    };
  }

  // Find which fixed products have vendor cost entries
  const vendorCosts = await prisma.vendorCost.findMany({
    where: { isActive: true },
    select: { productSlug: true },
    distinct: ["productSlug"],
  });

  const coveredSlugs = new Set(
    vendorCosts.map((vc) => vc.productSlug).filter(Boolean)
  );

  const items: RemediationItem[] = [];

  for (const p of fixedProducts) {
    if (!coveredSlugs.has(p.slug)) {
      items.push({
        id: p.id,
        identifier: p.slug,
        currentValue: "no vendor cost entries",
        proposedValue: "Needs manual vendor cost entry",
        reason: `Outsourced product "${p.name}" has no vendor cost data`,
      });
    }
  }

  return {
    action: "flag_fixed_missing_vendor_cost",
    dryRun: true,
    affectedCount: items.length,
    items,
    summary: `${items.length} outsourced product(s) missing vendor cost data`,
  };
}

// ══════════════════════════════════════════════════════════════════
// Executors
// ══════════════════════════════════════════════════════════════════

async function executeBackfillDisplayFromPrice(
  items: RemediationItem[],
  operator: { id: string; name: string }
): Promise<RemediationResult> {
  let applied = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const item of items) {
    try {
      const proposed = Number(item.proposedValue);
      if (!proposed || proposed <= 0) {
        skipped++;
        continue;
      }

      await prisma.product.update({
        where: { id: item.id },
        data: { displayFromPrice: proposed },
      });

      // Log change — fire-and-forget import at usage
      const { logPriceChange } = await import("./change-log");
      logPriceChange({
        productId: item.id,
        productSlug: item.identifier,
        scope: "product",
        field: "displayFromPrice",
        labelBefore: item.currentValue == null ? "null" : String(item.currentValue),
        labelAfter: `$${(proposed / 100).toFixed(2)}`,
        valueBefore: item.currentValue,
        valueAfter: proposed,
        operatorId: operator.id,
        operatorName: operator.name,
        note: `Remediation: ${item.reason}`,
      });

      applied++;
    } catch (err) {
      errors.push(`${item.identifier}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return { applied, skipped, errors };
}

async function executeFixZeroCostMaterials(
  items: RemediationItem[],
  operator: { id: string; name: string }
): Promise<RemediationResult> {
  let applied = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const item of items) {
    try {
      // Deactivate zero-cost materials
      await prisma.material.update({
        where: { id: item.id },
        data: { isActive: false },
      });

      const { logPriceChange } = await import("./change-log");
      logPriceChange({
        scope: "material",
        field: `material.${item.identifier}.isActive`,
        labelBefore: "active",
        labelAfter: "deactivated",
        valueBefore: true,
        valueAfter: false,
        operatorId: operator.id,
        operatorName: operator.name,
        note: `Remediation: deactivated zero-cost material "${item.identifier}"`,
      });

      applied++;
    } catch (err) {
      errors.push(`${item.identifier}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return { applied, skipped, errors };
}

async function executeBackfillFloorPolicy(
  items: RemediationItem[],
  operator: { id: string; name: string }
): Promise<RemediationResult> {
  let applied = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const item of items) {
    try {
      const proposed = Number(item.proposedValue);
      if (!proposed || proposed <= 0) {
        skipped++;
        continue;
      }

      await prisma.product.update({
        where: { id: item.id },
        data: { minPrice: proposed },
      });

      const { logPriceChange } = await import("./change-log");
      logPriceChange({
        productId: item.id,
        productSlug: item.identifier,
        scope: "product",
        field: "minPrice",
        labelBefore: item.currentValue == null ? "null" : String(item.currentValue),
        labelAfter: `$${(proposed / 100).toFixed(2)}`,
        valueBefore: item.currentValue,
        valueAfter: proposed,
        operatorId: operator.id,
        operatorName: operator.name,
        note: `Remediation: ${item.reason}`,
      });

      applied++;
    } catch (err) {
      errors.push(`${item.identifier}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return { applied, skipped, errors };
}

// ══════════════════════════════════════════════════════════════════
// Helpers
// ══════════════════════════════════════════════════════════════════

function parseJson(val: unknown): unknown {
  if (val == null) return null;
  if (typeof val === "object") return val;
  if (typeof val === "string") {
    try {
      return JSON.parse(val);
    } catch {
      return null;
    }
  }
  return null;
}

function hasFixedPrices(pricingConfig: unknown): boolean {
  const cfg = parseJson(pricingConfig);
  if (!cfg || typeof cfg !== "object") return false;
  const fp = (cfg as Record<string, unknown>).fixedPrices;
  return !!fp && typeof fp === "object" && Object.keys(fp as object).length > 0;
}

/**
 * Extract the minimum price value from a fixedPrices table.
 * fixedPrices is typically: { "size_key": { "qty": priceCents, ... }, ... }
 * Returns the smallest price across all sizes and quantities, or null.
 */
function getMinFixedPrice(pricingConfig: unknown): number | null {
  const cfg = parseJson(pricingConfig);
  if (!cfg || typeof cfg !== "object") return null;
  const fp = (cfg as Record<string, unknown>).fixedPrices;
  if (!fp || typeof fp !== "object") return null;

  let min: number | null = null;

  for (const sizeData of Object.values(fp as Record<string, unknown>)) {
    if (typeof sizeData === "number") {
      // Simple { sizeKey: price } format
      if (min === null || sizeData < min) min = sizeData;
    } else if (sizeData && typeof sizeData === "object") {
      // Nested { sizeKey: { qty: price } } format
      for (const price of Object.values(sizeData as Record<string, unknown>)) {
        if (typeof price === "number" && price > 0) {
          if (min === null || price < min) min = price;
        }
      }
    }
  }

  return min;
}
