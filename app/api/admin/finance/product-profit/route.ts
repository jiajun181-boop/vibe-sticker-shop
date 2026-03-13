import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin-auth";

/**
 * GET /api/admin/finance/product-profit
 *
 * Per-product profit ranking — aggregates revenue and costs by product name.
 * Query params: from, to, limit (default 30)
 */
export async function GET(request: NextRequest) {
  const auth = await requirePermission(request, "analytics", "view");
  if (!auth.authenticated) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "30")));

    // Build date filter
    const dateFilter: string[] = [];
    const params: unknown[] = [];
    // Always filter to paid orders
    dateFilter.push(`o."paymentStatus" = 'paid'`);
    if (from) {
      params.push(new Date(from));
      dateFilter.push(`o."paidAt" >= $${params.length}`);
    }
    if (to) {
      params.push(new Date(to));
      dateFilter.push(`o."paidAt" <= $${params.length}`);
    }

    const whereClause = dateFilter.join(" AND ");

    // Aggregate by productName from OrderItem joined with Order
    const rows = await prisma.$queryRawUnsafe(`
      SELECT
        oi."productName" AS "productName",
        COUNT(DISTINCT o."id") AS "orderCount",
        SUM(oi."quantity") AS "totalQty",
        SUM(oi."totalPrice") AS "revenue",
        SUM(oi."materialCostCents") AS "materialCost",
        SUM(CASE WHEN oi."laborMinutes" > 0 THEN oi."laborMinutes" * 50 ELSE 0 END) AS "laborCost"
      FROM "OrderItem" oi
      JOIN "Order" o ON o."id" = oi."orderId"
      WHERE ${whereClause}
        AND oi."productName" IS NOT NULL
        AND oi."productName" != ''
      GROUP BY oi."productName"
      ORDER BY SUM(oi."totalPrice") DESC
      LIMIT ${limit}
    `, ...params) as Array<{
      productName: string;
      orderCount: bigint;
      totalQty: bigint;
      revenue: bigint;
      materialCost: bigint;
      laborCost: bigint;
    }>;

    const products = rows.map((r) => {
      const revenue = Number(r.revenue) || 0;
      const materialCost = Number(r.materialCost) || 0;
      // Estimate labor cost: laborMinutes * $0.50/min (50 cents)
      const laborCost = Number(r.laborCost) || 0;
      const totalCost = materialCost + laborCost;
      const profit = revenue - totalCost;
      const marginPct = revenue > 0 ? Math.round((profit / revenue) * 10000) / 100 : 0;

      return {
        productName: r.productName,
        orderCount: Number(r.orderCount),
        totalQty: Number(r.totalQty),
        revenue,
        costs: { material: materialCost, labor: laborCost, total: totalCost },
        profit,
        marginPct,
      };
    });

    // Aggregated totals
    const totalRevenue = products.reduce((s, p) => s + p.revenue, 0);
    const totalCost = products.reduce((s, p) => s + p.costs.total, 0);
    const totalProfit = totalRevenue - totalCost;

    return NextResponse.json({
      products,
      summary: {
        totalRevenue,
        totalCost,
        totalProfit,
        avgMarginPct: totalRevenue > 0 ? Math.round((totalProfit / totalRevenue) * 10000) / 100 : 0,
        productCount: products.length,
      },
    });
  } catch (err) {
    console.error("[Product Profit GET] Error:", err);
    return NextResponse.json({ error: "Failed to fetch product profitability" }, { status: 500 });
  }
}
