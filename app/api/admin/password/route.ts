import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { getAdminSession } from "@/lib/admin-auth";

// PATCH /api/admin/password — Change own password
export async function PATCH(request: NextRequest) {
  const session = await getAdminSession(request);
  if (!session.authenticated) return session.response;

  const userId = session.user!.id;

  try {
    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Current password and new password are required" },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "New password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const adminUser = await prisma.adminUser.findUnique({
      where: { id: userId },
      select: { id: true, passwordHash: true },
    });

    if (!adminUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const isValid = await bcrypt.compare(currentPassword, adminUser.passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 403 });
    }

    const newHash = await bcrypt.hash(newPassword, 12);
    await prisma.adminUser.update({
      where: { id: userId },
      data: { passwordHash: newHash },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[AdminPassword] PATCH error:", err);
    return NextResponse.json({ error: "Failed to change password" }, { status: 500 });
  }
}
