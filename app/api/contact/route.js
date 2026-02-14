import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email/resend";
import { buildContactReceivedHtml, buildContactNotifyHtml } from "@/lib/email/templates/contact-received";
import { contactLimiter, getClientIp } from "@/lib/rate-limit";

const NOTIFY_EMAIL = process.env.CONTACT_NOTIFY_EMAIL || "support@lunarprint.ca";

export async function POST(req) {
  try {
    const ip = getClientIp(req);
    const { success } = contactLimiter.check(ip);
    if (!success) {
      return NextResponse.json({ error: "Too many messages sent. Please try again later." }, { status: 429 });
    }

    const body = await req.json();
    const { name, email, message } = body;

    if (!name || !email || !message) {
      return NextResponse.json({ error: "Required fields missing" }, { status: 400 });
    }

    const phone = body.phone || "";
    const company = body.company || "";

    // Send confirmation to customer
    sendEmail({
      to: email,
      subject: "We received your message — Vibe Sticker Shop",
      html: buildContactReceivedHtml({ name, message }),
      template: "contact-received",
    }).catch((err) => console.error("[Contact] Customer email failed:", err));

    // Send notification to shop
    sendEmail({
      to: NOTIFY_EMAIL,
      subject: `New Contact: ${name} — ${company || email}`,
      html: buildContactNotifyHtml({ name, email, phone, company, message }),
      template: "contact-notify",
    }).catch((err) => console.error("[Contact] Notify email failed:", err));

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Contact Form Error]", err);
    return NextResponse.json({ error: "Failed to process" }, { status: 500 });
  }
}
