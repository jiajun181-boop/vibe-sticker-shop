import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity-log";
import { requirePermission } from "@/lib/admin-auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission(request, "production", "view");
  if (!auth.authenticated) return auth.response;

  try {
    const { id } = await params;

    const rule = await prisma.assignmentRule.findUnique({
      where: { id },
    });

    if (!rule) {
      return NextResponse.json(
        { error: "Assignment rule not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(rule);
  } catch (error) {
    console.error("[AssignmentRule GET] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch assignment rule" },
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

    const existing = await prisma.assignmentRule.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Assignment rule not found" },
        { status: 404 }
      );
    }

    const data: Record<string, unknown> = {};

    if (body.name !== undefined) data.name = body.name;
    if (body.priority !== undefined) data.priority = body.priority;
    if (body.isActive !== undefined) data.isActive = body.isActive;
    if (body.conditions !== undefined) data.conditions = body.conditions;
    if (body.action !== undefined) data.action = body.action;

    const rule = await prisma.assignmentRule.update({
      where: { id },
      data,
    });

    logActivity({
      action: "updated",
      entity: "AssignmentRule",
      entityId: rule.id,
      details: { updatedFields: Object.keys(data) },
    });

    return NextResponse.json(rule);
  } catch (error) {
    console.error("[AssignmentRule PATCH] Error:", error);
    return NextResponse.json(
      { error: "Failed to update assignment rule" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission(request, "production", "edit");
  if (!auth.authenticated) return auth.response;

  try {
    const { id } = await params;

    await prisma.assignmentRule.delete({
      where: { id },
    });

    logActivity({
      action: "deleted",
      entity: "AssignmentRule",
      entityId: id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[AssignmentRule DELETE] Error:", error);
    return NextResponse.json(
      { error: "Failed to delete assignment rule" },
      { status: 500 }
    );
  }
}
