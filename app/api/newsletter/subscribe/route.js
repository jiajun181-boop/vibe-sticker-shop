import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createRateLimiter, getClientIp } from "@/lib/rate-limit";

const newsletterLimiter = createRateLimiter({ windowMs: 60_000, max: 5 });

export async function POST(req) {
  try {
    const ip = getClientIp(req);
    const { success } = newsletterLimiter.check(ip);
    if (!success) {
      return NextResponse.json({ error: "Too many attempts. Please try again later." }, { status: 429 });
    }

    const { email, source } = await req.json();

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const validSources = ["footer", "exit-popup", "checkout"];
    const safeSource = validSources.includes(source) ? source : "footer";

    // Upsert — don't error if already subscribed
    await prisma.newsletterSubscriber.upsert({
      where: { email: normalizedEmail },
      update: {}, // Already subscribed — no change
      create: { email: normalizedEmail, source: safeSource },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[newsletter/subscribe]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
