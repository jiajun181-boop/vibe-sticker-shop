import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity-log";
import { requirePermission } from "@/lib/admin-auth";

/**
 * POST /api/admin/orders/[id]/refund
 * Body: { amountCents: number, reason?: string }
 * Processes a Stripe refund and updates the order.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission(request, "orders", "approve");
  if (!auth.authenticated) return auth.response!;

  const { id } = await params;

  try {
    const body = await request.json();
    const { amountCents, reason } = body;

    if (!amountCents || amountCents <= 0) {
      return NextResponse.json(
        { error: "amountCents must be a positive integer" },
        { status: 400 }
      );
    }

    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (!order.stripePaymentIntentId) {
      return NextResponse.json(
        { error: "No payment intent found — cannot refund" },
        { status: 400 }
      );
    }

    const totalRefundable = order.totalAmount - order.refundAmount;
    if (amountCents > totalRefundable) {
      return NextResponse.json(
        { error: `Max refundable: ${totalRefundable} cents (already refunded: ${order.refundAmount})` },
        { status: 400 }
      );
    }

    // Stripe refund
    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2026-01-28.clover",
    });

    const refund = await stripe.refunds.create({
      payment_intent: order.stripePaymentIntentId,
      amount: amountCents,
      reason: "requested_by_customer",
      metadata: {
        orderId: id,
        adminReason: reason || "",
      },
    });

    // Update order
    const newRefundTotal = order.refundAmount + amountCents;
    const isFullRefund = newRefundTotal >= order.totalAmount;

    const updated = await prisma.order.update({
      where: { id },
      data: {
        refundAmount: newRefundTotal,
        paymentStatus: isFullRefund ? "refunded" : "partially_refunded",
        status: isFullRefund ? "refunded" : order.status,
      },
    });

    // Timeline event
    await prisma.orderTimeline.create({
      data: {
        orderId: id,
        action: isFullRefund ? "full_refund" : "partial_refund",
        details: JSON.stringify({
          amountCents,
          reason,
          stripeRefundId: refund.id,
          totalRefunded: newRefundTotal,
        }),
        actor: auth.user?.email || "admin",
      },
    });

    await logActivity({
      action: "refund",
      entity: "order",
      entityId: id,
      actor: auth.user?.email || "admin",
      details: { amountCents, reason, stripeRefundId: refund.id },
    });

    // Send refund email
    try {
      const { sendEmail } = await import("@/lib/email/resend");
      const { buildRefundEmailHtml } = await import("@/lib/email/templates/refund-issued");
      await sendEmail({
        to: order.customerEmail,
        subject: `Refund Issued — Order #${id.slice(0, 8)}`,
        html: buildRefundEmailHtml(order, amountCents, newRefundTotal, reason),
        template: "refund-issued",
        orderId: id,
      });
    } catch (emailErr) {
      console.error("[Refund] Email send failed:", emailErr);
    }

    return NextResponse.json({
      success: true,
      refund: {
        stripeRefundId: refund.id,
        amountCents,
        totalRefunded: newRefundTotal,
        isFullRefund,
      },
      order: updated,
    });
  } catch (err) {
    console.error("[Refund] Error:", err);
    const message = err instanceof Error ? err.message : "Refund failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
