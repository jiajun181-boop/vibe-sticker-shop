// app/api/admin/pricing/profit-alerts/route.ts
// Profit tracking API — returns orders with margin alerts.
// Read-only. Does not modify any data.

import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/admin-auth";
import { getOrdersWithProfitAlerts } from "@/lib/pricing/profit-tracking";

export async function GET(request: NextRequest) {
  const auth = await requirePermission(request, "pricing", "view");
  if (!auth.authenticated) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const days = Number(searchParams.get("days")) || 30;
    const floorMarginPct = Number(searchParams.get("floor")) || 15;
    const limit = Number(searchParams.get("limit")) || 50;

    const results = await getOrdersWithProfitAlerts({
      days,
      floorMarginPct,
      limit,
    });

    return NextResponse.json({
      alerts: results,
      totalAlerts: results.reduce((sum, r) => sum + r.alerts.length, 0),
      ordersWithAlerts: results.length,
      params: { days, floorMarginPct, limit },
    });
  } catch (err) {
    console.error("[profit-alerts] GET failed:", err);
    return NextResponse.json({ error: "Failed to compute profit alerts" }, { status: 500 });
  }
}
