import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/admin-auth";

export async function POST(request: NextRequest) {
  const session = await getAdminSession(request);
  if (!session.authenticated) return session.response;

  try {
    const userId = session.user!.id;
    const userRole = session.user!.role;

    // Mark all unread notifications for this user as read
    const result = await prisma.notification.updateMany({
      where: {
        isRead: false,
        OR: [
          { recipientId: userId },
          { recipientRole: userRole },
          { recipientId: null, recipientRole: null },
        ],
      },
      data: { isRead: true },
    });

    return NextResponse.json({ success: true, updated: result.count });
  } catch (err) {
    console.error("[Notifications read-all] Error:", err);
    return NextResponse.json(
      { error: "Failed to mark notifications as read" },
      { status: 500 }
    );
  }
}
