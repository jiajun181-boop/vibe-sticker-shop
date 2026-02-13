import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { setSessionCookie } from "@/lib/auth";
import { authLimiter, getClientIp } from "@/lib/rate-limit";

export async function POST(request) {
  try {
    const ip = getClientIp(request);
    const { success } = authLimiter.check(ip);
    if (!success) {
      return NextResponse.json({ error: "Too many login attempts. Please try again later." }, { status: 429 });
    }

    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user || !user.password) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        accountType: user.accountType,
        emailVerified: user.emailVerified,
        b2bApproved: user.b2bApproved,
        companyName: user.companyName,
      },
    });

    return setSessionCookie(response, user.id, user.email);
  } catch (err) {
    console.error("[Auth] Login error:", err);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
