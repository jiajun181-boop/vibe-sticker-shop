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

    // Validate and sanitize cart items to prevent storing arbitrary data
    const MAX_CART_ITEMS = 50;
    const sanitizedCart = cart.slice(0, MAX_CART_ITEMS).filter(
      (item: any) =>
        item &&
        typeof item === "object" &&
        typeof item.id === "string" &&
        typeof item.name === "string" &&
        typeof item.price === "number" &&
        typeof item.quantity === "number"
    ).map((item: any) => ({
      id: String(item.id).slice(0, 100),
      name: String(item.name).slice(0, 200),
      price: Number(item.price),
      quantity: Math.min(999, Math.max(1, Number(item.quantity))),
      ...(item.options && typeof item.options === "object" ? { options: item.options } : {}),
      ...(item._cartId && typeof item._cartId === "string" ? { _cartId: String(item._cartId).slice(0, 50) } : {}),
    }));

    if (sanitizedCart.length === 0) {
      return NextResponse.json({ ok: false, error: "Invalid cart data" }, { status: 400 });
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
          cartJson: sanitizedCart,
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
          cartJson: sanitizedCart,
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
