import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email/resend";
import { logActivity } from "@/lib/activity-log";
import { supportLimiter, getClientIp } from "@/lib/rate-limit";

const VALID_ISSUE_TYPES = ["quality_defect", "wrong_item", "damaged_shipping", "other"];
const VALID_RESOLUTIONS = ["reprint", "refund", "partial_refund"];

const ISSUE_LABELS: Record<string, string> = {
  quality_defect: "Quality Defect",
  wrong_item: "Wrong Item Received",
  damaged_shipping: "Damaged in Shipping",
  other: "Other",
};

const RESOLUTION_LABELS: Record<string, string> = {
  reprint: "Reprint",
  refund: "Full Refund",
  partial_refund: "Partial Refund",
};

/**
 * POST /api/returns/request — create a return/reprint request (guest, no login needed)
 */
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const { success } = supportLimiter.check(ip);
  if (!success) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  let body: {
    orderId?: string;
    email?: string;
    issueType?: string;
    description?: string;
    photoUrl?: string | null;
    resolution?: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { orderId, email, issueType, description, photoUrl, resolution } = body;

  // --- Validation ---
  if (!orderId?.trim()) {
    return NextResponse.json({ error: "Order ID is required." }, { status: 400 });
  }
  if (!email?.trim()) {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }
  if (!issueType || !VALID_ISSUE_TYPES.includes(issueType)) {
    return NextResponse.json({ error: "Please select a valid issue type." }, { status: 400 });
  }
  if (!description?.trim() || description.trim().length < 10) {
    return NextResponse.json(
      { error: "Please provide a description (at least 10 characters)." },
      { status: 400 }
    );
  }
  if (!resolution || !VALID_RESOLUTIONS.includes(resolution)) {
    return NextResponse.json({ error: "Please select a desired resolution." }, { status: 400 });
  }

  // --- Verify order belongs to customer ---
  try {
    const order = await prisma.order.findFirst({
      where: {
        id: orderId.trim(),
        customerEmail: { equals: email.trim(), mode: "insensitive" },
      },
      select: { id: true, customerEmail: true, customerName: true, status: true },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Order not found. Please check your Order ID and email address." },
        { status: 404 }
      );
    }

    // --- Build the message body ---
    const issueLabel = ISSUE_LABELS[issueType] || issueType;
    const resolutionLabel = RESOLUTION_LABELS[resolution] || resolution;

    const messageBody = [
      `**Issue Type:** ${issueLabel}`,
      `**Desired Resolution:** ${resolutionLabel}`,
      `**Order ID:** ${order.id}`,
      `**Order Status:** ${order.status}`,
      "",
      `**Description:**`,
      description.trim(),
      photoUrl ? `\n**Photo:** ${photoUrl}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    // --- Create SupportTicket + initial message ---
    const ticket = await prisma.supportTicket.create({
      data: {
        email: order.customerEmail,
        subject: `[Return Request] Order #${order.id.slice(0, 8)}`,
        orderId: order.id,
        status: "open",
        priority: "normal",
        messages: {
          create: {
            authorType: "customer",
            authorName: order.customerName || order.customerEmail,
            body: messageBody,
            attachments: photoUrl ? [photoUrl] : [],
          },
        },
      },
      include: { messages: true },
    });

    // --- Send notification email to orders@lunarprint.ca ---
    try {
      const adminHtml = `<!DOCTYPE html>
<html><head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#f7f7f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
    <div style="background:#111;padding:24px 32px;">
      <h1 style="margin:0;color:#fff;font-size:18px;font-weight:700;">New Return Request</h1>
    </div>
    <div style="padding:32px;">
      <div style="background:#f7f7f8;border-radius:8px;padding:16px;margin-bottom:16px;">
        <p style="margin:0 0 4px;font-size:12px;color:#999;text-transform:uppercase;">Ticket</p>
        <p style="margin:0;font-size:16px;font-weight:600;color:#111;">#${ticket.id.slice(0, 8)}</p>
      </div>
      <table style="width:100%;border-collapse:collapse;font-size:14px;color:#333;">
        <tr><td style="padding:6px 0;color:#999;width:120px;">Order</td><td style="padding:6px 0;font-weight:600;">${order.id.slice(0, 8)}</td></tr>
        <tr><td style="padding:6px 0;color:#999;">Customer</td><td style="padding:6px 0;">${order.customerName || "N/A"} (${order.customerEmail})</td></tr>
        <tr><td style="padding:6px 0;color:#999;">Issue</td><td style="padding:6px 0;">${issueLabel}</td></tr>
        <tr><td style="padding:6px 0;color:#999;">Resolution</td><td style="padding:6px 0;">${resolutionLabel}</td></tr>
      </table>
      <div style="margin-top:16px;padding:12px;background:#fff8f0;border-radius:8px;border:1px solid #fde0c0;">
        <p style="margin:0 0 4px;font-size:12px;color:#999;text-transform:uppercase;">Description</p>
        <p style="margin:0;font-size:14px;color:#333;white-space:pre-wrap;">${description.trim()}</p>
      </div>
      ${photoUrl ? `<p style="margin-top:12px;font-size:13px;"><a href="${photoUrl}" style="color:#2563eb;">View Photo</a></p>` : ""}
    </div>
  </div>
</body></html>`;

      await sendEmail({
        to: "orders@lunarprint.ca",
        subject: `[Return Request] Order #${order.id.slice(0, 8)} — ${issueLabel}`,
        html: adminHtml,
        template: "return-request-admin",
      });
    } catch (emailErr) {
      console.error("[ReturnRequest] Admin notification email failed:", emailErr);
    }

    // --- Send confirmation email to customer ---
    try {
      const customerHtml = `<!DOCTYPE html>
<html><head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#f7f7f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
    <div style="background:#111;padding:24px 32px;">
      <h1 style="margin:0;color:#fff;font-size:18px;font-weight:700;">La Lunar Printing</h1>
    </div>
    <div style="padding:32px;">
      <h2 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#111;">Return Request Received</h2>
      <p style="margin:0 0 20px;color:#666;font-size:14px;line-height:1.5;">
        We've received your return/reprint request and will review it within 1-2 business days.
      </p>
      <div style="background:#f7f7f8;border-radius:8px;padding:16px;margin-bottom:20px;">
        <p style="margin:0 0 4px;font-size:12px;color:#999;text-transform:uppercase;">Reference Number</p>
        <p style="margin:0;font-size:16px;font-weight:600;color:#111;">#${ticket.id.slice(0, 8)}</p>
        <p style="margin:8px 0 0;font-size:14px;color:#333;">${issueLabel} &mdash; ${resolutionLabel}</p>
      </div>
      <p style="margin:0;font-size:13px;color:#666;line-height:1.5;">
        If you need to add more details or photos, reply to this email or contact us at
        <a href="mailto:orders@lunarprint.ca" style="color:#111;font-weight:600;">orders@lunarprint.ca</a>.
      </p>
    </div>
    <div style="padding:16px 32px;background:#f7f7f8;text-align:center;">
      <p style="margin:0;font-size:12px;color:#999;">La Lunar Printing Inc. &bull; Toronto, ON</p>
    </div>
  </div>
</body></html>`;

      await sendEmail({
        to: order.customerEmail,
        subject: `Return Request #${ticket.id.slice(0, 8)} — We've received your request`,
        html: customerHtml,
        template: "return-request-confirmation",
      });
    } catch (emailErr) {
      console.error("[ReturnRequest] Customer confirmation email failed:", emailErr);
    }

    // --- Activity log ---
    logActivity({
      action: "return_request_created",
      entity: "SupportTicket",
      entityId: ticket.id,
      actor: "customer",
      details: {
        orderId: order.id,
        email: order.customerEmail,
        issueType,
        resolution,
        photoUrl: photoUrl || null,
      },
    });

    return NextResponse.json({ success: true, ticketId: ticket.id }, { status: 201 });
  } catch (err) {
    console.error("[ReturnRequest] POST error:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again or contact orders@lunarprint.ca." },
      { status: 500 }
    );
  }
}
