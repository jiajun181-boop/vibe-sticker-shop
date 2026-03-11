import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

/**
 * GET /api/account/orders/[id]/files
 *
 * List files for an order (customer view).
 * Returns OrderFiles with preflight status.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const order = await prisma.order.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        customerEmail: true,
        files: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            fileName: true,
            fileUrl: true,
            mimeType: true,
            fileExt: true,
            sizeBytes: true,
            widthPx: true,
            heightPx: true,
            dpi: true,
            preflightStatus: true,
            preflightResult: true,
            createdAt: true,
          },
        },
        items: {
          select: {
            id: true,
            productName: true,
            fileUrl: true,
            fileName: true,
            meta: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Verify ownership
    if (order.userId !== user.id && order.customerEmail !== user.email) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Check which items are missing artwork
    const itemsNeedingArtwork = order.items
      .filter((item) => {
        const meta = item.meta && typeof item.meta === "object" ? item.meta as Record<string, unknown> : {};
        const hasFile = !!(item.fileUrl || meta.artworkUrl || meta.fileUrl);
        const isUploadLater = meta.artworkIntent === "upload-later" || meta.intakeMode === "upload-later";
        const isDesignHelp = meta.artworkIntent === "design-help" || meta.designHelp === true;
        return !hasFile && !isDesignHelp; // Design-help items don't need customer upload
      })
      .map((item) => ({
        id: item.id,
        productName: item.productName,
      }));

    return NextResponse.json({
      files: order.files,
      itemsNeedingArtwork,
      totalItems: order.items.length,
    });
  } catch (error) {
    console.error("[account/orders/files] GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/account/orders/[id]/files
 *
 * Link an uploaded file to an order as an OrderFile.
 * Customer calls this AFTER uploading via UploadThing.
 *
 * Body: {
 *   fileUrl: string,     — UploadThing URL
 *   fileName: string,    — original file name
 *   storageKey?: string, — UploadThing key
 *   mimeType?: string,
 *   sizeBytes?: number,
 *   itemId?: string,     — link to specific order item
 * }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { fileUrl, fileName, storageKey, mimeType, sizeBytes, itemId } = body;

    if (!fileUrl || !fileName) {
      return NextResponse.json(
        { error: "fileUrl and fileName are required" },
        { status: 400 }
      );
    }

    // Verify order ownership
    const order = await prisma.order.findUnique({
      where: { id },
      select: { id: true, userId: true, customerEmail: true, status: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.userId !== user.id && order.customerEmail !== user.email) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Don't allow file uploads on canceled/refunded orders
    if (["canceled", "refunded"].includes(order.status)) {
      return NextResponse.json(
        { error: "Cannot upload files for a canceled order" },
        { status: 400 }
      );
    }

    // Extract file extension
    const fileExt = fileName.includes(".")
      ? fileName.split(".").pop()?.toLowerCase() || null
      : null;

    // Create OrderFile record
    const orderFile = await prisma.orderFile.create({
      data: {
        orderId: id,
        fileUrl,
        storageKey: storageKey || null,
        fileName,
        mimeType: mimeType || null,
        fileExt,
        sizeBytes: sizeBytes || null,
        preflightStatus: "pending",
      },
    });

    // If itemId provided, also update the item's fileUrl
    if (itemId) {
      const item = await prisma.orderItem.findFirst({
        where: { id: itemId, orderId: id },
      });
      if (item) {
        await prisma.orderItem.update({
          where: { id: itemId },
          data: { fileUrl, fileName },
        });
      }
    }

    // Create timeline entry
    await prisma.orderTimeline.create({
      data: {
        orderId: id,
        action: "file_uploaded",
        details: JSON.stringify({
          fileName,
          fileUrl,
          itemId: itemId || null,
          uploadedBy: "customer",
        }),
        actor: user.email || "customer",
      },
    });

    return NextResponse.json({ file: orderFile }, { status: 201 });
  } catch (error) {
    console.error("[account/orders/files] POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
