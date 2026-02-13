import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { setSessionCookie, generateToken } from "@/lib/auth";
import { sendEmail } from "@/lib/email/resend";
import { buildVerifyEmailHtml } from "@/lib/email/templates/verify-email";
import { buildB2bPendingHtml } from "@/lib/email/templates/b2b-pending";
import { authLimiter, getClientIp } from "@/lib/rate-limit";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://vibestickers.com";

export async function POST(request) {
  try {
    const ip = getClientIp(request);
    const { success } = authLimiter.check(ip);
    if (!success) {
      return NextResponse.json({ error: "Too many signup attempts. Please try again later." }, { status: 429 });
    }

    const body = await request.json();
    const { name, email, password, accountType, companyName, companyRole } = body;

    // Validate required fields
    if (!name || typeof name !== "string" || name.trim().length < 1) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
    }
    if (!password || typeof password !== "string" || password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const type = accountType === "B2B" ? "B2B" : "B2C";

    // Check if email already exists
    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Generate email verification token (24h expiry)
    const emailVerifyToken = generateToken();
    const emailVerifyExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        name: name.trim(),
        password: hashedPassword,
        accountType: type,
        emailVerifyToken,
        emailVerifyExpires,
        companyName: type === "B2B" ? (companyName || "").trim() || null : null,
        companyRole: type === "B2B" ? (companyRole || "").trim() || null : null,
        b2bApproved: false,
      },
    });

    // Retroactively link existing orders by email
    await prisma.order.updateMany({
      where: { customerEmail: normalizedEmail, userId: null },
      data: { userId: user.id },
    });

    // Send verification email (non-blocking)
    const verifyUrl = `${SITE_URL}/verify-email?token=${emailVerifyToken}`;
    sendEmail({
      to: normalizedEmail,
      subject: "Verify your email — Vibe Sticker Shop",
      html: buildVerifyEmailHtml({ name: name.trim(), verifyUrl }),
      template: "verify-email",
    }).catch(() => {});

    // If B2B, notify admin (non-blocking)
    if (type === "B2B") {
      const adminEmail = process.env.CONTACT_NOTIFY_EMAIL;
      if (adminEmail) {
        sendEmail({
          to: adminEmail,
          subject: `New B2B Account Request — ${companyName || name}`,
          html: buildB2bPendingHtml({ name: name.trim(), companyName: companyName || "", email: normalizedEmail }),
          template: "b2b-pending",
        }).catch(() => {});
      }
    }

    // Set session cookie and return user
    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        accountType: user.accountType,
        emailVerified: user.emailVerified,
        b2bApproved: user.b2bApproved,
        companyName: user.companyName,
      },
    });

    return setSessionCookie(response, user.id, user.email);
  } catch (err) {
    console.error("[Auth] Signup error:", err);
    return NextResponse.json({ error: "Failed to create account" }, { status: 500 });
  }
}
