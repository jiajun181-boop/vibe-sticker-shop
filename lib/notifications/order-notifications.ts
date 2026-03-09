import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email/resend";
import { buildProductionStartedHtml } from "@/lib/email/templates/production-started";
import { buildProofReadyHtml } from "@/lib/email/templates/proof-ready";
import { buildQualityPassedHtml } from "@/lib/email/templates/quality-passed";
import { buildReadyToShipHtml } from "@/lib/email/templates/ready-to-ship";
import { buildOrderCanceledHtml } from "@/lib/email/templates/order-canceled";
import { buildOrderShippedHtml } from "@/lib/email/templates/order-shipped";
import { sendPushToUser } from "@/lib/push/web-push";

type NotificationType =
  | "production_started"
  | "proof_ready"
  | "quality_passed"
  | "ready_to_ship"
  | "order_shipped"
  | "order_canceled";

interface OrderForNotification {
  id: string;
  customerEmail: string;
  customerName: string | null;
  items?: Array<{
    productName: string;
    quantity: number;
  }>;
}

const builders: Record<
  NotificationType,
  (order: OrderForNotification, extra?: Record<string, unknown>) => { subject: string; html: string }
> = {
  production_started: (order) => ({
    subject: `Your order is in production — #${order.id.slice(0, 8)}`,
    html: buildProductionStartedHtml(order),
  }),
  proof_ready: (order, extra) => ({
    subject: `Proof ready for review — #${order.id.slice(0, 8)}`,
    html: buildProofReadyHtml(order, extra),
  }),
  quality_passed: (order) => ({
    subject: `Quality check passed — #${order.id.slice(0, 8)}`,
    html: buildQualityPassedHtml(order),
  }),
  ready_to_ship: (order) => ({
    subject: `Your order is ready to ship — #${order.id.slice(0, 8)}`,
    html: buildReadyToShipHtml(order),
  }),
  order_shipped: (order, extra) => ({
    subject: `Your order has shipped — #${order.id.slice(0, 8)}`,
    html: buildOrderShippedHtml(order, {
      trackingNumber: extra?.trackingNumber as string,
      carrier: extra?.carrier as string,
      estimatedDelivery: extra?.estimatedDelivery as string,
    }),
  }),
  order_canceled: (order, extra) => ({
    subject: `Order canceled — #${order.id.slice(0, 8)}`,
    html: buildOrderCanceledHtml(order, (extra?.reason as string) || null),
  }),
};

export async function sendOrderNotification(
  orderId: string,
  type: NotificationType,
  extra?: Record<string, unknown>
) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: { select: { productName: true, quantity: true } } },
    });
    if (!order || !order.customerEmail) return;

    const builder = builders[type];
    if (!builder) return;

    const { subject, html } = builder(order, extra);

    await sendEmail({
      to: order.customerEmail,
      subject,
      html,
      template: type.replace(/_/g, "-"),
      orderId,
    });

    // Also send push notification if user is linked
    if (order.userId) {
      const pushMessages: Record<string, { title: string; body: string }> = {
        production_started: { title: "In Production", body: `Order #${orderId.slice(0, 8)} is being printed` },
        proof_ready: { title: "Proof Ready", body: `Review your proof for order #${orderId.slice(0, 8)}` },
        quality_passed: { title: "QC Passed", body: `Order #${orderId.slice(0, 8)} passed quality check` },
        ready_to_ship: { title: "Ready to Ship", body: `Order #${orderId.slice(0, 8)} is packed and ready` },
        order_shipped: { title: "Order Shipped", body: `Order #${orderId.slice(0, 8)} is on its way!` },
        order_canceled: { title: "Order Canceled", body: `Order #${orderId.slice(0, 8)} has been canceled` },
      };
      const msg = pushMessages[type];
      if (msg) {
        sendPushToUser(order.userId, {
          ...msg,
          url: `/account/orders/${orderId}`,
          tag: `order-${orderId.slice(0, 8)}`,
        }).catch(() => {});
      }
    }
  } catch (err) {
    console.error(`[OrderNotification] Failed to send ${type}:`, err);
  }
}
