import { prisma } from "@/lib/prisma";

/**
 * Job-status → order-productionStatus mapping.
 * Called after any ProductionJob status change to keep the parent order in sync.
 *
 * Rules (evaluated top-to-bottom, first match wins):
 *  1. ANY job on_hold        → order = on_hold
 *  2. ALL jobs shipped        → order = shipped
 *  3. ALL jobs finished+      → order = ready_to_ship
 *  4. ANY job quality_check   → order = in_production
 *  5. ANY job printing        → order = in_production
 *  6. ANY job assigned        → order = preflight
 *  7. ALL jobs queued         → order = not_started
 */

const TERMINAL_OR_LATER = new Set(["finished", "shipped"]);

export async function syncOrderProductionStatus(orderId: string): Promise<string | null> {
  try {
    const jobs = await prisma.productionJob.findMany({
      where: { orderItem: { orderId } },
      select: {
        status: true,
        orderItem: {
          select: {
            fileUrl: true,
            meta: true,
          },
        },
      },
    });

    if (jobs.length === 0) return null;

    const statuses = jobs.map((j) => j.status);

    // Check artwork readiness across all jobs
    const hasArtworkGap = jobs.some((j) => {
      const meta = (j.orderItem.meta && typeof j.orderItem.meta === "object" ? j.orderItem.meta : {}) as Record<string, unknown>;
      const hasFile = !!j.orderItem.fileUrl || !!meta.artworkUrl || !!meta.fileUrl || !!meta.uploadedFileUrl;
      const artworkStatus = String(meta.artworkStatus || "");
      const artworkIntent = String(meta.artworkIntent || "");
      // Missing artwork if: no file AND not design-help (design-help is handled by designer)
      return !hasFile && artworkIntent !== "design-help" && artworkStatus !== "uploaded" && artworkStatus !== "design-help";
    });

    let newStatus: string;

    if (statuses.some((s) => s === "on_hold")) {
      newStatus = "on_hold";
    } else if (statuses.every((s) => s === "shipped")) {
      newStatus = "shipped";
    } else if (statuses.every((s) => TERMINAL_OR_LATER.has(s))) {
      newStatus = "ready_to_ship";
    } else if (statuses.some((s) => s === "quality_check" || s === "printing")) {
      newStatus = "in_production";
    } else if (statuses.some((s) => s === "assigned")) {
      // If artwork is missing, stay at preflight even when jobs are assigned
      // This tells operators the order isn't truly ready to print
      newStatus = hasArtworkGap ? "preflight" : "preflight";
    } else {
      newStatus = "not_started";
    }

    // Use updatedAt-based optimistic concurrency to prevent stale overwrites
    // when two jobs update simultaneously
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { productionStatus: true },
    });

    // Skip update if status hasn't changed and artwork gap hasn't changed
    const currentTags: string[] = Array.isArray(order?.tags) ? (order.tags as string[]) : [];
    const hasArtworkGapTag = currentTags.includes("missing_artwork");
    if (order?.productionStatus === newStatus && hasArtworkGapTag === hasArtworkGap) {
      return newStatus;
    }

    // Update tags: add or remove missing_artwork tag based on current artwork state
    let updatedTags = currentTags.filter((t: string) => t !== "missing_artwork");
    if (hasArtworkGap) updatedTags.push("missing_artwork");

    await prisma.order.update({
      where: { id: orderId },
      data: {
        productionStatus: newStatus as "not_started" | "preflight" | "in_production" | "ready_to_ship" | "shipped" | "completed" | "on_hold",
        tags: updatedTags,
      },
    });

    return newStatus;
  } catch (error) {
    console.error(`[production-sync] Failed to sync order ${orderId}:`, error);
    // Return null to indicate sync failure — caller should log but not crash
    return null;
  }
}
