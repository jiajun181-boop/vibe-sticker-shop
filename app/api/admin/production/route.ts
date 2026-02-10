import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminAuth } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  const auth = requireAdminAuth(request);
  if (!auth.authenticated) return auth.response;

  try {
    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const factoryId = searchParams.get("factoryId");
    const search = searchParams.get("search");
    const sort = searchParams.get("sort") || "createdAt";
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
      where.orderItem = {
        OR: [
          { productName: { contains: search, mode: "insensitive" } },
          {
            order: {
              customerEmail: { contains: search, mode: "insensitive" },
            },
          },
        ],
      };
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

    const formatted = jobs.map((job) => ({
      id: job.id,
      status: job.status,
      priority: job.priority,
      notes: job.notes,
      dueAt: job.dueAt,
      startedAt: job.startedAt,
      completedAt: job.completedAt,
      createdAt: job.createdAt,
      orderItemId: job.orderItemId,
      productName: job.orderItem.productName,
      quantity: job.orderItem.quantity,
      orderId: job.orderItem.order.id,
      customerEmail: job.orderItem.order.customerEmail,
      customerName: job.orderItem.order.customerName,
      factoryId: job.factoryId,
      factoryName: job.factory?.name ?? null,
    }));

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
