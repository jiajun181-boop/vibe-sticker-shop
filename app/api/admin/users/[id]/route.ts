import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { requirePermission } from "@/lib/admin-auth";
import { logActivity } from "@/lib/activity-log";

// PATCH /api/admin/users/[id] — Update admin user
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission(request, "users", "admin");
  if (!auth.authenticated) return auth.response;

  const { id } = await params;

  try {
    const body = await request.json();
    const data: Record<string, unknown> = {};

    if (body.name !== undefined) data.name = body.name;
    if (body.role !== undefined) data.role = body.role;
    if (body.isActive !== undefined) data.isActive = body.isActive;

    // Password change
    if (body.password && body.password.length >= 8) {
      data.passwordHash = await bcrypt.hash(body.password, 12);
    }

    const user = await prisma.adminUser.update({
      where: { id },
      data,
      select: { id: true, email: true, name: true, role: true, isActive: true, lastLoginAt: true, createdAt: true },
    });

    await logActivity({
      action: "updated",
      entity: "adminUser",
      entityId: id,
      actor: auth.user?.email || "admin",
      details: { fields: Object.keys(data) },
    });

    return NextResponse.json({ user });
  } catch (err) {
    console.error("[AdminUsers] PATCH error:", err);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}

// DELETE /api/admin/users/[id] — Deactivate admin user
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission(request, "users", "admin");
  if (!auth.authenticated) return auth.response;

  const { id } = await params;

  // Prevent self-deactivation
  if (auth.user?.id === id) {
    return NextResponse.json({ error: "Cannot deactivate yourself" }, { status: 400 });
  }

  try {
    await prisma.adminUser.update({
      where: { id },
      data: { isActive: false },
    });

    await logActivity({
      action: "deactivated",
      entity: "adminUser",
      entityId: id,
      actor: auth.user?.email || "admin",
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[AdminUsers] DELETE error:", err);
    return NextResponse.json({ error: "Failed to deactivate user" }, { status: 500 });
  }
}
