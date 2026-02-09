import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity-log";

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
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const job = await prisma.productionJob.findUnique({
      where: { id },
      include: JOB_INCLUDE,
    });

    if (!job) {
      return NextResponse.json(
        { error: "Production job not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(job);
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
  try {
    const { id } = await params;
    const body = await request.json();

    const { type, payload, operatorName } = body;

    if (!type) {
      return NextResponse.json(
        { error: "Event type is required" },
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
