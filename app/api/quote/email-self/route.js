import { NextResponse } from "next/server";
import { createRateLimiter, getClientIp } from "@/lib/rate-limit";
import { sendEmail } from "@/lib/email/resend";
import { buildSelfQuoteHtml } from "@/lib/email/templates/email-self-quote";

// 3 per email per hour
const emailLimiter = createRateLimiter({ windowMs: 60 * 60 * 1000, max: 3 });
// 10 per IP per hour
const ipLimiter = createRateLimiter({ windowMs: 60 * 60 * 1000, max: 10 });

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function sanitize(str, maxLen = 500) {
  if (typeof str !== "string") return "";
  return str.slice(0, maxLen).replace(/[<>&"']/g, "");
}

export async function POST(req) {
  try {
    const ip = getClientIp(req);

    // IP rate limit
    const ipCheck = ipLimiter.check(ip);
    if (!ipCheck.success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { email, productName, summaryLines, unitCents, subtotalCents, quantity, pageUrl } = body;

    // Validate email
    if (!email || typeof email !== "string" || !EMAIL_RE.test(email.trim())) {
      return NextResponse.json({ error: "Please provide a valid email address." }, { status: 400 });
    }
    const cleanEmail = email.trim().toLowerCase().slice(0, 254);

    // Email rate limit
    const emailCheck = emailLimiter.check(cleanEmail);
    if (!emailCheck.success) {
      return NextResponse.json(
        { error: "Quote limit reached for this email. Please try again later." },
        { status: 429 }
      );
    }

    // Validate required fields
    if (!productName || typeof productName !== "string") {
      return NextResponse.json({ error: "Product name is required." }, { status: 400 });
    }
    if (!Array.isArray(summaryLines) || summaryLines.length === 0) {
      return NextResponse.json({ error: "Summary lines are required." }, { status: 400 });
    }
    if (typeof unitCents !== "number" || unitCents <= 0) {
      return NextResponse.json({ error: "Valid pricing is required." }, { status: 400 });
    }
    if (typeof subtotalCents !== "number" || subtotalCents <= 0) {
      return NextResponse.json({ error: "Valid subtotal is required." }, { status: 400 });
    }
    if (typeof quantity !== "number" || quantity <= 0) {
      return NextResponse.json({ error: "Valid quantity is required." }, { status: 400 });
    }

    // Sanitize inputs
    const safeProductName = sanitize(productName, 200);
    const safeSummaryLines = summaryLines.slice(0, 20).map((line) => ({
      label: sanitize(line?.label, 100),
      value: sanitize(line?.value, 200),
    }));
    const safePageUrl = typeof pageUrl === "string" ? pageUrl.slice(0, 2000) : "https://lunarprint.ca";

    // Build email HTML
    const html = buildSelfQuoteHtml({
      productName: safeProductName,
      summaryLines: safeSummaryLines,
      unitCents,
      subtotalCents,
      quantity,
      pageUrl: safePageUrl,
    });

    // Fire-and-forget email send (don't block the response)
    sendEmail({
      to: cleanEmail,
      subject: `Your Quote — ${safeProductName} | La Lunar Printing`,
      html,
      template: "self-quote",
    }).catch(() => {});

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[email-self-quote] Error:", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
