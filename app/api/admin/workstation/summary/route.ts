import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin-auth";

/**
 * GET /api/admin/workstation/summary
 *
 * Aggregation endpoint for the admin workstation.
 * Returns real server-side counts and filtered lists — no frontend guessing.
 *
 * Needs-attention rules (orders shown in priority order):
 *   1. priority 0 (urgent) or priority 1 (rush) — regardless of status
 *   2. status = "pending"          — new order, needs first look
 *   3. paymentStatus = "unpaid"    — awaiting payment
 *   4. productionStatus = "preflight" — needs file/proof review
 *   5. status = "paid" AND productionStatus = "not_started" — paid but not pushed to production
 *
 * Each sub-query is wrapped in try/catch so one failure doesn't kill the whole page.
 */
export async function GET(request: NextRequest) {
  const auth = await requirePermission(request, "tools", "view");
  if (!auth.authenticated) return auth.response;

  // Run all queries in parallel; each catches its own errors
  const [
    statsResult,
    attentionResult,
    proofsResult,
    jobsResult,
    prodResult,
  ] = await Promise.allSettled([
    fetchStats(),
    fetchNeedsAttention(),
    fetchPendingProofs(),
    fetchRecentJobs(),
    fetchProductionSummary(),
  ]);

  return NextResponse.json({
    stats: statsResult.status === "fulfilled" ? statsResult.value : null,
    needsAttention: attentionResult.status === "fulfilled" ? attentionResult.value : [],
    pendingProofs: proofsResult.status === "fulfilled" ? proofsResult.value : [],
    recentJobs: jobsResult.status === "fulfilled" ? jobsResult.value : [],
    productionSummary: prodResult.status === "fulfilled" ? prodResult.value : null,
    errors: buildErrors({ statsResult, attentionResult, proofsResult, jobsResult, prodResult }),
  });
}

// ─── Stats: real DB counts ──────────────────────────────────────────────────

async function fetchStats() {
  const [
    totalOrders,
    needsAttentionCount,
    pendingProofsCount,
    recentJobsCount,
    inProductionCounts,
  ] = await Promise.all([
    prisma.order.count(),

    // Needs-attention: pending OR paid+not_started OR preflight OR rush/urgent
    prisma.order.count({
      where: {
        isArchived: false,
        OR: [
          { status: "pending" },
          { paymentStatus: "unpaid", status: { not: "canceled" } },
          { productionStatus: "preflight" },
          { status: "paid", productionStatus: "not_started" },
          { priority: { lte: 1 } }, // 0=urgent, 1=rush
        ],
      },
    }),

    // Proofs waiting for action (pending or revised)
    prisma.orderProof.count({
      where: { status: { in: ["pending", "revised"] } },
    }),

    // Tool jobs in last 7 days
    prisma.adminToolJob.count({
      where: {
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
    }),

    // Production jobs in active states
    prisma.productionJob.groupBy({
      by: ["status"],
      _count: true,
      where: {
        status: { in: ["queued", "assigned", "printing", "quality_check", "on_hold"] },
      },
    }),
  ]);

  const inProductionCount = inProductionCounts.reduce(
    (sum, g) => sum + g._count,
    0
  );

  return {
    totalOrders,
    needsAttentionCount,
    pendingProofsCount,
    recentJobsCount,
    inProductionCount,
  };
}

// ─── Needs-attention orders ─────────────────────────────────────────────────

async function fetchNeedsAttention() {
  const orders = await prisma.order.findMany({
    where: {
      isArchived: false,
      OR: [
        { status: "pending" },
        { paymentStatus: "unpaid", status: { not: "canceled" } },
        { productionStatus: "preflight" },
        { status: "paid", productionStatus: "not_started" },
        { priority: { lte: 1 } },
      ],
    },
    select: {
      id: true,
      status: true,
      paymentStatus: true,
      productionStatus: true,
      customerEmail: true,
      customerName: true,
      totalAmount: true,
      priority: true,
      createdAt: true,
      _count: { select: { items: true } },
    },
    orderBy: [
      { priority: "asc" },   // urgent (0) first
      { createdAt: "desc" }, // newest first within same priority
    ],
    take: 20,
  });

  return orders;
}

// ─── Pending proofs ─────────────────────────────────────────────────────────

async function fetchPendingProofs() {
  const proofs = await prisma.orderProof.findMany({
    where: { status: { in: ["pending", "revised"] } },
    select: {
      id: true,
      orderId: true,
      version: true,
      status: true,
      fileName: true,
      imageUrl: true,
      notes: true,
      uploadedBy: true,
      createdAt: true,
      order: {
        select: {
          id: true,
          customerEmail: true,
          customerName: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return proofs;
}

// ─── Recent tool jobs (last 7 days) ─────────────────────────────────────────

async function fetchRecentJobs() {
  const jobs = await prisma.adminToolJob.findMany({
    where: {
      createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    },
    select: {
      id: true,
      toolType: true,
      status: true,
      operatorName: true,
      orderId: true,
      outputFileUrl: true,
      createdAt: true,
      notes: true,
    },
    orderBy: { createdAt: "desc" },
    take: 15,
  });

  return jobs;
}

// ─── Production summary ─────────────────────────────────────────────────────

async function fetchProductionSummary() {
  const counts = await prisma.productionJob.groupBy({
    by: ["status"],
    _count: true,
  });

  const summary: Record<string, number> = {
    queued: 0,
    assigned: 0,
    printing: 0,
    quality_check: 0,
    finished: 0,
    shipped: 0,
    on_hold: 0,
  };

  for (const row of counts) {
    if (row.status in summary) {
      summary[row.status] = row._count;
    }
  }

  return summary;
}

// ─── Error collector ────────────────────────────────────────────────────────

function buildErrors(results: Record<string, PromiseSettledResult<unknown>>) {
  const errors: Record<string, string> = {};
  for (const [key, result] of Object.entries(results)) {
    if (result.status === "rejected") {
      const name = key.replace("Result", "");
      errors[name] = String(result.reason);
      console.error(`[workstation/summary] ${name} failed:`, result.reason);
    }
  }
  return Object.keys(errors).length > 0 ? errors : undefined;
}
