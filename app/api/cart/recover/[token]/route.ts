import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    const cart = await prisma.abandonedCart.findUnique({
      where: { recoveryToken: token },
    });

    if (!cart) {
      return NextResponse.json({ error: "Cart not found" }, { status: 404 });
    }

    return NextResponse.json({
      cart: cart.cartJson,
      email: cart.email,
      recoveredAt: cart.recoveredAt,
    });
  } catch (err) {
    console.error("[CartRecover] Error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
