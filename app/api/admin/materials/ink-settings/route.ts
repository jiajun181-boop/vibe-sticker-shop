import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin-auth";

export async function PUT(req: NextRequest) {
  const auth = await requirePermission(req, "pricing", "edit");
  if (!auth.authenticated) return auth.response;

  try {
    const body = await req.json();
    const { inkCostPerLiter, inkMlPerSqft } = body;

    if (typeof inkCostPerLiter === "number" && inkCostPerLiter >= 0) {
      await prisma.setting.upsert({
        where: { key: "ink_cost_per_liter" },
        create: { key: "ink_cost_per_liter", value: String(inkCostPerLiter) },
        update: { value: String(inkCostPerLiter) },
      });
    }

    if (typeof inkMlPerSqft === "number" && inkMlPerSqft >= 0) {
      await prisma.setting.upsert({
        where: { key: "ink_ml_per_sqft" },
        create: { key: "ink_ml_per_sqft", value: String(inkMlPerSqft) },
        update: { value: String(inkMlPerSqft) },
      });
    }

    const costPerLiter = typeof inkCostPerLiter === "number" ? inkCostPerLiter : 234;
    const mlPerSqft = typeof inkMlPerSqft === "number" ? inkMlPerSqft : 1;

    return NextResponse.json({
      inkCostPerLiter: costPerLiter,
      inkMlPerSqft: mlPerSqft,
      inkCostPerSqft: (costPerLiter / 1000) * mlPerSqft,
    });
  } catch (err) {
    console.error("[InkSettings PUT]", err);
    return NextResponse.json({ error: "Failed to update ink settings" }, { status: 500 });
  }
}
