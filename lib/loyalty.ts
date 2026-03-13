import { prisma } from "./prisma";

const DEFAULT_EARN_RATE = 1; // 1 point per dollar spent

/**
 * Award loyalty points to a user after a successful order.
 * Non-blocking, fire-and-forget. Finds the user by order's userId or email.
 */
export async function awardLoyaltyPoints(
  orderId: string,
  totalAmountCents: number
) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { userId: true, customerEmail: true, totalAmount: true },
  });
  if (!order?.userId) return; // Guest orders don't earn points

  // Get loyalty rules from settings
  let earnRate = DEFAULT_EARN_RATE;
  try {
    const rulesSetting = await prisma.setting.findUnique({
      where: { key: "loyalty_rules" },
    });
    if (rulesSetting) {
      const rules = rulesSetting.value as Record<string, unknown>;
      if (typeof rules.earnRate === "number") earnRate = rules.earnRate;
    }
  } catch {
    // Use default
  }

  const dollars = Math.floor(totalAmountCents / 100);
  const pointsToAward = Math.max(1, Math.floor(dollars * earnRate));

  // Upsert loyalty account
  const account = await prisma.loyaltyAccount.upsert({
    where: { userId: order.userId },
    create: {
      userId: order.userId,
      pointsBalance: pointsToAward,
      totalEarned: pointsToAward,
      tier: "bronze",
    },
    update: {
      pointsBalance: { increment: pointsToAward },
      totalEarned: { increment: pointsToAward },
    },
  });

  // Record transaction
  await prisma.loyaltyTransaction.create({
    data: {
      accountId: account.id,
      type: "earn",
      points: pointsToAward,
      description: `Order ${orderId.slice(0, 8)} — $${dollars} spent`,
      orderId,
    },
  });

  // Update tier based on total earned
  const newTier = computeTier(account.totalEarned + pointsToAward);
  if (newTier !== account.tier) {
    await prisma.loyaltyAccount.update({
      where: { id: account.id },
      data: { tier: newTier },
    });
  }
}

function computeTier(totalPoints: number): string {
  if (totalPoints >= 20000) return "platinum";
  if (totalPoints >= 5000) return "gold";
  if (totalPoints >= 1000) return "silver";
  return "bronze";
}
