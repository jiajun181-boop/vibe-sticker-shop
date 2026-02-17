import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const session = getSessionFromRequest(request);
    const body = await request.json();

    const { productId, rating, title, body: reviewBody } = body;

    // --- Validation ---

    if (!productId) {
      return NextResponse.json(
        { error: "productId is required" },
        { status: 400 }
      );
    }

    if (!rating || typeof rating !== "number" || rating < 1 || rating > 5 || !Number.isInteger(rating)) {
      return NextResponse.json(
        { error: "rating must be an integer between 1 and 5" },
        { status: 400 }
      );
    }

    if (!reviewBody || typeof reviewBody !== "string" || reviewBody.trim().length < 10) {
      return NextResponse.json(
        { error: "Review body must be at least 10 characters" },
        { status: 400 }
      );
    }

    // --- Resolve customer identity ---

    let userId: string | null = null;
    let customerName: string;
    let customerEmail: string;

    if (session?.userId) {
      // Logged-in user: get name and email from the database
      const user = await prisma.user.findUnique({
        where: { id: session.userId },
        select: { id: true, name: true, email: true },
      });

      if (!user) {
        return NextResponse.json(
          { error: "User not found" },
          { status: 404 }
        );
      }

      userId = user.id;
      customerName = user.name || "Customer";
      customerEmail = user.email;
    } else {
      // Guest: require name and email in the body
      if (!body.name || typeof body.name !== "string" || body.name.trim().length === 0) {
        return NextResponse.json(
          { error: "name is required for guest reviews" },
          { status: 400 }
        );
      }

      if (!body.email || typeof body.email !== "string" || !body.email.includes("@")) {
        return NextResponse.json(
          { error: "A valid email is required for guest reviews" },
          { status: 400 }
        );
      }

      customerName = body.name.trim();
      customerEmail = body.email.trim().toLowerCase();
    }

    // --- Duplicate check (by userId or email) ---

    const existingReview = await prisma.review.findFirst({
      where: {
        productId,
        OR: [
          ...(userId ? [{ userId }] : []),
          { customerEmail },
        ],
      },
    });

    if (existingReview) {
      return NextResponse.json(
        { error: "You have already reviewed this product" },
        { status: 409 }
      );
    }

    // --- Verified purchase detection ---

    let isVerified = false;

    const paidOrderWithProduct = await prisma.order.findFirst({
      where: {
        paymentStatus: "paid",
        ...(userId
          ? { OR: [{ userId }, { customerEmail }] }
          : { customerEmail }),
        items: {
          some: { productId },
        },
      },
      select: { id: true },
    });

    if (paidOrderWithProduct) {
      isVerified = true;
    }

    // --- Create review ---

    await prisma.review.create({
      data: {
        productId,
        userId,
        customerName,
        customerEmail,
        rating,
        title: title ? String(title).trim() : null,
        body: reviewBody.trim(),
        isApproved: false,
        isVerified,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Thank you for your review! It will appear after moderation.",
      isVerified,
    });
  } catch (err) {
    console.error("[/api/reviews/submit] Error:", err);
    return NextResponse.json(
      { error: "Failed to submit review" },
      { status: 500 }
    );
  }
}
