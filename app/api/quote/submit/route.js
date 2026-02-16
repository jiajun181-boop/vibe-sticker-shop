import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email/resend";
import { buildQuoteReceivedHtml, buildQuoteNotifyHtml } from "@/lib/email/templates/quote-request";
import { createRateLimiter, getClientIp } from "@/lib/rate-limit";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "orders@lalunar.com";
const quoteLimiter = createRateLimiter({ windowMs: 10 * 60 * 1000, max: 5 });

function generateReference() {
  const ts = Date.now().toString(36).toUpperCase().slice(-4);
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `Q-${ts}${rand}`;
}

const MAX_FIELD = 500;
const MAX_DESC = 5000;

export async function POST(request) {
  try {
    const ip = getClientIp(request);
    const { success: allowed } = quoteLimiter.check(ip);
    if (!allowed) {
      return NextResponse.json({ error: "Too many submissions. Please try again later." }, { status: 429 });
    }

    const body = await request.json();
    const { name, email, phone, company, productType, description, width, height, quantity, material, colorMode, neededBy, isRush, fileUrls } = body;

    if (!name || !email) {
      return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
    }

    if (name.length > MAX_FIELD || email.length > MAX_FIELD || (phone && phone.length > MAX_FIELD) || (company && company.length > MAX_FIELD)) {
      return NextResponse.json({ error: "Input too long" }, { status: 400 });
    }
    if (description && description.length > MAX_DESC) {
      return NextResponse.json({ error: "Description too long" }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }

    const reference = generateReference();

    // Send confirmation to customer
    await sendEmail({
      to: email,
      subject: `Quote Request Received — ${reference}`,
      html: buildQuoteReceivedHtml({ name, reference }),
      template: "quote-received",
    });

    // Send notification to admin
    await sendEmail({
      to: ADMIN_EMAIL,
      subject: `${isRush ? "⚡ RUSH " : ""}New Quote — ${reference} — ${name}`,
      html: buildQuoteNotifyHtml({
        name, email, phone, company, productType, description,
        width, height, quantity, material, colorMode, neededBy,
        isRush, fileUrls, reference,
      }),
      template: "quote-notify",
    });

    return NextResponse.json({ success: true, reference });
  } catch (err) {
    console.error("[Quote API] Error:", err);
    return NextResponse.json({ error: "Failed to submit quote request" }, { status: 500 });
  }
}
