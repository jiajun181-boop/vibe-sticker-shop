import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin-auth";

/**
 * GET /api/admin/support — list all support tickets (admin)
 */
export async function GET(req: NextRequest) {
  const auth = await requirePermission(req, "support", "view");
  if (!auth.authenticated) return auth.response;

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20")));

    const search = searchParams.get("search");

    const where: Record<string, unknown> = {};
    if (status && status !== "all") {
      where.status = status;
    }
    if (search) {
      where.OR = [
        { subject: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    const [tickets, total] = await Promise.all([
      prisma.supportTicket.findMany({
        where,
        orderBy: [
          { status: "asc" },
          { updatedAt: "desc" },
        ],
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: { select: { id: true, name: true, email: true } },
          _count: { select: { messages: true } },
        },
      }),
      prisma.supportTicket.count({ where }),
    ]);

    return NextResponse.json({ tickets, total, page, limit });

  } catch (err) {
    console.error("[admin/support] GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
