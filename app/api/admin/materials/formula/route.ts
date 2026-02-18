import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin-auth";

// GET: Read current COST_PLUS formula parameters
export async function GET(req: NextRequest) {
  const auth = await requirePermission(req, "pricing", "view");
  if (!auth.authenticated) return auth.response;

  try {
    const preset = await prisma.pricingPreset.findUnique({
      where: { key: "window_film_costplus" },
    });

    if (!preset) {
      return NextResponse.json({ error: "COST_PLUS preset not found" }, { status: 404 });
    }

    const config = preset.config as Record<string, any>;
    return NextResponse.json({
      presetId: preset.id,
      markup: config.markup || { retailTiers: [], b2bTiers: [], floor: 1.5, retail: 2.5, b2b: 1.8 },
      machineLabor: config.machineLabor || { hourlyRate: 60 },
      cutting: config.cutting || { rectangularPerFt: 0.5, contourPerSqft: 2.0, contourMinimum: 15 },
      waste: config.waste || { tiers: [] },
      qtyEfficiency: config.qtyEfficiency || { tiers: [] },
      fileFee: config.fileFee ?? 10,
      minimumPrice: config.minimumPrice ?? 25,
      inkCosts: config.inkCosts || {},
      materials: config.materials || {},
    });
  } catch (err) {
    console.error("[Formula GET]", err);
    return NextResponse.json({ error: "Failed to fetch formula" }, { status: 500 });
  }
}

// PUT: Update COST_PLUS formula parameters
export async function PUT(req: NextRequest) {
  const auth = await requirePermission(req, "pricing", "edit");
  if (!auth.authenticated) return auth.response;

  try {
    const body = await req.json();
    const preset = await prisma.pricingPreset.findUnique({
      where: { key: "window_film_costplus" },
    });

    if (!preset) {
      return NextResponse.json({ error: "COST_PLUS preset not found" }, { status: 404 });
    }

    const config = { ...(preset.config as Record<string, any>) };

    // Update only provided fields
    if (body.markup) config.markup = body.markup;
    if (body.machineLabor) config.machineLabor = body.machineLabor;
    if (body.cutting) config.cutting = body.cutting;
    if (body.waste) config.waste = body.waste;
    if (body.qtyEfficiency) config.qtyEfficiency = body.qtyEfficiency;
    if (typeof body.fileFee === "number") config.fileFee = body.fileFee;
    if (typeof body.minimumPrice === "number") config.minimumPrice = body.minimumPrice;
    if (body.inkCosts) config.inkCosts = body.inkCosts;

    await prisma.pricingPreset.update({
      where: { key: "window_film_costplus" },
      data: { config },
    });

    return NextResponse.json({ ok: true, config });
  } catch (err) {
    console.error("[Formula PUT]", err);
    return NextResponse.json({ error: "Failed to update formula" }, { status: 500 });
  }
}
