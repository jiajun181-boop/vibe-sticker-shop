import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";

/**
 * POST /api/support/[id]/messages — add a reply to a ticket
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = getSessionFromRequest(req as any);
  if (!session?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ticket = await prisma.supportTicket.findFirst({
    where: { id, userId: session.userId },
  });

  if (!ticket) {
    return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
  }

  if (ticket.status === "closed") {
    return NextResponse.json({ error: "Ticket is closed" }, { status: 400 });
  }

  const body = await req.json();
  const { message } = body;

  if (!message?.trim()) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { name: true, email: true },
  });

  const msg = await prisma.ticketMessage.create({
    data: {
      ticketId: id,
      authorType: "customer",
      authorName: user?.name || user?.email || "Customer",
      body: message.trim(),
    },
  });

  // Re-open ticket if it was waiting on customer
  if (ticket.status === "waiting_customer") {
    await prisma.supportTicket.update({
      where: { id },
      data: { status: "open" },
    });
  }

  return NextResponse.json({ message: msg }, { status: 201 });
}
