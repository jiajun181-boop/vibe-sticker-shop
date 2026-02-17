/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin-auth";
import { logActivity } from "@/lib/activity-log";

export async function GET(request: NextRequest) {
  const auth = await requirePermission(request, "pricing", "view");
  if (!auth.authenticated) return auth.response;

  try {
    const logs = await prisma.activityLog.findMany({
      where: {
        entity: "PricingBulkAdjust",
        action: "bulk_adjust_apply",
      },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        createdAt: true,
        actor: true,
        details: true,
      },
    });

    return NextResponse.json({
      logs: logs.map((l) => ({
        id: l.id,
        createdAt: l.createdAt,
        actor: l.actor,
        category: l.details?.category || null,
        percent: l.details?.percent || null,
        applied: l.details?.applied || 0,
      })),
    });
  } catch (err) {
    console.error("[Pricing rollback] GET failed:", err);
    return NextResponse.json({ error: "Failed to load rollback history" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requirePermission(request, "pricing", "edit");
  if (!auth.authenticated) return auth.response;

  try {
    const body = await request.json();
    const logId = String(body?.logId || "");
    if (!logId) {
      return NextResponse.json({ error: "logId is required" }, { status: 400 });
    }

    const log = await prisma.activityLog.findUnique({
      where: { id: logId },
      select: { id: true, action: true, entity: true, details: true },
    });
    if (!log || log.entity !== "PricingBulkAdjust" || log.action !== "bulk_adjust_apply") {
      return NextResponse.json({ error: "Rollback source log not found" }, { status: 404 });
    }

    const snapshots = Array.isArray(log.details?.snapshots) ? log.details.snapshots : [];
    if (!snapshots.length) {
      return NextResponse.json({ error: "No snapshots found in rollback source" }, { status: 400 });
    }

    await prisma.$transaction(
      snapshots.map((s: any) =>
        prisma.pricingPreset.update({
          where: { id: s.presetId },
          data: { config: s.before },
        })
      )
    );

    await logActivity({
      action: "bulk_adjust_rollback",
      entity: "PricingBulkAdjust",
      actor: auth.user?.email || "admin",
      details: {
        sourceLogId: log.id,
        restoredPresets: snapshots.length,
      },
    });

    return NextResponse.json({ ok: true, restoredPresets: snapshots.length });
  } catch (err) {
    console.error("[Pricing rollback] POST failed:", err);
    return NextResponse.json({ error: "Failed to rollback bulk adjustment" }, { status: 500 });
  }
}
