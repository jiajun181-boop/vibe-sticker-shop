import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { createAdminToken, COOKIE_NAME } from "@/lib/admin-auth";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // ── New path: email + password login (AdminUser table) ──
    if (email) {
      const admin = await prisma.adminUser.findUnique({ where: { email } });
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
        maxAge: 60 * 60 * 24, // 24 hours
      });

      return response;
    }

    // ── Legacy path: password-only login (env ADMIN_PASSWORD) ──
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminPassword) {
      return NextResponse.json(
        { error: "Admin password not configured" },
        { status: 500 }
      );
    }
    if (password !== adminPassword) {
      return NextResponse.json(
        { error: "Invalid password" },
        { status: 401 }
      );
    }

    const response = NextResponse.json({ success: true });
    response.cookies.set("admin_auth", "authenticated", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24,
    });
    return response;
  } catch {
    return NextResponse.json(
      { error: "Login failed" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete("admin_auth");
  response.cookies.delete(COOKIE_NAME);
  return response;
}
