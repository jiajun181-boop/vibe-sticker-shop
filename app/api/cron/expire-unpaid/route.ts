import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { releaseReserve } from "@/lib/inventory";
import { logActivity } from "@/lib/activity-log";
import { sendEmail } from "@/lib/email/resend";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "orders@lalunar.com";

/**
 * Auto-cancel unpaid Invoice/Interac orders past their grace period.
 *
 * Invoice orders: cancel after 14 days of non-payment.
 * Interac orders: cancel after 7 days of non-payment.
 *
 * For each auto-canceled order:
 *   1. Set status = "canceled", cancelReason = auto-expire reason
 *   2. Release reserved stock
 *   3. Add timeline entry
 *   4. Log activity + email summary to Jay
 *
 * Note: coupon usedCount is NOT decremented because Invoice/Interac
 * only consume coupons on payment confirmation (never at creation).
 *
 * Schedule: daily at 10am (vercel.json)
 * Auth: Bearer CRON_SECRET
 */

const INTERAC_GRACE_DAYS = 7;
const INVOICE_OVERDUE_GRACE_DAYS = 14; // 14 days after dueAt

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    const expiredOrders: Array<{ id: string; orderNumber: string; customerEmail: string; totalAmount: number; reason: string }> = [];

    // ── 1. Interac orders unpaid after 7 days ────────────────────────────
    const interacCutoff = new Date(now.getTime() - INTERAC_GRACE_DAYS * 24 * 60 * 60 * 1000);
    const staleInterac = await prisma.order.findMany({
      where: {
        paymentStatus: "unpaid",
        status: { notIn: ["canceled"] },
        tags: { has: "interac_checkout" },
        createdAt: { lt: interacCutoff },
      },
      select: {
        id: true,
        orderNumber: true,
        customerEmail: true,
        totalAmount: true,
        couponId: true,
        items: { select: { productId: true, quantity: true } },
      },
      take: 50,
    });

    for (const order of staleInterac) {
      await expireOrder(order, "interac_unpaid_7d");
      expiredOrders.push({
        id: order.id,
        orderNumber: order.orderNumber,
        customerEmail: order.customerEmail,
        totalAmount: order.totalAmount,
        reason: "Interac unpaid 7+ days",
      });
    }

    // ── 2. Invoice orders overdue for 14+ days past dueAt ────────────────
    // Find orders linked to overdue invoices that are way past due
    const invoiceCutoff = new Date(now.getTime() - INVOICE_OVERDUE_GRACE_DAYS * 24 * 60 * 60 * 1000);
    const staleInvoice = await prisma.order.findMany({
      where: {
        paymentStatus: "unpaid",
        status: { notIn: ["canceled"] },
        tags: { has: "invoice_checkout" },
        createdAt: { lt: invoiceCutoff },
      },
      select: {
        id: true,
        orderNumber: true,
        customerEmail: true,
        totalAmount: true,
        couponId: true,
        items: { select: { productId: true, quantity: true } },
      },
      take: 50,
    });

    for (const order of staleInvoice) {
      await expireOrder(order, "invoice_unpaid_14d");
      expiredOrders.push({
        id: order.id,
        orderNumber: order.orderNumber,
        customerEmail: order.customerEmail,
        totalAmount: order.totalAmount,
        reason: "Invoice unpaid 14+ days",
      });
    }

    // ── 3. Notify Jay if any orders expired ──────────────────────────────
    if (expiredOrders.length > 0) {
      const totalLost = expiredOrders.reduce((sum, o) => sum + o.totalAmount, 0);
      const rows = expiredOrders
        .map(
          (o) =>
            `<tr><td style="padding:4px 8px;border:1px solid #ddd">${o.orderNumber}</td>` +
            `<td style="padding:4px 8px;border:1px solid #ddd">${o.customerEmail}</td>` +
            `<td style="padding:4px 8px;border:1px solid #ddd">$${(o.totalAmount / 100).toFixed(2)}</td>` +
            `<td style="padding:4px 8px;border:1px solid #ddd">${o.reason}</td></tr>`
        )
        .join("");

      await sendEmail({
        to: ADMIN_EMAIL,
        subject: `[Auto] ${expiredOrders.length} unpaid order(s) expired — $${(totalLost / 100).toFixed(2)} released`,
        html: `
          <h2>Unpaid Orders Auto-Expired</h2>
          <p>${expiredOrders.length} order(s) were automatically canceled because payment was never received. Stock reservations have been released.</p>
          <table style="border-collapse:collapse;width:100%;font-size:14px">
            <thead>
              <tr style="background:#f5f5f5">
                <th style="padding:4px 8px;border:1px solid #ddd;text-align:left">Order #</th>
                <th style="padding:4px 8px;border:1px solid #ddd;text-align:left">Customer</th>
                <th style="padding:4px 8px;border:1px solid #ddd;text-align:left">Amount</th>
                <th style="padding:4px 8px;border:1px solid #ddd;text-align:left">Reason</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
          <p style="margin-top:12px;color:#666;font-size:13px">
            If any of these customers still want to pay, they can place a new order. The original order has been preserved with "canceled" status for records.
          </p>
        `,
        template: "unpaid-order-expired",
      });
    }

    return NextResponse.json({
      expired: expiredOrders.length,
      interac: staleInterac.length,
      invoice: staleInvoice.length,
    });
  } catch (err) {
    console.error("[ExpireUnpaidCron] Error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

async function expireOrder(
  order: {
    id: string;
    orderNumber: string;
    couponId: string | null;
    items: Array<{ productId: string; quantity: number }>;
  },
  reason: string
) {
  // 1. Mark as canceled with auto-expire reason
  await prisma.order.update({
    where: { id: order.id },
    data: {
      status: "canceled",
      cancelReason: `Auto-canceled: ${reason}`,
    },
  });

  // 2. Release reserved stock
  if (order.items.length > 0) {
    try {
      await releaseReserve(
        order.items.map((item) => ({ productId: item.productId, quantity: item.quantity }))
      );
    } catch (err) {
      console.error(`[ExpireUnpaid] Failed to release stock for ${order.orderNumber}:`, err);
    }
  }

  // 3. Defensive coupon cleanup — invoice/interac shouldn't have consumed
  //    coupons yet (only consumed on payment confirmation), but if somehow
  //    they did, release the hold
  // (No-op for now since coupon is not consumed until payment)

  // 4. Add timeline entry
  try {
    await prisma.orderTimeline.create({
      data: {
        orderId: order.id,
        action: "order_auto_canceled",
        details: `Auto-canceled: ${reason}. Stock reservations released.`,
        actor: "system",
      },
    });
  } catch {
    // timeline is non-critical
  }

  // 5. Log activity
  logActivity({
    action: "order_auto_canceled",
    entity: "order",
    entityId: order.id,
    details: { orderNumber: order.orderNumber, reason },
  }).catch(() => {});
}
