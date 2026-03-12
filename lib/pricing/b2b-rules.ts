// lib/pricing/b2b-rules.ts
// ═══════════════════════════════════════════════════════════════════
// B2B special pricing — CRUD + lookup for B2BPriceRule.
// Supports per-customer, per-company, per-tier, per-product,
// per-category, and per-template discount/override rules.
//
// Sub-task 4: B2B Special Price
// ═══════════════════════════════════════════════════════════════════

import { prisma } from "@/lib/prisma";

export type B2BRuleType =
  | "pct_discount"       // percentage off retail (value = 0-100)
  | "fixed_price"        // fixed unit price in cents (value = cents)
  | "cost_plus_override" // override margin tier (value = margin %)
  | "margin_override";   // set exact margin (value = margin %)

export interface B2BRuleInput {
  userId?: string;
  companyName?: string;
  partnerTier?: string;
  productId?: string;
  productSlug?: string;
  category?: string;
  templateKey?: string;
  ruleType: B2BRuleType;
  value: number;
  minQty?: number;
  maxQty?: number;
  note?: string;
  validFrom?: Date;
  validUntil?: Date;
  createdBy?: string;
}

/**
 * Create a new B2B price rule.
 */
export async function createB2BRule(input: B2BRuleInput) {
  return prisma.b2BPriceRule.create({
    data: {
      userId: input.userId || null,
      companyName: input.companyName || null,
      partnerTier: input.partnerTier || null,
      productId: input.productId || null,
      productSlug: input.productSlug || null,
      category: input.category || null,
      templateKey: input.templateKey || null,
      ruleType: input.ruleType,
      value: input.value,
      minQty: input.minQty ?? null,
      maxQty: input.maxQty ?? null,
      note: input.note || null,
      validFrom: input.validFrom || null,
      validUntil: input.validUntil || null,
      createdBy: input.createdBy || null,
    },
  });
}

/**
 * Find applicable B2B rules for a given context.
 * Returns rules in priority order: product > category > template > tier > global.
 */
export async function findApplicableRules(params: {
  userId?: string;
  companyName?: string;
  partnerTier?: string;
  productId?: string;
  productSlug?: string;
  category?: string;
  templateKey?: string;
  quantity?: number;
}) {
  const now = new Date();

  const rules = await prisma.b2BPriceRule.findMany({
    where: {
      isActive: true,
      OR: [
        // User-specific rules
        ...(params.userId ? [{ userId: params.userId }] : []),
        // Company-level rules
        ...(params.companyName ? [{ companyName: params.companyName }] : []),
        // Tier-level rules
        ...(params.partnerTier ? [{ partnerTier: params.partnerTier }] : []),
      ],
      // Date validity
      AND: [
        { OR: [{ validFrom: null }, { validFrom: { lte: now } }] },
        { OR: [{ validUntil: null }, { validUntil: { gte: now } }] },
      ],
    },
    orderBy: { createdAt: "desc" },
  });

  // Filter by product/category/template match + quantity range
  return rules.filter((rule) => {
    // Product-level match (most specific)
    if (rule.productId && rule.productId !== params.productId) return false;
    if (rule.productSlug && rule.productSlug !== params.productSlug) return false;

    // Category-level match
    if (rule.category && rule.category !== params.category) return false;

    // Template-level match
    if (rule.templateKey && rule.templateKey !== params.templateKey) return false;

    // Quantity range check
    if (rule.minQty != null && params.quantity != null && params.quantity < rule.minQty) return false;
    if (rule.maxQty != null && params.quantity != null && params.quantity > rule.maxQty) return false;

    return true;
  });
}

/**
 * Apply the best B2B rule to a price.
 * Returns the adjusted price and the applied rule, or null if no rules apply.
 */
export function applyBestRule(
  rules: { ruleType: string; value: number; productId: string | null; category: string | null; id?: string }[],
  retailPriceCents: number,
  costCents?: number
): { adjustedPriceCents: number; appliedRule: typeof rules[0]; discountCents: number } | null {
  if (!rules.length) return null;

  // Priority: product-specific > category > global (no product, no category)
  const sorted = [...rules].sort((a, b) => {
    const aSpec = (a.productId ? 4 : 0) + (a.category ? 2 : 0);
    const bSpec = (b.productId ? 4 : 0) + (b.category ? 2 : 0);
    return bSpec - aSpec;
  });

  const best = sorted[0];
  let adjustedPrice = retailPriceCents;

  switch (best.ruleType) {
    case "pct_discount":
      adjustedPrice = Math.round(retailPriceCents * (1 - best.value / 100));
      break;
    case "fixed_price":
      adjustedPrice = Math.round(best.value);
      break;
    case "cost_plus_override":
      if (costCents != null && costCents > 0) {
        adjustedPrice = Math.round(costCents / (1 - best.value / 100));
      }
      break;
    case "margin_override":
      if (costCents != null && costCents > 0) {
        adjustedPrice = Math.round(costCents / (1 - best.value / 100));
      }
      break;
  }

  return {
    adjustedPriceCents: adjustedPrice,
    appliedRule: best,
    discountCents: retailPriceCents - adjustedPrice,
  };
}

/**
 * List all B2B rules with optional filters.
 */
export async function listB2BRules(params?: {
  userId?: string;
  partnerTier?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}) {
  const page = params?.page || 1;
  const limit = Math.min(params?.limit || 50, 200);

  const where: Record<string, unknown> = {};
  if (params?.userId) where.userId = params.userId;
  if (params?.partnerTier) where.partnerTier = params.partnerTier;
  if (params?.isActive !== undefined) where.isActive = params.isActive;

  const [rules, total] = await Promise.all([
    prisma.b2BPriceRule.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.b2BPriceRule.count({ where }),
  ]);

  return { rules, total, page, limit };
}

/**
 * Update an existing B2B price rule by id.
 */
export async function updateB2BRule(id: string, data: Partial<B2BRuleInput>) {
  const updateData: Record<string, unknown> = {};

  if (data.userId !== undefined) updateData.userId = data.userId || null;
  if (data.companyName !== undefined) updateData.companyName = data.companyName || null;
  if (data.partnerTier !== undefined) updateData.partnerTier = data.partnerTier || null;
  if (data.productId !== undefined) updateData.productId = data.productId || null;
  if (data.productSlug !== undefined) updateData.productSlug = data.productSlug || null;
  if (data.category !== undefined) updateData.category = data.category || null;
  if (data.templateKey !== undefined) updateData.templateKey = data.templateKey || null;
  if (data.ruleType !== undefined) updateData.ruleType = data.ruleType;
  if (data.value !== undefined) updateData.value = data.value;
  if (data.minQty !== undefined) updateData.minQty = data.minQty ?? null;
  if (data.maxQty !== undefined) updateData.maxQty = data.maxQty ?? null;
  if (data.note !== undefined) updateData.note = data.note || null;
  if (data.validFrom !== undefined) updateData.validFrom = data.validFrom || null;
  if (data.validUntil !== undefined) updateData.validUntil = data.validUntil || null;

  return prisma.b2BPriceRule.update({
    where: { id },
    data: updateData,
  });
}

/**
 * Soft-delete a B2B price rule (set isActive = false).
 */
export async function deleteB2BRule(id: string) {
  await prisma.b2BPriceRule.update({
    where: { id },
    data: { isActive: false },
  });
  return { success: true };
}

/**
 * Resolve the best B2B price for a given context.
 * This is the main entry point for pricing integration.
 * Returns null if no B2B rule applies.
 */
export async function resolveB2BPrice(params: {
  userId?: string;
  companyName?: string;
  partnerTier?: string;
  productId?: string;
  productSlug?: string;
  category?: string;
  templateKey?: string;
  quantity?: number;
  retailPriceCents: number;
  costCents?: number;
}): Promise<{
  adjustedPriceCents: number;
  discountCents: number;
  appliedRule: { ruleType: string; value: number; id: string; note?: string | null };
} | null> {
  // If no B2B targeting params at all, skip the DB query entirely
  if (!params.userId && !params.companyName && !params.partnerTier) {
    return null;
  }

  const rules = await findApplicableRules({
    userId: params.userId,
    companyName: params.companyName,
    partnerTier: params.partnerTier,
    productId: params.productId,
    productSlug: params.productSlug,
    category: params.category,
    templateKey: params.templateKey,
    quantity: params.quantity,
  });

  if (!rules.length) return null;

  const result = applyBestRule(rules, params.retailPriceCents, params.costCents);
  if (!result) return null;

  return {
    adjustedPriceCents: result.adjustedPriceCents,
    discountCents: result.discountCents,
    appliedRule: {
      ruleType: result.appliedRule.ruleType,
      value: result.appliedRule.value,
      id: (result.appliedRule as { id?: string }).id || "",
      note: (result.appliedRule as { note?: string | null }).note ?? null,
    },
  };
}
