import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";
import { pushLimiter, getClientIp } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const { success } = pushLimiter.check(ip);
  if (!success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const body = await req.json();
    const { endpoint, p256dh, auth } = body;

    if (!endpoint || !p256dh || !auth) {
      return NextResponse.json({ error: "Missing subscription data" }, { status: 400 });
    }

    const session = getSessionFromRequest(req as any);
    const userId = session?.userId || null;

    // Upsert subscription
    await prisma.pushSubscription.upsert({
      where: { endpoint },
      update: { p256dh, auth, userId },
      create: { endpoint, p256dh, auth, userId },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[push/subscribe] Error:", err);
    return NextResponse.json({ error: "Failed to subscribe" }, { status: 500 });
  }
}
