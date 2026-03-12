// lib/pricing/approval.ts
// ═══════════════════════════════════════════════════════════════════
// Pricing approval workflow — create, review, list pending approvals.
// Works with PricingApproval model and pricing-permissions tiers.
//
// Sub-task 3: Approval Mechanism
// ═══════════════════════════════════════════════════════════════════

import { prisma } from "@/lib/prisma";
import { canApprovePricing, checkApprovalRequired } from "./pricing-permissions";
import { logPriceChange } from "./change-log";

export interface ApprovalRequest {
  changeType: string;
  scope?: string;
  targetId?: string;
  targetSlug?: string;
  targetName?: string;
  description: string;
  changeDiff?: unknown;
  driftPct?: number;
  affectedCount?: number;
  requester: { id: string; name: string; role: string };
  expiresInDays?: number;
}

/**
 * Create a pending approval request.
 */
export async function createApprovalRequest(req: ApprovalRequest): Promise<string> {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + (req.expiresInDays || 7));

  const approval = await prisma.pricingApproval.create({
    data: {
      changeType: req.changeType,
      scope: req.scope || "product",
      targetId: req.targetId || null,
      targetSlug: req.targetSlug || null,
      targetName: req.targetName || null,
      description: req.description,
      changeDiff: req.changeDiff ?? null,
      driftPct: req.driftPct ?? null,
      affectedCount: req.affectedCount ?? 1,
      requesterId: req.requester.id,
      requesterName: req.requester.name,
      requesterRole: req.requester.role,
      expiresAt,
    },
  });

  return approval.id;
}

/**
 * Approve a pending request. Only roles with manager+ tier can approve.
 */
export async function approveRequest(params: {
  approvalId: string;
  reviewer: { id: string; name: string; role: string };
  note?: string;
}): Promise<{ success: boolean; error?: string }> {
  if (!canApprovePricing(params.reviewer.role)) {
    return { success: false, error: "Insufficient pricing tier to approve" };
  }

  const approval = await prisma.pricingApproval.findUnique({
    where: { id: params.approvalId },
  });

  if (!approval) return { success: false, error: "Approval not found" };
  if (approval.status !== "pending") {
    return { success: false, error: `Already ${approval.status}` };
  }
  if (approval.expiresAt && approval.expiresAt < new Date()) {
    await prisma.pricingApproval.update({
      where: { id: params.approvalId },
      data: { status: "expired" },
    });
    return { success: false, error: "Approval request has expired" };
  }

  // Record the approval
  await prisma.pricingApproval.update({
    where: { id: params.approvalId },
    data: {
      status: "approved",
      reviewerId: params.reviewer.id,
      reviewerName: params.reviewer.name,
      reviewerRole: params.reviewer.role,
      reviewNote: params.note || null,
      reviewedAt: new Date(),
    },
  });

  // Log to PriceChangeLog as well
  const logId = await logPriceChange({
    productSlug: approval.targetSlug,
    productName: approval.targetName,
    scope: approval.scope as "product" | "material" | "setting" | "preset" | "b2b",
    field: `approval.${approval.changeType}`,
    valueBefore: approval.changeDiff,
    valueAfter: { approved: true },
    driftPct: approval.driftPct,
    affectedCount: approval.affectedCount,
    operatorId: params.reviewer.id,
    operatorName: params.reviewer.name,
    note: `Approved: ${params.note || approval.description}`,
  });

  // Link the log
  if (logId) {
    await prisma.pricingApproval.update({
      where: { id: params.approvalId },
      data: { priceChangeLogId: logId },
    }).catch(() => {});
  }

  return { success: true };
}

/**
 * Reject a pending request.
 */
export async function rejectRequest(params: {
  approvalId: string;
  reviewer: { id: string; name: string; role: string };
  note?: string;
}): Promise<{ success: boolean; error?: string }> {
  if (!canApprovePricing(params.reviewer.role)) {
    return { success: false, error: "Insufficient pricing tier to reject" };
  }

  const approval = await prisma.pricingApproval.findUnique({
    where: { id: params.approvalId },
  });

  if (!approval) return { success: false, error: "Approval not found" };
  if (approval.status !== "pending") {
    return { success: false, error: `Already ${approval.status}` };
  }

  await prisma.pricingApproval.update({
    where: { id: params.approvalId },
    data: {
      status: "rejected",
      reviewerId: params.reviewer.id,
      reviewerName: params.reviewer.name,
      reviewerRole: params.reviewer.role,
      reviewNote: params.note || null,
      reviewedAt: new Date(),
    },
  });

  // Log rejection to PriceChangeLog for full audit trail
  logPriceChange({
    productSlug: approval.targetSlug,
    productName: approval.targetName,
    scope: (approval.scope as "product" | "material" | "setting" | "preset" | "b2b") || "preset",
    field: `approval.${approval.changeType}`,
    valueBefore: approval.changeDiff,
    valueAfter: { rejected: true },
    driftPct: approval.driftPct,
    affectedCount: approval.affectedCount,
    operatorId: params.reviewer.id,
    operatorName: params.reviewer.name,
    note: `Rejected: ${params.note || approval.description}`,
  }).catch(() => {});

  return { success: true };
}

/**
 * List pending approvals.
 */
export async function listPendingApprovals(limit: number = 50) {
  return prisma.pricingApproval.findMany({
    where: { status: "pending" },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

/**
 * Get approval summary counts.
 */
export async function getApprovalSummary() {
  const counts = await prisma.pricingApproval.groupBy({
    by: ["status"],
    _count: true,
  });

  return Object.fromEntries(counts.map((c) => [c.status, c._count]));
}

/**
 * List approval history with filters and pagination.
 * Unlike listPendingApprovals, returns all statuses.
 */
export async function listApprovalHistory(params: {
  status?: string;
  changeType?: string;
  requesterId?: string;
  page?: number;
  limit?: number;
}) {
  const page = params.page || 1;
  const limit = params.limit || 30;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (params.status) where.status = params.status;
  if (params.changeType) where.changeType = params.changeType;
  if (params.requesterId) where.requesterId = params.requesterId;

  const [approvals, total] = await Promise.all([
    prisma.pricingApproval.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.pricingApproval.count({ where }),
  ]);

  return { approvals, total, page, limit };
}

/**
 * Check if a pricing change needs approval, and if so, create the request.
 * Returns { needsApproval: false } or { needsApproval: true, approvalId, reason }.
 */
export async function gateWithApproval(params: {
  operatorRole: string;
  operator: { id: string; name: string; role: string };
  changeType: string;
  scope?: string;
  targetId?: string;
  targetSlug?: string;
  targetName?: string;
  description: string;
  changeDiff?: unknown;
  driftPct?: number;
  affectedCount?: number;
}): Promise<{ needsApproval: boolean; approvalId?: string; reason?: string }> {
  const check = checkApprovalRequired({
    operatorRole: params.operatorRole,
    changeType: params.changeType,
    driftPct: params.driftPct,
    affectedCount: params.affectedCount,
    isBulk: (params.affectedCount ?? 0) > 10,
  });

  if (!check.requiresApproval) {
    return { needsApproval: false };
  }

  const approvalId = await createApprovalRequest({
    changeType: params.changeType,
    scope: params.scope,
    targetId: params.targetId,
    targetSlug: params.targetSlug,
    targetName: params.targetName,
    description: params.description,
    changeDiff: params.changeDiff,
    driftPct: params.driftPct,
    affectedCount: params.affectedCount,
    requester: params.operator,
  });

  return {
    needsApproval: true,
    approvalId,
    reason: check.reason,
  };
}
