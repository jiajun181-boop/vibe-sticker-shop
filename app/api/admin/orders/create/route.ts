import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin-auth";
import { isServiceFeeItem } from "@/lib/order-item-utils";
import { detectProductFamily } from "@/lib/preflight";
import { DESIGN_HELP_CENTS } from "@/lib/order-config";

/**
 * POST /api/admin/orders/create
 * Creates a manual order from admin panel.
 * Creates Order + OrderItems + ProductionJobs in a single transaction.
 *
 * Semantics aligned with storefront checkout:
 *   - artworkIntent: "provided" | "upload-later" | "design-help"
 *   - rushProduction: boolean → priority "urgent" on ProductionJob
 *   - design-help items create a real service-fee OrderItem row
 */
export async function POST(request: NextRequest) {
  const auth = await requirePermission(request, "orders", "edit");
  if (!auth.authenticated) return auth.response;

  try {
    const body = await request.json();
    const {
      customerEmail,
      customerName,
      customerPhone,
      items,
      notes,
      paymentStatus = "unpaid",
    } = body;

    if (!customerEmail || !items || items.length === 0) {
      return NextResponse.json(
        { error: "Customer email and at least one item are required" },
        { status: 400 }
      );
    }

    // Validate items
    for (const item of items) {
      if (!item.productName || item.quantity < 1) {
        return NextResponse.json(
          { error: "Each item must have a productName and quantity >= 1" },
          { status: 400 }
        );
      }
    }

    // Count design-help requests for service-fee row
    const designHelpCount = items.filter(
      (item: { artworkIntent?: string }) => item.artworkIntent === "design-help"
    ).length;
    const designHelpTotal = designHelpCount * DESIGN_HELP_CENTS;

    // Calculate totals (product items + design-help service fee)
    const itemsSubtotal = items.reduce(
      (sum: number, item: { totalPrice?: number; unitPrice?: number; quantity: number }) =>
        sum + (item.totalPrice || (item.unitPrice || 0) * item.quantity),
      0
    );
    const subtotalAmount = itemsSubtotal + designHelpTotal;

    // Build order tags
    const hasRush = items.some((item: { rushProduction?: boolean }) => item.rushProduction);
    const tags = ["admin_manual"];
    if (hasRush) tags.push("rush");
    if (designHelpCount > 0) tags.push("design-help");

    // Look up existing user by email
    const existingUser = await prisma.user.findUnique({
      where: { email: customerEmail.toLowerCase().trim() },
      select: { id: true },
    });

    const order = await prisma.$transaction(async (tx) => {
      // Build line items for creation
      type ItemInput = {
        productName: string;
        productType?: string;
        quantity: number;
        unitPrice?: number;
        totalPrice?: number;
        widthIn?: number;
        heightIn?: number;
        material?: string;
        finishing?: string;
        artworkIntent?: string;
        rushProduction?: boolean;
        meta?: Record<string, unknown>;
      };

      const orderItemsCreate = items.map((item: ItemInput) => ({
        productName: item.productName,
        productType: item.productType || "custom",
        quantity: item.quantity,
        unitPrice: item.unitPrice || 0,
        totalPrice: item.totalPrice || (item.unitPrice || 0) * item.quantity,
        widthIn: item.widthIn || null,
        heightIn: item.heightIn || null,
        material: item.material || null,
        finishing: item.finishing || null,
        meta: item.meta || null,
      }));

      // Add design-help service-fee row (matches Interac/Invoice convention)
      if (designHelpTotal > 0) {
        orderItemsCreate.push({
          productName: designHelpCount > 1
            ? `Design Help Service (×${designHelpCount})`
            : "Design Help Service",
          productType: "service" as string,
          quantity: 1,
          unitPrice: designHelpTotal,
          totalPrice: designHelpTotal,
          widthIn: null,
          heightIn: null,
          material: null,
          finishing: null,
          meta: { isServiceFee: "true", feeType: "design-help" } as Record<string, unknown>,
        });
      }

      // Lifecycle: paid manual orders → status "paid" so downstream sees them correctly
      const effectiveStatus = paymentStatus === "paid" ? "paid" : "pending";

      // Create order with all items
      const newOrder = await tx.order.create({
        data: {
          customerEmail: customerEmail.toLowerCase().trim(),
          customerName: customerName || null,
          customerPhone: customerPhone || null,
          userId: existingUser?.id || null,
          subtotalAmount,
          totalAmount: subtotalAmount,
          status: effectiveStatus,
          paymentStatus: paymentStatus as "unpaid" | "paid",
          productionStatus: "not_started",
          tags,
          items: { create: orderItemsCreate },
        },
        include: { items: true },
      });

      // Create ProductionJob for each production item (skip service-fee rows)
      for (const orderItem of newOrder.items) {
        if (isServiceFeeItem(orderItem)) continue;

        const itemMeta = orderItem.meta && typeof orderItem.meta === "object"
          ? orderItem.meta as Record<string, unknown> : {};
        const family = detectProductFamily(orderItem);
        const artworkUrl = orderItem.fileUrl
          || (typeof itemMeta.artworkUrl === "string" ? itemMeta.artworkUrl : null);
        const isRush = itemMeta.rushProduction === "true";

        // Rush → +1 day, standard → +3 days
        const dueAt = new Date();
        dueAt.setDate(dueAt.getDate() + (isRush ? 1 : 3));

        await tx.productionJob.create({
          data: {
            orderItemId: orderItem.id,
            status: "queued",
            priority: isRush ? "urgent" : "normal",
            dueAt,
            productName: orderItem.productName || null,
            family,
            quantity: orderItem.quantity,
            widthIn: orderItem.widthIn || null,
            heightIn: orderItem.heightIn || null,
            material: orderItem.material || null,
            finishing: orderItem.finishing || null,
            artworkUrl,
            isRush,
          },
        });
      }

      // Add a note if provided
      if (notes) {
        await tx.orderNote.create({
          data: {
            orderId: newOrder.id,
            message: notes,
            authorType: "staff",
            isInternal: true,
          },
        });
      }

      // Summarize pricing provenance for timeline
      const pricingSources = items.reduce(
        (acc: Record<string, number>, item: { meta?: Record<string, unknown> }) => {
          const src = (item.meta?.pricingSource as string) || "manual";
          acc[src] = (acc[src] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );
      const pricingParts: string[] = [];
      if (pricingSources.calculated) pricingParts.push(`${pricingSources.calculated} calc-priced`);
      if (pricingSources.overridden) pricingParts.push(`${pricingSources.overridden} overridden`);
      if (pricingSources.manual) pricingParts.push(`${pricingSources.manual} manual-priced`);
      const pricingSummary = pricingParts.length > 0 ? `pricing: ${pricingParts.join(", ")}` : null;

      // Add timeline entry
      const timelineDetails = [
        "Order created manually from admin panel",
        paymentStatus === "paid" ? "(paid)" : "(unpaid)",
        hasRush ? "(rush)" : null,
        designHelpCount > 0 ? `(${designHelpCount} design-help)` : null,
        pricingSummary ? `| ${pricingSummary}` : null,
      ].filter(Boolean).join(" ");

      await tx.orderTimeline.create({
        data: {
          orderId: newOrder.id,
          action: "created",
          details: timelineDetails,
          actor: auth.user?.email || "admin",
        },
      });

      // If paid at creation, add a payment timeline entry
      if (paymentStatus === "paid") {
        await tx.orderTimeline.create({
          data: {
            orderId: newOrder.id,
            action: "payment_received",
            details: "Manual order marked as paid at creation",
            actor: auth.user?.email || "admin",
          },
        });
      }

      return newOrder;
    });

    return NextResponse.json({ order }, { status: 201 });
  } catch (err) {
    console.error("[AdminOrderCreate] Error:", err);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}
