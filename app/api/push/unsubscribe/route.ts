import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { endpoint } = body;

    if (!endpoint) {
      return NextResponse.json({ error: "Missing endpoint" }, { status: 400 });
    }

    await prisma.pushSubscription.deleteMany({ where: { endpoint } });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[push/unsubscribe] Error:", err);
    return NextResponse.json({ error: "Failed to unsubscribe" }, { status: 500 });
  }
}
