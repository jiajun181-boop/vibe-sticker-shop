import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(request) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "10", 10)));
  const skip = (page - 1) * limit;

  // Match orders by userId OR email (catches pre-registration orders)
  const where = {
    OR: [
      { userId: user.id },
      { customerEmail: user.email },
    ],
  };

  const [orders, total, spentResult] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      select: {
        id: true,
        status: true,
        paymentStatus: true,
        productionStatus: true,
        totalAmount: true,
        createdAt: true,
        _count: { select: { items: true } },
      },
    }),
    prisma.order.count({ where }),
    prisma.order.aggregate({
      where,
      _sum: { totalAmount: true },
    }),
  ]);

  return NextResponse.json({
    orders,
    total,
    totalSpent: spentResult._sum.totalAmount || 0,
    page,
    pageSize: limit,
  });
}
