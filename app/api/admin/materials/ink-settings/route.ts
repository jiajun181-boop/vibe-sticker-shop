import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin-auth";
import { gateWithApproval } from "@/lib/pricing/approval";
import { logSettingChange } from "@/lib/pricing/change-log";

export async function PUT(req: NextRequest) {
  const auth = await requirePermission(req, "pricing", "edit");
  if (!auth.authenticated) return auth.response;

  try {
    const body = await req.json();
    const { inkCostPerLiter, inkMlPerSqft } = body;

    // Gate ink settings through approval
    const gate = await gateWithApproval({
      operatorRole: auth.user?.role || "unknown",
      operator: { id: auth.user?.id || "", name: auth.user?.name || auth.user?.email || "admin", role: auth.user?.role || "unknown" },
      changeType: "ink_settings_edit",
      scope: "setting",
      targetName: "Ink Cost Settings",
      description: `Ink settings: costPerLiter=${inkCostPerLiter}, mlPerSqft=${inkMlPerSqft}`,
      changeDiff: body,
    });
    if (gate.needsApproval) {
      return NextResponse.json({ requiresApproval: true, approvalId: gate.approvalId, reason: gate.reason }, { status: 202 });
    }

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

    // Log ink settings change
    if (typeof inkCostPerLiter === "number") {
      logSettingChange({ settingKey: "ink_cost_per_liter", before: null, after: inkCostPerLiter, operator: { id: auth.user?.id || "", name: auth.user?.name || auth.user?.email || "admin" }, note: "owner-bypass" }).catch(() => {});
    }
    if (typeof inkMlPerSqft === "number") {
      logSettingChange({ settingKey: "ink_ml_per_sqft", before: null, after: inkMlPerSqft, operator: { id: auth.user?.id || "", name: auth.user?.name || auth.user?.email || "admin" }, note: "owner-bypass" }).catch(() => {});
    }

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
