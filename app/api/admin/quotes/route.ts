import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin-auth";

/**
 * GET /api/admin/quotes — list quote requests with search, status filter, pagination
 */
export async function GET(request: NextRequest) {
  // Quotes are pricing-center-owned: quote requests require pricing knowledge
  // to set quotedAmountCents, and the pricing center has the quote simulator.
  const auth = await requirePermission(request, "pricing", "view");
  if (!auth.authenticated) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search") || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (status && status !== "all") {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { customerName: { contains: search, mode: "insensitive" } },
        { customerEmail: { contains: search, mode: "insensitive" } },
        { reference: { contains: search, mode: "insensitive" } },
        { companyName: { contains: search, mode: "insensitive" } },
        { productType: { contains: search, mode: "insensitive" } },
      ];
    }

    const [quotes, total] = await Promise.all([
      prisma.quoteRequest.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.quoteRequest.count({ where }),
    ]);

    return NextResponse.json({
      quotes,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("[Admin Quotes GET] Error:", error);
    return NextResponse.json({ error: "Failed to fetch quotes" }, { status: 500 });
  }
}
