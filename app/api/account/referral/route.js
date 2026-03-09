import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";

/**
 * GET /api/account/referral — Get or generate user's invite code + referral stats.
 */
export async function GET(req) {
  try {
    const session = getSessionFromRequest(req);
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { id: true, inviteCode: true, referrals: { select: { id: true, createdAt: true } } },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Auto-generate invite code if not set
    let inviteCode = user.inviteCode;
    if (!inviteCode) {
      inviteCode = generateCode();
      await prisma.user.update({
        where: { id: user.id },
        data: { inviteCode },
      });
    }

    return NextResponse.json({
      inviteCode,
      referralCount: user.referrals.length,
      referralLink: `https://lunarprint.ca/?ref=${inviteCode}`,
    });
  } catch (err) {
    console.error("[account/referral] GET error:", err);
    return NextResponse.json({ error: "Failed to load referral info" }, { status: 500 });
  }
}

/** Generate a short, memorable invite code like "LUNAR-A7B3" */
function generateCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return `LUNAR-${code}`;
}
