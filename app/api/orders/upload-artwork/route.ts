import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getClientIp, uploadLimiter } from "@/lib/rate-limit";
import { refreshAutoTags } from "@/lib/auto-tag";
import { itemNeedsArtwork } from "@/lib/artwork-detection";

/**
 * POST /api/orders/upload-artwork
 *
 * Guest-accessible artwork upload endpoint.
 * Verifies customer identity via email + order reference (same as track-order).
 *
 * Auto-links to the single remaining item when itemId is omitted.
 * Returns 400 if multiple items still need artwork and no itemId provided.
 *
 * Body: {
 *   email: string,       — customer email for verification
 *   orderId: string,     — order ID
 *   fileUrl: string,     — UploadThing URL (customer must upload first via UploadThing)
 *   fileName: string,    — original file name
 *   storageKey?: string,
 *   mimeType?: string,
 *   sizeBytes?: number,
 *   itemId?: string,     — optional: link to specific order item
 * }
 *
 * This endpoint is rate-limited and does NOT require authentication.
 * It uses email verification against the order's customerEmail.
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limit
    const ip = getClientIp(request);
    const { success } = uploadLimiter.check(ip);
    if (!success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { email, orderId, fileUrl, fileName, storageKey, mimeType, sizeBytes } = body;
    let { itemId } = body;

    if (!email || !orderId || !fileUrl || !fileName) {
      return NextResponse.json(
        { error: "email, orderId, fileUrl, and fileName are required" },
        { status: 400 }
      );
    }

    // Look up order and verify email
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        customerEmail: true,
        status: true,
        items: {
          select: { id: true, productName: true, fileUrl: true, meta: true },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Verify email matches (case-insensitive)
    if (order.customerEmail.toLowerCase() !== email.toLowerCase().trim()) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Don't allow uploads on canceled orders
    if (["canceled", "refunded"].includes(order.status)) {
      return NextResponse.json(
        { error: "Cannot upload files for a canceled order" },
        { status: 400 }
      );
    }

    // Resolve itemId: auto-link if exactly one item needs artwork
    const itemsStillNeeding = order.items.filter((item) => itemNeedsArtwork(item));

    if (!itemId && itemsStillNeeding.length === 1) {
      itemId = itemsStillNeeding[0].id;
    } else if (!itemId && itemsStillNeeding.length > 1) {
      return NextResponse.json(
        {
          error: "This order has multiple items that need artwork. Please select which item this file is for.",
          itemsNeeding: itemsStillNeeding.map((i) => ({ id: i.id, productName: i.productName })),
        },
        { status: 400 }
      );
    }

    const fileExt = fileName.includes(".")
      ? fileName.split(".").pop()?.toLowerCase() || null
      : null;

    // Create OrderFile
    const orderFile = await prisma.orderFile.create({
      data: {
        orderId,
        fileUrl,
        storageKey: storageKey || null,
        fileName,
        mimeType: mimeType || null,
        fileExt,
        sizeBytes: sizeBytes || null,
        preflightStatus: "pending",
      },
    });

    // Update the item's fileUrl so item-level detection sees the artwork
    if (itemId) {
      const item = await prisma.orderItem.findFirst({
        where: { id: itemId, orderId },
      });
      if (item) {
        await prisma.orderItem.update({
          where: { id: itemId },
          data: { fileUrl, fileName },
        });
      }
    }

    // Timeline entry
    await prisma.orderTimeline.create({
      data: {
        orderId,
        action: "file_uploaded",
        details: JSON.stringify({
          fileName,
          fileUrl,
          itemId: itemId || null,
          uploadedBy: "customer_guest",
        }),
        actor: email.toLowerCase().trim(),
      },
    });

    // Refresh auto-tags (clears missing-artwork if all items now have files)
    refreshAutoTags(orderId, prisma);

    return NextResponse.json({
      success: true,
      fileId: orderFile.id,
      fileName: orderFile.fileName,
    }, { status: 201 });
  } catch (error) {
    console.error("[orders/upload-artwork] POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
