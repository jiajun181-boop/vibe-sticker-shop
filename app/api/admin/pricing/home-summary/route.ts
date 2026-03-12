// app/api/admin/pricing/home-summary/route.ts
// One compact truth endpoint for the Pricing Center dashboard.
// Returns counts, severity, and high-value action items across all pricing ops signals.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin-auth";
import { getApprovalSummary } from "@/lib/pricing/approval";
import { buildPricingUrl } from "@/lib/pricing/focus";
import { computeQueueSummary } from "@/lib/quotes/workflow";

export type PricingHealthStatus = "healthy" | "issues" | "degraded";

interface SectionHealth {
  count: number;
  severity: "ok" | "warning" | "critical";
  /** Canonical URL for the section's landing — built from focus contract */
  actionUrl: string;
  /** Top actionable item for exact-target landing (when data exists) */
  topTarget?: {
    orderId?: string;
    itemId?: string;
    slug?: string;
    approvalId?: string;
    quoteId?: string;
    label: string;
  };
  error?: string;
}

export async function GET(request: NextRequest) {
  const auth = await requirePermission(request, "pricing", "view");
  if (!auth.authenticated) return auth.response;

  const sections: Record<string, SectionHealth> = {};
  const errors: string[] = [];

  // ── Parallel fetch all pricing ops signals ────────────────────
  const [
    approvalResult,
    missingCostResult,
    profitAlertResult,
    vendorCostResult,
    driftResult,
    // Top-target fetches (lightweight — 1 row each)
    topMissingCostResult,
    topProfitAlertResult,
    topMissingVendorResult,
    // Quote queue signals
    quoteQueueResult,
    topQuoteResult,
  ] = await Promise.allSettled([
    // 1. Pending approvals
    getApprovalSummary(),

    // 2. Missing actual costs (items in recent orders without actualCostCents)
    prisma.orderItem.count({
      where: {
        estimatedCostCents: { gt: 0 },
        actualCostCents: { lte: 0 },
        order: {
          status: { notIn: ["draft", "canceled", "refunded"] },
          createdAt: { gte: thirtyDaysAgo() },
        },
      },
    }),

    // 3. Profit alerts — orders with negative/below-floor margin
    prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*) as count FROM "OrderItem" oi
      JOIN "Order" o ON o.id = oi."orderId"
      WHERE o.status NOT IN ('draft', 'canceled', 'refunded')
        AND o."createdAt" >= ${thirtyDaysAgo()}
        AND oi."actualCostCents" > 0
        AND oi."actualCostCents" > (oi."totalPrice" * 100)
    `.then((r) => Number(r[0]?.count || 0)),

    // 4. Missing vendor costs — fixed-price products without vendor cost entries
    prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(DISTINCT p.id) as count FROM "Product" p
      WHERE p."isActive" = true
        AND p."pricingConfig"::text LIKE '%fixedPrices%'
        AND NOT EXISTS (
          SELECT 1 FROM "VendorCost" vc
          WHERE vc."productSlug" = p.slug AND vc."isActive" = true
        )
    `.then((r) => Number(r[0]?.count || 0)),

    // 5. High-drift changes (>20% in last 7 days)
    prisma.priceChangeLog.count({
      where: {
        driftPct: { gte: 20 },
        createdAt: { gte: sevenDaysAgo() },
      },
    }),

    // 6. Top missing-cost item (for exact-target landing)
    prisma.orderItem.findFirst({
      where: {
        estimatedCostCents: { gt: 0 },
        actualCostCents: { lte: 0 },
        order: {
          status: { notIn: ["draft", "canceled", "refunded"] },
          createdAt: { gte: thirtyDaysAgo() },
        },
      },
      select: { id: true, orderId: true, productName: true },
      orderBy: { createdAt: "desc" },
    }),

    // 7. Top profit-alert item
    prisma.$queryRaw<Array<{ id: string; orderId: string; productName: string }>>`
      SELECT oi.id, oi."orderId", oi."productName" FROM "OrderItem" oi
      JOIN "Order" o ON o.id = oi."orderId"
      WHERE o.status NOT IN ('draft', 'canceled', 'refunded')
        AND o."createdAt" >= ${thirtyDaysAgo()}
        AND oi."actualCostCents" > 0
        AND oi."actualCostCents" > (oi."totalPrice" * 100)
      LIMIT 1
    `.then((r) => r[0] || null),

    // 8. Top missing-vendor-cost product
    prisma.$queryRaw<Array<{ slug: string; name: string }>>`
      SELECT p.slug, p.name FROM "Product" p
      WHERE p."isActive" = true
        AND p."pricingConfig"::text LIKE '%fixedPrices%'
        AND NOT EXISTS (
          SELECT 1 FROM "VendorCost" vc
          WHERE vc."productSlug" = p.slug AND vc."isActive" = true
        )
      LIMIT 1
    `.then((r) => r[0] || null),

    // 9. Quote queue — actionable quotes (new + reviewing + accepted)
    prisma.quoteRequest.groupBy({
      by: ["status"],
      _count: { status: true },
    }),

    // 10. Top actionable quote (oldest first = most urgent)
    prisma.quoteRequest.findFirst({
      where: { status: { in: ["new", "reviewing", "accepted"] } },
      orderBy: { createdAt: "asc" },
      select: { id: true, reference: true, status: true, customerName: true },
    }),
  ]);

  // ── Process results with degradation handling ─────────────────

  // Extract top targets (non-critical if they fail)
  const topMissingCost = topMissingCostResult.status === "fulfilled"
    ? topMissingCostResult.value as { id: string; orderId: string; productName: string } | null
    : null;
  const topProfitAlert = topProfitAlertResult.status === "fulfilled"
    ? topProfitAlertResult.value as { id: string; orderId: string; productName: string } | null
    : null;
  const topMissingVendor = topMissingVendorResult.status === "fulfilled"
    ? topMissingVendorResult.value as { slug: string; name: string } | null
    : null;

  // Approvals
  if (approvalResult.status === "fulfilled") {
    const pending = (approvalResult.value as Record<string, number>).pending || 0;
    sections.pendingApprovals = {
      count: pending,
      severity: pending > 0 ? "warning" : "ok",
      actionUrl: buildPricingUrl({ tab: "governance", section: "approvals" }),
    };
  } else {
    sections.pendingApprovals = { count: 0, severity: "ok", actionUrl: buildPricingUrl({ tab: "governance", section: "approvals" }), error: "fetch_failed" };
    errors.push("approvals");
  }

  // Missing costs
  if (missingCostResult.status === "fulfilled") {
    const count = missingCostResult.value as number;
    sections.missingActualCost = {
      count,
      severity: count > 10 ? "critical" : count > 0 ? "warning" : "ok",
      actionUrl: buildPricingUrl({ tab: "costs" }),
      ...(topMissingCost && {
        topTarget: {
          orderId: topMissingCost.orderId,
          itemId: topMissingCost.id,
          label: topMissingCost.productName || "Order item",
        },
      }),
    };
  } else {
    sections.missingActualCost = { count: 0, severity: "ok", actionUrl: buildPricingUrl({ tab: "costs" }), error: "fetch_failed" };
    errors.push("missingCost");
  }

  // Profit alerts
  if (profitAlertResult.status === "fulfilled") {
    const count = profitAlertResult.value as number;
    sections.profitAlerts = {
      count,
      severity: count > 0 ? "critical" : "ok",
      actionUrl: buildPricingUrl({ tab: "ops", section: "alerts" }),
      ...(topProfitAlert && {
        topTarget: {
          orderId: topProfitAlert.orderId,
          itemId: topProfitAlert.id,
          label: topProfitAlert.productName || "Order item",
        },
      }),
    };
  } else {
    sections.profitAlerts = { count: 0, severity: "ok", actionUrl: buildPricingUrl({ tab: "ops", section: "alerts" }), error: "fetch_failed" };
    errors.push("profitAlerts");
  }

  // Missing vendor costs
  if (vendorCostResult.status === "fulfilled") {
    const count = vendorCostResult.value as number;
    sections.missingVendorCost = {
      count,
      severity: count > 5 ? "critical" : count > 0 ? "warning" : "ok",
      actionUrl: buildPricingUrl({ tab: "governance", section: "vendor" }),
      ...(topMissingVendor && {
        topTarget: {
          slug: topMissingVendor.slug,
          label: topMissingVendor.name,
        },
      }),
    };
  } else {
    sections.missingVendorCost = { count: 0, severity: "ok", actionUrl: buildPricingUrl({ tab: "governance", section: "vendor" }), error: "fetch_failed" };
    errors.push("vendorCost");
  }

  // Quote queue
  if (quoteQueueResult.status === "fulfilled") {
    const rawCounts = quoteQueueResult.value as Array<{ status: string; _count: { status: number } }>;
    const qCounts: Record<string, number> = {};
    for (const row of rawCounts) qCounts[row.status] = row._count.status;

    const topQuote = topQuoteResult.status === "fulfilled"
      ? topQuoteResult.value as { id: string; reference: string; status: string; customerName: string } | null
      : null;
    const qs = computeQueueSummary(qCounts, topQuote ? {
      id: topQuote.id,
      reference: topQuote.reference,
      status: topQuote.status,
      customerName: topQuote.customerName,
      label: `${topQuote.reference} \u2014 ${topQuote.customerName}`,
    } : null);

    sections.quoteQueue = {
      count: qs.actionableCount,
      severity: qs.severity,
      actionUrl: "/admin/quotes",
      ...(qs.topActionable && {
        topTarget: {
          quoteId: qs.topActionable.id,
          label: qs.topActionable.label,
        },
      }),
    };
  } else {
    sections.quoteQueue = { count: 0, severity: "ok", actionUrl: "/admin/quotes", error: "fetch_failed" };
    errors.push("quoteQueue");
  }

  // High drift
  if (driftResult.status === "fulfilled") {
    const count = driftResult.value as number;
    sections.highDrift = {
      count,
      severity: count > 0 ? "critical" : "ok",
      actionUrl: buildPricingUrl({ tab: "governance", section: "changelog" }),
    };
  } else {
    sections.highDrift = { count: 0, severity: "ok", actionUrl: buildPricingUrl({ tab: "governance", section: "changelog" }), error: "fetch_failed" };
    errors.push("drift");
  }

  // ── Compute overall health ──────────────────────────────────────

  const allSeverities = Object.values(sections).map((s) => s.severity);
  const hasCritical = allSeverities.includes("critical");
  const hasWarning = allSeverities.includes("warning");
  const totalActionItems = Object.values(sections).reduce((sum, s) => sum + s.count, 0);

  let health: PricingHealthStatus;
  if (errors.length > 0) {
    health = "degraded";
  } else if (hasCritical || hasWarning) {
    health = "issues";
  } else {
    health = "healthy";
  }

  // ── Build canonical actionItems array ─────────────────────────
  // Primary action contract — UI renders these directly without
  // reconstructing meaning from section counts.

  interface ActionItem {
    /** Stable identifier for this action type */
    key: string;
    /** How many records are affected */
    count: number;
    /** Visual severity for badge/icon rendering */
    severity: "ok" | "warning" | "critical";
    /** i18n key for the action label */
    labelKey: string;
    /** Human-readable summary — UI can render this directly */
    description: string;
    /** Which pricing tab this routes to (for tab switching without URL parsing) */
    tab: string;
    /** Canonical exact-target URL — click destination */
    actionUrl: string;
    /** Exact focus fields for the top record (when available) */
    focusTarget?: {
      orderId?: string;
      itemId?: string;
      slug?: string;
      approvalId?: string;
      quoteId?: string;
    };
    /** Label of the top actionable record (e.g., product name, order item name) */
    topLabel?: string;
  }

  const actionItems: ActionItem[] = [];

  // Only emit action items for non-zero issues
  const s = sections;

  if (s.pendingApprovals && s.pendingApprovals.count > 0) {
    actionItems.push({
      key: "pending_approvals",
      count: s.pendingApprovals.count,
      severity: s.pendingApprovals.severity,
      labelKey: "pricing.action.pending_approvals",
      description: `${s.pendingApprovals.count} pricing approval${s.pendingApprovals.count > 1 ? "s" : ""} waiting for review`,
      tab: "governance",
      actionUrl: s.pendingApprovals.actionUrl,
    });
  }

  if (s.missingActualCost && s.missingActualCost.count > 0) {
    const mc = s.missingActualCost;
    actionItems.push({
      key: "missing_actual_cost",
      count: mc.count,
      severity: mc.severity,
      labelKey: "pricing.action.missing_actual_cost",
      description: `${mc.count} item${mc.count > 1 ? "s" : ""} missing actual cost`,
      tab: "costs",
      actionUrl: mc.topTarget
        ? buildPricingUrl({ tab: "costs", orderId: mc.topTarget.orderId, itemId: mc.topTarget.itemId })
        : mc.actionUrl,
      ...(mc.topTarget && {
        focusTarget: { orderId: mc.topTarget.orderId, itemId: mc.topTarget.itemId },
        topLabel: mc.topTarget.label,
      }),
    });
  }

  if (s.profitAlerts && s.profitAlerts.count > 0) {
    const pa = s.profitAlerts;
    actionItems.push({
      key: "profit_alerts",
      count: pa.count,
      severity: pa.severity,
      labelKey: "pricing.action.profit_alerts",
      description: `${pa.count} item${pa.count > 1 ? "s" : ""} with cost exceeding revenue`,
      tab: "ops",
      actionUrl: pa.topTarget
        ? buildPricingUrl({ tab: "ops", section: "alerts", orderId: pa.topTarget.orderId })
        : pa.actionUrl,
      ...(pa.topTarget && {
        focusTarget: { orderId: pa.topTarget.orderId, itemId: pa.topTarget.itemId },
        topLabel: pa.topTarget.label,
      }),
    });
  }

  if (s.missingVendorCost && s.missingVendorCost.count > 0) {
    const vc = s.missingVendorCost;
    actionItems.push({
      key: "missing_vendor_cost",
      count: vc.count,
      severity: vc.severity,
      labelKey: "pricing.action.missing_vendor_cost",
      description: `${vc.count} outsourced product${vc.count > 1 ? "s" : ""} missing vendor cost`,
      tab: "governance",
      actionUrl: vc.topTarget
        ? buildPricingUrl({ tab: "governance", section: "vendor", slug: vc.topTarget.slug })
        : vc.actionUrl,
      ...(vc.topTarget && {
        focusTarget: { slug: vc.topTarget.slug },
        topLabel: vc.topTarget.label,
      }),
    });
  }

  if (s.highDrift && s.highDrift.count > 0) {
    actionItems.push({
      key: "high_drift",
      count: s.highDrift.count,
      severity: s.highDrift.severity,
      labelKey: "pricing.action.high_drift",
      description: `${s.highDrift.count} high-drift price change${s.highDrift.count > 1 ? "s" : ""} in last 7 days`,
      tab: "governance",
      actionUrl: s.highDrift.actionUrl,
    });
  }

  if (s.quoteQueue && s.quoteQueue.count > 0) {
    const qq = s.quoteQueue;
    actionItems.push({
      key: "quote_queue",
      count: qq.count,
      severity: qq.severity,
      labelKey: "pricing.action.quote_queue",
      description: `${qq.count} quote${qq.count > 1 ? "s" : ""} awaiting action`,
      tab: "quotes",
      actionUrl: qq.topTarget
        ? `/admin/quotes/${qq.topTarget.quoteId}`
        : qq.actionUrl,
      ...(qq.topTarget && {
        focusTarget: { quoteId: qq.topTarget.quoteId },
        topLabel: qq.topTarget.label,
      }),
    });
  }

  // Sort: critical first, then warning, then by count descending
  const severityOrder = { critical: 0, warning: 1, ok: 2 };
  actionItems.sort((a, b) => {
    const sd = severityOrder[a.severity] - severityOrder[b.severity];
    return sd !== 0 ? sd : b.count - a.count;
  });

  return NextResponse.json({
    health,
    totalActionItems,
    actionItems,
    sections,
    errors: errors.length > 0 ? errors : undefined,
    generatedAt: new Date().toISOString(),
  });
}

function thirtyDaysAgo(): Date {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d;
}

function sevenDaysAgo(): Date {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return d;
}
