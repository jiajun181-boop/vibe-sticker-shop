import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin-auth";
import { sendEmail } from "@/lib/email/resend";
import { logActivity } from "@/lib/activity-log";
import { itemNeedsArtwork } from "@/lib/artwork-detection";

/**
 * POST /api/admin/orders/[id]/remind-artwork
 *
 * Send an artwork reminder email to the customer.
 * Creates a timeline entry and email log.
 *
 * Body (optional): { customMessage?: string }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission(request, "orders", "edit");
  if (!auth.authenticated) return auth.response;

  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const customMessage = body.customMessage || "";

    const order = await prisma.order.findUnique({
      where: { id },
      select: {
        id: true,
        customerName: true,
        customerEmail: true,
        status: true,
        items: {
          select: {
            id: true,
            productName: true,
            fileUrl: true,
            meta: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (["canceled", "refunded"].includes(order.status)) {
      return NextResponse.json({ error: "Cannot send reminder for canceled order" }, { status: 400 });
    }

    // Find items missing artwork (shared detection)
    const itemsMissing = order.items.filter((item) => itemNeedsArtwork(item));

    if (itemsMissing.length === 0) {
      return NextResponse.json({ error: "All items already have artwork" }, { status: 400 });
    }

    const customerName = order.customerName || "there";
    const trackUrl = `https://lunarprint.ca/track-order?order=${order.id}`;

    const itemList = itemsMissing
      .map((item) => `<li style="margin-bottom:4px;">${item.productName}</li>`)
      .join("");

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:Arial,Helvetica,sans-serif;color:#222;line-height:1.5;">
  <div style="max-width:560px;margin:0 auto;padding:32px 16px;">
    <h2 style="margin:0 0 16px;font-size:20px;color:#111;">Artwork Needed for Your Order</h2>
    <p>Hi ${customerName},</p>
    <p>We're ready to start working on your order <strong>#${order.id.slice(0, 8)}</strong>, but we still need your artwork for the following items:</p>
    <ul style="padding-left:20px;margin:16px 0;">${itemList}</ul>
    ${customMessage ? `<p style="background:#f9f6ed;border-left:3px solid #d4a940;padding:12px 16px;border-radius:4px;margin:16px 0;">${customMessage}</p>` : ""}
    <p>You can upload your files securely using this link:</p>
    <p style="margin:16px 0;">
      <a href="${trackUrl}" style="display:inline-block;background:#111;color:#fff;padding:12px 28px;text-decoration:none;border-radius:6px;font-weight:600;font-size:14px;">
        Upload Artwork
      </a>
    </p>
    <p style="color:#666;font-size:13px;">
      If you have any questions about file requirements, reply to this email and we'll help you out.
    </p>
    <hr style="border:none;border-top:1px solid #eee;margin:24px 0;">
    <p style="color:#999;font-size:12px;">La Lunar Printing Inc. — Toronto, Canada</p>
  </div>
</body>
</html>`;

    await sendEmail({
      to: order.customerEmail,
      subject: `Artwork needed — Order #${order.id.slice(0, 8)}`,
      html,
      template: "artwork_reminder",
      orderId: order.id,
    });

    // Timeline entry
    await prisma.orderTimeline.create({
      data: {
        orderId: order.id,
        action: "artwork_reminder_sent",
        details: JSON.stringify({
          itemsMissing: itemsMissing.map((i) => i.productName),
          sentBy: auth.user?.email || "admin",
          customMessage: customMessage || null,
        }),
        actor: auth.user?.email || "admin",
      },
    });

    logActivity({
      action: "artwork_reminder_sent",
      entity: "Order",
      entityId: order.id,
      actor: auth.user?.email || "admin",
      details: { itemsMissing: itemsMissing.length },
    });

    return NextResponse.json({
      success: true,
      sentTo: order.customerEmail,
      itemsReminded: itemsMissing.length,
    });
  } catch (error) {
    console.error("[Artwork Reminder] Error:", error);
    return NextResponse.json({ error: "Failed to send reminder" }, { status: 500 });
  }
}
