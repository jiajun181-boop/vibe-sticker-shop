import { NextRequest, NextResponse } from "next/server";

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

    const { name, email, password } = await request.json();

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
    const admin = await prisma.adminUser.create({
      data: {
        email,
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
