import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { requirePermission } from "@/lib/admin-auth";
import { logActivity } from "@/lib/activity-log";

// GET /api/admin/users — List all admin users
export async function GET(request: NextRequest) {
  const auth = await requirePermission(request, "users", "view");
  if (!auth.authenticated) return auth.response;

  try {
    const users = await prisma.adminUser.findMany({
      orderBy: [{ isActive: "desc" }, { createdAt: "asc" }],
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
      },
    });
    return NextResponse.json({ users });
  } catch (err) {
    console.error("[AdminUsers] GET error:", err);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

// POST /api/admin/users — Create a new admin user
export async function POST(request: NextRequest) {
  const auth = await requirePermission(request, "users", "admin");
  if (!auth.authenticated) return auth.response;

  try {
    const { email, name, password, role } = await request.json();

    if (!email || !name || !password || !role) {
      return NextResponse.json({ error: "email, name, password, and role are required" }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    const existing = await prisma.adminUser.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Email already exists" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.adminUser.create({
      data: { email, name, passwordHash, role },
      select: { id: true, email: true, name: true, role: true, isActive: true, createdAt: true },
    });

    await logActivity({
      action: "created",
      entity: "adminUser",
      entityId: user.id,
      actor: auth.user?.email || "admin",
      details: { email, name, role },
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (err) {
    console.error("[AdminUsers] POST error:", err);
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
}
