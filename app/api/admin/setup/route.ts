import { NextRequest, NextResponse } from "next/server";
import { adminLoginLimiter, getClientIp } from "@/lib/rate-limit";
import {
  isSetupTokenAccepted,
  isSetupTokenRequired,
} from "@/lib/admin-setup-security";

/**
 * Initial admin setup — only works when ZERO admin users exist.
 * Once the first admin is created, this endpoint is permanently disabled.
 */

export async function GET() {
  try {
    const { prisma } = await import("@/lib/prisma");
    const count = await prisma.adminUser.count();
    return NextResponse.json({ needsSetup: count === 0 });
  } catch (err) {
    console.error("[Admin Setup] GET error:", err);
    return NextResponse.json({ needsSetup: false, error: "DB error" });
  }
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const { success } = adminLoginLimiter.check(ip);
    if (!success) {
      return NextResponse.json(
        { error: "Too many setup attempts. Please try again later." },
        { status: 429 }
      );
    }

    const { prisma } = await import("@/lib/prisma");
    const bcrypt = (await import("bcryptjs")).default;
    const { createAdminToken, COOKIE_NAME } = await import("@/lib/admin-auth");

    // Safety: only allow if no admin users exist
    const count = await prisma.adminUser.count();
    if (count > 0) {
      return NextResponse.json(
        { error: "Setup already completed. Use the login page." },
        { status: 403 }
      );
    }

    const setupTokenRequired = process.env.ADMIN_SETUP_TOKEN;
    if (isSetupTokenRequired(process.env.NODE_ENV, setupTokenRequired)) {
      return NextResponse.json(
        { error: "ADMIN_SETUP_TOKEN must be configured in production." },
        { status: 500 }
      );
    }

    const body = await request.json();
    const setupToken =
      request.headers.get("x-admin-setup-token") ||
      body?.setupToken ||
      "";

    if (!isSetupTokenAccepted(setupTokenRequired, setupToken)) {
      return NextResponse.json(
        { error: "Invalid setup token" },
        { status: 401 }
      );
    }

    const { name, email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }
    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const normalizedEmail = String(email).trim().toLowerCase();
    const admin = await prisma.adminUser.create({
      data: {
        email: normalizedEmail,
        name: name || "Admin",
        passwordHash,
        role: "admin",
      },
    });

    const token = await createAdminToken(admin);
    const response = NextResponse.json({
      success: true,
      user: { id: admin.id, name: admin.name, email: admin.email, role: admin.role },
    });

    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24,
    });

    return response;
  } catch (err) {
    console.error("[Admin Setup] POST error:", err);
    return NextResponse.json(
      { error: "Setup failed: " + (err instanceof Error ? err.message : "unknown") },
      { status: 500 }
    );
  }
}
