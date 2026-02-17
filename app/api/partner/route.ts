import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";

/** GET — get current user's partner info + recent orders */
export async function GET(request: Request) {
  const session = getSessionFromRequest(request);
  if (!session?.userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      companyName: true,
      companyRole: true,
      accountType: true,
      b2bApproved: true,
      partnerTier: true,
      partnerDiscount: true,
      inviteCode: true,
      createdAt: true,
      _count: { select: { orders: true, referrals: true } },
    },
  });

  if (!user || user.accountType !== "B2B" || !user.b2bApproved) {
    return NextResponse.json({ error: "Not a partner account" }, { status: 403 });
  }

  // Recent orders
  const orders = await prisma.order.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: {
      id: true,
      status: true,
      paymentStatus: true,
      productionStatus: true,
      totalAmount: true,
      currency: true,
      createdAt: true,
      items: {
        select: { productName: true, quantity: true, totalPrice: true },
      },
    },
  });

  // Stats
  const stats = await prisma.order.aggregate({
    where: { userId: user.id, paymentStatus: "paid" },
    _sum: { totalAmount: true },
    _count: { id: true },
  });

  return NextResponse.json({
    user,
    orders,
    stats: {
      totalSpent: stats._sum.totalAmount || 0,
      orderCount: stats._count.id || 0,
      referralCount: user._count.referrals,
    },
  });
}
