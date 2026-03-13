import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin-auth";

export async function GET(req: Request) {
  const auth = await requirePermission(req, "settings", "view");
  if (!auth.authenticated) return auth.response;

  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  try {
    // Run all health checks in parallel
    const [
      productsNoPricing,
      productsNoImageRaw,
      staleJobs,
      unpaidInvoices,
      ordersNoProduction,
      recentWebhookErrors,
      missingActualCost,
      lowMarginOrders,
      totalProducts,
      totalOrders,
      totalJobs,
    ] = await Promise.all([
      // Active products with no pricing source (no preset AND no basePrice)
      prisma.product.count({
        where: {
          isActive: true,
          pricingPresetId: null,
          OR: [{ basePrice: null }, { basePrice: 0 }],
        },
      }),

      // Active products without any images (legacy ProductImage or AssetLink)
      prisma.$queryRaw`
        SELECT COUNT(*)::int AS count FROM "Product" p
        WHERE p."isActive" = true
          AND NOT EXISTS (SELECT 1 FROM "ProductImage" pi WHERE pi."productId" = p.id)
          AND NOT EXISTS (SELECT 1 FROM "AssetLink" al WHERE al."entityType" = 'product' AND al."entityId" = p.id)
      ` as Promise<Array<{ count: number }>>,

      // Production jobs stuck in queued for >3 days
      prisma.productionJob.count({
        where: {
          status: "queued",
          createdAt: { lt: sevenDaysAgo },
        },
      }),

      // Unpaid invoices older than 7 days
      prisma.order.count({
        where: {
          paymentStatus: "unpaid",
          status: { not: "canceled" },
          createdAt: { lt: sevenDaysAgo },
        },
      }),

      // Paid orders without any production jobs
      prisma.$queryRaw`
        SELECT COUNT(*)::int as count FROM "Order" o
        WHERE o.status = 'paid'
        AND o."productionStatus" = 'not_started'
        AND o."createdAt" < ${oneDayAgo}
        AND NOT EXISTS (
          SELECT 1 FROM "ProductionJob" pj
          JOIN "OrderItem" oi ON oi.id = pj."orderItemId"
          WHERE oi."orderId" = o.id
        )
      ` as Promise<Array<{ count: number }>>,

      // Orders created in last 24h (proxy for webhook activity)
      prisma.order.count({
        where: {
          status: "paid",
          createdAt: { gte: oneDayAgo },
        },
      }),

      // Shipped orders missing actual cost entry
      prisma.$queryRaw`
        SELECT COUNT(DISTINCT o.id)::int as count FROM "Order" o
        JOIN "OrderItem" oi ON oi."orderId" = o.id
        WHERE o."productionStatus" IN ('shipped', 'completed')
        AND oi."actualCostCents" = 0
        AND oi."estimatedCostCents" > 0
        AND oi."productType" != 'service'
      ` as Promise<Array<{ count: number }>>,

      // Orders with margin below 15%
      prisma.$queryRaw`
        SELECT COUNT(*)::int as count FROM "Order" o
        WHERE o.status = 'paid'
        AND o."totalAmount" > 0
        AND o."materialCost" > 0
        AND ((o."totalAmount" - o."materialCost" - o."laborCost")::float / o."totalAmount") < 0.15
      ` as Promise<Array<{ count: number }>>,

      // Totals for context
      prisma.product.count({ where: { isActive: true } }),
      prisma.order.count(),
      prisma.productionJob.count(),
    ]);

    const productsNoImage = Array.isArray(productsNoImageRaw) ? (productsNoImageRaw[0]?.count || 0) : 0;
    const noProductionCount = Array.isArray(ordersNoProduction) ? (ordersNoProduction[0]?.count || 0) : 0;
    const missingCostCount = Array.isArray(missingActualCost) ? (missingActualCost[0]?.count || 0) : 0;
    const lowMarginCount = Array.isArray(lowMarginOrders) ? (lowMarginOrders[0]?.count || 0) : 0;

    const checks = [
      {
        id: "products_no_pricing",
        label: "Products without pricing",
        status: productsNoPricing === 0 ? "ok" : productsNoPricing <= 5 ? "warning" : "critical",
        count: productsNoPricing,
        total: totalProducts,
        hint: "Active products with no pricing preset and no base price",
      },
      {
        id: "products_no_image",
        label: "Products without images",
        status: productsNoImage === 0 ? "ok" : productsNoImage <= 10 ? "warning" : "critical",
        count: productsNoImage,
        total: totalProducts,
        hint: "Active products with no images (legacy or asset system)",
      },
      {
        id: "stale_production_jobs",
        label: "Stale production jobs (>7 days queued)",
        status: staleJobs === 0 ? "ok" : staleJobs <= 3 ? "warning" : "critical",
        count: staleJobs,
        total: totalJobs,
        hint: "Jobs stuck in queued status for over a week",
      },
      {
        id: "unpaid_invoices",
        label: "Overdue unpaid invoices (>7 days)",
        status: unpaidInvoices === 0 ? "ok" : unpaidInvoices <= 5 ? "warning" : "critical",
        count: unpaidInvoices,
        hint: "Invoice orders still unpaid after 7 days",
      },
      {
        id: "orders_no_production",
        label: "Paid orders without production jobs",
        status: noProductionCount === 0 ? "ok" : "critical",
        count: noProductionCount,
        hint: "Orders paid >24h ago with no production jobs — webhook may have failed",
      },
      {
        id: "missing_actual_cost",
        label: "Shipped orders missing actual cost",
        status: missingCostCount === 0 ? "ok" : missingCostCount <= 10 ? "warning" : "critical",
        count: missingCostCount,
        hint: "Shipped/delivered orders where operators haven't entered actual production costs",
      },
      {
        id: "low_margin_orders",
        label: "Low-margin orders (<15%)",
        status: lowMarginCount === 0 ? "ok" : lowMarginCount <= 5 ? "warning" : "critical",
        count: lowMarginCount,
        hint: "Orders where margin is below the 15% floor threshold",
      },
      {
        id: "recent_orders",
        label: "Orders in last 24 hours",
        status: "info",
        count: recentWebhookErrors,
        hint: "Paid orders created in the last 24 hours — indicates webhook is working",
      },
    ];

    const overallStatus = checks.some((c) => c.status === "critical")
      ? "critical"
      : checks.some((c) => c.status === "warning")
        ? "warning"
        : "ok";

    return NextResponse.json({
      status: overallStatus,
      checkedAt: now.toISOString(),
      checks,
      summary: {
        totalProducts,
        totalOrders,
        totalJobs,
      },
    });
  } catch (error) {
    console.error("[System Health] Error:", error);
    return NextResponse.json(
      { error: "Failed to run system health checks" },
      { status: 500 }
    );
  }
}
