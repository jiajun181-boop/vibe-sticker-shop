import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin-auth";

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

    const material = await prisma.material.update({
      where: { id },
      data: updates,
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

    await prisma.material.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[Materials DELETE]", err);
    return NextResponse.json({ error: "Failed to delete material" }, { status: 500 });
  }
}
