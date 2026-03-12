// app/api/admin/pricing/change-summary/route.ts
// Price change log summary — aggregated stats for dashboard.
// Supports basic summary (default) and detailed summary (when groupBy is set).

import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/admin-auth";
import { getChangeSummary, getDetailedChangeSummary } from "@/lib/pricing/change-log";

export async function GET(request: NextRequest) {
  const auth = await requirePermission(request, "pricing", "view");
  if (!auth.authenticated) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const days = Number(searchParams.get("days")) || 30;
    const groupBy = searchParams.get("groupBy") as "day" | "week" | null;

    // When groupBy is specified, return the detailed summary
    if (groupBy === "day" || groupBy === "week") {
      const detailed = await getDetailedChangeSummary({ days, groupBy });
      return NextResponse.json(detailed);
    }

    // Default: basic summary (backward compatible)
    const summary = await getChangeSummary(days);
    return NextResponse.json(summary);
  } catch (err) {
    console.error("[change-summary] GET failed:", err);
    return NextResponse.json({ error: "Failed to get change summary" }, { status: 500 });
  }
}
