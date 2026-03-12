// app/api/admin/pricing/profit-alerts/route.ts
// Profit tracking API — returns orders with margin alerts.
// Read-only. Does not modify any data.

import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/admin-auth";
import { getOrdersWithProfitAlerts } from "@/lib/pricing/profit-tracking";
import { alertTypeToAction } from "@/lib/pricing/ops-action";

export async function GET(request: NextRequest) {
  const auth = await requirePermission(request, "pricing", "view");
  if (!auth.authenticated) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const days = Number(searchParams.get("days")) || 30;
    const floorMarginPct = Number(searchParams.get("floor")) || 15;
    const limit = Number(searchParams.get("limit")) || 50;
    const targetOrderId = searchParams.get("orderId") || undefined;
    const targetAlertType = searchParams.get("alertType") || undefined;

    const results = await getOrdersWithProfitAlerts({
      days,
      floorMarginPct,
      limit,
    });

    // Filter to exact order if requested
    const scoped = targetOrderId
      ? results.filter((r) => r.orderId === targetOrderId)
      : results;

    // Enrich each alert with a precise, machine-readable action hint
    let enriched = scoped.map((r) => ({
      ...r,
      alerts: r.alerts.map((a) => ({
        ...a,
        actionHint: alertTypeToAction(a.alertType, {
          orderId: r.orderId,
          orderItemId: a.orderItemId,
          productSlug: a.productName,
        }),
      })),
    }));

    // Filter to specific alert type if requested
    if (targetAlertType) {
      enriched = enriched.map((r) => ({
        ...r,
        alerts: r.alerts.filter((a) => a.alertType === targetAlertType),
      })).filter((r) => r.alerts.length > 0);
    }

    const focused = !!(targetOrderId || targetAlertType);
    const totalAlerts = enriched.reduce((sum, r) => sum + r.alerts.length, 0);

    return NextResponse.json({
      alerts: enriched,
      totalAlerts,
      ordersWithAlerts: enriched.length,
      focused,
      ...(focused && {
        focusParams: {
          orderId: targetOrderId || undefined,
          alertType: targetAlertType || undefined,
        },
        primaryRecord: enriched[0] || null,
      }),
      params: { days, floorMarginPct, limit, orderId: targetOrderId, alertType: targetAlertType },
    });
  } catch (err) {
    console.error("[profit-alerts] GET failed:", err);
    return NextResponse.json({ error: "Failed to compute profit alerts" }, { status: 500 });
  }
}
