import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin-auth";
import { logActivity } from "@/lib/activity-log";

/**
 * GET /api/admin/warranty
 * List all warranty claims with optional filters.
 * Query params: status, from, to, page, limit, search
 */
export async function GET(request: NextRequest) {
  const auth = await requirePermission(request, "orders", "view");
  if (!auth.authenticated) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));
    const skip = (page - 1) * limit;
    const status = searchParams.get("status");
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const search = searchParams.get("search");

    const where: Record<string, unknown> = {};

    if (status && status !== "all") {
      where.status = status;
    }

    if (from || to) {
      const dateFilter: Record<string, Date> = {};
      if (from) dateFilter.gte = new Date(from);
      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        dateFilter.lte = toDate;
      }
      where.createdAt = dateFilter;
    }

    if (search) {
      where.OR = [
        { claimNumber: { contains: search, mode: "insensitive" } },
        { customerEmail: { contains: search, mode: "insensitive" } },
        { customerName: { contains: search, mode: "insensitive" } },
        { orderId: { contains: search } },
      ];
    }

    const [claims, total] = await Promise.all([
      prisma.warrantyClaim.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.warrantyClaim.count({ where }),
    ]);

    return NextResponse.json({
      claims,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("[admin/warranty] GET error:", err);
    return NextResponse.json(
      { error: "Failed to load warranty claims" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/warranty
 * Update a warranty claim's status, resolution, and/or notes.
 * Body: { claimId, status?, resolution?, resolutionNote?, refundAmount? }
 */
export async function PATCH(request: NextRequest) {
  const auth = await requirePermission(request, "orders", "edit");
  if (!auth.authenticated) return auth.response;

  try {
    const body = await request.json();
    const { claimId, status, resolution, resolutionNote, refundAmount } = body;

    if (!claimId) {
      return NextResponse.json(
        { error: "Missing required field: claimId" },
        { status: 400 }
      );
    }

    const existing = await prisma.warrantyClaim.findUnique({
      where: { id: claimId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Warranty claim not found" },
        { status: 404 }
      );
    }

    const validStatuses = [
      "submitted",
      "under_review",
      "approved",
      "denied",
      "fulfilled",
    ];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` },
        { status: 400 }
      );
    }

    const validResolutions = ["replace", "refund", "repair", "credit"];
    if (resolution && !validResolutions.includes(resolution)) {
      return NextResponse.json(
        {
          error: `Invalid resolution. Must be one of: ${validResolutions.join(", ")}`,
        },
        { status: 400 }
      );
    }

    const data: Record<string, unknown> = {};

    if (status) data.status = status;
    if (resolution !== undefined) data.resolution = resolution;
    if (resolutionNote !== undefined) data.resolutionNote = resolutionNote;
    if (typeof refundAmount === "number") data.refundAmount = refundAmount;

    // If the status is being resolved (approved/denied/fulfilled), track who and when
    if (
      status &&
      ["approved", "denied", "fulfilled"].includes(status) &&
      !existing.resolvedAt
    ) {
      data.resolvedBy = auth.user?.email || "admin";
      data.resolvedAt = new Date();
    }

    const updated = await prisma.warrantyClaim.update({
      where: { id: claimId },
      data,
    });

    // Log the activity (fire-and-forget)
    logActivity({
      action: "warranty_claim_updated",
      entity: "WarrantyClaim",
      entityId: claimId,
      actor: auth.user?.email || "admin",
      details: {
        claimNumber: updated.claimNumber,
        oldStatus: existing.status,
        newStatus: status || existing.status,
        resolution: resolution || existing.resolution,
      },
    });

    return NextResponse.json({ claim: updated });
  } catch (err) {
    console.error("[admin/warranty] PATCH error:", err);
    return NextResponse.json(
      { error: "Failed to update warranty claim" },
      { status: 500 }
    );
  }
}
