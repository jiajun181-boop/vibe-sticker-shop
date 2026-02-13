import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin-auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission(request, "orders", "view");
  if (!auth.authenticated) return auth.response;

  try {
    const { id } = await params;

    const events = await prisma.orderTimeline.findMany({
      where: { orderId: id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(events);
  } catch (error) {
    console.error("[Timeline GET] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch timeline" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission(request, "orders", "edit");
  if (!auth.authenticated) return auth.response;

  try {
    const { id } = await params;
    const body = await request.json();
    const { action, details } = body;

    if (!action) {
      return NextResponse.json(
        { error: "action is required" },
        { status: 400 }
      );
    }

    const event = await prisma.orderTimeline.create({
      data: {
        orderId: id,
        action,
        details: details ?? null,
        actor: "admin",
      },
    });

    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    console.error("[Timeline POST] Error:", error);
    return NextResponse.json(
      { error: "Failed to create timeline event" },
      { status: 500 }
    );
  }
}
