import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashToken } from "@/lib/auth";

export async function POST(request) {
  try {
    const { token } = await request.json();

    if (!token || typeof token !== "string") {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    const tokenHash = hashToken(token);
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ emailVerifyToken: tokenHash }, { emailVerifyToken: token }],
      },
    });

    if (!user || !user.emailVerifyExpires || user.emailVerifyExpires < new Date()) {
      return NextResponse.json({ error: "Invalid or expired verification link" }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerifyToken: null,
        emailVerifyExpires: null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Auth] Verify email error:", err);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
