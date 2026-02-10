import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity-log";
import { requireAdminAuth } from "@/lib/admin-auth";

export async function POST(request: NextRequest) {
  const auth = requireAdminAuth(request);
  if (!auth.authenticated) return auth.response;

  try {
    const body = await request.json();
    const { orderIds } = body;

    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json(
        { error: "orderIds must be a non-empty array" },
        { status: 400 }
      );
    }

    // Fetch all matching orders with their items
    const orders = await prisma.order.findMany({
      where: { id: { in: orderIds } },
      include: { items: true },
      orderBy: { createdAt: "desc" },
    });

    // Build CSV
    const headers = [
      "Order ID",
      "Customer Name",
      "Customer Email",
      "Status",
      "Payment Status",
      "Subtotal",
      "Tax",
      "Shipping",
      "Total",
      "Currency",
      "Created Date",
      "Items",
    ];

    const csvRows: string[] = [headers.join(",")];

    for (const order of orders) {
      // Concatenate item names with quantities
      const itemsSummary = order.items
        .map((item) => `${item.productName} (x${item.quantity})`)
        .join(", ");

      const row = [
        JSON.stringify(order.id),
        JSON.stringify(order.customerName ?? ""),
        JSON.stringify(order.customerEmail),
        JSON.stringify(order.status),
        JSON.stringify(order.paymentStatus),
        JSON.stringify((order.subtotalAmount / 100).toFixed(2)),
        JSON.stringify((order.taxAmount / 100).toFixed(2)),
        JSON.stringify((order.shippingAmount / 100).toFixed(2)),
        JSON.stringify((order.totalAmount / 100).toFixed(2)),
        JSON.stringify(order.currency),
        JSON.stringify(order.createdAt.toISOString()),
        JSON.stringify(itemsSummary),
      ];

      csvRows.push(row.join(","));
    }

    const csvContent = csvRows.join("\n");

    // Fire-and-forget activity log
    logActivity({
      action: "bulk_export",
      entity: "order",
      details: {
        orderIds,
        count: orders.length,
      },
    });

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": 'attachment; filename="orders-export.csv"',
      },
    });
  } catch (error) {
    console.error("[Orders Bulk Export] Error:", error);
    return NextResponse.json(
      { error: "Failed to export orders" },
      { status: 500 }
    );
  }
}
