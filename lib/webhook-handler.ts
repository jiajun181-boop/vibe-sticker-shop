import { prisma } from "./prisma";
import Stripe from "stripe";
import { validateAmountReconciliation } from "./calculate-order-totals";
import { applyAssignmentRules } from "./assignment-rules";

export async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session
) {
  const sessionId = session.id;

  console.log(`[Webhook] Processing session: ${sessionId}`);

  // 1. Idempotency check
  const existing = await prisma.order.findUnique({
    where: { stripeSessionId: sessionId },
  });

  if (existing) {
    console.log(`[Webhook] Order already exists: ${existing.id}`);
    return existing;
  }

  // 2. Validate customer email
  if (!session.customer_email) {
    throw new Error("Missing customer email");
  }

  // 3. Parse metadata
  const metadata = session.metadata;
  if (!metadata || !metadata.items) {
    throw new Error("Missing metadata");
  }

  const items = JSON.parse(metadata.items);

  // 4. Amount reconciliation
  const totalAmount = validateAmountReconciliation(
    metadata,
    session.amount_total || 0
  );

  // 5. Transactional order creation
  const order = await prisma.$transaction(async (tx) => {
    // Create order
    const newOrder = await tx.order.create({
      data: {
        stripeSessionId: sessionId,
        stripePaymentIntentId: session.payment_intent as string,
        customerEmail: session.customer_email!,
        customerName: session.customer_details?.name || null,
        customerPhone: session.customer_details?.phone || null,
        subtotalAmount: parseInt(metadata!.subtotalAmount),
        taxAmount: parseInt(metadata!.taxAmount),
        shippingAmount: parseInt(metadata!.shippingAmount),
        totalAmount,
        status: "paid",
        paymentStatus: "paid",
        paidAt: new Date(),
      },
    });

    // Create order items
    for (const item of items) {
      await tx.orderItem.create({
        data: {
          orderId: newOrder.id,
          productId: item.productId || null,
          productName: item.name,
          productType: "custom",
          quantity: item.quantity,
          unitPrice: item.unitAmount,
          totalPrice: item.unitAmount * item.quantity,
          widthIn: item.meta?.width || null,
          heightIn: item.meta?.height || null,
          material: item.meta?.material || null,
          finishing: item.meta?.finishing || null,
          meta: item.meta || null,
        },
      });
    }

    // Create system note
    await tx.orderNote.create({
      data: {
        orderId: newOrder.id,
        authorType: "system",
        isInternal: true,
        message: `Order created via Stripe webhook: ${sessionId}`,
      },
    });

    return newOrder;
  });

  // 6. Auto-create production jobs for each order item
  try {
    const orderItems = await prisma.orderItem.findMany({
      where: { orderId: order.id },
    });

    for (const item of orderItems) {
      const newJob = await prisma.productionJob.create({
        data: {
          orderItemId: item.id,
          status: "queued",
          priority: "normal",
        },
      });

      // Try to auto-assign via rules
      await applyAssignmentRules(newJob.id);
    }

    console.log(`[Webhook] Created ${orderItems.length} production jobs for order: ${order.id}`);
  } catch (jobError) {
    // Don't fail the webhook if job creation fails
    console.error(`[Webhook] Failed to create production jobs:`, jobError);
  }

  console.log(`[Webhook] Order created: ${order.id}`);
  return order;
}
