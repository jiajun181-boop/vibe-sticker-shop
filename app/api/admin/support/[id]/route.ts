import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin-auth";
import { sendEmail } from "@/lib/email/resend";
import { buildTicketReplyHtml } from "@/lib/email/templates/ticket-reply";
import { logActivity } from "@/lib/activity-log";

/**
 * GET /api/admin/support/[id] — get ticket detail (admin)
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission(req, "support", "view");
  if (!auth.authenticated) return auth.response;

  try {
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
  } catch (err) {
    console.error("[admin/support/[id]] GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/support/[id] — update ticket status/priority (admin)
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission(req, "support", "edit");
  if (!auth.authenticated) return auth.response;

  try {
    const { id } = await params;
    const body = await req.json();
    const { status, priority } = body;

    const data: Record<string, unknown> = {};
    if (status) data.status = status;
    if (priority) data.priority = priority;
    if (status === "closed" || status === "resolved") data.closedAt = new Date();

    const ticket = await prisma.supportTicket.update({
      where: { id },
      data,
    });

    logActivity({
      action: "ticket_updated",
      entity: "support_ticket",
      entityId: id,
      actor: auth.user?.name || auth.user?.email || "admin",
      details: { status, priority },
    });

    return NextResponse.json({ ticket });
  } catch (err) {
    console.error("[admin/support/[id]] PATCH error:", err);
    return NextResponse.json({ error: "Failed to update ticket" }, { status: 500 });
  }
}

/**
 * POST /api/admin/support/[id] — admin reply to ticket
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission(req, "support", "edit");
  if (!auth.authenticated) return auth.response;

  try {
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

    logActivity({
      action: "ticket_reply",
      entity: "support_ticket",
      entityId: id,
      actor: auth.user?.name || auth.user?.email || "admin",
    });

    return NextResponse.json({ message: msg }, { status: 201 });
  } catch (err) {
    console.error("[admin/support/[id]] POST error:", err);
    return NextResponse.json({ error: "Failed to send reply" }, { status: 500 });
  }
}
