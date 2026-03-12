// lib/pricing/floor-enforcement.ts
// ===================================================================
// Floor Price Enforcement Module
//
// Gates pricing write operations against floor price policy.
// Used by vendor-costs, b2b-rules, and floor-check API routes
// to prevent selling below cost + minimum margin.
// ===================================================================

import { prisma } from "@/lib/prisma";
import { buildPricingContract } from "@/lib/pricing/pricing-contract";
import { getPricingTier, PricingTier } from "@/lib/pricing/pricing-permissions";

export interface FloorCheckResult {
  allowed: boolean;
  floorPriceCents: number;
  proposedPriceCents: number;
  policySource: string;
  reason: string;
  requiresOverride: boolean; // true = owner can override
}

/**
 * Check whether a proposed price complies with the floor price policy
 * for a given product.
 *
 * 1. Looks up the product from Prisma by slug (includes pricingPreset)
 * 2. Calls buildPricingContract to get the floor price
 * 3. Compares proposedPriceCents against contract.floor.priceCents
 * 4. If below floor:
 *    - Owner tier -> allowed, no override required
 *    - Otherwise  -> blocked, requiresOverride=true
 * 5. If at or above floor -> allowed
 */
export async function checkFloorCompliance(params: {
  productSlug: string;
  proposedPriceCents: number;
  quantity?: number;
  widthIn?: number;
  heightIn?: number;
  material?: string;
  operatorRole: string;
}): Promise<FloorCheckResult> {
  const {
    productSlug,
    proposedPriceCents,
    quantity,
    widthIn,
    heightIn,
    material,
    operatorRole,
  } = params;

  // Look up product
  const product = await prisma.product.findFirst({
    where: { slug: productSlug },
    include: { pricingPreset: true },
  });

  if (!product) {
    // Fail-closed: unknown product should not silently pass floor check
    // for non-owners. Only owner tier may proceed with an unknown slug.
    const tier = getPricingTier(operatorRole);
    if (tier === PricingTier.OWNER) {
      return {
        allowed: true,
        floorPriceCents: 0,
        proposedPriceCents,
        policySource: "none",
        reason: `Product not found: ${productSlug}. Owner override allowed.`,
        requiresOverride: false,
      };
    }
    return {
      allowed: false,
      floorPriceCents: 0,
      proposedPriceCents,
      policySource: "none",
      reason: `Product not found: ${productSlug}. Cannot verify floor compliance.`,
      requiresOverride: true,
    };
  }

  // Build pricing contract to get the floor price
  const input = {
    quantity: quantity || 1,
    widthIn: widthIn || undefined,
    heightIn: heightIn || undefined,
    material: material || undefined,
  };

  let contract: Awaited<ReturnType<typeof buildPricingContract>>;
  try {
    contract = await buildPricingContract(product, input);
  } catch {
    // Fail-closed: if we cannot compute the floor, block non-owners.
    const tier = getPricingTier(operatorRole);
    if (tier === PricingTier.OWNER) {
      return {
        allowed: true,
        floorPriceCents: 0,
        proposedPriceCents,
        policySource: "error",
        reason: "Could not compute floor price. Owner override allowed.",
        requiresOverride: false,
      };
    }
    return {
      allowed: false,
      floorPriceCents: 0,
      proposedPriceCents,
      policySource: "error",
      reason: "Could not compute floor price. Requires owner override.",
      requiresOverride: true,
    };
  }

  const floorPriceCents = (contract.floor as { priceCents?: number })?.priceCents || 0;
  const policySource = (contract.floor as { policySource?: string })?.policySource || "unknown";

  // No floor computed (e.g., no cost data) — allow
  if (floorPriceCents <= 0) {
    return {
      allowed: true,
      floorPriceCents: 0,
      proposedPriceCents,
      policySource,
      reason: "No floor price computed (no cost data). Price allowed.",
      requiresOverride: false,
    };
  }

  // At or above floor — allowed
  if (proposedPriceCents >= floorPriceCents) {
    return {
      allowed: true,
      floorPriceCents,
      proposedPriceCents,
      policySource,
      reason: "Price meets or exceeds floor.",
      requiresOverride: false,
    };
  }

  // Below floor — check operator tier
  const tier = getPricingTier(operatorRole);
  const proposedFmt = `$${(proposedPriceCents / 100).toFixed(2)}`;
  const floorFmt = `$${(floorPriceCents / 100).toFixed(2)}`;

  if (tier === PricingTier.OWNER) {
    return {
      allowed: true,
      floorPriceCents,
      proposedPriceCents,
      policySource,
      reason: "Owner override",
      requiresOverride: false,
    };
  }

  return {
    allowed: false,
    floorPriceCents,
    proposedPriceCents,
    policySource,
    reason: `Price ${proposedFmt} below floor ${floorFmt} (source: ${policySource}). Requires owner override.`,
    requiresOverride: true,
  };
}

/**
 * Check floor compliance for multiple products sharing a vendor cost.
 * Returns an array of warnings for products whose current sell price
 * falls below the floor after a vendor cost change.
 *
 * Used by the vendor-costs POST route to flag potential issues
 * without blocking the operation.
 */
export async function checkVendorCostFloorImpact(params: {
  productSlug: string;
  operatorRole: string;
}): Promise<
  Array<{
    productSlug: string;
    productName: string | null;
    sellPriceCents: number;
    floorPriceCents: number;
    policySource: string;
    message: string;
  }>
> {
  const { productSlug, operatorRole } = params;
  const warnings: Array<{
    productSlug: string;
    productName: string | null;
    sellPriceCents: number;
    floorPriceCents: number;
    policySource: string;
    message: string;
  }> = [];

  // Find products linked to this vendor cost's product slug
  const product = await prisma.product.findFirst({
    where: { slug: productSlug },
    include: { pricingPreset: true },
  });

  if (!product) return warnings;

  // Build the contract with defaults to get current sell price vs new floor
  let contract: Awaited<ReturnType<typeof buildPricingContract>>;
  try {
    contract = await buildPricingContract(product, {
      quantity: 1,
    });
  } catch {
    return warnings;
  }

  const floorPriceCents = (contract.floor as { priceCents?: number })?.priceCents || 0;
  const policySource = (contract.floor as { policySource?: string })?.policySource || "unknown";
  const sellPriceCents = contract.sellPrice?.totalCents || 0;

  if (floorPriceCents > 0 && sellPriceCents > 0 && sellPriceCents < floorPriceCents) {
    const tier = getPricingTier(operatorRole);
    const isOwner = tier === PricingTier.OWNER;

    warnings.push({
      productSlug: product.slug,
      productName: product.name,
      sellPriceCents,
      floorPriceCents,
      policySource,
      message: `Sell price $${(sellPriceCents / 100).toFixed(2)} is below floor $${(floorPriceCents / 100).toFixed(2)} (${policySource}).${isOwner ? " Owner can override." : " Requires owner review."}`,
    });
  }

  return warnings;
}
