import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  const session = await getAdminSession(request);
  if (!session.authenticated) return session.response;

  try {
    const { searchParams } = new URL(request.url);

    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));
    const unreadOnly = searchParams.get("unread_only") === "true";

    const userId = session.user!.id;
    const userRole = session.user!.role;

    // Notifications visible to this user:
    // 1. recipientId matches their ID
    // 2. recipientRole matches their role
    // 3. No recipient specified (broadcast)
    const where: Record<string, unknown> = {
      OR: [
        { recipientId: userId },
        { recipientRole: userRole },
        { recipientId: null, recipientRole: null },
      ],
    };

    if (unreadOnly) {
      where.isRead = false;
    }

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.notification.count({ where }),
    ]);

    return NextResponse.json({
      data: notifications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("[/api/admin/notifications] GET Error:", err);
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await getAdminSession(request);
  if (!session.authenticated) return session.response;

  try {
    const body = await request.json();
    const { type, title, message, link, severity, recipientRole, recipientId, entityType, entityId } = body;

    if (!type || !title || !message) {
      return NextResponse.json(
        { error: "type, title, and message are required" },
        { status: 400 }
      );
    }

    const notification = await prisma.notification.create({
      data: {
        type,
        title,
        message,
        link: link || null,
        severity: severity || "info",
        recipientRole: recipientRole || null,
        recipientId: recipientId || null,
        entityType: entityType || null,
        entityId: entityId || null,
      },
    });

    return NextResponse.json({ data: notification }, { status: 201 });
  } catch (err) {
    console.error("[/api/admin/notifications] POST Error:", err);
    return NextResponse.json(
      { error: "Failed to create notification" },
      { status: 500 }
    );
  }
}
