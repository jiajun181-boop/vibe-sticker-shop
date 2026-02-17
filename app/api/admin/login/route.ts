import { NextRequest, NextResponse } from "next/server";
import { adminLoginLimiter, getClientIp } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const { success } = adminLoginLimiter.check(ip);
    if (!success) {
      return NextResponse.json(
        { error: "Too many login attempts. Please try again later." },
        { status: 429 }
      );
    }

    const { email, password } = await request.json();
    const normalizedEmail =
      typeof email === "string" ? email.trim().toLowerCase() : "";

    // ── New path: email + password login (AdminUser table) ──
    if (normalizedEmail) {
      // Dynamic imports to avoid crashing legacy path if prisma isn't ready
      const { prisma } = await import("@/lib/prisma");
      const bcrypt = (await import("bcryptjs")).default;
      const { createAdminToken, COOKIE_NAME } = await import("@/lib/admin-auth");

      const admin = await prisma.adminUser.findUnique({
        where: { email: normalizedEmail },
      });
      if (!admin || !admin.isActive) {
        return NextResponse.json(
          { error: "Invalid email or password" },
          { status: 401 }
        );
      }
      const valid = await bcrypt.compare(password, admin.passwordHash);
      if (!valid) {
        return NextResponse.json(
          { error: "Invalid email or password" },
          { status: 401 }
        );
      }

      // Update last login
      await prisma.adminUser.update({
        where: { id: admin.id },
        data: { lastLoginAt: new Date() },
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
    }

    // ── Legacy path: password-only login (env ADMIN_PASSWORD) ──
    const adminPassword = (process.env.ADMIN_PASSWORD || "").trim();
    if (!adminPassword) {
      return NextResponse.json(
        { error: "Admin password not configured" },
        { status: 500 }
      );
    }
    if ((password || "").trim() !== adminPassword) {
      return NextResponse.json(
        { error: "Invalid password" },
        { status: 401 }
      );
    }

    const { createAdminToken, COOKIE_NAME } = await import("@/lib/admin-auth");
    const token = await createAdminToken({
      id: "legacy-password-admin",
      email: "admin@local",
      name: "Legacy Admin",
      role: "admin",
    });

    const response = NextResponse.json({ success: true });
    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24,
    });
    return response;
  } catch (err) {
    console.error("[Admin Login] Error:", err);
    return NextResponse.json(
      { error: "Login failed" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete("admin_session");
  response.cookies.delete("admin_auth");
  return response;
}
