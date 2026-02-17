import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin-auth";
import { sendEmail } from "@/lib/email/resend";
import { buildPartnerInviteHtml } from "@/lib/email/templates/partner-invite";
import crypto from "crypto";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://lunarprint.ca";

/** GET — list all invites */
export async function GET(request: NextRequest) {
  const auth = await requirePermission(request, "b2b", "view");
  if (!auth.authenticated) return auth.response;

  const invites = await prisma.partnerInvite.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json({ invites });
}

/** POST — send a new partner invite */
export async function POST(request: NextRequest) {
  const auth = await requirePermission(request, "b2b", "edit");
  if (!auth.authenticated) return auth.response;

  const body = await request.json();
  const { email, companyName, tier, discount, note } = body;

  if (!email || typeof email !== "string" || !email.includes("@")) {
    return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const discountNum = Math.min(50, Math.max(0, parseInt(discount) || 0));

  // Check if an active invite already exists for this email
  const existing = await prisma.partnerInvite.findFirst({
    where: {
      email: normalizedEmail,
      acceptedAt: null,
      expiresAt: { gt: new Date() },
    },
  });
  if (existing) {
    return NextResponse.json({ error: "An active invite already exists for this email" }, { status: 409 });
  }

  // Check if user already has a B2B account
  const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existingUser?.accountType === "B2B" && existingUser?.b2bApproved) {
    return NextResponse.json({ error: "This email already has an approved B2B account" }, { status: 409 });
  }

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // 14 days

  const invite = await prisma.partnerInvite.create({
    data: {
      email: normalizedEmail,
      companyName: companyName?.trim() || null,
      token,
      tier: tier || "bronze",
      discount: discountNum,
      note: note?.trim() || null,
      expiresAt,
    },
  });

  // Send invite email
  const inviteUrl = `${SITE_URL}/invite/${token}`;
  sendEmail({
    to: normalizedEmail,
    subject: "You're invited to partner with La Lunar Printing",
    html: buildPartnerInviteHtml({
      companyName: companyName?.trim() || "",
      inviteUrl,
      tier: tier || "bronze",
      discount: discountNum,
    }),
    template: "partner-invite",
  }).catch(() => {});

  await prisma.activityLog.create({
    data: {
      action: "partner_invite_sent",
      entity: "partner_invite",
      entityId: invite.id,
      details: { email: normalizedEmail, companyName, tier, discount: discountNum },
    },
  });

  return NextResponse.json({ success: true, invite: { id: invite.id, email: invite.email, token, expiresAt } });
}

/** DELETE — cancel/revoke an invite */
export async function DELETE(request: NextRequest) {
  const auth = await requirePermission(request, "b2b", "edit");
  if (!auth.authenticated) return auth.response;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  await prisma.partnerInvite.delete({ where: { id } }).catch(() => {});

  return NextResponse.json({ success: true });
}
