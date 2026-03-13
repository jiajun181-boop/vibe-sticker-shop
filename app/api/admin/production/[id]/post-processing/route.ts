import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin-auth";
import { logActivity } from "@/lib/activity-log";

// ── Post-Processing Task Tracking ──
// Uses the JobEvent model with type="post_processing" to store
// finishing tasks (lamination, cutting, folding, scoring, binding, packaging)
// for a given ProductionJob.

const VALID_TASK_TYPES = [
  "lamination",
  "cutting",
  "folding",
  "scoring",
  "binding",
  "packaging",
] as const;

const VALID_TASK_STATUSES = [
  "pending",
  "in_progress",
  "completed",
  "skipped",
] as const;

type TaskType = (typeof VALID_TASK_TYPES)[number];
type TaskStatus = (typeof VALID_TASK_STATUSES)[number];

interface PostProcessingPayload {
  taskType: TaskType;
  status: TaskStatus;
  assignedTo?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  notes?: string | null;
}

/**
 * GET /api/admin/production/[id]/post-processing
 * Returns all post-processing tasks for a production job.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission(request, "production", "view");
  if (!auth.authenticated) return auth.response;

  try {
    const { id } = await params;

    // Verify the production job exists
    const job = await prisma.productionJob.findUnique({
      where: { id },
      select: { id: true, status: true, productName: true },
    });

    if (!job) {
      return NextResponse.json(
        { error: "Production job not found" },
        { status: 404 }
      );
    }

    // Fetch all post-processing events for this job
    const events = await prisma.jobEvent.findMany({
      where: {
        jobId: id,
        type: "post_processing",
      },
      orderBy: { createdAt: "asc" },
    });

    // Transform events into task objects
    const tasks = events.map((event) => {
      const payload = (event.payload ?? {}) as Record<string, unknown>;
      return {
        id: event.id,
        jobId: event.jobId,
        type: payload.taskType ?? null,
        status: payload.status ?? "pending",
        assignedTo: payload.assignedTo ?? event.operatorName ?? null,
        startedAt: payload.startedAt ?? null,
        completedAt: payload.completedAt ?? null,
        notes: payload.notes ?? null,
        createdAt: event.createdAt,
      };
    });

    return NextResponse.json({ jobId: id, tasks });
  } catch (error) {
    console.error("[PostProcessing GET] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch post-processing tasks" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/production/[id]/post-processing
 * Add a new post-processing task.
 *
 * Body: { type, status?, assignedTo?, startedAt?, completedAt?, notes? }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission(request, "production", "edit");
  if (!auth.authenticated) return auth.response;

  try {
    const { id } = await params;
    const body = await request.json();

    const { type, status, assignedTo, startedAt, completedAt, notes } = body;

    // Validate required field
    if (!type) {
      return NextResponse.json(
        { error: "Task type is required" },
        { status: 400 }
      );
    }

    if (!VALID_TASK_TYPES.includes(type)) {
      return NextResponse.json(
        {
          error: `Invalid task type: "${type}". Allowed: ${VALID_TASK_TYPES.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Validate status if provided
    const taskStatus = status ?? "pending";
    if (!VALID_TASK_STATUSES.includes(taskStatus)) {
      return NextResponse.json(
        {
          error: `Invalid status: "${taskStatus}". Allowed: ${VALID_TASK_STATUSES.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Verify the production job exists
    const job = await prisma.productionJob.findUnique({
      where: { id },
      select: { id: true, status: true },
    });

    if (!job) {
      return NextResponse.json(
        { error: "Production job not found" },
        { status: 404 }
      );
    }

    // Build the payload
    const payload: PostProcessingPayload = {
      taskType: type as TaskType,
      status: taskStatus as TaskStatus,
      assignedTo: assignedTo ?? null,
      startedAt: startedAt ?? null,
      completedAt: completedAt ?? null,
      notes: notes ?? null,
    };

    // Auto-set startedAt when status is in_progress
    if (taskStatus === "in_progress" && !startedAt) {
      payload.startedAt = new Date().toISOString();
    }

    // Auto-set completedAt when status is completed
    if (taskStatus === "completed" && !completedAt) {
      payload.completedAt = new Date().toISOString();
    }

    const event = await prisma.jobEvent.create({
      data: {
        jobId: id,
        type: "post_processing",
        payload: payload as unknown as Record<string, unknown>,
        operatorName: assignedTo ?? null,
      },
    });

    logActivity({
      action: "post_processing_added",
      entity: "ProductionJob",
      entityId: id,
      details: { taskType: type, status: taskStatus },
    });

    // Return in the same shape as GET tasks
    return NextResponse.json(
      {
        id: event.id,
        jobId: event.jobId,
        type: payload.taskType,
        status: payload.status,
        assignedTo: payload.assignedTo,
        startedAt: payload.startedAt,
        completedAt: payload.completedAt,
        notes: payload.notes,
        createdAt: event.createdAt,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[PostProcessing POST] Error:", error);
    return NextResponse.json(
      { error: "Failed to create post-processing task" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/production/[id]/post-processing
 * Update an existing post-processing task's status.
 *
 * Body: { taskId, status?, assignedTo?, startedAt?, completedAt?, notes? }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission(request, "production", "edit");
  if (!auth.authenticated) return auth.response;

  try {
    const { id } = await params;
    const body = await request.json();

    const { taskId, status, assignedTo, startedAt, completedAt, notes } = body;

    if (!taskId) {
      return NextResponse.json(
        { error: "taskId is required" },
        { status: 400 }
      );
    }

    // Validate status if provided
    if (status && !VALID_TASK_STATUSES.includes(status)) {
      return NextResponse.json(
        {
          error: `Invalid status: "${status}". Allowed: ${VALID_TASK_STATUSES.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Fetch the existing event and confirm it belongs to this job
    const existing = await prisma.jobEvent.findUnique({
      where: { id: taskId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Post-processing task not found" },
        { status: 404 }
      );
    }

    if (existing.jobId !== id) {
      return NextResponse.json(
        { error: "Task does not belong to this production job" },
        { status: 400 }
      );
    }

    if (existing.type !== "post_processing") {
      return NextResponse.json(
        { error: "Event is not a post-processing task" },
        { status: 400 }
      );
    }

    // Merge updated fields into the existing payload
    const oldPayload = (existing.payload ?? {}) as Record<string, unknown>;
    const updatedPayload: Record<string, unknown> = { ...oldPayload };

    if (status !== undefined) updatedPayload.status = status;
    if (assignedTo !== undefined) updatedPayload.assignedTo = assignedTo;
    if (startedAt !== undefined) updatedPayload.startedAt = startedAt;
    if (completedAt !== undefined) updatedPayload.completedAt = completedAt;
    if (notes !== undefined) updatedPayload.notes = notes;

    // Auto-set startedAt when transitioning to in_progress
    if (
      status === "in_progress" &&
      !updatedPayload.startedAt &&
      startedAt === undefined
    ) {
      updatedPayload.startedAt = new Date().toISOString();
    }

    // Auto-set completedAt when transitioning to completed
    if (
      status === "completed" &&
      !updatedPayload.completedAt &&
      completedAt === undefined
    ) {
      updatedPayload.completedAt = new Date().toISOString();
    }

    const updated = await prisma.jobEvent.update({
      where: { id: taskId },
      data: {
        payload: updatedPayload,
        operatorName: (updatedPayload.assignedTo as string) ?? existing.operatorName,
      },
    });

    logActivity({
      action: "post_processing_updated",
      entity: "ProductionJob",
      entityId: id,
      details: {
        taskId,
        taskType: updatedPayload.taskType,
        from: oldPayload.status,
        to: updatedPayload.status,
      },
    });

    return NextResponse.json({
      id: updated.id,
      jobId: updated.jobId,
      type: updatedPayload.taskType ?? null,
      status: updatedPayload.status ?? "pending",
      assignedTo: updatedPayload.assignedTo ?? updated.operatorName ?? null,
      startedAt: updatedPayload.startedAt ?? null,
      completedAt: updatedPayload.completedAt ?? null,
      notes: updatedPayload.notes ?? null,
      createdAt: updated.createdAt,
    });
  } catch (error) {
    console.error("[PostProcessing PATCH] Error:", error);
    return NextResponse.json(
      { error: "Failed to update post-processing task" },
      { status: 500 }
    );
  }
}
