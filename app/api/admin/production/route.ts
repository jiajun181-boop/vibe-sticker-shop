import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  const auth = await requirePermission(request, "production", "view");
  if (!auth.authenticated) return auth.response;

  try {
    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const factoryId = searchParams.get("factoryId");
    const search = searchParams.get("search");
    const sortParam = searchParams.get("sort") || "createdAt";
    // Map frontend sort keys to Prisma field paths
    const SORT_MAP: Record<string, string> = {
      createdAt: "createdAt",
      dueAt: "dueAt",
      priority: "priority",
      status: "status",
    };
    const sort = SORT_MAP[sortParam] || "createdAt";
    const order = searchParams.get("order") || "desc";

    const where: Record<string, unknown> = {};

    if (status) {
      where.status = status;
    }

    if (priority) {
      where.priority = priority;
    }

    if (factoryId) {
      where.factoryId = factoryId;
    }

    if (search) {
      where.OR = [
        { productName: { contains: search, mode: "insensitive" } },
        { orderItem: { productName: { contains: search, mode: "insensitive" } } },
        { orderItem: { order: { customerEmail: { contains: search, mode: "insensitive" } } } },
      ];
    }

    const [jobs, total] = await Promise.all([
      prisma.productionJob.findMany({
        where,
        include: {
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
          factory: {
            select: { name: true },
          },
        },
        orderBy: { [sort]: order },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.productionJob.count({ where }),
    ]);

    const formatted = jobs.map((job) => {
      const itemMeta = job.orderItem.meta && typeof job.orderItem.meta === "object"
        ? job.orderItem.meta as Record<string, unknown>
        : {};

      return {
        id: job.id,
        status: job.status,
        priority: job.priority,
        notes: job.notes,
        dueAt: job.dueAt,
        startedAt: job.startedAt,
        completedAt: job.completedAt,
        createdAt: job.createdAt,
        orderItemId: job.orderItemId,
        orderId: job.orderItem.order.id,
        customerEmail: job.orderItem.order.customerEmail,
        customerName: job.orderItem.order.customerName,
        factoryId: job.factoryId,
        factoryName: job.factory?.name ?? null,
        assignedTo: job.assignedTo,

        // Production-critical fields (direct from job, fallback to orderItem/meta)
        productName: job.productName || job.orderItem.productName,
        family: job.family || null,
        quantity: job.quantity || job.orderItem.quantity,
        widthIn: job.widthIn ?? job.orderItem.widthIn ?? null,
        heightIn: job.heightIn ?? job.orderItem.heightIn ?? null,
        material: job.material || job.orderItem.material || null,
        materialLabel: job.materialLabel || (typeof itemMeta.materialLabel === "string" ? itemMeta.materialLabel : null),
        finishing: job.finishing || job.orderItem.finishing || null,
        finishingLabel: job.finishingLabel || (typeof itemMeta.finishingLabel === "string" ? itemMeta.finishingLabel : null),
        artworkUrl: job.artworkUrl || job.orderItem.fileUrl || (typeof itemMeta.artworkUrl === "string" ? itemMeta.artworkUrl : null),
        isTwoSided: job.isTwoSided,
        isRush: job.isRush,
      };
    });

    return NextResponse.json({
      jobs: formatted,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("[Production GET] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch production jobs" },
      { status: 500 }
    );
  }
}
