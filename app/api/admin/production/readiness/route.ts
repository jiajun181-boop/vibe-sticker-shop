import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin-auth";
import { assessItem, READINESS } from "@/lib/admin/production-readiness";

/**
 * GET /api/admin/production/readiness
 *
 * Returns a summary of production readiness across all pending orders:
 *   - counts by readiness level (blocked, needs-info, ready, in-progress, done)
 *   - top blockers (most common blocking reasons)
 *   - list of blocked items (for quick action)
 */
export async function GET(request: NextRequest) {
  const auth = await requirePermission(request, "production", "view");
  if (!auth.authenticated) return auth.response;

  try {
    // Fetch all order items from paid orders that are NOT completed/canceled
    const items = await prisma.orderItem.findMany({
      where: {
        order: {
          status: "paid",
          productionStatus: { notIn: ["shipped", "completed", "canceled"] },
        },
      },
      select: {
        id: true,
        productName: true,
        quantity: true,
        widthIn: true,
        heightIn: true,
        material: true,
        meta: true,
        specsJson: true,
        order: {
          select: {
            id: true,
            customerEmail: true,
            createdAt: true,
          },
        },
        productionJob: {
          select: { id: true, status: true, dueAt: true },
        },
      },
    });

    // Assess each item
    const counts: Record<string, number> = {
      [READINESS.BLOCKED]: 0,
      [READINESS.NEEDS_INFO]: 0,
      [READINESS.READY]: 0,
      [READINESS.IN_PROGRESS]: 0,
      [READINESS.DONE]: 0,
    };

    const blockerCounts: Record<string, number> = {};
    const blockedItems: Array<{
      itemId: string;
      orderId: string;
      productName: string;
      customerEmail: string;
      reasons: Array<{ code: string; message: string }>;
      nextAction: string | null;
    }> = [];

    for (const item of items) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const assessment: any = assessItem(item, item.order.id);
      counts[assessment.level] = (counts[assessment.level] || 0) + 1;

      if (assessment.level === READINESS.BLOCKED && assessment.reasons) {
        for (const reason of assessment.reasons) {
          if (reason.severity === "blocker") {
            blockerCounts[reason.code] = (blockerCounts[reason.code] || 0) + 1;
          }
        }
        blockedItems.push({
          itemId: item.id,
          orderId: item.order.id,
          productName: item.productName,
          customerEmail: item.order.customerEmail,
          reasons: assessment.reasons
            .filter((r: { severity: string }) => r.severity === "blocker")
            .map((r: { code: string; message: string }) => ({ code: r.code, message: r.message })),
          nextAction: assessment.nextAction || null,
        });
      }
    }

    // Sort blockers by frequency
    const topBlockers = Object.entries(blockerCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([code, count]) => ({ code, count }));

    return NextResponse.json({
      totalItems: items.length,
      counts,
      topBlockers,
      blockedItems: blockedItems.slice(0, 50), // Cap at 50 for performance
    });
  } catch (error) {
    console.error("[Production Readiness] Error:", error);
    return NextResponse.json(
      { error: "Failed to assess production readiness" },
      { status: 500 }
    );
  }
}
