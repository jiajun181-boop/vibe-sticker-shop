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
  const auth = await requirePermission(request, "customers", "view");
  if (!auth.authenticated) return auth.response;

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));
  const sort = searchParams.get("sort") || "pointsBalance";
  const order = searchParams.get("order") || "desc";
  const search = searchParams.get("search") || "";
  const tierFilter = searchParams.get("tier") || "";
  const offset = (page - 1) * limit;

  try {
    // Build where clause
    const where: Record<string, unknown> = {};
    if (tierFilter) {
      where.tier = tierFilter;
    }
    if (search) {
      where.userId = {
        in: (
          await prisma.user.findMany({
            where: {
              OR: [
                { email: { contains: search, mode: "insensitive" } },
                { name: { contains: search, mode: "insensitive" } },
              ],
            },
            select: { id: true },
            take: 200,
          })
        ).map((u) => u.id),
      };
    }

    // Build orderBy
    const validSorts = ["pointsBalance", "totalEarned", "tier", "createdAt", "updatedAt"];
    const sortField = validSorts.includes(sort) ? sort : "pointsBalance";
    const orderBy = { [sortField]: order === "asc" ? "asc" : "desc" };

    const [accounts, total] = await Promise.all([
      prisma.loyaltyAccount.findMany({
        where,
        orderBy,
        skip: offset,
        take: limit,
      }),
      prisma.loyaltyAccount.count({ where }),
    ]);

    // Get user info for all accounts
    const userIds = accounts.map((a) => a.userId);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, email: true, name: true },
    });
    const userMap = new Map(users.map((u) => [u.id, u]));

    const enriched = accounts.map((account) => {
      const user = userMap.get(account.userId) as { id: string; email: string; name: string | null } | undefined;
      return {
        id: account.id,
        userId: account.userId,
        email: user?.email || "unknown",
        name: user?.name || null,
        pointsBalance: account.pointsBalance,
        totalEarned: account.totalEarned,
        totalRedeemed: account.totalRedeemed,
        tier: account.tier,
        createdAt: account.createdAt,
        updatedAt: account.updatedAt,
      };
    });

    return NextResponse.json({
      accounts: enriched,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("[admin/loyalty] GET error:", err);
    return NextResponse.json(
      { error: "Failed to fetch loyalty accounts" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await requirePermission(request, "customers", "edit");
  if (!auth.authenticated) return auth.response;

  try {
    const body = await request.json();
    const { points, type, description } = body;
    let { userId } = body;
    const { email } = body;

    // Accept email as alternative to userId
    if (!userId && email) {
      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase().trim() },
        select: { id: true },
      });
      if (!user) {
        return NextResponse.json({ error: "User not found with that email" }, { status: 404 });
      }
      userId = user.id;
    }

    if (!userId || typeof userId !== "string") {
      return NextResponse.json({ error: "userId or email is required" }, { status: 400 });
    }
    if (!points || typeof points !== "number" || !Number.isInteger(points)) {
      return NextResponse.json(
        { error: "points must be a non-zero integer" },
        { status: 400 }
      );
    }
    if (!type || !["bonus", "adjust"].includes(type)) {
      return NextResponse.json(
        { error: "type must be 'bonus' or 'adjust'" },
        { status: 400 }
      );
    }
    if (!description || typeof description !== "string" || description.trim().length === 0) {
      return NextResponse.json(
        { error: "description is required" },
        { status: 400 }
      );
    }

    // Load rules for tier recomputation
    const rulesSetting = await prisma.setting.findUnique({
      where: { key: "loyalty_rules" },
    });
    const rules = rulesSetting?.value
      ? (rulesSetting.value as typeof DEFAULT_RULES)
      : DEFAULT_RULES;

    // Find or create loyalty account
    let account = await prisma.loyaltyAccount.findUnique({
      where: { userId },
    });

    if (!account) {
      account = await prisma.loyaltyAccount.create({
        data: {
          userId,
          pointsBalance: 0,
          totalEarned: 0,
          totalRedeemed: 0,
          tier: "bronze",
        },
      });
    }

    // Validate balance won't go negative
    const newBalance = account.pointsBalance + points;
    if (newBalance < 0) {
      return NextResponse.json(
        {
          error: `Insufficient balance. Current: ${account.pointsBalance}, adjustment: ${points}`,
        },
        { status: 400 }
      );
    }

    // Update account and create transaction atomically
    const newTotalEarned =
      points > 0 ? account.totalEarned + points : account.totalEarned;
    const newTotalRedeemed =
      points < 0
        ? account.totalRedeemed + Math.abs(points)
        : account.totalRedeemed;
    const newTier = computeTier(
      newTotalEarned,
      rules.tiers as Record<string, number>
    );

    const [updatedAccount, transaction] = await prisma.$transaction([
      prisma.loyaltyAccount.update({
        where: { id: account.id },
        data: {
          pointsBalance: newBalance,
          totalEarned: newTotalEarned,
          totalRedeemed: newTotalRedeemed,
          tier: newTier,
        },
      }),
      prisma.loyaltyTransaction.create({
        data: {
          accountId: account.id,
          type,
          points,
          description: description.trim(),
        },
      }),
    ]);

    await logActivity({
      action: "loyalty_adjust",
      entity: "loyalty_account",
      entityId: account.id,
      actor: auth.user?.email || "admin",
      details: {
        userId,
        type,
        points,
        description: description.trim(),
        newBalance,
        newTier,
      },
    });

    return NextResponse.json({
      success: true,
      account: {
        id: updatedAccount.id,
        pointsBalance: updatedAccount.pointsBalance,
        totalEarned: updatedAccount.totalEarned,
        totalRedeemed: updatedAccount.totalRedeemed,
        tier: updatedAccount.tier,
      },
      transaction: {
        id: transaction.id,
        type: transaction.type,
        points: transaction.points,
        description: transaction.description,
        createdAt: transaction.createdAt,
      },
    });
  } catch (err) {
    console.error("[admin/loyalty] POST error:", err);
    return NextResponse.json(
      { error: "Failed to adjust loyalty points" },
      { status: 500 }
    );
  }
}
