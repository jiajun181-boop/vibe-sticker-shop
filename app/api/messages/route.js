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
    const conversationId = searchParams.get("conversationId");
    if (!conversationId) {
      return NextResponse.json({ error: "conversationId required" }, { status: 400 });
    }

    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
    });

    // Mark customer messages as read (for staff viewing)
    await prisma.message.updateMany({
      where: { conversationId, senderType: "customer", isRead: false },
      data: { isRead: true },
    });

    return NextResponse.json({ messages });
  } catch (err) {
    console.error("GET /api/messages error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getAdminSession(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { conversationId, content, senderType, senderName, customerEmail, customerName } = body;

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: "Content required" }, { status: 400 });
    }
    if (content.length > 2000) {
      return NextResponse.json({ error: "Content max 2000 characters" }, { status: 400 });
    }
    if (!senderType || !["customer", "staff"].includes(senderType)) {
      return NextResponse.json({ error: "Invalid senderType" }, { status: 400 });
    }

    let convId = conversationId;

    // Create new conversation if none provided
    if (!convId) {
      const conv = await prisma.conversation.create({
        data: {
          customerName: customerName || senderName || null,
          customerEmail: customerEmail || null,
          status: "open",
          lastMessageAt: new Date(),
        },
      });
      convId = conv.id;
    }

    // Create the message
    const message = await prisma.message.create({
      data: {
        conversationId: convId,
        senderType,
        senderName: senderName || null,
        content: content.trim(),
      },
    });

    // Update conversation lastMessageAt and reopen if closed
    await prisma.conversation.update({
      where: { id: convId },
      data: {
        lastMessageAt: new Date(),
        ...(senderType === "customer" ? { status: "open" } : {}),
      },
    });

    return NextResponse.json({ message, conversationId: convId }, { status: 201 });
  } catch (err) {
    console.error("POST /api/messages error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
