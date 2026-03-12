import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin-auth";
import { logActivity } from "@/lib/activity-log";
import { gateWithApproval } from "@/lib/pricing/approval";
import { logMaterialChange, logPriceChange } from "@/lib/pricing/change-log";

export async function GET(req: NextRequest) {
  const auth = await requirePermission(req, "pricing", "view");
  if (!auth.authenticated) return auth.response;

  try {
    const url = new URL(req.url);
    const type = url.searchParams.get("type");

    const where: Record<string, unknown> = {};
    if (type) where.type = type;

    const materials = await prisma.material.findMany({
      where,
      orderBy: { sortOrder: "asc" },
    });

    // Also return ink cost settings
    const inkSettings = await prisma.setting.findMany({
      where: { key: { in: ["ink_cost_per_liter", "ink_ml_per_sqft"] } },
    });
    const inkCostPerLiter = Number(inkSettings.find((s) => s.key === "ink_cost_per_liter")?.value) || 234;
    const inkMlPerSqft = Number(inkSettings.find((s) => s.key === "ink_ml_per_sqft")?.value) || 1;

    return NextResponse.json({
      materials,
      total: materials.length,
      inkSettings: { inkCostPerLiter, inkMlPerSqft, inkCostPerSqft: (inkCostPerLiter / 1000) * inkMlPerSqft },
    });
  } catch (err) {
    console.error("[Materials GET]", err);
    return NextResponse.json({ error: "Failed to fetch materials" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requirePermission(req, "pricing", "edit");
  if (!auth.authenticated) return auth.response;

  try {
    const body = await req.json();

    // Gate material creation through approval
    const gate = await gateWithApproval({
      operatorRole: auth.user?.role || "unknown",
      operator: { id: auth.user?.id || "", name: auth.user?.name || auth.user?.email || "admin", role: auth.user?.role || "unknown" },
      changeType: "material_create",
      scope: "material",
      targetName: body.name || "New Material",
      description: `Create material: ${body.name || "New Material"} (${body.type || "Adhesive Vinyl"})`,
      changeDiff: { name: body.name, type: body.type, rollCost: body.rollCost, costPerSqft: body.costPerSqft },
    });
    if (gate.needsApproval) {
      return NextResponse.json({ requiresApproval: true, approvalId: gate.approvalId, reason: gate.reason }, { status: 202 });
    }

    const material = await prisma.material.create({
      data: {
        sortOrder: body.sortOrder ?? 0,
        type: body.type || "Adhesive Vinyl",
        name: body.name || "New Material",
        family: body.family || null,
        rollSpec: body.rollSpec || null,
        minWidthIn: body.minWidthIn ?? 9,
        widthIn: body.widthIn ?? null,
        minLengthFt: body.minLengthFt ?? 10,
        lengthFt: body.lengthFt ?? null,
        lengthIn: body.lengthIn ?? null,
        thickness: body.thickness || null,
        texture: body.texture || null,
        rollCost: body.rollCost ?? 0,
        sqftPerRoll: body.sqftPerRoll ?? 0,
        costPerSqft: body.costPerSqft ?? 0,
        costPerSqm: body.costPerSqm ?? 0,
        lamination: body.lamination || null,
        printMode: body.printMode || "cmyk",
      },
    });

    logActivity({
      action: "material_created",
      entity: "material",
      entityId: material.id,
      actor: auth.user?.name || auth.user?.email || "admin",
      details: { name: body.name, type: body.type },
    });

    // Log to pricing change log
    logPriceChange({
      scope: "material",
      field: "material.create",
      productName: body.name || "New Material",
      valueBefore: null,
      valueAfter: { name: body.name, type: body.type, rollCost: body.rollCost, costPerSqft: body.costPerSqft },
      operatorId: auth.user?.id || null,
      operatorName: auth.user?.name || auth.user?.email || "admin",
      note: "owner-bypass",
    }).catch(() => {});

    return NextResponse.json({ material });
  } catch (err) {
    console.error("[Materials POST]", err);
    return NextResponse.json({ error: "Failed to create material" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await requirePermission(req, "pricing", "edit");
  if (!auth.authenticated) return auth.response;

  try {
    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    // Auto-compute costPerSqm from costPerSqft if costPerSqft changed
    if (typeof updates.costPerSqft === "number" && updates.costPerSqm === undefined) {
      updates.costPerSqm = Number((updates.costPerSqft * 10.7639).toFixed(2));
    }

    // Auto-compute costPerSqft from rollCost / sqftPerRoll
    if (typeof updates.rollCost === "number" && typeof updates.sqftPerRoll === "number" && updates.sqftPerRoll > 0) {
      updates.costPerSqft = Number((updates.rollCost / updates.sqftPerRoll).toFixed(4));
      updates.costPerSqm = Number((updates.costPerSqft * 10.7639).toFixed(2));
    }

    // Gate material cost changes through approval
    const isCostChange = updates.costPerSqft !== undefined || updates.rollCost !== undefined || updates.costPerSqm !== undefined;
    if (isCostChange) {
      const existing = await prisma.material.findUnique({ where: { id }, select: { id: true, name: true, costPerSqft: true, rollCost: true } });
      if (existing) {
        const oldCost = existing.costPerSqft || 0;
        const newCost = updates.costPerSqft ?? oldCost;
        const driftPct = oldCost > 0 ? ((newCost - oldCost) / oldCost) * 100 : null;

        const gate = await gateWithApproval({
          operatorRole: auth.user?.role || "unknown",
          operator: { id: auth.user?.id || "", name: auth.user?.name || auth.user?.email || "admin", role: auth.user?.role || "unknown" },
          changeType: "material_cost_edit",
          scope: "material",
          targetId: id,
          targetName: existing.name,
          description: `Material cost change: ${existing.name}`,
          changeDiff: { before: { costPerSqft: existing.costPerSqft, rollCost: existing.rollCost }, after: { costPerSqft: updates.costPerSqft, rollCost: updates.rollCost } },
          driftPct: driftPct ?? undefined,
        });
        if (gate.needsApproval) {
          return NextResponse.json({ requiresApproval: true, approvalId: gate.approvalId, reason: gate.reason }, { status: 202 });
        }

        // Log cost change
        if (updates.costPerSqft !== undefined && updates.costPerSqft !== existing.costPerSqft) {
          logMaterialChange({
            materialId: id,
            materialName: existing.name,
            field: "costPerSqft",
            before: existing.costPerSqft,
            after: updates.costPerSqft,
            operator: { id: auth.user?.id || "", name: auth.user?.name || auth.user?.email || "admin" },
            note: "owner-bypass",
          }).catch(() => {});
        }
      }
    }

    const material = await prisma.material.update({
      where: { id },
      data: updates,
    });

    logActivity({
      action: "material_updated",
      entity: "material",
      entityId: id,
      actor: auth.user?.name || auth.user?.email || "admin",
    });

    return NextResponse.json({ material });
  } catch (err) {
    console.error("[Materials PATCH]", err);
    return NextResponse.json({ error: "Failed to update material" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await requirePermission(req, "pricing", "edit");
  if (!auth.authenticated) return auth.response;

  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

    const existing = await prisma.material.findUnique({ where: { id }, select: { id: true, name: true, type: true } });
    if (!existing) return NextResponse.json({ error: "Material not found" }, { status: 404 });

    // Gate material deactivation through approval
    const gate = await gateWithApproval({
      operatorRole: auth.user?.role || "unknown",
      operator: { id: auth.user?.id || "", name: auth.user?.name || auth.user?.email || "admin", role: auth.user?.role || "unknown" },
      changeType: "material_delete",
      scope: "material",
      targetId: id,
      targetName: existing.name,
      description: `Deactivate material: ${existing.name}`,
      changeDiff: { name: existing.name, type: existing.type },
    });
    if (gate.needsApproval) {
      return NextResponse.json({ requiresApproval: true, approvalId: gate.approvalId, reason: gate.reason }, { status: 202 });
    }

    // Soft-delete: deactivate instead of hard-delete to preserve historical references
    await prisma.material.update({
      where: { id },
      data: { isActive: false },
    });

    logActivity({
      action: "material_deactivated",
      entity: "material",
      entityId: id,
      actor: auth.user?.name || auth.user?.email || "admin",
    });

    // Log to pricing change log
    logPriceChange({
      scope: "material",
      field: "material.deactivate",
      productName: existing.name,
      valueBefore: { active: true },
      valueAfter: { active: false },
      operatorId: auth.user?.id || null,
      operatorName: auth.user?.name || auth.user?.email || "admin",
      note: "owner-bypass",
    }).catch(() => {});

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[Materials DELETE]", err);
    return NextResponse.json({ error: "Failed to deactivate material" }, { status: 500 });
  }
}
