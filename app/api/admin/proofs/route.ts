import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  try {
    const auth = await requirePermission(request, "tools", "view");
    if (!auth.authenticated) return auth.response;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));

    const where: Record<string, unknown> = {};
    if (status && status !== "all") where.status = status;

    const [proofs, total] = await Promise.all([
      prisma.orderProof.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          order: {
            select: {
              id: true,
              customerEmail: true,
              customerName: true,
              status: true,
            },
          },
        },
      }),
      prisma.orderProof.count({ where }),
    ]);

    return NextResponse.json({
      proofs,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error("[admin/proofs] GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
