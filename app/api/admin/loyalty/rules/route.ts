import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin-auth";
import { logActivity } from "@/lib/activity-log";

const DEFAULT_RULES = {
  earnRate: 1,
  redeemRate: 100,
  tiers: { bronze: 0, silver: 1000, gold: 5000, platinum: 20000 },
  bonusEvents: { firstOrder: 100, referral: 200, review: 50 },
};

export async function GET(request: NextRequest) {
  const auth = await requirePermission(request, "settings", "view");
  if (!auth.authenticated) return auth.response;

  try {
    const setting = await prisma.setting.findUnique({
      where: { key: "loyalty_rules" },
    });

    const rules = setting?.value || DEFAULT_RULES;
    return NextResponse.json({ rules });
  } catch (err) {
    console.error("[admin/loyalty/rules] GET error:", err);
    return NextResponse.json(
      { error: "Failed to fetch loyalty rules" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const auth = await requirePermission(request, "settings", "edit");
  if (!auth.authenticated) return auth.response;

  try {
    const body = await request.json();

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        { error: "Body must be an object" },
        { status: 400 }
      );
    }

    const { earnRate, redeemRate, tiers, bonusEvents } = body;

    // Validate earnRate
    if (
      earnRate !== undefined &&
      (typeof earnRate !== "number" || earnRate < 0 || earnRate > 100)
    ) {
      return NextResponse.json(
        { error: "earnRate must be a number between 0 and 100" },
        { status: 400 }
      );
    }

    // Validate redeemRate
    if (
      redeemRate !== undefined &&
      (typeof redeemRate !== "number" || redeemRate < 1 || redeemRate > 10000)
    ) {
      return NextResponse.json(
        { error: "redeemRate must be a number between 1 and 10000" },
        { status: 400 }
      );
    }

    // Validate tiers
    if (tiers !== undefined) {
      if (typeof tiers !== "object" || Array.isArray(tiers)) {
        return NextResponse.json(
          { error: "tiers must be an object" },
          { status: 400 }
        );
      }
      for (const [name, threshold] of Object.entries(tiers)) {
        if (typeof threshold !== "number" || threshold < 0) {
          return NextResponse.json(
            { error: `Tier "${name}" threshold must be a non-negative number` },
            { status: 400 }
          );
        }
      }
      // Must have bronze starting at 0
      if (tiers.bronze !== 0) {
        return NextResponse.json(
          { error: "Bronze tier must start at 0" },
          { status: 400 }
        );
      }
    }

    // Validate bonusEvents
    if (bonusEvents !== undefined) {
      if (typeof bonusEvents !== "object" || Array.isArray(bonusEvents)) {
        return NextResponse.json(
          { error: "bonusEvents must be an object" },
          { status: 400 }
        );
      }
      for (const [event, pts] of Object.entries(bonusEvents)) {
        if (typeof pts !== "number" || pts < 0) {
          return NextResponse.json(
            {
              error: `Bonus event "${event}" points must be a non-negative number`,
            },
            { status: 400 }
          );
        }
      }
    }

    // Merge with existing rules
    const existing = await prisma.setting.findUnique({
      where: { key: "loyalty_rules" },
    });
    const currentRules = (existing?.value as typeof DEFAULT_RULES) || DEFAULT_RULES;

    const updatedRules = {
      earnRate: earnRate ?? currentRules.earnRate,
      redeemRate: redeemRate ?? currentRules.redeemRate,
      tiers: tiers ?? currentRules.tiers,
      bonusEvents: bonusEvents ?? currentRules.bonusEvents,
    };

    await prisma.setting.upsert({
      where: { key: "loyalty_rules" },
      create: { key: "loyalty_rules", value: updatedRules as any },
      update: { value: updatedRules as any },
    });

    await logActivity({
      action: "updated",
      entity: "loyalty_rules",
      actor: auth.user?.email || "admin",
      details: { updatedRules },
    });

    return NextResponse.json({ success: true, rules: updatedRules });
  } catch (err) {
    console.error("[admin/loyalty/rules] PUT error:", err);
    return NextResponse.json(
      { error: "Failed to update loyalty rules" },
      { status: 500 }
    );
  }
}
