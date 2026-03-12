// lib/pricing/change-log.ts
// ═══════════════════════════════════════════════════════════════════
// Pricing change logging helper — wraps PriceChangeLog writes.
// Fire-and-forget by default. Never throws.
//
// Sub-task 1: Price Version / Change Records
// Augments existing PriceChangeLog with structured helpers for:
//   - material cost changes
//   - preset edits
//   - setting changes
//   - product pricing config changes
//   - batch / bulk updates
// ═══════════════════════════════════════════════════════════════════

import { prisma } from "@/lib/prisma";

export type ChangeScope = "product" | "material" | "setting" | "preset" | "b2b";

export interface ChangeLogEntry {
  productId?: string | null;
  productSlug?: string | null;
  productName?: string | null;
  scope: ChangeScope;
  field: string;
  labelBefore?: string | null;
  labelAfter?: string | null;
  valueBefore?: unknown;
  valueAfter?: unknown;
  driftPct?: number | null;
  affectedCount?: number;
  operatorId?: string | null;
  operatorName?: string | null;
  note?: string | null;
}

/**
 * Log a single pricing change. Fire-and-forget — never throws.
 */
export async function logPriceChange(entry: ChangeLogEntry): Promise<string | null> {
  try {
    const log = await prisma.priceChangeLog.create({
      data: {
        productId: entry.productId || null,
        productSlug: entry.productSlug || null,
        productName: entry.productName || null,
        scope: entry.scope,
        field: entry.field,
        labelBefore: entry.labelBefore || null,
        labelAfter: entry.labelAfter || null,
        valueBefore: entry.valueBefore ?? null,
        valueAfter: entry.valueAfter ?? null,
        driftPct: entry.driftPct ?? null,
        affectedCount: entry.affectedCount ?? 1,
        operatorId: entry.operatorId || null,
        operatorName: entry.operatorName || null,
        note: entry.note || null,
      },
    });
    return log.id;
  } catch (err) {
    console.error("[change-log] Failed to write PriceChangeLog:", err);
    return null;
  }
}

/**
 * Log a material cost change with automatic drift calculation.
 */
export async function logMaterialChange(params: {
  materialId: string;
  materialName: string;
  field: string; // e.g. "costPerSqft", "rollCost"
  before: number;
  after: number;
  affectedProductCount?: number;
  operator: { id: string; name: string };
  note?: string;
}): Promise<string | null> {
  const drift = params.before > 0
    ? ((params.after - params.before) / params.before) * 100
    : null;

  return logPriceChange({
    scope: "material",
    field: `material.${params.materialName}.${params.field}`,
    labelBefore: `$${params.before.toFixed(4)}`,
    labelAfter: `$${params.after.toFixed(4)}`,
    valueBefore: params.before,
    valueAfter: params.after,
    driftPct: drift,
    affectedCount: params.affectedProductCount ?? 1,
    operatorId: params.operator.id,
    operatorName: params.operator.name,
    note: params.note || null,
  });
}

/**
 * Log a preset configuration change.
 */
export async function logPresetChange(params: {
  presetId: string;
  presetKey: string;
  presetName: string;
  field: string;
  before: unknown;
  after: unknown;
  affectedProductCount?: number;
  operator: { id: string; name: string };
  note?: string;
}): Promise<string | null> {
  return logPriceChange({
    productId: params.presetId,
    productSlug: params.presetKey,
    productName: params.presetName,
    scope: "preset",
    field: `preset.${params.presetKey}.${params.field}`,
    valueBefore: params.before,
    valueAfter: params.after,
    affectedCount: params.affectedProductCount ?? 1,
    operatorId: params.operator.id,
    operatorName: params.operator.name,
    note: params.note || null,
  });
}

/**
 * Log a settings change (e.g. ink_rate_sqft, pricing.* keys).
 */
export async function logSettingChange(params: {
  settingKey: string;
  before: unknown;
  after: unknown;
  operator: { id: string; name: string };
  note?: string;
}): Promise<string | null> {
  return logPriceChange({
    scope: "setting",
    field: `setting.${params.settingKey}`,
    valueBefore: params.before,
    valueAfter: params.after,
    operatorId: params.operator.id,
    operatorName: params.operator.name,
    note: params.note || null,
  });
}

/**
 * Log multiple changes as a batch. Returns array of log IDs.
 */
export async function logBatchChanges(
  entries: ChangeLogEntry[]
): Promise<(string | null)[]> {
  return Promise.all(entries.map(logPriceChange));
}

/**
 * Query recent changes for a given scope.
 */
export async function getRecentChanges(params: {
  scope?: ChangeScope;
  productSlug?: string;
  limit?: number;
}) {
  return prisma.priceChangeLog.findMany({
    where: {
      ...(params.scope ? { scope: params.scope } : {}),
      ...(params.productSlug ? { productSlug: params.productSlug } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: params.limit || 50,
  });
}

/**
 * Get change summary statistics for dashboard.
 */
export async function getChangeSummary(days: number = 30) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const [total, byScope, highDrift] = await Promise.all([
    prisma.priceChangeLog.count({
      where: { createdAt: { gte: since } },
    }),
    prisma.priceChangeLog.groupBy({
      by: ["scope"],
      where: { createdAt: { gte: since } },
      _count: true,
    }),
    prisma.priceChangeLog.count({
      where: {
        createdAt: { gte: since },
        driftPct: { gte: 20 },
      },
    }),
  ]);

  return {
    totalChanges: total,
    highDriftChanges: highDrift,
    byScope: Object.fromEntries(byScope.map((r) => [r.scope, r._count])),
    periodDays: days,
  };
}

/**
 * Detailed change summary with operator breakdown, daily aggregation,
 * and recent high-drift entries — used by the Governance Hub.
 */
export async function getDetailedChangeSummary(params: {
  days?: number;
  groupBy?: "day" | "week";
}): Promise<{
  totalChanges: number;
  highDriftChanges: number;
  byScope: Record<string, number>;
  byOperator: Array<{ operatorId: string; operatorName: string; count: number }>;
  byDay: Array<{ date: string; count: number; highDrift: number }>;
  recentHighDrift: Array<{
    id: string;
    field: string;
    driftPct: number;
    operatorName: string;
    createdAt: string;
    productSlug?: string;
  }>;
  periodDays: number;
}> {
  const days = params.days || 30;
  const since = new Date();
  since.setDate(since.getDate() - days);

  // Run all queries in parallel
  const [total, byScope, highDriftCount, operatorGroups, allChanges, recentHighDriftRows] =
    await Promise.all([
      // Total count
      prisma.priceChangeLog.count({
        where: { createdAt: { gte: since } },
      }),

      // By scope
      prisma.priceChangeLog.groupBy({
        by: ["scope"],
        where: { createdAt: { gte: since } },
        _count: true,
      }),

      // High drift count
      prisma.priceChangeLog.count({
        where: { createdAt: { gte: since }, driftPct: { gte: 20 } },
      }),

      // By operator
      prisma.priceChangeLog.groupBy({
        by: ["operatorId", "operatorName"],
        where: { createdAt: { gte: since } },
        _count: true,
        orderBy: { _count: { id: "desc" } },
      }),

      // All changes in period (for daily aggregation — select only what we need)
      prisma.priceChangeLog.findMany({
        where: { createdAt: { gte: since } },
        select: { createdAt: true, driftPct: true },
        orderBy: { createdAt: "asc" },
      }),

      // Recent high-drift entries (last 10)
      prisma.priceChangeLog.findMany({
        where: { driftPct: { gte: 20 }, createdAt: { gte: since } },
        select: {
          id: true,
          field: true,
          driftPct: true,
          operatorName: true,
          createdAt: true,
          productSlug: true,
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
    ]);

  // Build byOperator array
  const byOperator = operatorGroups.map((g) => ({
    operatorId: g.operatorId || "unknown",
    operatorName: g.operatorName || "Unknown",
    count: g._count,
  }));

  // Build byDay map
  const dayMap = new Map<string, { count: number; highDrift: number }>();
  for (const row of allChanges) {
    const dateKey = row.createdAt.toISOString().slice(0, 10); // "YYYY-MM-DD"
    const existing = dayMap.get(dateKey) || { count: 0, highDrift: 0 };
    existing.count += 1;
    if (row.driftPct !== null && row.driftPct >= 20) existing.highDrift += 1;
    dayMap.set(dateKey, existing);
  }

  // Fill in missing days so the chart has no gaps
  const byDay: Array<{ date: string; count: number; highDrift: number }> = [];
  const cursor = new Date(since);
  const today = new Date();
  while (cursor <= today) {
    const key = cursor.toISOString().slice(0, 10);
    const entry = dayMap.get(key) || { count: 0, highDrift: 0 };
    byDay.push({ date: key, ...entry });
    cursor.setDate(cursor.getDate() + 1);
  }

  // Format recentHighDrift
  const recentHighDrift = recentHighDriftRows.map((r) => ({
    id: r.id,
    field: r.field,
    driftPct: r.driftPct ?? 0,
    operatorName: r.operatorName || "Unknown",
    createdAt: r.createdAt.toISOString(),
    productSlug: r.productSlug || undefined,
  }));

  return {
    totalChanges: total,
    highDriftChanges: highDriftCount,
    byScope: Object.fromEntries(byScope.map((r) => [r.scope, r._count])),
    byOperator,
    byDay,
    recentHighDrift,
    periodDays: days,
  };
}

/**
 * List change history with rich filters — version history view.
 */
export async function listChangeHistory(params: {
  scope?: ChangeScope;
  productSlug?: string;
  productId?: string;
  field?: string;
  operatorId?: string;
  highDriftOnly?: boolean;
  dateFrom?: Date;
  dateTo?: Date;
  page?: number;
  limit?: number;
}) {
  const page = params.page || 1;
  const limit = Math.min(params.limit || 50, 200);

  const where: Record<string, unknown> = {};
  if (params.scope) where.scope = params.scope;
  if (params.productSlug) where.productSlug = params.productSlug;
  if (params.productId) where.productId = params.productId;
  if (params.operatorId) where.operatorId = params.operatorId;
  if (params.field) where.field = { contains: params.field };
  if (params.highDriftOnly) where.driftPct = { gte: 20 };
  if (params.dateFrom || params.dateTo) {
    where.createdAt = {};
    if (params.dateFrom) (where.createdAt as any).gte = params.dateFrom;
    if (params.dateTo) (where.createdAt as any).lte = params.dateTo;
  }

  const [changes, total] = await Promise.all([
    prisma.priceChangeLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.priceChangeLog.count({ where }),
  ]);

  return { changes, total, page, limit };
}
