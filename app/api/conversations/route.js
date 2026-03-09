import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/admin-auth";

export async function GET(request) {
  try {
    const session = await getAdminSession(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const userId = searchParams.get("userId");

    const where = {};
    if (status) where.status = status;
    if (userId) where.userId = userId;

    const conversations = await prisma.conversation.findMany({
      where,
      orderBy: { lastMessageAt: "desc" },
      include: {
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        _count: {
          select: {
            messages: { where: { senderType: "customer", isRead: false } },
          },
        },
      },
    });

    const result = conversations.map((c) => ({
      id: c.id,
      subject: c.subject,
      customerName: c.customerName,
      customerEmail: c.customerEmail,
      userId: c.userId,
      status: c.status,
      lastMessageAt: c.lastMessageAt,
      createdAt: c.createdAt,
      lastMessage: c.messages[0]?.content || null,
      lastMessageSender: c.messages[0]?.senderType || null,
      unreadCount: c._count.messages,
    }));

    return NextResponse.json({ conversations: result });
  } catch (err) {
    console.error("GET /api/conversations error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const session = await getAdminSession(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, status } = body;

    if (!id) {
      return NextResponse.json({ error: "id required" }, { status: 400 });
    }

    const data = {};
    if (status && ["open", "closed"].includes(status)) {
      data.status = status;
    }

    const conversation = await prisma.conversation.update({
      where: { id },
      data,
    });

    return NextResponse.json({ conversation });
  } catch (err) {
    console.error("PATCH /api/conversations error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
