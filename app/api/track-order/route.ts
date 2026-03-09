import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createRateLimiter, getClientIp } from "@/lib/rate-limit";

const trackLimiter = createRateLimiter({ windowMs: 60_000, max: 10 });

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const { success: allowed } = trackLimiter.check(ip);
    if (!allowed) {
      return NextResponse.json(
        { error: "Too many attempts. Please try again later." },
        { status: 429 }
      );
    }

    const { orderRef, email } = await req.json();

    if (!orderRef || !email) {
      return NextResponse.json(
        { error: "Order reference and email are required." },
        { status: 400 }
      );
    }

    const order = await prisma.order.findFirst({
      where: {
        id: orderRef.trim(),
        customerEmail: { equals: email.trim(), mode: "insensitive" },
      },
      select: {
        id: true,
        status: true,
        productionStatus: true,
        totalAmount: true,
        shippingAmount: true,
        taxAmount: true,
        createdAt: true,
        estimatedCompletion: true,
        items: {
          select: { productName: true, quantity: true, unitPrice: true },
        },
        timeline: {
          orderBy: { createdAt: "desc" },
          take: 8,
          select: { id: true, action: true, details: true, createdAt: true },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "No order found. Please check your order reference and email." },
        { status: 404 }
      );
    }

    // Extract tracking info from the most recent "shipped" timeline event
    let tracking: { trackingNumber?: string; carrier?: string; estimatedDelivery?: string } | null = null;
    for (const evt of order.timeline) {
      if (evt.action === "shipped" && evt.details) {
        try {
          const d = typeof evt.details === "string" ? JSON.parse(evt.details) : evt.details;
          if (d.trackingNumber) {
            tracking = {
              trackingNumber: d.trackingNumber,
              carrier: d.carrier || null,
              estimatedDelivery: d.estimatedDelivery || null,
            };
            break;
          }
        } catch {}
      }
    }

    return NextResponse.json({
      id: order.id,
      status: order.status,
      totalAmount: order.totalAmount,
      shippingAmount: order.shippingAmount,
      taxAmount: order.taxAmount,
      createdAt: order.createdAt,
      productionStatus: order.productionStatus,
      estimatedCompletion: order.estimatedCompletion,
      tracking,
      items: order.items.map((item) => ({
        name: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
      timeline: order.timeline.map((evt) => ({
        id: evt.id,
        action: evt.action,
        createdAt: evt.createdAt,
      })),
    });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
