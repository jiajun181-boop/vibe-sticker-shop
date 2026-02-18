import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = getSessionFromRequest(req as any);
  if (!session?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { smsOptIn: true, smsPhone: true },
  });

  return NextResponse.json({ smsOptIn: user?.smsOptIn || false, smsPhone: user?.smsPhone || "" });
}

export async function PATCH(req: NextRequest) {
  const session = getSessionFromRequest(req as any);
  if (!session?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const data: Record<string, unknown> = {};

  if (typeof body.smsOptIn === "boolean") data.smsOptIn = body.smsOptIn;
  if (typeof body.smsPhone === "string") data.smsPhone = body.smsPhone || null;

  const updated = await prisma.user.update({
    where: { id: session.userId },
    data,
    select: { smsOptIn: true, smsPhone: true },
  });

  return NextResponse.json(updated);
}
