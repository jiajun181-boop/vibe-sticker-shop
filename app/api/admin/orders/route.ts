import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  const auth = await requirePermission(request, "orders", "view");
  if (!auth.authenticated) return auth.response;

  try {
    const { searchParams } = new URL(request.url);

    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const ALLOWED_SORT_FIELDS = ["createdAt", "updatedAt", "totalAmount", "status", "customerName", "customerEmail"];
    const rawSort = searchParams.get("sort") || "createdAt";
    const sort = ALLOWED_SORT_FIELDS.includes(rawSort) ? rawSort : "createdAt";
    const rawOrder = searchParams.get("order") || "desc";
    const order = rawOrder === "asc" ? "asc" : "desc";

    const production = searchParams.get("production");

    const where: Record<string, unknown> = {};

    if (status && status !== "all") {
      where.status = status;
    }

    if (production && production !== "all") {
      where.productionStatus = production;
    }

    if (search) {
      where.OR = [
        { customerEmail: { contains: search, mode: "insensitive" } },
        { id: { contains: search } },
        { customerName: { contains: search, mode: "insensitive" } },
        { customerPhone: { contains: search } },
      ];
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          _count: { select: { items: true, notes: true } },
          items: {
            take: 1,
            orderBy: { totalPrice: "desc" },
            select: {
              productName: true,
              material: true,
              meta: true,
            },
          },
        },
        orderBy: { [sort]: order },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.order.count({ where }),
    ]);

    return NextResponse.json({
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("[/api/admin/orders] Error:", err);
    return NextResponse.json(
      { error: "Failed to fetch orders", orders: [], pagination: null },
      { status: 500 }
    );
  }
}
