import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin-auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ email: string }> }
) {
  const auth = await requirePermission(request, "customers", "view");
  if (!auth.authenticated) return auth.response;

  const { email: rawEmail } = await params;
  const email = decodeURIComponent(rawEmail);

  try {
    // Fetch all orders for this customer
    const orders = await prisma.order.findMany({
      where: { customerEmail: email },
      include: {
        items: {
          select: { productName: true, quantity: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    if (orders.length === 0) {
      return NextResponse.json({
        totalOrders: 0,
        lifetimeSpend: 0,
        avgOrderValue: 0,
        firstOrderDate: null,
        lastOrderDate: null,
        daysSinceLastOrder: null,
        orderFrequency: 0,
        topProducts: [],
        segment: "New",
      });
    }

    // Paid orders for spend calculations
    const paidOrders = orders.filter(
      (o) => o.status === "paid" || o.paymentStatus === "paid"
    );

    const totalOrders = orders.length;
    const lifetimeSpend = paidOrders.reduce(
      (sum, o) => sum + (o.totalAmount || 0),
      0
    );
    const avgOrderValue =
      paidOrders.length > 0 ? Math.round(lifetimeSpend / paidOrders.length) : 0;

    const firstOrderDate = orders[0].createdAt;
    const lastOrderDate = orders[orders.length - 1].createdAt;
    const now = new Date();
    const daysSinceLastOrder = Math.floor(
      (now.getTime() - new Date(lastOrderDate).getTime()) / (1000 * 60 * 60 * 24)
    );

    // Order frequency: orders per month since first order
    const monthsSinceFirst = Math.max(
      1,
      (now.getTime() - new Date(firstOrderDate).getTime()) /
        (1000 * 60 * 60 * 24 * 30)
    );
    const orderFrequency = Math.round((totalOrders / monthsSinceFirst) * 10) / 10;

    // Top products
    const productCounts: Record<string, number> = {};
    for (const order of orders) {
      for (const item of order.items) {
        const name = item.productName || "Unknown";
        productCounts[name] = (productCounts[name] || 0) + item.quantity;
      }
    }
    const topProducts = Object.entries(productCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    // Customer segment
    let segment = "New";
    const lifetimeSpendDollars = lifetimeSpend / 100;

    if (lifetimeSpendDollars > 5000 || totalOrders > 20) {
      segment = "VIP";
    } else if (lifetimeSpendDollars > 500 || totalOrders > 5) {
      segment = "Regular";
    } else if (totalOrders < 3) {
      segment = "New";
    }

    // Override: At Risk if last order > 90 days ago and was previously regular+
    if (
      daysSinceLastOrder > 90 &&
      (segment === "Regular" || segment === "VIP")
    ) {
      segment = "At Risk";
    }

    return NextResponse.json({
      totalOrders,
      lifetimeSpend,
      avgOrderValue,
      firstOrderDate,
      lastOrderDate,
      daysSinceLastOrder,
      orderFrequency,
      topProducts,
      segment,
    });
  } catch (err) {
    console.error("[Customer stats] Error:", err);
    return NextResponse.json(
      { error: "Failed to fetch customer stats" },
      { status: 500 }
    );
  }
}
