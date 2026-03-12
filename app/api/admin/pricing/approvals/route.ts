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
  listApprovalHistory,
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
    const status = searchParams.get("status") || undefined;
    const approvalId = searchParams.get("approvalId") || undefined;
    const targetSlug = searchParams.get("slug") || undefined;

    // Exact-target: fetch single approval by ID
    if (approvalId) {
      const { prisma } = await import("@/lib/prisma");
      const approval = await prisma.pricingApproval.findUnique({ where: { id: approvalId } });
      if (!approval) {
        return NextResponse.json({ error: "Approval not found" }, { status: 404 });
      }
      return NextResponse.json({
        approvals: [approval],
        total: 1,
        focused: true,
        focusParams: { approvalId },
        primaryRecord: approval,
      });
    }

    // Filtered list: by status and/or target slug
    if (status || targetSlug) {
      const history = await listApprovalHistory({ status, page: 1, limit });
      // Further filter by targetSlug if provided
      const filtered = targetSlug
        ? history.approvals.filter((a: any) => a.targetSlug === targetSlug)
        : history.approvals;
      return NextResponse.json({
        approvals: filtered,
        total: filtered.length,
        focused: !!(targetSlug),
        ...(targetSlug && {
          focusParams: { slug: targetSlug },
          primaryRecord: filtered[0] || null,
        }),
      });
    }

    const approvals = await listPendingApprovals(limit);
    return NextResponse.json({ approvals, focused: false });
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

    // Return updated approval state + remaining count so the UI can
    // immediately reflect the resolution without re-fetching.
    let updatedApproval = null;
    let pendingCount = 0;
    try {
      const { prisma } = await import("@/lib/prisma");
      [updatedApproval, pendingCount] = await Promise.all([
        prisma.pricingApproval.findUnique({ where: { id: approvalId } }),
        prisma.pricingApproval.count({ where: { status: "pending" } }),
      ]);
    } catch (_e) {
      // Non-critical: base success response is sufficient
    }

    return NextResponse.json({
      success: true,
      approval: updatedApproval,
      remainingPending: pendingCount,
      refreshHint: { invalidates: ["pendingApprovals"] },
    });
  } catch (err) {
    console.error("[approvals] PATCH failed:", err);
    return NextResponse.json({ error: "Failed to process approval" }, { status: 500 });
  }
}
