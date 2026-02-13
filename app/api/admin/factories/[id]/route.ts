import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity-log";
import { requirePermission } from "@/lib/admin-auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission(request, "factories", "view");
  if (!auth.authenticated) return auth.response;

  try {
    const { id } = await params;

    const factory = await prisma.factory.findUnique({
      where: { id },
      include: {
        jobs: {
          take: 20,
          orderBy: { createdAt: "desc" },
          include: {
            orderItem: {
              select: {
                productName: true,
                order: {
                  select: { customerEmail: true },
                },
              },
            },
          },
        },
      },
    });

    if (!factory) {
      return NextResponse.json(
        { error: "Factory not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(factory);
  } catch (err) {
    console.error("[Factory GET] Error:", err);
    return NextResponse.json(
      { error: "Failed to fetch factory" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission(request, "factories", "edit");
  if (!auth.authenticated) return auth.response;

  try {
    const { id } = await params;
    const body = await request.json();

    const allowedFields = ["name", "location", "capabilities", "isActive"];

    const data: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        if (field === "name") {
          const name = typeof body.name === "string" ? body.name.trim() : "";
          if (!name) {
            return NextResponse.json(
              { error: "Factory name cannot be empty" },
              { status: 400 }
            );
          }
          data.name = name;
        } else if (field === "isActive") {
          data.isActive = Boolean(body.isActive);
        } else {
          data[field] = body[field];
        }
      }
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    const factory = await prisma.factory.update({
      where: { id },
      data,
    });

    logActivity({
      action: "updated",
      entity: "factory",
      entityId: factory.id,
      details: { updatedFields: Object.keys(data) },
    });

    return NextResponse.json(factory);
  } catch (err) {
    console.error("[Factory PATCH] Error:", err);
    return NextResponse.json(
      { error: "Failed to update factory" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission(request, "factories", "edit");
  if (!auth.authenticated) return auth.response;

  try {
    const { id } = await params;

    const jobCount = await prisma.productionJob.count({
      where: { factoryId: id },
    });

    if (jobCount > 0) {
      // Soft-delete: deactivate because jobs reference this factory
      const factory = await prisma.factory.update({
        where: { id },
        data: { isActive: false },
      });

      logActivity({
        action: "deactivated",
        entity: "factory",
        entityId: id,
        details: {
          reason: "Has linked jobs, deactivated instead of deleted",
          jobCount,
        },
      });

      return NextResponse.json({
        success: true,
        deactivated: true,
        message: `Factory has ${jobCount} linked job(s) and was deactivated instead of deleted.`,
        factory,
      });
    }

    await prisma.factory.delete({ where: { id } });

    logActivity({
      action: "deleted",
      entity: "factory",
      entityId: id,
    });

    return NextResponse.json({ success: true, deleted: true });
  } catch (err) {
    console.error("[Factory DELETE] Error:", err);
    return NextResponse.json(
      { error: "Failed to delete factory" },
      { status: 500 }
    );
  }
}
