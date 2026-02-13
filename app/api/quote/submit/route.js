import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email/resend";
import { buildQuoteReceivedHtml, buildQuoteNotifyHtml } from "@/lib/email/templates/quote-request";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "orders@lalunar.com";

function generateReference() {
  const ts = Date.now().toString(36).toUpperCase().slice(-4);
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `Q-${ts}${rand}`;
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, email, phone, company, productType, description, width, height, quantity, material, colorMode, neededBy, isRush, fileUrls } = body;

    if (!name || !email) {
      return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
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
