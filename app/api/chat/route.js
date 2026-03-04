import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

/**
 * GET /api/chat — Fetch conversation + messages for a guest (by sessionId) or logged-in user.
 * Query params:
 *   - sessionId (string) — required for guests
 *   - conversationId (string) — optional, fetch specific conversation
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");
    const conversationId = searchParams.get("conversationId");

    // Logged-in user path
    const user = await getUserFromRequest(request);
    const userId = user?.id;

    if (!userId && !sessionId) {
      return NextResponse.json({ error: "sessionId or login required" }, { status: 400 });
    }

    let conversation;

    if (conversationId) {
      // Fetch specific conversation — verify ownership
      conversation = await prisma.conversation.findFirst({
        where: {
          id: conversationId,
          ...(userId ? { userId } : { sessionId }),
        },
        include: { messages: { orderBy: { createdAt: "asc" } } },
      });
    } else {
      // Find the most recent open conversation for this user/session
      conversation = await prisma.conversation.findFirst({
        where: {
          ...(userId ? { userId } : { sessionId }),
          status: "open",
        },
        orderBy: { lastMessageAt: "desc" },
        include: { messages: { orderBy: { createdAt: "asc" } } },
      });
    }

    if (!conversation) {
      return NextResponse.json({ conversation: null, messages: [] });
    }

    // Mark staff messages as read for the customer
    await prisma.message.updateMany({
      where: { conversationId: conversation.id, senderType: "staff", isRead: false },
      data: { isRead: true },
    });

    return NextResponse.json({
      conversation: {
        id: conversation.id,
        status: conversation.status,
        lastMessageAt: conversation.lastMessageAt,
      },
      messages: conversation.messages,
    });
  } catch (err) {
    console.error("GET /api/chat error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/**
 * POST /api/chat — Send a message (creates conversation if needed).
 * Body:
 *   - content (string, required)
 *   - sessionId (string) — required for guests
 *   - guestName (string, optional) — guest display name
 *   - guestEmail (string, optional) — guest email for follow-up
 *   - conversationId (string, optional) — existing conversation
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { content, sessionId, guestName, guestEmail, conversationId } = body;

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: "Content required" }, { status: 400 });
    }
    if (content.length > 2000) {
      return NextResponse.json({ error: "Content max 2000 characters" }, { status: 400 });
    }

    // Logged-in user path
    const user = await getUserFromRequest(request);
    const userId = user?.id;
    const userName = user?.name;

    if (!userId && !sessionId) {
      return NextResponse.json({ error: "sessionId or login required" }, { status: 400 });
    }

    let convId = conversationId;

    if (convId) {
      // Verify ownership
      const existing = await prisma.conversation.findFirst({
        where: {
          id: convId,
          ...(userId ? { userId } : { sessionId }),
        },
      });
      if (!existing) {
        return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
      }
    } else {
      // Try to find existing open conversation
      const existing = await prisma.conversation.findFirst({
        where: {
          ...(userId ? { userId } : { sessionId }),
          status: "open",
        },
        orderBy: { lastMessageAt: "desc" },
      });

      if (existing) {
        convId = existing.id;
      } else {
        // Create new conversation
        const conv = await prisma.conversation.create({
          data: {
            customerName: userId ? userName : (guestName || null),
            customerEmail: guestEmail || null,
            userId: userId || null,
            sessionId: userId ? null : sessionId,
            status: "open",
            lastMessageAt: new Date(),
          },
        });
        convId = conv.id;
      }
    }

    // Create the message
    const message = await prisma.message.create({
      data: {
        conversationId: convId,
        senderType: "customer",
        senderName: userId ? userName : (guestName || "Guest"),
        content: content.trim(),
      },
    });

    // Update conversation
    await prisma.conversation.update({
      where: { id: convId },
      data: {
        lastMessageAt: new Date(),
        status: "open",
        // Update guest info if provided
        ...(guestName ? { customerName: guestName } : {}),
        ...(guestEmail ? { customerEmail: guestEmail } : {}),
      },
    });

    return NextResponse.json({ message, conversationId: convId }, { status: 201 });
  } catch (err) {
    console.error("POST /api/chat error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
