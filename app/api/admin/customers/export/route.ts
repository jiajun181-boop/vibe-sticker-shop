import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin-auth";

/**
 * GET /api/admin/customers/export
 * Export customers as CSV for marketing / CRM use.
 * Query params: ?segment=b2b|b2c|all&minOrders=0&minSpend=0
 */
export async function GET(request: NextRequest) {
  const auth = await requirePermission(request, "customers", "view");
  if (!auth.authenticated) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const segment = searchParams.get("segment") || "all";
    const minOrders = parseInt(searchParams.get("minOrders") || "0");

    // Build where clause
    const where: Record<string, unknown> = {};
    if (segment === "b2b") where.accountType = "B2B";
    if (segment === "b2c") where.accountType = "B2C";

    const customers = await prisma.user.findMany({
      where,
      select: {
        email: true,
        name: true,
        phone: true,
        companyName: true,
        accountType: true,
        partnerTier: true,
        smsOptIn: true,
        createdAt: true,
        _count: {
          select: {
            orders: { where: { paymentStatus: "paid" } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 10000,
    });

    // Filter by minimum orders if specified
    const filtered = minOrders > 0
      ? customers.filter((c) => c._count.orders >= minOrders)
      : customers;

    // Build CSV
    const headers = [
      "Email",
      "Name",
      "Phone",
      "Company",
      "Account Type",
      "Partner Tier",
      "SMS Opt-In",
      "Total Orders",
      "Joined",
    ];

    const rows = filtered.map((c) => [
      c.email,
      c.name || "",
      c.phone || "",
      c.companyName || "",
      c.accountType,
      c.partnerTier || "",
      c.smsOptIn ? "Yes" : "No",
      c._count.orders.toString(),
      c.createdAt.toISOString().split("T")[0],
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
        "Content-Disposition": `attachment; filename="customers-${segment}-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error("[Customer Export] Error:", error);
    return NextResponse.json(
      { error: "Failed to export customers" },
      { status: 500 }
    );
  }
}
