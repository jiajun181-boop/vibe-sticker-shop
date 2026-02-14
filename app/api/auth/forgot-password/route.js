import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateToken, hashToken } from "@/lib/auth";
import { sendEmail } from "@/lib/email/resend";
import { buildPasswordResetHtml } from "@/lib/email/templates/password-reset";
import { forgotPasswordLimiter, getClientIp } from "@/lib/rate-limit";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://lunarprint.ca";

export async function POST(request) {
  try {
    const ip = getClientIp(request);
    const { success } = forgotPasswordLimiter.check(ip);
    if (!success) {
      return NextResponse.json({ success: true }); // Silent rate limit to prevent enumeration
    }

    const { email } = await request.json();

    // Always return success to prevent email enumeration
    if (!email || typeof email !== "string") {
      return NextResponse.json({ success: true });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    if (user && user.password) {
      const token = generateToken();
      const tokenHash = hashToken(token);
      const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await prisma.user.update({
        where: { id: user.id },
        data: { passwordResetToken: tokenHash, passwordResetExpires: expires },
      });

      const resetUrl = `${SITE_URL}/reset-password?token=${token}`;
      sendEmail({
        to: normalizedEmail,
        subject: "Reset your password — Vibe Sticker Shop",
        html: buildPasswordResetHtml({ name: user.name || "there", resetUrl }),
        template: "password-reset",
      }).catch(() => {});
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Auth] Forgot password error:", err);
    return NextResponse.json({ success: true });
  }
}
