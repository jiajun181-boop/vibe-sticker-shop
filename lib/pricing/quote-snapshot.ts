// lib/pricing/quote-snapshot.ts
// ═══════════════════════════════════════════════════════════════════
// Admin quote snapshot — records every internal pricing simulation.
// NOT customer-facing. For admin quick-quote / pricing audit trail.
//
// Sub-task 2: Quote Records
// ═══════════════════════════════════════════════════════════════════

import { prisma } from "@/lib/prisma";

export interface QuoteSnapshotInput {
  productId?: string | null;
  productSlug?: string | null;
  productName?: string | null;
  category?: string | null;
  configInput: Record<string, unknown>;
  pricingSource: string; // PRESET | FIXED | TEMPLATE | LEGACY | QUOTE_ONLY

  sellPriceCents: number;
  totalCostCents?: number;
  floorPriceCents?: number;
  quoteLedger?: unknown;

  operatorId?: string | null;
  operatorName?: string | null;
  note?: string | null;
}

/**
 * Save a quote snapshot to the database. Fire-and-forget.
 */
export async function saveQuoteSnapshot(input: QuoteSnapshotInput): Promise<string | null> {
  try {
    const profitCents = input.sellPriceCents - (input.totalCostCents || 0);
    const marginPct = input.sellPriceCents > 0
      ? (profitCents / input.sellPriceCents) * 100
      : 0;

    const record = await prisma.adminQuoteSnapshot.create({
      data: {
        productId: input.productId || null,
        productSlug: input.productSlug || null,
        productName: input.productName || null,
        category: input.category || null,
        configInput: input.configInput,
        pricingSource: input.pricingSource,
        sellPriceCents: input.sellPriceCents,
        totalCostCents: input.totalCostCents || 0,
        floorPriceCents: input.floorPriceCents || 0,
        profitCents,
        marginPct: Math.round(marginPct * 100) / 100,
        quoteLedger: input.quoteLedger ?? null,
        operatorId: input.operatorId || null,
        operatorName: input.operatorName || null,
        note: input.note || null,
      },
    });
    return record.id;
  } catch (err) {
    console.error("[quote-snapshot] Failed to save:", err);
    return null;
  }
}

/**
 * List recent quote snapshots with pagination.
 */
export async function listQuoteSnapshots(params: {
  productSlug?: string;
  operatorId?: string;
  operatorName?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}) {
  const page = params.page || 1;
  const limit = Math.min(params.limit || 30, 100);

  const where: Record<string, unknown> = {};
  if (params.productSlug) where.productSlug = params.productSlug;
  if (params.operatorId) where.operatorId = params.operatorId;
  if (params.operatorName) where.operatorName = params.operatorName;
  if (params.dateFrom || params.dateTo) {
    const createdAt: Record<string, Date> = {};
    if (params.dateFrom) createdAt.gte = new Date(params.dateFrom);
    if (params.dateTo) {
      const end = new Date(params.dateTo);
      end.setHours(23, 59, 59, 999);
      createdAt.lte = end;
    }
    where.createdAt = createdAt;
  }

  const [snapshots, total] = await Promise.all([
    prisma.adminQuoteSnapshot.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.adminQuoteSnapshot.count({ where }),
  ]);

  return { snapshots, total, page, limit };
}

/**
 * Get quote snapshot statistics for a given period.
 */
export async function getQuoteStats(days: number = 30) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const [total, avgMargin] = await Promise.all([
    prisma.adminQuoteSnapshot.count({
      where: { createdAt: { gte: since } },
    }),
    prisma.adminQuoteSnapshot.aggregate({
      where: { createdAt: { gte: since }, sellPriceCents: { gt: 0 } },
      _avg: { marginPct: true },
      _min: { marginPct: true },
      _max: { marginPct: true },
    }),
  ]);

  return {
    totalQuotes: total,
    avgMarginPct: Math.round((avgMargin._avg.marginPct || 0) * 100) / 100,
    minMarginPct: Math.round((avgMargin._min.marginPct || 0) * 100) / 100,
    maxMarginPct: Math.round((avgMargin._max.marginPct || 0) * 100) / 100,
    periodDays: days,
  };
}
