import { prisma } from "./prisma";
import Stripe from "stripe";
import { validateAmountReconciliation } from "./calculate-order-totals";
import { applyAssignmentRules } from "./assignment-rules";
import { sendEmail } from "./email/resend";
import { buildOrderConfirmationHtml } from "./email/templates/order-confirmation";

function toNumberOrNull(v: unknown) {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

function parseSizeRows(meta: Record<string, unknown> | null) {
  if (!meta) return null;
  const raw = meta.sizeRows;
  let rows: unknown = raw;
  if (typeof raw === "string") {
    try {
      rows = JSON.parse(raw);
    } catch {
      rows = null;
    }
  }
  if (!Array.isArray(rows)) return null;
  const normalized = rows
    .map((row) => {
      if (!row || typeof row !== "object") return null;
      const r = row as Record<string, unknown>;
      const width = toNumberOrNull(r.width ?? r.widthIn);
      const height = toNumberOrNull(r.height ?? r.heightIn);
      const quantity = toNumberOrNull(r.quantity);
      if (width == null || height == null || quantity == null) return null;
      if (width <= 0 || height <= 0 || quantity <= 0) return null;
      return { width, height, quantity };
    })
    .filter(Boolean) as Array<{ width: number; height: number; quantity: number }>;
  return normalized.length ? normalized : null;
}

export async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session
) {
  const sessionId = session.id;

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

  // 5. Transactional order creation (catches duplicate if race condition)
  const couponId = metadata.couponId || null;
  const discountAmount = parseInt(metadata.discountAmount || "0");

  let order;
  try {
  order = await prisma.$transaction(async (tx) => {

    const newOrder = await tx.order.create({
      data: {
        stripeSessionId: sessionId,
        stripePaymentIntentId: session.payment_intent as string,
        customerEmail: session.customer_email!,
        customerName: session.customer_details?.name || null,
        customerPhone: session.customer_details?.phone || null,
        subtotalAmount: parseInt(metadata!.subtotalAmount),
        discountAmount,
        taxAmount: parseInt(metadata!.taxAmount),
        shippingAmount: parseInt(metadata!.shippingAmount),
        totalAmount,
        couponId,
        status: "paid",
        paymentStatus: "paid",
        paidAt: new Date(),
      },
    });

    // Create order items
    for (const item of items) {
      const meta = item?.meta && typeof item.meta === "object" ? item.meta : null;
      const widthIn = toNumberOrNull(meta?.width);
      const heightIn = toNumberOrNull(meta?.height);
      const sizeRows = parseSizeRows(meta);
      const sizeMode = meta?.sizeMode === "multi" ? "multi" : "single";

      const fileUrl = meta?.artworkUrl || meta?.fileUrl || null;
      const fileKey = meta?.artworkKey || meta?.fileKey || null;
      const fileName = meta?.artworkName || meta?.fileName || null;

      const specs: Record<string, unknown> = {};
      if (meta?.editorType === "text") {
        specs.editor = {
          type: "text",
          text: meta?.editorText || "",
          font: meta?.editorFont || "",
          color: meta?.editorColor || "",
          widthIn,
          heightIn,
        };
      }
      if (sizeRows && sizeMode === "multi") {
        specs.sizeMode = "multi";
        specs.sizeRows = sizeRows;
      }
      const specsJson = Object.keys(specs).length > 0 ? specs : null;

      await tx.orderItem.create({
        data: {
          orderId: newOrder.id,
          productId: item.productId || null,
          productName: item.name || item.productName || "Item",
          productType: item.productType || "custom",
          quantity: item.quantity,
          unitPrice: item.unitAmount,
          totalPrice: item.unitAmount * item.quantity,
          widthIn,
          heightIn,
          material: meta?.material || null,
          finishing: Array.isArray(meta?.finishings)
            ? meta.finishings.join(", ")
            : (meta?.finishing || null),
          meta,
          specsJson,
          fileKey,
          fileUrl,
          fileName,
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
  } catch (txErr: unknown) {
    // Unique constraint on stripeSessionId — concurrent webhook created the order
    const isPrismaUnique =
      txErr && typeof txErr === "object" && "code" in txErr && (txErr as { code: string }).code === "P2002";
    if (isPrismaUnique) {
      console.log(`[Webhook] Concurrent duplicate caught for session: ${sessionId}`);
      const duplicate = await prisma.order.findUnique({ where: { stripeSessionId: sessionId } });
      if (duplicate) return duplicate;
    }
    throw txErr;
  }

  // 6. Atomic coupon usage increment
  if (couponId) {
    try {
      await prisma.coupon.update({
        where: { id: couponId },
        data: { usedCount: { increment: 1 } },
      });
      console.log(`[Webhook] Incremented coupon usage: ${couponId}`);
    } catch (couponErr) {
      console.error("[Webhook] Failed to increment coupon usage:", couponErr);
    }
  }

  // 7. Link order to existing user account (by email)

  try {
    if (session.customer_email) {
      const existingUser = await prisma.user.findUnique({
        where: { email: session.customer_email.toLowerCase() },
      });
      if (existingUser) {
        await prisma.order.update({
          where: { id: order.id },
          data: { userId: existingUser.id },
        });
        console.log(`[Webhook] Linked order ${order.id} to user ${existingUser.id}`);
      }
    }
  } catch (linkError) {
    console.error("[Webhook] Failed to link order to user:", linkError);
  }

  // 8. Auto-create production jobs for each order item
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

  // 9. Send order confirmation email (non-blocking)
  try {
    const orderWithItems = await prisma.order.findUnique({
      where: { id: order.id },
      include: { items: true },
    });
    if (orderWithItems && session.customer_email) {
      const html = buildOrderConfirmationHtml(orderWithItems, orderWithItems.items);
      await sendEmail({
        to: session.customer_email,
        subject: `Order Confirmed — ${order.id.slice(0, 8)}`,
        html,
        template: "order-confirmation",
        orderId: order.id,
      });
    }
  } catch (emailError) {
    console.error("[Webhook] Failed to send confirmation email:", emailError);
  }

  console.log(`[Webhook] Order created: ${order.id}`);
  return order;
}
