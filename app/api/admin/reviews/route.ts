import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin-auth";

const PAGE_SIZE = 20;

export async function GET(request: NextRequest) {
  const auth = await requirePermission(request, "content", "view");
  if (!auth.authenticated) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get("filter") || "all";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));

    const where: Record<string, unknown> = {};

    if (filter === "pending") {
      where.isApproved = false;
    } else if (filter === "approved") {
      where.isApproved = true;
    }
    // "all" — no filter

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
      }),
      prisma.review.count({ where }),
    ]);

    // Gather unique product IDs so we can include product names
    const productIds = [...new Set(reviews.map((r) => r.productId))];

    const products = productIds.length
      ? await prisma.product.findMany({
          where: { id: { in: productIds } },
          select: { id: true, name: true },
        })
      : [];

    const productMap = Object.fromEntries(products.map((p) => [p.id, p.name]));

    const reviewsWithProduct = reviews.map((r) => ({
      ...r,
      productName: productMap[r.productId] || "Unknown Product",
    }));

    return NextResponse.json({
      reviews: reviewsWithProduct,
      pagination: {
        page,
        pageSize: PAGE_SIZE,
        total,
        totalPages: Math.ceil(total / PAGE_SIZE),
      },
    });
  } catch (err) {
    console.error("[/api/admin/reviews] GET Error:", err);
    return NextResponse.json(
      { error: "Failed to fetch reviews" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await requirePermission(request, "content", "edit");
  if (!auth.authenticated) return auth.response;

  try {
    const body = await request.json();
    const { id, action } = body;

    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { error: "id is required" },
        { status: 400 }
      );
    }

    if (action !== "approve" && action !== "reject") {
      return NextResponse.json(
        { error: "action must be \"approve\" or \"reject\"" },
        { status: 400 }
      );
    }

    const review = await prisma.review.findUnique({ where: { id } });
    if (!review) {
      return NextResponse.json(
        { error: "Review not found" },
        { status: 404 }
      );
    }

    if (action === "approve") {
      await prisma.review.update({
        where: { id },
        data: { isApproved: true },
      });

      return NextResponse.json({ success: true, status: "approved" });
    }

    // action === "reject" — delete the review
    await prisma.review.delete({ where: { id } });

    return NextResponse.json({ success: true, status: "rejected" });
  } catch (err) {
    console.error("[/api/admin/reviews] PATCH Error:", err);
    return NextResponse.json(
      { error: "Failed to update review" },
      { status: 500 }
    );
  }
}
