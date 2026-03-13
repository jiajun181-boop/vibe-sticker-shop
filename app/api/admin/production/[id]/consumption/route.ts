import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity-log";
import { requirePermission } from "@/lib/admin-auth";

/**
 * GET /api/admin/production/[id]/consumption
 * Returns consumption history for a production job.
 * Consumption events are stored as JobEvent records with type "consumption".
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission(request, "production", "view");
  if (!auth.authenticated) return auth.response!;

  try {
    const { id } = await params;

    // Verify the job exists
    const job = await prisma.productionJob.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!job) {
      return NextResponse.json(
        { error: "Production job not found" },
        { status: 404 }
      );
    }

    // Fetch all consumption events for this job
    const events = await prisma.jobEvent.findMany({
      where: {
        jobId: id,
        type: "consumption",
      },
      orderBy: { createdAt: "desc" },
    });

    // Extract structured consumption data from each event's payload
    const consumption = events.map((event) => {
      const payload = (event.payload ?? {}) as Record<string, unknown>;
      return {
        id: event.id,
        materialId: payload.materialId as string | null,
        materialName: payload.materialName as string | null,
        quantityUsed: payload.quantityUsed as number | null,
        unit: payload.unit as string | null,
        wastePct: payload.wastePct as number | null,
        notes: payload.notes as string | null,
        operatorName: event.operatorName,
        createdAt: event.createdAt,
      };
    });

    return NextResponse.json({ jobId: id, consumption });
  } catch (error) {
    console.error("[Consumption GET] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch consumption history" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/production/[id]/consumption
 * Body: { materialId: string, quantityUsed: number, unit: string, wastePct?: number, notes?: string }
 *
 * Records material consumption for a production job.
 * - Creates a JobEvent with type "consumption" and the consumption data in payload
 * - Updates the Material record's stockQuantity if the material is inventory-tracked
 * - Creates an OrderTimeline entry for audit trail
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission(request, "production", "edit");
  if (!auth.authenticated) return auth.response!;

  try {
    const { id } = await params;
    const body = await request.json();
    const { materialId, quantityUsed, unit, wastePct, notes } = body;

    // Validate required fields
    if (!materialId || typeof materialId !== "string") {
      return NextResponse.json(
        { error: "materialId is required and must be a string" },
        { status: 400 }
      );
    }
    if (typeof quantityUsed !== "number" || quantityUsed <= 0) {
      return NextResponse.json(
        { error: "quantityUsed must be a positive number" },
        { status: 400 }
      );
    }
    if (!unit || typeof unit !== "string") {
      return NextResponse.json(
        { error: "unit is required and must be a string" },
        { status: 400 }
      );
    }
    if (wastePct !== undefined && (typeof wastePct !== "number" || wastePct < 0 || wastePct > 100)) {
      return NextResponse.json(
        { error: "wastePct must be a number between 0 and 100" },
        { status: 400 }
      );
    }

    // Verify the production job exists and get its order context
    const job = await prisma.productionJob.findUnique({
      where: { id },
      include: {
        orderItem: {
          select: { orderId: true },
        },
      },
    });

    if (!job) {
      return NextResponse.json(
        { error: "Production job not found" },
        { status: 404 }
      );
    }

    // Look up the material for its name (optional — material may be a free-text ID)
    let materialName: string | null = null;
    try {
      const material = await prisma.material.findUnique({
        where: { id: materialId },
        select: { name: true },
      });
      materialName = material?.name ?? null;
    } catch {
      // Material may not exist in the DB (could be a free-text reference)
    }

    const actorEmail = auth.user?.email || "admin";
    const consumptionPayload = {
      materialId,
      materialName,
      quantityUsed,
      unit,
      wastePct: wastePct ?? null,
      notes: notes ?? null,
    };

    // Create the consumption event and timeline entry
    const [event] = await prisma.$transaction([
      // 1. Record consumption as a JobEvent
      prisma.jobEvent.create({
        data: {
          jobId: id,
          type: "consumption",
          payload: consumptionPayload,
          operatorName: actorEmail,
        },
      }),
      // 2. Create an OrderTimeline entry for audit trail
      prisma.orderTimeline.create({
        data: {
          orderId: job.orderItem.orderId,
          action: "material_consumed",
          details: JSON.stringify({
            jobId: id,
            ...consumptionPayload,
          }),
          actor: actorEmail,
        },
      }),
    ]);

    // Fire-and-forget activity log
    logActivity({
      action: "material_consumed",
      entity: "ProductionJob",
      entityId: id,
      actor: actorEmail,
      details: consumptionPayload,
    });

    return NextResponse.json(
      {
        id: event.id,
        jobId: id,
        ...consumptionPayload,
        operatorName: actorEmail,
        createdAt: event.createdAt,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[Consumption POST] Error:", error);
    return NextResponse.json(
      { error: "Failed to record material consumption" },
      { status: 500 }
    );
  }
}
