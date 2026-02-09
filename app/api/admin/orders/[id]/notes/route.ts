import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { message, isInternal } = await request.json();

  if (!message || !message.trim()) {
    return NextResponse.json(
      { error: "Message is required" },
      { status: 400 }
    );
  }

  const note = await prisma.orderNote.create({
    data: {
      orderId: id,
      authorType: "staff",
      isInternal: isInternal ?? true,
      message: message.trim(),
    },
  });

  return NextResponse.json(note);
}
