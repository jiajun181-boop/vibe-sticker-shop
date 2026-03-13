import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

function generateClaimNumber(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return `WC-${code}`;
}

/**
 * GET /api/account/warranty
 * List the authenticated user's warranty claims.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const claims = await prisma.warrantyClaim.findMany({
      where: {
        OR: [
          { userId: user.id },
          { customerEmail: user.email },
        ],
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ claims });
  } catch (err) {
    console.error("[account/warranty] GET error:", err);
    return NextResponse.json(
      { error: "Failed to load warranty claims" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/account/warranty
 * Submit a new warranty claim.
 * Body: { orderId, issueType, description, photoUrls?, quantity? }
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { orderId, issueType, description, photoUrls, quantity } = body;

    if (!orderId || !issueType || !description) {
      return NextResponse.json(
        { error: "Missing required fields: orderId, issueType, description" },
        { status: 400 }
      );
    }

    const validIssueTypes = [
      "defective",
      "damaged",
      "wrong_item",
      "quality",
      "other",
    ];
    if (!validIssueTypes.includes(issueType)) {
      return NextResponse.json(
        { error: `Invalid issueType. Must be one of: ${validIssueTypes.join(", ")}` },
        { status: 400 }
      );
    }

    // Verify the order belongs to this user
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        OR: [
          { userId: user.id },
          { customerEmail: user.email },
        ],
      },
      select: {
        id: true,
        customerEmail: true,
        customerName: true,
        items: {
          select: {
            id: true,
            productName: true,
            quantity: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Order not found or does not belong to you" },
        { status: 404 }
      );
    }

    // Check for duplicate active claims on the same order
    const existingClaim = await prisma.warrantyClaim.findFirst({
      where: {
        orderId,
        status: { in: ["submitted", "under_review"] },
        OR: [
          { userId: user.id },
          { customerEmail: user.email },
        ],
      },
    });

    if (existingClaim) {
      return NextResponse.json(
        {
          error:
            "You already have an active warranty claim for this order. Please wait for the existing claim to be reviewed.",
        },
        { status: 409 }
      );
    }

    // Generate a unique claim number (retry on collision)
    let claimNumber = generateClaimNumber();
    let attempts = 0;
    while (attempts < 5) {
      const exists = await prisma.warrantyClaim.findUnique({
        where: { claimNumber },
        select: { id: true },
      });
      if (!exists) break;
      claimNumber = generateClaimNumber();
      attempts++;
    }

    const firstItem = order.items?.[0];

    const claim = await prisma.warrantyClaim.create({
      data: {
        claimNumber,
        orderId,
        userId: user.id,
        customerEmail: order.customerEmail || user.email,
        customerName: order.customerName || user.name || undefined,
        issueType,
        description: description.trim(),
        photoUrls: Array.isArray(photoUrls)
          ? photoUrls.filter((u: string) => typeof u === "string" && u.trim())
          : [],
        productName: firstItem?.productName || undefined,
        quantity: typeof quantity === "number" && quantity > 0 ? quantity : 1,
      },
    });

    return NextResponse.json({ claim }, { status: 201 });
  } catch (err) {
    console.error("[account/warranty] POST error:", err);
    return NextResponse.json(
      { error: "Failed to submit warranty claim" },
      { status: 500 }
    );
  }
}
