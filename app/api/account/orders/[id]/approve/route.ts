import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";
import { logActivity } from "@/lib/activity-log";

// ────────────────────────────────────────────────────────────
// B2B Customer-Facing Order Approval
//
// POST /api/account/orders/[id]/approve
//
// Allows a B2B customer with companyRole "manager" or "owner"
// to approve orders placed by their team members.
// ────────────────────────────────────────────────────────────

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Authenticate the requesting user
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Must be a B2B account
    if (user.accountType !== "B2B") {
      return NextResponse.json(
        { error: "Only B2B accounts can approve orders" },
        { status: 403 }
      );
    }

    // Must be approved B2B
    if (!user.b2bApproved) {
      return NextResponse.json(
        { error: "Your B2B account is not yet approved" },
        { status: 403 }
      );
    }

    // Must have manager or owner role
    const role = (user.companyRole || "").toLowerCase();
    if (role !== "manager" && role !== "owner") {
      return NextResponse.json(
        { error: "Only managers and owners can approve team orders" },
        { status: 403 }
      );
    }

    // Fetch the order
    const order = await prisma.order.findUnique({
      where: { id },
      select: {
        id: true,
        tags: true,
        totalAmount: true,
        userId: true,
        customerEmail: true,
        customerName: true,
        user: {
          select: {
            id: true,
            companyName: true,
            accountType: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Verify the order belongs to the same company.
    // Match by companyName: the approver's company must match the order placer's company.
    const orderCompany = order.user?.companyName;
    if (!orderCompany || orderCompany !== user.companyName) {
      return NextResponse.json(
        { error: "You can only approve orders from your own company" },
        { status: 403 }
      );
    }

    // The order must be pending approval
    if (!order.tags.includes("pending_approval")) {
      return NextResponse.json(
        { error: "This order is not pending approval" },
        { status: 409 }
      );
    }

    // Prevent self-approval: the order placer cannot approve their own order
    if (order.userId === user.id) {
      return NextResponse.json(
        { error: "You cannot approve your own order" },
        { status: 403 }
      );
    }

    // Approve: remove "pending_approval", add "approved"
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

    // Create timeline event
    await prisma.orderTimeline.create({
      data: {
        orderId: id,
        action: "approval_approved",
        details: `Approved by B2B ${role} ${user.name || user.email} (${user.companyName})`,
        actor: user.email,
      },
    });

    // Activity log (fire-and-forget)
    logActivity({
      action: "b2b_order_approved_by_customer",
      entity: "order",
      entityId: id,
      actor: user.email,
      details: {
        approverId: user.id,
        approverRole: role,
        companyName: user.companyName,
        totalAmount: order.totalAmount,
      },
    });

    return NextResponse.json({
      success: true,
      status: "approved",
      tags: updatedTags,
    });
  } catch (error) {
    console.error("[B2B Approve] Error:", error);
    return NextResponse.json(
      { error: "Failed to approve order" },
      { status: 500 }
    );
  }
}
