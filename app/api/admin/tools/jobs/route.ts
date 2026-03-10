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

    // --- Writeback: auto-update OrderItem.meta with tool results ---
    const itemId = inputData?.itemId;
    if (orderId && itemId && (status === "completed" || !status)) {
      try {
        await writebackToolResults(toolType, itemId, outputData, outputFileUrl);
      } catch (wbErr) {
        // Non-fatal: log but don't fail the job creation
        console.error("[admin/tools/jobs] writeback error:", wbErr);
      }
    }

    return NextResponse.json({ job, writeback: !!(orderId && itemId) }, { status: 201 });
  } catch (err) {
    console.error("[admin/tools/jobs] POST error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ── Writeback: merge tool output into OrderItem.meta ──────────────────────

async function writebackToolResults(
  toolType: string,
  itemId: string,
  outputData: Record<string, unknown> | null,
  outputFileUrl: string | null,
) {
  const item = await prisma.orderItem.findUnique({
    where: { id: itemId },
    select: { id: true, meta: true },
  });
  if (!item) return;

  const existingMeta = (item.meta && typeof item.meta === "object" && !Array.isArray(item.meta))
    ? (item.meta as Record<string, unknown>)
    : {};

  let patch: Record<string, unknown> = {};

  if (toolType === "contour") {
    // Write contour SVG URL + bleed info back to the item
    patch = {
      contourSvg: outputData?.svgFileUrl || outputFileUrl || null,
      bleedMm: outputData?.bleedPath ? (outputData?.bleedMm ?? 3) : undefined,
      processedImageUrl: outputData?.processedFileUrl || null,
      contourConfidence: outputData?.contourConfidence || null,
      contourToolJobAt: new Date().toISOString(),
    };
  } else if (toolType === "stamp-studio") {
    // Write stamp preview URL back to the item
    patch = {
      stampPreviewUrl: outputFileUrl || null,
      stampShape: outputData?.shape || null,
      stampToolJobAt: new Date().toISOString(),
    };
  } else if (toolType === "proof") {
    patch = {
      proofFileUrl: outputFileUrl || null,
      proofToolJobAt: new Date().toISOString(),
    };
  }

  // Remove undefined values
  const cleanPatch: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(patch)) {
    if (v !== undefined) cleanPatch[k] = v;
  }

  if (Object.keys(cleanPatch).length === 0) return;

  await prisma.orderItem.update({
    where: { id: itemId },
    data: { meta: { ...existingMeta, ...cleanPatch } },
  });
}
