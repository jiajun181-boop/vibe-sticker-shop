import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin-auth";

/**
 * GET /api/admin/orders/export
 * Export orders as CSV for accounting / reporting.
 * Query params: ?days=30&status=paid&format=csv
 */
export async function GET(request: NextRequest) {
  const auth = await requirePermission(request, "orders", "view");
  if (!auth.authenticated) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const days = Math.min(365, Math.max(1, parseInt(searchParams.get("days") || "30")));
    const status = searchParams.get("status"); // paid, pending, etc.
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const where: Record<string, unknown> = {
      createdAt: { gte: since },
    };
    if (status) {
      where.paymentStatus = status;
    }

    const orders = await prisma.order.findMany({
      where,
      select: {
        id: true,
        customerEmail: true,
        customerName: true,
        status: true,
        paymentStatus: true,
        productionStatus: true,
        subtotalAmount: true,
        taxAmount: true,
        shippingAmount: true,
        discountAmount: true,
        totalAmount: true,
        deliveryMethod: true,
        tags: true,
        createdAt: true,
        paidAt: true,
        items: {
          select: {
            productName: true,
            quantity: true,
            totalPrice: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 5000,
    });

    const headers = [
      "Order ID",
      "Date",
      "Customer Email",
      "Customer Name",
      "Status",
      "Payment",
      "Production",
      "Items",
      "Qty",
      "Subtotal",
      "Tax",
      "Shipping",
      "Discount",
      "Total",
      "Delivery",
      "Paid Date",
      "Tags",
    ];

    const formatCents = (c: number) => (c / 100).toFixed(2);

    const rows = orders.map((o) => [
      o.id.slice(0, 8),
      o.createdAt.toISOString().split("T")[0],
      o.customerEmail,
      o.customerName || "",
      o.status,
      o.paymentStatus,
      o.productionStatus,
      o.items.map((i) => i.productName).join("; "),
      o.items.reduce((s, i) => s + i.quantity, 0).toString(),
      formatCents(o.subtotalAmount),
      formatCents(o.taxAmount),
      formatCents(o.shippingAmount),
      formatCents(o.discountAmount),
      formatCents(o.totalAmount),
      o.deliveryMethod || "shipping",
      o.paidAt ? o.paidAt.toISOString().split("T")[0] : "",
      o.tags.join("; "),
    ]);

    const csv = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n");

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="orders-${days}d-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error("[Order Export] Error:", error);
    return NextResponse.json(
      { error: "Failed to export orders" },
      { status: 500 }
    );
  }
}
