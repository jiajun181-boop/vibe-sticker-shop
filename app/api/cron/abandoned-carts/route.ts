import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email/resend";
import { buildAbandonedCartHtml } from "@/lib/email/templates/abandoned-cart";

// Schedule intervals: 1h, 24h, 72h after last cart update
const SEND_INTERVALS_MS = [
  1 * 60 * 60 * 1000,   // 1 hour
  24 * 60 * 60 * 1000,  // 24 hours
  72 * 60 * 60 * 1000,  // 72 hours
];
const MAX_EMAILS = 3;

export async function GET(req: NextRequest) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Find abandoned carts that haven't been recovered and haven't maxed out emails
    const carts = await prisma.abandonedCart.findMany({
      where: {
        recoveredAt: null,
        emailsSent: { lt: MAX_EMAILS },
      },
      orderBy: { createdAt: "asc" },
      take: 50,
    });

    let sent = 0;
    const now = Date.now();

    for (const cart of carts) {
      const emailNumber = cart.emailsSent + 1;
      const intervalMs = SEND_INTERVALS_MS[cart.emailsSent] || SEND_INTERVALS_MS[SEND_INTERVALS_MS.length - 1];
      const referenceTime = cart.lastEmailAt || cart.updatedAt || cart.createdAt;
      const elapsed = now - referenceTime.getTime();

      if (elapsed < intervalMs) continue;

      const cartItems = Array.isArray(cart.cartJson) ? cart.cartJson as any[] : [];
      if (cartItems.length === 0) continue;

      const { subject, html } = buildAbandonedCartHtml({
        email: cart.email,
        cart: cartItems,
        recoveryToken: cart.recoveryToken,
        emailNumber,
      });

      await sendEmail({
        to: cart.email,
        subject,
        html,
        template: `abandoned-cart-${emailNumber}`,
      });

      await prisma.abandonedCart.update({
        where: { id: cart.id },
        data: {
          emailsSent: emailNumber,
          lastEmailAt: new Date(),
        },
      });

      sent++;
    }

    return NextResponse.json({ processed: carts.length, sent });
  } catch (err) {
    console.error("[AbandonedCartCron] Error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
