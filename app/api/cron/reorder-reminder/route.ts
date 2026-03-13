import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email/resend";
import { formatCad } from "@/lib/product-helpers";
import { escapeHtml } from "@/lib/email/escape-html";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.lunarprint.ca";

// Configurable window: remind customers whose last completed order
// was between MIN_DAYS_AGO and MAX_DAYS_AGO days ago
const MIN_DAYS_AGO = 30;
const MAX_DAYS_AGO = 90;

// Don't send another reminder if one was sent in the last 30 days
const COOLDOWN_DAYS = 30;

// Process in batches to avoid timeouts
const BATCH_SIZE = 50;

export async function GET(req: NextRequest) {
  // ── Auth: verify cron secret ──────────────────────────────────
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    const minDate = new Date(now.getTime() - MAX_DAYS_AGO * 86_400_000); // 90 days ago
    const maxDate = new Date(now.getTime() - MIN_DAYS_AGO * 86_400_000); // 30 days ago
    const cooldownDate = new Date(
      now.getTime() - COOLDOWN_DAYS * 86_400_000
    ); // 30 days ago

    // ── Find eligible customers ─────────────────────────────────
    // Get distinct customer emails with at least one completed/shipped order
    // whose most recent such order falls within the reminder window.
    const eligibleCustomers = await prisma.$queryRaw`
      SELECT
        o."customerEmail",
        o."customerName",
        MAX(o."createdAt") AS "lastOrderDate",
        (
          SELECT o2.id FROM "Order" o2
          WHERE o2."customerEmail" = o."customerEmail"
            AND (o2.status = 'paid' OR o2."productionStatus" IN ('shipped', 'completed'))
          ORDER BY o2."createdAt" DESC
          LIMIT 1
        ) AS "lastOrderId"
      FROM "Order" o
      WHERE (o.status = 'paid' OR o."productionStatus" IN ('shipped', 'completed'))
      GROUP BY o."customerEmail", o."customerName"
      HAVING MAX(o."createdAt") BETWEEN ${minDate} AND ${maxDate}
      LIMIT ${BATCH_SIZE}
    ` as Array<{
      customerEmail: string;
      customerName: string | null;
      lastOrderDate: Date;
      lastOrderId: string;
    }>;

    if (eligibleCustomers.length === 0) {
      return NextResponse.json({ processed: 0, sent: 0, skipped: 0 });
    }

    // ── Filter out customers who received a recent reorder reminder ──
    const emails = eligibleCustomers.map((c) => c.customerEmail);
    const recentReminders = await prisma.emailLog.findMany({
      where: {
        to: { in: emails },
        template: "reorder-reminder",
        createdAt: { gte: cooldownDate },
      },
      select: { to: true },
    });
    const recentlyRemindedSet = new Set(recentReminders.map((r) => r.to));

    let sent = 0;
    let skipped = 0;

    for (const customer of eligibleCustomers) {
      // Skip if already reminded recently
      if (recentlyRemindedSet.has(customer.customerEmail)) {
        skipped++;
        continue;
      }

      // Fetch last order items for the email summary
      const lastOrderItems = await prisma.orderItem.findMany({
        where: { orderId: customer.lastOrderId },
        select: {
          productName: true,
          quantity: true,
          totalPrice: true,
        },
        take: 5, // limit to 5 items to keep email concise
      });

      const html = buildReorderReminderHtml({
        customerName: customer.customerName,
        customerEmail: customer.customerEmail,
        lastOrderDate: customer.lastOrderDate,
        items: lastOrderItems,
      });

      await sendEmail({
        to: customer.customerEmail,
        subject: "We miss you at Lunar Print! \u{1F319}",
        html,
        template: "reorder-reminder",
      });

      sent++;
    }

    return NextResponse.json({
      processed: eligibleCustomers.length,
      sent,
      skipped,
    });
  } catch (err) {
    console.error("[ReorderReminderCron] Error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// ── Email template ────────────────────────────────────────────────
function buildReorderReminderHtml({
  customerName,
  customerEmail,
  lastOrderDate,
  items,
}: {
  customerName: string | null;
  customerEmail: string;
  lastOrderDate: Date;
  items: Array<{ productName: string; quantity: number; totalPrice: number }>;
}): string {
  const greeting = customerName
    ? `Hi ${escapeHtml(customerName)},`
    : "Hi there,";

  const formattedDate = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(lastOrderDate));

  const itemRows = items
    .map(
      (item) => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;font-size:14px;">${escapeHtml(item.productName)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;font-size:14px;text-align:center;">${item.quantity}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;font-size:14px;text-align:right;">${formatCad(item.totalPrice)}</td>
      </tr>`
    )
    .join("");

  const shopUrl = `${SITE_URL}/shop`;
  const unsubscribeUrl = `${SITE_URL}/unsubscribe?email=${encodeURIComponent(customerEmail)}&type=reorder_reminder`;

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">

      <!-- Header -->
      <div style="background:#111;color:#fff;padding:24px 32px;">
        <h1 style="margin:0;font-size:20px;font-weight:600;letter-spacing:0.05em;">LA LUNAR PRINTING INC.</h1>
      </div>

      <!-- Body -->
      <div style="padding:32px;">
        <div style="text-align:center;margin-bottom:24px;">
          <div style="display:inline-block;width:48px;height:48px;background:#eef2ff;border-radius:50%;text-align:center;line-height:48px;font-size:24px;">
            \u{1F319}
          </div>
          <h2 style="margin:12px 0 4px;font-size:22px;color:#111;">We miss you!</h2>
        </div>

        <p style="font-size:15px;color:#333;line-height:1.6;margin-bottom:8px;">
          ${greeting}
        </p>

        <p style="font-size:14px;color:#555;line-height:1.6;margin-bottom:20px;">
          It's been a while since your last order on <strong>${formattedDate}</strong> and we wanted to check in.
          Whether you need a restock of your favourite products or want to try something new, we're here to help
          bring your ideas to life.
        </p>

        ${
          items.length > 0
            ? `
        <p style="font-size:13px;color:#888;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:8px;font-weight:600;">
          Your last order included:
        </p>
        <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
          <thead>
            <tr style="background:#f9fafb;">
              <th style="padding:8px 12px;text-align:left;font-size:12px;color:#666;text-transform:uppercase;">Item</th>
              <th style="padding:8px 12px;text-align:center;font-size:12px;color:#666;text-transform:uppercase;">Qty</th>
              <th style="padding:8px 12px;text-align:right;font-size:12px;color:#666;text-transform:uppercase;">Price</th>
            </tr>
          </thead>
          <tbody>${itemRows}</tbody>
        </table>
        `
            : ""
        }

        <p style="font-size:14px;color:#555;line-height:1.6;margin-bottom:24px;">
          Ready to reorder or explore what's new? Click below to browse our full catalogue of
          stickers, labels, business cards, banners, and more.
        </p>

        <div style="text-align:center;margin:24px 0;">
          <a href="${shopUrl}" style="display:inline-block;padding:14px 40px;background:#111;color:#fff;text-decoration:none;border-radius:8px;font-size:15px;font-weight:600;">
            Browse the Shop
          </a>
        </div>

        <p style="font-size:13px;color:#999;text-align:center;margin-top:16px;">
          Need help with a custom order? Just reply to this email and we'll get back to you.
        </p>
      </div>

      <!-- Footer -->
      <div style="padding:16px 32px;background:#f9fafb;text-align:center;">
        <p style="margin:0 0 8px;font-size:12px;color:#999;">
          La Lunar Printing Inc. &middot; 11 Progress Ave #21, Scarborough, ON M1P 4S7
        </p>
        <p style="margin:0;font-size:11px;color:#bbb;">
          You're receiving this because you've previously placed an order at lunarprint.ca.
          <a href="${unsubscribeUrl}" style="color:#999;text-decoration:underline;">Unsubscribe</a>
          from reorder reminders.
        </p>
      </div>

    </div>
  </div>
</body>
</html>`;
}
