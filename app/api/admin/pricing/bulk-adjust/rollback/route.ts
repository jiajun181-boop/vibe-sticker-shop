/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin-auth";
import { logActivity } from "@/lib/activity-log";
import { gateWithApproval } from "@/lib/pricing/approval";
import { logPriceChange } from "@/lib/pricing/change-log";

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

    const rawSnapshots = Array.isArray(log.details?.snapshots) ? log.details.snapshots : [];
    if (!rawSnapshots.length) {
      return NextResponse.json({ error: "No snapshots found in rollback source" }, { status: 400 });
    }

    // Validate snapshot structure before writing back
    const snapshots = rawSnapshots.filter(
      (s: any) =>
        s &&
        typeof s.presetId === "string" &&
        s.presetId.length > 0 &&
        s.before !== undefined &&
        s.before !== null &&
        typeof s.before === "object"
    );

    if (!snapshots.length) {
      return NextResponse.json({ error: "No valid snapshots in rollback source" }, { status: 400 });
    }

    // Verify all referenced presets actually exist
    const presetIds = snapshots.map((s: any) => s.presetId);
    const existingPresets = await prisma.pricingPreset.findMany({
      where: { id: { in: presetIds } },
      select: { id: true },
    });
    const existingIds = new Set(existingPresets.map((p) => p.id));
    const validSnapshots = snapshots.filter((s: any) => existingIds.has(s.presetId));

    if (!validSnapshots.length) {
      return NextResponse.json({ error: "None of the referenced pricing presets exist" }, { status: 400 });
    }

    // Gate rollback through approval
    const gate = await gateWithApproval({
      operatorRole: auth.user?.role || "unknown",
      operator: { id: auth.user?.id || "", name: auth.user?.name || auth.user?.email || "admin", role: auth.user?.role || "unknown" },
      changeType: "bulk_rollback",
      scope: "preset",
      targetName: `Rollback bulk-adjust (${validSnapshots.length} presets)`,
      description: `Rollback ${validSnapshots.length} presets from bulk-adjust log ${logId}`,
      changeDiff: { sourceLogId: logId, presetCount: validSnapshots.length },
      affectedCount: validSnapshots.length,
    });
    if (gate.needsApproval) {
      return NextResponse.json({ requiresApproval: true, approvalId: gate.approvalId, reason: gate.reason }, { status: 202 });
    }

    await prisma.$transaction(
      validSnapshots.map((s: any) =>
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
        restoredPresets: validSnapshots.length,
      },
    });

    logPriceChange({
      scope: "preset",
      field: "bulk_rollback",
      valueBefore: { logId },
      valueAfter: { restoredPresets: validSnapshots.length },
      affectedCount: validSnapshots.length,
      operatorId: auth.user?.id || null,
      operatorName: auth.user?.name || auth.user?.email || "admin",
      note: "owner-bypass",
    }).catch(() => {});

    return NextResponse.json({ ok: true, restoredPresets: validSnapshots.length });
  } catch (err) {
    console.error("[Pricing rollback] POST failed:", err);
    return NextResponse.json({ error: "Failed to rollback bulk adjustment" }, { status: 500 });
  }
}
