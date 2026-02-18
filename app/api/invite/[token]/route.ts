import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { setSessionCookie } from "@/lib/auth";
import { sendEmail } from "@/lib/email/resend";
import { buildB2bApprovedHtml } from "@/lib/email/templates/b2b-approved";

/** GET — validate an invite token */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const invite = await prisma.partnerInvite.findUnique({ where: { token } });

  if (!invite) {
    return NextResponse.json({ valid: false, error: "Invite not found" }, { status: 404 });
  }
  if (invite.acceptedAt) {
    return NextResponse.json({ valid: false, error: "This invite has already been used" }, { status: 410 });
  }
  if (invite.expiresAt < new Date()) {
    return NextResponse.json({ valid: false, error: "This invite has expired" }, { status: 410 });
  }

  return NextResponse.json({
    valid: true,
    invite: {
      email: invite.email,
      companyName: invite.companyName,
      tier: invite.tier,
      discount: invite.discount,
      expiresAt: invite.expiresAt,
    },
  });
}

/** POST — accept invite and create B2B account */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const body = await request.json();
  const { name, password, companyName, companyRole, phone } = body;

  // Validate token
  const invite = await prisma.partnerInvite.findUnique({ where: { token } });
  if (!invite) {
    return NextResponse.json({ error: "Invalid invite" }, { status: 404 });
  }
  if (invite.acceptedAt) {
    return NextResponse.json({ error: "This invite has already been used" }, { status: 410 });
  }
  if (invite.expiresAt < new Date()) {
    return NextResponse.json({ error: "This invite has expired" }, { status: 410 });
  }

  // Validate inputs
  if (!name || typeof name !== "string" || name.trim().length < 1) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }
  if (!password || typeof password !== "string" || password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }

  const email = invite.email;

  // Check if email already registered
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    // If they already have an account, upgrade it to B2B partner
    if (existing.accountType === "B2B" && existing.b2bApproved) {
      return NextResponse.json({ error: "This email already has an approved B2B account" }, { status: 409 });
    }

    // Upgrade existing account
    await prisma.user.update({
      where: { id: existing.id },
      data: {
        accountType: "B2B",
        b2bApproved: true,
        b2bApprovedAt: new Date(),
        companyName: companyName?.trim() || invite.companyName || existing.companyName,
        companyRole: companyRole?.trim() || existing.companyRole,
        partnerTier: invite.tier,
        partnerDiscount: invite.discount,
      },
    });

    // Mark invite as accepted
    await prisma.partnerInvite.update({
      where: { id: invite.id },
      data: { acceptedAt: new Date(), acceptedUserId: existing.id },
    });

    await prisma.activityLog.create({
      data: {
        action: "partner_invite_accepted",
        entity: "user",
        entityId: existing.id,
        details: { email, tier: invite.tier, discount: invite.discount, upgraded: true },
      },
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: existing.id,
        email: existing.email,
        name: existing.name,
        accountType: "B2B",
        b2bApproved: true,
        partnerTier: invite.tier,
      },
    });

    return setSessionCookie(response, existing.id, existing.email);
  }

  // Create new user
  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      email,
      name: name.trim(),
      phone: phone?.trim() || null,
      password: hashedPassword,
      accountType: "B2B",
      b2bApproved: true,
      b2bApprovedAt: new Date(),
      emailVerified: true, // Invited = trusted
      companyName: companyName?.trim() || invite.companyName,
      companyRole: companyRole?.trim() || null,
      partnerTier: invite.tier,
      partnerDiscount: invite.discount,
    },
  });

  // Link existing orders by email
  await prisma.order.updateMany({
    where: { customerEmail: email, userId: null },
    data: { userId: user.id },
  });

  // Mark invite accepted
  await prisma.partnerInvite.update({
    where: { id: invite.id },
    data: { acceptedAt: new Date(), acceptedUserId: user.id },
  });

  // Log activity
  await prisma.activityLog.create({
    data: {
      action: "partner_invite_accepted",
      entity: "user",
      entityId: user.id,
      details: { email, tier: invite.tier, discount: invite.discount },
    },
  });

  // Send welcome email
  sendEmail({
    to: email,
    subject: "Welcome to our partner program — La Lunar Printing",
    html: buildB2bApprovedHtml({ name: name.trim(), companyName: companyName || invite.companyName || "" }),
    template: "partner-welcome",
  }).catch(() => {});

  const response = NextResponse.json({
    success: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      accountType: "B2B",
      b2bApproved: true,
      partnerTier: invite.tier,
    },
  });

  return setSessionCookie(response, user.id, user.email);
}
