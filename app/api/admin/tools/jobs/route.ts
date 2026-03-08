import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  try {
    const auth = await requirePermission(request, "tools", "view");
    if (!auth.authenticated) return auth.response;

    const { searchParams } = new URL(request.url);
    const toolType = searchParams.get("toolType");
    const status = searchParams.get("status");
    const orderId = searchParams.get("orderId");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));

    const where: Record<string, unknown> = {};
    if (toolType) where.toolType = toolType;
    if (status) where.status = status;
    if (orderId) where.orderId = orderId;

    const [jobs, total] = await Promise.all([
      prisma.adminToolJob.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          order: { select: { id: true, customerEmail: true, status: true } },
        },
      }),
      prisma.adminToolJob.count({ where }),
    ]);

    return NextResponse.json({
      jobs,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error("[admin/tools/jobs] GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requirePermission(request, "tools", "edit");
    if (!auth.authenticated) return auth.response;

    const body = await request.json();
    const { toolType, inputFileUrl, inputFileKey, inputData, outputFileUrl, outputFileKey, outputData, notes, orderId, status } = body;

    if (!toolType) {
      return NextResponse.json({ error: "toolType is required" }, { status: 400 });
    }

    const validTypes = ["contour", "stamp-studio", "proof"];
    if (!validTypes.includes(toolType)) {
      return NextResponse.json({ error: `Invalid toolType. Must be one of: ${validTypes.join(", ")}` }, { status: 400 });
    }

    // Validate orderId if provided
    if (orderId) {
      const order = await prisma.order.findUnique({ where: { id: orderId }, select: { id: true } });
      if (!order) {
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
      }
    }

    const job = await prisma.adminToolJob.create({
      data: {
        toolType,
        status: status || "completed",
        inputFileUrl: inputFileUrl || null,
        inputFileKey: inputFileKey || null,
        inputData: inputData || undefined,
        outputFileUrl: outputFileUrl || null,
        outputFileKey: outputFileKey || null,
        outputData: outputData || undefined,
        notes: notes || null,
        orderId: orderId || null,
        operatorId: auth.user.id,
        operatorName: auth.user.name || auth.user.email,
      },
    });

    return NextResponse.json({ job }, { status: 201 });
  } catch (err) {
    console.error("[admin/tools/jobs] POST error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
