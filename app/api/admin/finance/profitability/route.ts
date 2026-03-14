import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  const auth = await requirePermission(request, "finance", "view");
  if (!auth.authenticated) return auth.response;

  try {
    const { searchParams } = new URL(request.url);

    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const sort = searchParams.get("sort") || "createdAt";
    const rawOrder = searchParams.get("order") || "desc";
    const order = rawOrder === "asc" ? "asc" : "desc";

    const where: Record<string, unknown> = {
      paymentStatus: "paid",
    };

    if (from || to) {
      const dateFilter: Record<string, Date> = {};
      if (from) dateFilter.gte = new Date(from);
      if (to) dateFilter.lte = new Date(to);
      where.paidAt = dateFilter;
    }

    const ALLOWED_SORT_FIELDS = ["createdAt", "paidAt", "totalAmount"];
    const sortField = ALLOWED_SORT_FIELDS.includes(sort) ? sort : "createdAt";

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        select: {
          id: true,
          customerEmail: true,
          customerName: true,
          totalAmount: true,
          subtotalAmount: true,
          taxAmount: true,
          shippingAmount: true,
          discountAmount: true,
          materialCost: true,
          laborCost: true,
          shippingCost: true,
          paidAt: true,
          createdAt: true,
          items: {
            select: {
              productName: true,
              quantity: true,
              totalPrice: true,
              materialCostCents: true,
              laborMinutes: true,
            },
          },
        },
        orderBy: { [sortField]: order },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.order.count({ where }),
    ]);

    // Calculate profitability for each order
    const ordersWithProfit = orders.map((o) => {
      const revenue = o.totalAmount;
      const totalCost = o.materialCost + o.laborCost + o.shippingCost;
      const profit = revenue - totalCost;
      const marginPercent = revenue > 0
        ? Math.round((profit / revenue) * 10000) / 100
        : 0;

      return {
        id: o.id,
        customerEmail: o.customerEmail,
        customerName: o.customerName,
        revenue,
        subtotalAmount: o.subtotalAmount,
        taxAmount: o.taxAmount,
        shippingAmount: o.shippingAmount,
        discountAmount: o.discountAmount,
        costs: {
          material: o.materialCost,
          labor: o.laborCost,
          shipping: o.shippingCost,
          total: totalCost,
        },
        profit,
        marginPercent,
        paidAt: o.paidAt,
        createdAt: o.createdAt,
        items: o.items,
      };
    });

    // Aggregate stats
    const totalRevenue = ordersWithProfit.reduce((sum, o) => sum + o.revenue, 0);
    const totalCosts = ordersWithProfit.reduce((sum, o) => sum + o.costs.total, 0);
    const totalProfit = totalRevenue - totalCosts;
    const avgMarginPercent = totalRevenue > 0
      ? Math.round((totalProfit / totalRevenue) * 10000) / 100
      : 0;

    return NextResponse.json({
      data: ordersWithProfit,
      summary: {
        totalRevenue,
        totalCosts,
        totalProfit,
        avgMarginPercent,
        orderCount: total,
      },
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("[Finance Profitability GET] Error:", err);
    return NextResponse.json(
      { error: "Failed to fetch profitability data" },
      { status: 500 }
    );
  }
}
