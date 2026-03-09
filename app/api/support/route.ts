import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";
import { sendEmail } from "@/lib/email/resend";
import { buildTicketCreatedHtml } from "@/lib/email/templates/ticket-created";
import { supportLimiter, getClientIp } from "@/lib/rate-limit";

/**
 * GET /api/support — list user's tickets
 */
export async function GET(req: NextRequest) {
  const session = getSessionFromRequest(req as any);
  if (!session?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const tickets = await prisma.supportTicket.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        subject: true,
        status: true,
        priority: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { messages: true } },
      },
    });

    return NextResponse.json({ tickets });
  } catch (err) {
    console.error("[support] GET error:", err);
    return NextResponse.json({ error: "Failed to load tickets" }, { status: 500 });
  }
}

/**
 * POST /api/support — create a new ticket
 */
export async function POST(req: NextRequest) {
  const session = getSessionFromRequest(req as any);
  if (!session?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ip = getClientIp(req);
  const { success } = supportLimiter.check(ip);
  if (!success) {
    return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
  }

  try {
    const body = await req.json();
    const { subject, message, orderId } = body;

    if (!subject?.trim() || !message?.trim()) {
      return NextResponse.json({ error: "Subject and message are required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { id: true, email: true, name: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const ticket = await prisma.supportTicket.create({
      data: {
        userId: user.id,
        email: user.email,
        subject: subject.trim(),
        orderId: orderId || null,
        status: "open",
        priority: "normal",
        messages: {
          create: {
            authorType: "customer",
            authorName: user.name || user.email,
            body: message.trim(),
          },
        },
      },
      include: { messages: true },
    });

    // Send confirmation email
    try {
      const html = buildTicketCreatedHtml(ticket.id, ticket.subject);
      await sendEmail({
        to: user.email,
        subject: `Ticket #${ticket.id.slice(0, 8)} — ${ticket.subject}`,
        html,
        template: "ticket-created",
      });
    } catch (err) {
      console.error("[Support] Email failed:", err);
    }

    return NextResponse.json({ ticket }, { status: 201 });
  } catch (err) {
    console.error("[support] POST error:", err);
    return NextResponse.json({ error: "Failed to create ticket" }, { status: 500 });
  }
}
