import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = getSessionFromRequest(req as any);
    if (!session?.userId) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }

    const body = await req.json();
    const { cart, email } = body;

    if (!Array.isArray(cart) || cart.length === 0) {
      // Empty cart — delete any existing abandoned cart record
      await prisma.abandonedCart.deleteMany({
        where: { userId: session.userId, recoveredAt: null },
      });
      return NextResponse.json({ ok: true });
    }

    // Look up user email if not provided
    let customerEmail = email;
    if (!customerEmail) {
      const user = await prisma.user.findUnique({
        where: { id: session.userId },
        select: { email: true },
      });
      customerEmail = user?.email;
    }

    if (!customerEmail) {
      return NextResponse.json({ ok: false, error: "No email" }, { status: 400 });
    }

    // Upsert abandoned cart for this user
    const existing = await prisma.abandonedCart.findFirst({
      where: { userId: session.userId, recoveredAt: null },
    });

    if (existing) {
      await prisma.abandonedCart.update({
        where: { id: existing.id },
        data: {
          cartJson: cart,
          email: customerEmail,
          updatedAt: new Date(),
        },
      });
    } else {
      const recoveryToken = crypto.randomBytes(32).toString("hex");
      await prisma.abandonedCart.create({
        data: {
          userId: session.userId,
          email: customerEmail,
          cartJson: cart,
          recoveryToken,
        },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[CartSync] Error:", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
