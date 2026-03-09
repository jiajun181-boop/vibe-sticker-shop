import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  const session = await getAdminSession(request);
  if (!session.authenticated) return session.response;

  try {
    const userId = session.user!.id;
    const userRole = session.user!.role;

    const count = await prisma.notification.count({
      where: {
        isRead: false,
        OR: [
          { recipientId: userId },
          { recipientRole: userRole },
          { recipientId: null, recipientRole: null },
        ],
      },
    });

    return NextResponse.json({ data: { unreadCount: count } });
  } catch (err) {
    console.error("[Notifications count] Error:", err);
    return NextResponse.json(
      { error: "Failed to fetch notification count" },
      { status: 500 }
    );
  }
}
