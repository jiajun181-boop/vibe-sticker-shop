import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getClientIp, uploadLimiter } from "@/lib/rate-limit";

/**
 * POST /api/orders/upload-artwork
 *
 * Guest-accessible artwork upload endpoint.
 * Verifies customer identity via email + order reference (same as track-order).
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
    const { email, orderId, fileUrl, fileName, storageKey, mimeType, sizeBytes, itemId } = body;

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

    // Link to specific item if provided
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
