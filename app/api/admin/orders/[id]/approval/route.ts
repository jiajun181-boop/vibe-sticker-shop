import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin-auth";
import { logActivity } from "@/lib/activity-log";
import { sendEmail } from "@/lib/email/resend";

// ────────────────────────────────────────────────────────────
// B2B Order Approval Workflow — Admin Side
//
// GET    — Check approval status (reads tags + timeline)
// POST   — Submit order for approval (adds "pending_approval" tag)
// PATCH  — Approve or reject (body: { action, note? })
// ────────────────────────────────────────────────────────────

/**
 * GET /api/admin/orders/[id]/approval
 * Returns the current approval state derived from order tags and timeline.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission(request, "orders", "view");
  if (!auth.authenticated) return auth.response;

  try {
    const { id } = await params;

    const order = await prisma.order.findUnique({
      where: { id },
      select: {
        id: true,
        tags: true,
        totalAmount: true,
        customerEmail: true,
        customerName: true,
        userId: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Derive approval state from tags
    const isPending = order.tags.includes("pending_approval");
    const isApproved = order.tags.includes("approved");
    const isRejected = order.tags.includes("approval_rejected");

    let status: "none" | "pending" | "approved" | "rejected" = "none";
    if (isPending) status = "pending";
    else if (isApproved) status = "approved";
    else if (isRejected) status = "rejected";

    // Fetch approval-related timeline events for context
    const approvalEvents = await prisma.orderTimeline.findMany({
      where: {
        orderId: id,
        action: {
          in: [
            "submitted_for_approval",
            "approval_approved",
            "approval_rejected",
          ],
        },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    return NextResponse.json({
      orderId: order.id,
      status,
      tags: order.tags,
      totalAmount: order.totalAmount,
      events: approvalEvents,
    });
  } catch (error) {
    console.error("[Approval GET] Error:", error);
    return NextResponse.json(
      { error: "Failed to check approval status" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/orders/[id]/approval
 * Submit an order for approval.
 * Adds "pending_approval" tag and creates a timeline event.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission(request, "orders", "edit");
  if (!auth.authenticated) return auth.response;

  try {
    const { id } = await params;

    const order = await prisma.order.findUnique({
      where: { id },
      select: { id: true, tags: true, totalAmount: true, customerEmail: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Guard: already pending or already decided
    if (order.tags.includes("pending_approval")) {
      return NextResponse.json(
        { error: "Order is already pending approval" },
        { status: 409 }
      );
    }
    if (order.tags.includes("approved")) {
      return NextResponse.json(
        { error: "Order has already been approved" },
        { status: 409 }
      );
    }

    // Add "pending_approval" tag (preserve existing tags)
    const updatedTags = [
      ...order.tags.filter((t: string) => t !== "approval_rejected"),
      "pending_approval",
    ];

    await prisma.order.update({
      where: { id },
      data: { tags: updatedTags },
    });

    const actorEmail = auth.user?.email || "admin";

    // Create timeline event
    await prisma.orderTimeline.create({
      data: {
        orderId: id,
        action: "submitted_for_approval",
        details: `Order submitted for B2B approval by ${actorEmail}`,
        actor: actorEmail,
      },
    });

    // Activity log (fire-and-forget)
    logActivity({
      action: "order_submitted_for_approval",
      entity: "order",
      entityId: id,
      actor: actorEmail,
      details: { totalAmount: order.totalAmount },
    });

    return NextResponse.json(
      { success: true, status: "pending", tags: updatedTags },
      { status: 201 }
    );
  } catch (error) {
    console.error("[Approval POST] Error:", error);
    return NextResponse.json(
      { error: "Failed to submit for approval" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/orders/[id]/approval
 * Approve or reject an order.
 * Body: { action: "approve" | "reject", note?: string }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission(request, "orders", "edit");
  if (!auth.authenticated) return auth.response;

  try {
    const { id } = await params;
    const body = await request.json();
    const { action, note } = body as { action?: string; note?: string };

    if (!action || !["approve", "reject"].includes(action)) {
      return NextResponse.json(
        { error: 'action must be "approve" or "reject"' },
        { status: 400 }
      );
    }

    const order = await prisma.order.findUnique({
      where: { id },
      select: {
        id: true,
        tags: true,
        totalAmount: true,
        customerEmail: true,
        customerName: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (!order.tags.includes("pending_approval")) {
      return NextResponse.json(
        { error: "Order is not pending approval" },
        { status: 409 }
      );
    }

    const actorEmail = auth.user?.email || "admin";

    if (action === "approve") {
      // Remove "pending_approval", add "approved"
      const updatedTags = [
        ...order.tags.filter(
          (t: string) => t !== "pending_approval" && t !== "approval_rejected"
        ),
        "approved",
      ];

      await prisma.order.update({
        where: { id },
        data: { tags: updatedTags },
      });

      await prisma.orderTimeline.create({
        data: {
          orderId: id,
          action: "approval_approved",
          details: note
            ? `Approved by ${actorEmail}: ${note}`
            : `Approved by ${actorEmail}`,
          actor: actorEmail,
        },
      });

      logActivity({
        action: "order_approval_approved",
        entity: "order",
        entityId: id,
        actor: actorEmail,
        details: { note: note || null, totalAmount: order.totalAmount },
      });

      return NextResponse.json({
        success: true,
        status: "approved",
        tags: updatedTags,
      });
    }

    // action === "reject"
    const updatedTags = [
      ...order.tags.filter(
        (t: string) => t !== "pending_approval" && t !== "approved"
      ),
      "approval_rejected",
    ];

    await prisma.order.update({
      where: { id },
      data: { tags: updatedTags },
    });

    await prisma.orderTimeline.create({
      data: {
        orderId: id,
        action: "approval_rejected",
        details: note
          ? `Rejected by ${actorEmail}: ${note}`
          : `Rejected by ${actorEmail}`,
        actor: actorEmail,
      },
    });

    logActivity({
      action: "order_approval_rejected",
      entity: "order",
      entityId: id,
      actor: actorEmail,
      details: { note: note || null, totalAmount: order.totalAmount },
    });

    // Send rejection email to the customer (non-blocking)
    if (order.customerEmail) {
      const customerName = order.customerName || "Customer";
      const reasonText = note ? `<p><strong>Reason:</strong> ${note}</p>` : "";

      sendEmail({
        to: order.customerEmail,
        subject: `Order #${id} — Approval Update`,
        html: `
          <h2>Order Approval Update</h2>
          <p>Hi ${customerName},</p>
          <p>Your order <strong>#${id}</strong> was not approved for processing.</p>
          ${reasonText}
          <p>Please contact us if you have questions or would like to discuss next steps.</p>
          <p>— La Lunar Printing</p>
        `,
        template: "order_approval_rejected",
        orderId: id,
      }).catch((err) => {
        console.error("[Approval PATCH] Failed to send rejection email:", err);
      });
    }

    return NextResponse.json({
      success: true,
      status: "rejected",
      tags: updatedTags,
    });
  } catch (error) {
    console.error("[Approval PATCH] Error:", error);
    return NextResponse.json(
      { error: "Failed to process approval action" },
      { status: 500 }
    );
  }
}
