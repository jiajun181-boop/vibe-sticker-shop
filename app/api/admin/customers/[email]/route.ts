import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ email: string }> }
) {
  const { email: rawEmail } = await params;
  const email = decodeURIComponent(rawEmail);

  try {
    const [aggregate, orders] = await Promise.all([
      prisma.order.aggregate({
        where: { customerEmail: email },
        _sum: { totalAmount: true },
        _count: { id: true },
      }),
      prisma.order.findMany({
        where: { customerEmail: email },
        include: { items: true },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    if (aggregate._count.id === 0) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    // Extract name from most recent order
    const name = orders[0]?.customerName || null;

    return NextResponse.json({
      email,
      name,
      orderCount: aggregate._count.id,
      totalSpent: aggregate._sum.totalAmount || 0,
      orders,
    });
  } catch (error) {
    console.error("Failed to fetch customer:", error);
    return NextResponse.json(
      { error: "Failed to fetch customer" },
      { status: 500 }
    );
  }
}
