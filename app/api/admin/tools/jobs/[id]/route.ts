import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin-auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requirePermission(request, "tools", "view");
    if (!auth.authenticated) return auth.response;

    const { id } = await params;

    const job = await prisma.adminToolJob.findUnique({
      where: { id },
      include: {
        order: { select: { id: true, customerEmail: true, status: true } },
      },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    return NextResponse.json({ job });
  } catch (err) {
    console.error("[admin/tools/jobs/[id]] GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requirePermission(request, "tools", "edit");
    if (!auth.authenticated) return auth.response;

    const { id } = await params;

    const existing = await prisma.adminToolJob.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const body = await request.json();
    const { status, notes, outputData, outputFileUrl, outputFileKey, orderId } = body;

    const data: Record<string, unknown> = {};
    if (status !== undefined) data.status = status;
    if (notes !== undefined) data.notes = notes;
    if (outputData !== undefined) data.outputData = outputData;
    if (outputFileUrl !== undefined) data.outputFileUrl = outputFileUrl;
    if (outputFileKey !== undefined) data.outputFileKey = outputFileKey;
    if (orderId !== undefined) {
      if (orderId) {
        const order = await prisma.order.findUnique({ where: { id: orderId }, select: { id: true } });
        if (!order) {
          return NextResponse.json({ error: "Order not found" }, { status: 404 });
        }
      }
      data.orderId = orderId || null;
    }

    const job = await prisma.adminToolJob.update({
      where: { id },
      data,
    });

    return NextResponse.json({ job });
  } catch (err) {
    console.error("[admin/tools/jobs/[id]] PATCH error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
