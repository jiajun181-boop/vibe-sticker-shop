import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

const DEFAULT_RULES = {
  earnRate: 1,
  redeemRate: 100,
  tiers: { bronze: 0, silver: 1000, gold: 5000, platinum: 20000 },
  bonusEvents: { firstOrder: 100, referral: 200, review: 50 },
};

function computeTier(
  totalEarned: number,
  tiers: Record<string, number>
): string {
  const sorted = Object.entries(tiers).sort(([, a], [, b]) => b - a);
  for (const [name, threshold] of sorted) {
    if (totalEarned >= threshold) return name;
  }
  return "bronze";
}

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Load loyalty rules from settings
    const rulesSetting = await prisma.setting.findUnique({
      where: { key: "loyalty_rules" },
    });
    const rules = rulesSetting?.value
      ? (rulesSetting.value as typeof DEFAULT_RULES)
      : DEFAULT_RULES;

    // Auto-create loyalty account on first access
    let account = await prisma.loyaltyAccount.findUnique({
      where: { userId: user.id },
      include: {
        transactions: {
          orderBy: { createdAt: "desc" },
          take: 20,
        },
      },
    });

    if (!account) {
      account = await prisma.loyaltyAccount.create({
        data: {
          userId: user.id,
          pointsBalance: 0,
          totalEarned: 0,
          totalRedeemed: 0,
          tier: "bronze",
        },
        include: {
          transactions: {
            orderBy: { createdAt: "desc" },
            take: 20,
          },
        },
      });
    }

    // Recompute tier from current rules
    const currentTier = computeTier(
      account.totalEarned,
      rules.tiers as Record<string, number>
    );
    if (currentTier !== account.tier) {
      await prisma.loyaltyAccount.update({
        where: { id: account.id },
        data: { tier: currentTier },
      });
      account.tier = currentTier;
    }

    // Compute next tier info
    const tiers = rules.tiers as Record<string, number>;
    const tierOrder = Object.entries(tiers).sort(([, a], [, b]) => a - b);
    const currentIdx = tierOrder.findIndex(([name]) => name === account!.tier);
    const nextTier =
      currentIdx < tierOrder.length - 1 ? tierOrder[currentIdx + 1] : null;

    return NextResponse.json({
      account: {
        id: account.id,
        pointsBalance: account.pointsBalance,
        totalEarned: account.totalEarned,
        totalRedeemed: account.totalRedeemed,
        tier: account.tier,
        createdAt: account.createdAt,
      },
      transactions: account.transactions.map((tx) => ({
        id: tx.id,
        type: tx.type,
        points: tx.points,
        description: tx.description,
        orderId: tx.orderId,
        createdAt: tx.createdAt,
      })),
      nextTier: nextTier
        ? {
            name: nextTier[0],
            threshold: nextTier[1],
            pointsNeeded: nextTier[1] - account.totalEarned,
          }
        : null,
      rules: {
        earnRate: rules.earnRate,
        redeemRate: rules.redeemRate,
        tiers: rules.tiers,
        bonusEvents: rules.bonusEvents,
      },
    });
  } catch (err) {
    console.error("[account/loyalty] GET error:", err);
    return NextResponse.json(
      { error: "Failed to load loyalty data" },
      { status: 500 }
    );
  }
}
