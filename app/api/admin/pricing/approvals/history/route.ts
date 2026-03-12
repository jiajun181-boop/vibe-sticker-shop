// app/api/admin/pricing/approvals/history/route.ts
// Approval history API — list all approvals with filters and pagination.

import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/admin-auth";
import { listApprovalHistory } from "@/lib/pricing/approval";

export async function GET(request: NextRequest) {
  const auth = await requirePermission(request, "pricing", "view");
  if (!auth.authenticated) return auth.response;

  try {
    const { searchParams } = new URL(request.url);

    const status = searchParams.get("status") || undefined;
    const changeType = searchParams.get("changeType") || undefined;
    const requesterId = searchParams.get("requesterId") || undefined;
    const page = Number(searchParams.get("page")) || 1;
    const limit = Math.min(Number(searchParams.get("limit")) || 30, 100);

    const result = await listApprovalHistory({
      status,
      changeType,
      requesterId,
      page,
      limit,
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error("[approvals/history] GET failed:", err);
    return NextResponse.json(
      { error: "Failed to load approval history" },
      { status: 500 }
    );
  }
}
