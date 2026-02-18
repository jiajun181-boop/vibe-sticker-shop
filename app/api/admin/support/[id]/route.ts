import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email/resend";
import { buildTicketReplyHtml } from "@/lib/email/templates/ticket-reply";

/**
 * GET /api/admin/support/[id] — get ticket detail (admin)
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const ticket = await prisma.supportTicket.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true } },
      messages: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!ticket) {
    return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
  }

  return NextResponse.json({ ticket });
}

/**
 * PATCH /api/admin/support/[id] — update ticket status/priority (admin)
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const { status, priority } = body;

  const data: any = {};
  if (status) data.status = status;
  if (priority) data.priority = priority;
  if (status === "closed" || status === "resolved") data.closedAt = new Date();

  const ticket = await prisma.supportTicket.update({
    where: { id },
    data,
  });

  return NextResponse.json({ ticket });
}

/**
 * POST /api/admin/support/[id] — admin reply to ticket
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const { message, authorName } = body;

  if (!message?.trim()) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }

  const ticket = await prisma.supportTicket.findUnique({
    where: { id },
    select: { id: true, email: true, subject: true },
  });

  if (!ticket) {
    return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
  }

  const msg = await prisma.ticketMessage.create({
    data: {
      ticketId: id,
      authorType: "admin",
      authorName: authorName || "Support Team",
      body: message.trim(),
    },
  });

  // Update ticket status to waiting_customer
  await prisma.supportTicket.update({
    where: { id },
    data: { status: "waiting_customer" },
  });

  // Send email notification to customer
  try {
    const emailData = buildTicketReplyHtml(id, ticket.subject, message.trim(), authorName || "Support Team");
    await sendEmail({
      to: ticket.email,
      subject: emailData.subject,
      html: emailData.html,
      template: "ticket-reply",
    });
  } catch (err) {
    console.error("[Support] Reply email failed:", err);
  }

  return NextResponse.json({ message: msg }, { status: 201 });
}
