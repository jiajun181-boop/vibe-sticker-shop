import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity-log";
import { requirePermission } from "@/lib/admin-auth";
import { syncOrderProductionStatus } from "@/lib/production-sync";
import { VALID_JOB_TRANSITIONS } from "@/lib/order-config";
import { computeCostSignal } from "@/lib/pricing/production-cost-signal";

const JOB_INCLUDE = {
  orderItem: {
    include: {
      order: {
        select: {
          id: true,
          customerEmail: true,
          customerName: true,
        },
      },
    },
  },
  factory: true,
  events: {
    orderBy: { createdAt: "desc" as const },
  },
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission(request, "production", "view");
  if (!auth.authenticated) return auth.response;

  try {
    const { id } = await params;
    const includeCost = request.nextUrl.searchParams.get("include") === "costSignal";

    const job = await prisma.productionJob.findUnique({
      where: { id },
      include: {
        ...JOB_INCLUDE,
        // Include cost fields from orderItem when costSignal is requested
        ...(includeCost && {
          orderItem: {
            include: {
              order: {
                select: {
                  id: true,
                  customerEmail: true,
                  customerName: true,
                  status: true,
                  productionStatus: true,
                },
              },
            },
          },
        }),
      },
    });

    if (!job) {
      return NextResponse.json(
        { error: "Production job not found" },
        { status: 404 }
      );
    }

    // Optionally compute pricing health signal for the production job.
    // This tells operators whether the job is financially safe, needs pricing
    // review, or is missing cost data — without exposing raw dollar amounts.
    let costSignal = undefined;
    let sourceQuote = undefined;
    if (includeCost && job.orderItem) {
      const oi = job.orderItem as any;
      const order = oi.order;
      const orderId = order?.id || "";

      const [signal, quote] = await Promise.all([
        Promise.resolve(computeCostSignal(
          {
            id: oi.id,
            productName: oi.productName || job.productName || "",
            totalPrice: oi.totalPrice || 0,
            materialCostCents: oi.materialCostCents || 0,
            estimatedCostCents: oi.estimatedCostCents || 0,
            actualCostCents: oi.actualCostCents || 0,
            vendorCostCents: oi.vendorCostCents || 0,
          },
          orderId,
          order?.status || "",
          order?.productionStatus || "",
          { returnTo: `/admin/production/${id}`, source: "production-detail" }
        )),
        // Quote provenance: was this job's order created from a quote?
        orderId
          ? prisma.quoteRequest.findFirst({
              where: { convertedOrderId: orderId },
              select: { id: true, reference: true, status: true, quotedAmountCents: true, quotedAt: true },
            })
          : Promise.resolve(null),
      ]);

      costSignal = signal;
      sourceQuote = quote || undefined;
    }

    return NextResponse.json({
      ...job,
      ...(costSignal && { costSignal }),
      ...(sourceQuote && { sourceQuote }),
    });
  } catch (error) {
    console.error("[ProductionJob GET] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch production job" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission(request, "production", "edit");
  if (!auth.authenticated) return auth.response;

  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.productionJob.findUnique({
      where: { id },
      include: { factory: { select: { name: true } } },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Production job not found" },
        { status: 404 }
      );
    }

    const allowedFields = [
      "status",
      "priority",
      "factoryId",
      "assignedTo",
      "dueAt",
      "startedAt",
      "completedAt",
      "notes",
    ];

    const data: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        data[field] = body[field];
      }
    }

    // Convert date strings to Date objects
    if (typeof data.dueAt === "string") {
      data.dueAt = new Date(data.dueAt);
    }
    if (typeof data.startedAt === "string") {
      data.startedAt = new Date(data.startedAt);
    }
    if (typeof data.completedAt === "string") {
      data.completedAt = new Date(data.completedAt);
    }

    const statusChanged =
      data.status !== undefined && data.status !== existing.status;
    const factoryChanged =
      data.factoryId !== undefined && data.factoryId !== existing.factoryId;

    // Validate status transition
    if (statusChanged) {
      const allowed = VALID_JOB_TRANSITIONS[existing.status];
      if (allowed && !allowed.includes(data.status as string)) {
        return NextResponse.json(
          { error: `Cannot transition from "${existing.status}" to "${data.status}". Allowed: ${allowed.join(", ") || "none (terminal)"}` },
          { status: 400 }
        );
      }
    }

    // Auto-set startedAt when status changes to "printing"
    if (statusChanged && data.status === "printing" && !existing.startedAt && !data.startedAt) {
      data.startedAt = new Date();
    }

    // Auto-set completedAt when status changes to "finished" or "shipped"
    if (
      statusChanged &&
      (data.status === "finished" || data.status === "shipped") &&
      !existing.completedAt &&
      !data.completedAt
    ) {
      data.completedAt = new Date();
    }

    // Auto-set canceledAt when status changes to "canceled"
    if (statusChanged && data.status === "canceled" && !existing.canceledAt) {
      data.canceledAt = new Date();
    }

    const job = await prisma.productionJob.update({
      where: { id },
      data,
      include: JOB_INCLUDE,
    });

    // Create JobEvent for status change
    if (statusChanged) {
      await prisma.jobEvent.create({
        data: {
          jobId: id,
          type: "status_change",
          payload: { from: existing.status, to: data.status },
        },
      });

      logActivity({
        action: "status_change",
        entity: "ProductionJob",
        entityId: id,
        details: { from: existing.status, to: data.status },
      });
    }

    // Sync parent order's productionStatus from all its jobs
    if (statusChanged && job.orderItem?.order?.id) {
      const orderId = job.orderItem.order.id;
      const newOrderStatus = await syncOrderProductionStatus(orderId);

      // Create an OrderTimeline event so the customer tracking page shows progress
      if (newOrderStatus) {
        prisma.orderTimeline.create({
          data: {
            orderId,
            action: "status_updated",
            details: JSON.stringify({
              productionStatus: newOrderStatus,
              triggeredBy: `job ${id.slice(0, 8)} → ${data.status}`,
            }),
            actor: "system",
          },
        }).catch(() => {});
      }
    }

    // Create JobEvent for factory assignment
    if (factoryChanged) {
      // Fetch the newly assigned factory name if needed
      let factoryName: string | null = null;
      if (data.factoryId) {
        const factory = await prisma.factory.findUnique({
          where: { id: data.factoryId as string },
          select: { name: true },
        });
        factoryName = factory?.name ?? null;
      }

      await prisma.jobEvent.create({
        data: {
          jobId: id,
          type: "factory_assigned",
          payload: { factoryId: data.factoryId, factoryName },
        },
      });
    }

    return NextResponse.json(job);
  } catch (error) {
    console.error("[ProductionJob PATCH] Error:", error);
    return NextResponse.json(
      { error: "Failed to update production job" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission(request, "production", "edit");
  if (!auth.authenticated) return auth.response;

  try {
    const { id } = await params;
    const body = await request.json();

    const { type, payload, operatorName } = body;

    const VALID_EVENT_TYPES = [
      "status_change", "factory_assigned", "note", "quality_check",
      "defect_found", "rework", "file_received", "proof_uploaded",
      "proof_approved", "proof_rejected", "priority_changed",
      "operator_note", "delay", "custom",
    ];

    if (!type) {
      return NextResponse.json(
        { error: "Event type is required" },
        { status: 400 }
      );
    }

    if (!VALID_EVENT_TYPES.includes(type)) {
      return NextResponse.json(
        { error: `Invalid event type: "${type}". Allowed: ${VALID_EVENT_TYPES.join(", ")}` },
        { status: 400 }
      );
    }

    // Verify the job exists
    const job = await prisma.productionJob.findUnique({
      where: { id },
    });

    if (!job) {
      return NextResponse.json(
        { error: "Production job not found" },
        { status: 404 }
      );
    }

    const event = await prisma.jobEvent.create({
      data: {
        jobId: id,
        type,
        payload: payload ?? null,
        operatorName: operatorName ?? null,
      },
    });

    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    console.error("[ProductionJob POST event] Error:", error);
    return NextResponse.json(
      { error: "Failed to create job event" },
      { status: 500 }
    );
  }
}
