import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin-auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ email: string }> }
) {
  const auth = await requirePermission(request, "customers", "view");
  if (!auth.authenticated) return auth.response;

  const { email: rawEmail } = await params;
  const email = decodeURIComponent(rawEmail);

  try {
    const [aggregate, orders, user, supportTickets, conversations] = await Promise.all([
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
      prisma.user.findFirst({
        where: {
          email: { equals: email, mode: "insensitive" },
        },
        select: {
          id: true,
          email: true,
          name: true,
          accountType: true,
          companyName: true,
          companyRole: true,
          b2bApproved: true,
          b2bApprovedAt: true,
          partnerTier: true,
          partnerDiscount: true,
        },
      }),
      prisma.supportTicket.findMany({
        where: {
          email: { equals: email, mode: "insensitive" },
        },
        orderBy: { updatedAt: "desc" },
        take: 5,
        include: {
          _count: { select: { messages: true } },
        },
      }),
      prisma.conversation.findMany({
        where: {
          customerEmail: { equals: email, mode: "insensitive" },
        },
        orderBy: { lastMessageAt: "desc" },
        take: 5,
        include: {
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
          _count: { select: { messages: true } },
        },
      }),
    ]);

    if (aggregate._count.id === 0) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    // Extract name from most recent order
    const name = orders[0]?.customerName || user?.name || null;

    return NextResponse.json({
      email,
      name,
      orderCount: aggregate._count.id,
      totalSpent: aggregate._sum.totalAmount || 0,
      orders,
      b2bProfile: user
        ? {
            accountType: user.accountType,
            companyName: user.companyName,
            companyRole: user.companyRole,
            approved: user.b2bApproved,
            approvedAt: user.b2bApprovedAt,
            tier: user.partnerTier,
            discount: user.partnerDiscount,
          }
        : null,
      supportTickets,
      conversations: conversations.map((conversation) => ({
        id: conversation.id,
        subject: conversation.subject,
        status: conversation.status,
        lastMessageAt: conversation.lastMessageAt,
        lastMessage: conversation.messages[0]?.content || null,
        unreadCount: conversation._count.messages,
      })),
    });
  } catch (error) {
    console.error("Failed to fetch customer:", error);
    return NextResponse.json(
      { error: "Failed to fetch customer" },
      { status: 500 }
    );
  }
}
