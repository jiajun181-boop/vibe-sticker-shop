// app/api/admin/pricing/approvals/route.ts
// Pricing approval workflow API.
// GET: list pending approvals
// POST: create approval request
// PATCH: approve or reject

import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/admin-auth";
import {
  createApprovalRequest,
  approveRequest,
  rejectRequest,
  listPendingApprovals,
  getApprovalSummary,
} from "@/lib/pricing/approval";
import { canEditPricing, canApprovePricing } from "@/lib/pricing/pricing-permissions";

export async function GET(request: NextRequest) {
  const auth = await requirePermission(request, "pricing", "view");
  if (!auth.authenticated) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const summaryOnly = searchParams.get("summary") === "true";

    if (summaryOnly) {
      const summary = await getApprovalSummary();
      return NextResponse.json(summary);
    }

    const limit = Number(searchParams.get("limit")) || 50;
    const approvals = await listPendingApprovals(limit);
    return NextResponse.json({ approvals });
  } catch (err) {
    console.error("[approvals] GET failed:", err);
    return NextResponse.json({ error: "Failed to list approvals" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requirePermission(request, "pricing", "view");
  if (!auth.authenticated) return auth.response;

  // Need at least edit-level to request changes
  if (!canEditPricing(auth.user.role)) {
    return NextResponse.json(
      { error: "Insufficient pricing tier to request changes" },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();

    const id = await createApprovalRequest({
      changeType: body.changeType,
      scope: body.scope,
      targetId: body.targetId,
      targetSlug: body.targetSlug,
      targetName: body.targetName,
      description: body.description || "",
      changeDiff: body.changeDiff,
      driftPct: body.driftPct,
      affectedCount: body.affectedCount,
      requester: {
        id: auth.user.id,
        name: auth.user.name || auth.user.email,
        role: auth.user.role,
      },
      expiresInDays: body.expiresInDays,
    });

    return NextResponse.json({ id });
  } catch (err) {
    console.error("[approvals] POST failed:", err);
    return NextResponse.json({ error: "Failed to create approval" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await requirePermission(request, "pricing", "view");
  if (!auth.authenticated) return auth.response;

  if (!canApprovePricing(auth.user.role)) {
    return NextResponse.json(
      { error: "Insufficient pricing tier to review approvals" },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { approvalId, action, note } = body;

    if (!approvalId || !action) {
      return NextResponse.json({ error: "approvalId and action required" }, { status: 400 });
    }

    const reviewer = {
      id: auth.user.id,
      name: auth.user.name || auth.user.email,
      role: auth.user.role,
    };

    let result;
    if (action === "approve") {
      result = await approveRequest({ approvalId, reviewer, note });
    } else if (action === "reject") {
      result = await rejectRequest({ approvalId, reviewer, note });
    } else {
      return NextResponse.json({ error: "Invalid action. Use 'approve' or 'reject'" }, { status: 400 });
    }

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[approvals] PATCH failed:", err);
    return NextResponse.json({ error: "Failed to process approval" }, { status: 500 });
  }
}
