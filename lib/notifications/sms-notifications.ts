import { prisma } from "@/lib/prisma";
import { sendSms } from "@/lib/sms/twilio";

type SmsEvent = "order_confirmed" | "order_shipped" | "proof_ready";

const TEMPLATES: Record<SmsEvent, (orderId: string, extra?: Record<string, unknown>) => string> = {
  order_confirmed: (orderId) =>
    `La Lunar Printing: Your order #${orderId.slice(0, 8)} has been confirmed! We'll notify you when it ships. Reply STOP to opt out.`,
  order_shipped: (orderId, extra) =>
    `La Lunar Printing: Order #${orderId.slice(0, 8)} has shipped!${extra?.trackingNumber ? ` Tracking: ${extra.trackingNumber}` : ""} Reply STOP to opt out.`,
  proof_ready: (orderId) =>
    `La Lunar Printing: A proof is ready for your review — Order #${orderId.slice(0, 8)}. Check your email for details. Reply STOP to opt out.`,
};

/**
 * Send an SMS notification for an order event.
 * Only sends if the user has opted in and has a phone number.
 */
export async function sendOrderSms(
  orderId: string,
  event: SmsEvent,
  extra?: Record<string, unknown>
) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { userId: true, customerPhone: true },
    });

    if (!order) return;

    // Check user's SMS opt-in preference
    let phone = order.customerPhone;
    if (order.userId) {
      const user = await prisma.user.findUnique({
        where: { id: order.userId },
        select: { smsOptIn: true, smsPhone: true, phone: true },
      });
      if (!user?.smsOptIn) return;
      phone = user.smsPhone || user.phone || phone;
    }

    if (!phone) return;

    const template = TEMPLATES[event];
    if (!template) return;

    const message = template(orderId, extra);
    await sendSms(phone, message);
  } catch (err) {
    console.error(`[SMS] Failed to send ${event}:`, err);
  }
}
