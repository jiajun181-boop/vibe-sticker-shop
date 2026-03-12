// app/api/admin/pricing/profit-alerts/needs-actual/route.ts
// ═══════════════════════════════════════════════════════════════════
// Continuous reminder API — orders that are shipped/completed but
// still missing actual cost data. Groups by category and urgency.
//
// GET ?days=60&limit=50&category=shipped_missing_actual
// ═══════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/admin-auth";
import { getOrdersNeedingActualCost } from "@/lib/pricing/actual-cost";

export async function GET(request: NextRequest) {
  const auth = await requirePermission(request, "pricing", "view");
  if (!auth.authenticated) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const days = Number(searchParams.get("days")) || 60;
    const limit = Number(searchParams.get("limit")) || 50;
    const categoryParam = searchParams.get("category") || undefined;

    // Validate category if provided
    const validCategories = ["shipped_missing_actual", "outsourced_missing_vendor_actual"] as const;
    let category: typeof validCategories[number] | undefined;
    if (categoryParam) {
      if (!validCategories.includes(categoryParam as typeof validCategories[number])) {
        return NextResponse.json(
          { error: `Invalid category. Valid values: ${validCategories.join(", ")}` },
          { status: 400 }
        );
      }
      category = categoryParam as typeof validCategories[number];
    }

    const orders = await getOrdersNeedingActualCost({ days, limit, category });

    // Group by category
    const shippedMissing = orders.filter((o) => o.category === "shipped_missing_actual");
    const outsourcedMissing = orders.filter((o) => o.category === "outsourced_missing_vendor_actual");

    // Group by urgency
    const urgencyCounts = { low: 0, medium: 0, high: 0 };
    for (const order of orders) {
      urgencyCounts[order.urgency]++;
    }

    return NextResponse.json({
      totalCount: orders.length,
      groups: {
        shipped_missing_actual: {
          count: shippedMissing.length,
          orders: shippedMissing,
        },
        outsourced_missing_vendor_actual: {
          count: outsourcedMissing.length,
          orders: outsourcedMissing,
        },
      },
      urgency: urgencyCounts,
      params: { days, limit, category: category || "all" },
    });
  } catch (err) {
    console.error("[needs-actual] GET failed:", err);
    return NextResponse.json(
      { error: "Failed to fetch orders needing actual cost" },
      { status: 500 }
    );
  }
}
