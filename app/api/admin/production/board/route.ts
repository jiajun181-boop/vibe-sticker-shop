import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminAuth } from "@/lib/admin-auth";

const PRIORITY_ORDER: Record<string, number> = {
  urgent: 0,
  rush: 1,
  normal: 2,
};

export async function GET(request: NextRequest) {
  const auth = requireAdminAuth(request);
  if (!auth.authenticated) return auth.response;

  try {
    const { searchParams } = new URL(request.url);

    const factory = searchParams.get("factory");
    const priority = searchParams.get("priority");
    const dateRange = searchParams.get("dateRange") || "all";

    // Build where clause
    const where: Record<string, unknown> = {};

    if (factory) {
      where.factoryId = factory;
    }

    if (priority) {
      where.priority = priority;
    }

    if (dateRange !== "all") {
      const now = new Date();
      let from: Date;

      switch (dateRange) {
        case "today": {
          from = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        }
        case "week": {
          from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        }
        case "month": {
          from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        }
        default:
          from = new Date(0);
      }

      where.createdAt = { gte: from };
    }

    // Fetch all matching jobs
    const jobs = await prisma.productionJob.findMany({
      where,
      include: {
        orderItem: {
          select: {
            productName: true,
            quantity: true,
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
    });

    // Format jobs
    const formatted = jobs.map((job) => ({
      id: job.id,
      productName: job.orderItem.productName,
      customerEmail: job.orderItem.order.customerEmail,
      priority: job.priority,
      factoryName: job.factory?.name ?? null,
      factoryId: job.factoryId ?? null,
      createdAt: job.createdAt,
      orderId: job.orderItem.order.id,
      quantity: job.orderItem.quantity,
    }));

    // Group by status
    const columns: Record<string, typeof formatted> = {
      queued: [],
      assigned: [],
      printing: [],
      quality_check: [],
      finished: [],
      shipped: [],
      on_hold: [],
    };

    for (const job of formatted) {
      const status = jobs.find((j) => j.id === job.id)!.status;
      if (columns[status]) {
        columns[status].push(job);
      }
    }

    // Sort each column: priority desc (urgent first), then createdAt asc (oldest first)
    for (const status of Object.keys(columns)) {
      columns[status].sort((a, b) => {
        const priorityDiff =
          (PRIORITY_ORDER[a.priority] ?? 2) - (PRIORITY_ORDER[b.priority] ?? 2);
        if (priorityDiff !== 0) return priorityDiff;
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });
    }

    return NextResponse.json(columns);
  } catch (error) {
    console.error("[Production Board GET] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch production board" },
      { status: 500 }
    );
  }
}
