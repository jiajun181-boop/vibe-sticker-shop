import { prisma } from "./prisma";
import Stripe from "stripe";
import { validateAmountReconciliation } from "./calculate-order-totals";
import { applyAssignmentRules } from "./assignment-rules";
import { sendEmail } from "./email/resend";
import { buildOrderConfirmationHtml } from "./email/templates/order-confirmation";
import { decrementStock } from "./inventory";
import { sendOrderSms } from "./notifications/sms-notifications";
import { applyAutoTags } from "./auto-tag";
import { syncOrderProductionStatus } from "./production-sync";
import { detectProductFamily } from "./preflight";
import { isProductionItem } from "./order-item-utils";
import { populateItemCosts } from "./pricing/compute-item-cost";
import { awardLoyaltyPoints } from "./loyalty";
import {
  toNumberOrNull,
  parseSizeRows,
  parseMetadataItems,
  shapeOrderItem,
  shapeProductionJob,
  buildOrderCreatedTimeline,
  buildSystemNote,
  shouldAutoCreateProof,
  getProofImageUrl,
} from "./webhook-helpers";

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

  // 3. Parse metadata (using extracted helper for testability)
  const metadata = session.metadata;
  let items: any[];
  try {
    items = parseMetadataItems(metadata as Record<string, string> | null);
  } catch (parseErr) {
    console.error("[Webhook] CRITICAL: Failed to parse metadata.items for session:", sessionId, parseErr);
    throw parseErr;
  }

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
        deliveryMethod: metadata?.deliveryMethod || "shipping",
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

    // Create order items (using extracted shapeOrderItem for testability)
    for (const item of items) {
      const shaped = shapeOrderItem(item);
      await tx.orderItem.create({
        data: {
          orderId: newOrder.id,
          ...shaped,
        },
      });
    }

    // Create auto-generated proofs for items with confirmed die-cut contours
    for (const item of items) {
      const meta = item?.meta && typeof item.meta === "object" ? item.meta : null;
      if (!shouldAutoCreateProof(meta)) continue;

      const proofImageUrl = getProofImageUrl(meta!);

      // Link ProofData record to this order (if saved server-side before checkout)
      const proofDataId = meta?.proofDataId;
      if (proofDataId && typeof proofDataId === "string") {
        try {
          await tx.proofData.update({
            where: { id: proofDataId },
            data: { orderId: newOrder.id },
          });
        } catch {
          // ProofData may not exist (old orders or direct buy) — non-fatal
          console.log(`[Webhook] ProofData ${proofDataId} not found, skipping link`);
        }
      }

      await tx.orderProof.create({
        data: {
          orderId: newOrder.id,
          version: 1,
          imageUrl: proofImageUrl,
          fileName: meta?.fileName ? `proof-${meta.fileName}` : "auto-proof.png",
          notes: meta?.designStudio
            ? "Customer-approved design from Design Studio"
            : `Customer-confirmed proof — auto-generated contour with ${meta?.bleedMm || 3}mm bleed${proofDataId ? ` [proofData:${proofDataId}]` : ""}`,
          status: "approved",
          reviewedAt: new Date(),
          uploadedBy: "customer",
        },
      });

      // For Design Studio items, also create an OrderFile with the print-ready PDF
      if (meta?.designStudio && meta?.artworkPdfUrl) {
        await tx.orderFile.create({
          data: {
            orderId: newOrder.id,
            fileUrl: meta.artworkPdfUrl,
            storageKey: meta.artworkKey || null,
            fileName: `design-studio-${item.name || "artwork"}.pdf`,
            mimeType: "application/pdf",
            fileExt: "pdf",
            widthIn: typeof meta.widthIn === "number" ? meta.widthIn : null,
            heightIn: typeof meta.heightIn === "number" ? meta.heightIn : null,
            hasBleed: true,
            bleedIn: 0.125,
            preflightStatus: "approved",
          },
        });
      }
    }

    // Create timeline entry (using extracted helper)
    await tx.orderTimeline.create({
      data: {
        orderId: newOrder.id,
        ...buildOrderCreatedTimeline(session.payment_intent as string),
      },
    });

    // Create system note (using extracted helper)
    await tx.orderNote.create({
      data: {
        orderId: newOrder.id,
        ...buildSystemNote(sessionId),
      },
    });

    // 6. Atomic coupon usage increment (inside transaction for consistency)
    if (couponId) {
      await tx.coupon.update({
        where: { id: couponId },
        data: { usedCount: { increment: 1 } },
      });
    }

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

        // Mark any abandoned cart as recovered
        await prisma.abandonedCart.updateMany({
          where: { userId: existingUser.id, recoveredAt: null },
          data: { recoveredAt: new Date(), checkoutSessionId: sessionId },
        });
      }
    }
  } catch (linkError) {
    console.error("[Webhook] Failed to link order to user:", linkError);
  }

  // 7b. Decrement inventory for tracked products
  try {
    const stockItems = items.map((item: Record<string, unknown>) => ({
      productId: (item.productId as string) || "",
      quantity: (item.quantity as number) || 1,
    })).filter((si: { productId: string }) => si.productId);
    if (stockItems.length > 0) {
      await decrementStock(stockItems);
    }
  } catch (stockErr) {
    console.error(`[Webhook] CRITICAL: Failed to decrement stock for order ${order.id}:`, stockErr);
  }

  // 8. Auto-create production jobs for each order item (per-item error handling)
  try {
    const orderItems = await prisma.orderItem.findMany({
      where: { orderId: order.id },
    });

    let jobsCreated = 0;
    for (const item of orderItems) {
      // Skip non-production items (service fees like design help)
      if (!isProductionItem(item)) continue;

      try {
        // Shape production job fields (using extracted helper for testability)
        const jobShape = shapeProductionJob(item);
        const family = detectProductFamily(item);

        const newJob = await prisma.productionJob.create({
          data: {
            orderItemId: item.id,
            status: "queued",
            priority: jobShape.isRush ? "urgent" : "normal",
            dueAt: jobShape.dueAt,
            productName: item.productName || null,
            family,
            quantity: item.quantity,
            widthIn: jobShape.widthIn,
            heightIn: jobShape.heightIn,
            material: jobShape.material,
            materialLabel: jobShape.materialLabel,
            finishing: jobShape.finishing,
            finishingLabel: jobShape.finishingLabel,
            artworkUrl: jobShape.artworkUrl,
            artworkKey: jobShape.artworkKey,
            isTwoSided: jobShape.isTwoSided,
            isRush: jobShape.isRush,
          },
        });
        jobsCreated++;

        // Try to auto-assign via rules (don't let failure stop other jobs)
        try {
          await applyAssignmentRules(newJob.id);
        } catch (assignErr) {
          console.error(`[Webhook] Assignment rules failed for job ${newJob.id}:`, assignErr);
        }
      } catch (itemJobErr) {
        console.error(`[Webhook] Failed to create production job for item ${item.id}:`, itemJobErr);
      }
    }

    // Sync order productionStatus after all jobs + assignments are created
    if (jobsCreated > 0) {
      try {
        await syncOrderProductionStatus(order.id);
      } catch (syncErr) {
        console.error(`[Webhook] Failed to sync production status for order ${order.id}:`, syncErr);
      }
    }

  } catch (jobError) {
    // Don't fail the webhook if job query fails
    console.error(`[Webhook] Failed to create production jobs:`, jobError);
  }

  // 8b. Auto-tag order based on items, materials, quantities (non-blocking)
  applyAutoTags(order.id, prisma).catch((err) => {
    console.error("[Webhook] Failed to auto-tag order:", err);
  });

  // 8c. Compute cost breakdown for each item (non-blocking)
  populateItemCosts(order.id).catch((err) => {
    console.error("[Webhook] Failed to populate item costs:", err);
  });

  // 8d. Award loyalty points (non-blocking)
  awardLoyaltyPoints(order.id, totalAmount).catch((err) => {
    console.error("[Webhook] Failed to award loyalty points:", err);
  });

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

  // 10. Send SMS notification (non-blocking)
  sendOrderSms(order.id, "order_confirmed").catch((err) => {
    console.error("[Webhook] Failed to send SMS:", err);
  });

  console.log(`[Webhook] Order created: ${order.id}`);
  return order;
}
