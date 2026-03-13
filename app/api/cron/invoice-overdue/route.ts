import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email/resend";
import { logActivity } from "@/lib/activity-log";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "orders@lalunar.com";
const GRACE_DAYS = 7; // payment terms + 7 days before marking overdue
const REMINDER_DAYS_BEFORE = 3; // send reminder 3 days before due date

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    let remindersCount = 0;

    // Phase 1: Send payment reminders for invoices due in 3 days (still "sent" status)
    const reminderCutoff = new Date(now.getTime() + REMINDER_DAYS_BEFORE * 24 * 60 * 60 * 1000);
    const dueSoonInvoices = await prisma.invoice.findMany({
      where: {
        status: "sent",
        dueAt: { gt: now, lte: reminderCutoff },
        reminderSentAt: null, // only send one reminder per invoice
      },
      take: 50,
    });

    for (const inv of dueSoonInvoices) {
      try {
        const amount = `$${(inv.totalCents / 100).toFixed(2)}`;
        const dueDate = inv.dueAt ? inv.dueAt.toLocaleDateString("en-CA", { month: "long", day: "numeric", year: "numeric" }) : "soon";
        await sendEmail({
          to: inv.customerEmail,
          subject: `Payment Reminder — Invoice ${inv.invoiceNumber} due ${dueDate}`,
          html: `
            <div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto">
              <h2 style="color:#111">Payment Reminder</h2>
              <p>Hi ${inv.customerName || "there"},</p>
              <p>This is a friendly reminder that your invoice <strong>${inv.invoiceNumber}</strong> for <strong>${amount} CAD</strong> is due on <strong>${dueDate}</strong>.</p>
              <p>If you've already sent payment, please disregard this message.</p>
              <div style="margin:24px 0;padding:16px;background:#f5f5f5;border-radius:8px">
                <p style="margin:0;font-size:14px"><strong>Invoice:</strong> ${inv.invoiceNumber}</p>
                <p style="margin:4px 0 0;font-size:14px"><strong>Amount:</strong> ${amount} CAD</p>
                <p style="margin:4px 0 0;font-size:14px"><strong>Due:</strong> ${dueDate}</p>
              </div>
              <p>For questions about this invoice, please contact us at <a href="mailto:info@lunarprint.ca">info@lunarprint.ca</a> or call <strong>(647) 539-5025</strong>.</p>
              <p style="color:#666;font-size:13px">Thank you for your business!<br>La Lunar Printing</p>
            </div>
          `,
          template: "invoice-reminder",
        });
        await prisma.invoice.update({
          where: { id: inv.id },
          data: { reminderSentAt: now },
        });
        remindersCount++;
      } catch (reminderErr) {
        console.error(`[InvoiceOverdueCron] Failed to send reminder for ${inv.invoiceNumber}:`, reminderErr);
      }
    }

    // Phase 2: Mark overdue invoices (past due date + grace period)
    const overdueInvoices = await prisma.invoice.findMany({
      where: {
        status: "sent",
        dueAt: { lt: new Date(now.getTime() - GRACE_DAYS * 24 * 60 * 60 * 1000) },
      },
      take: 100,
    });

    if (overdueInvoices.length === 0 && remindersCount === 0) {
      return NextResponse.json({ processed: 0, marked: 0, reminders: 0 });
    }

    if (overdueInvoices.length > 0) {
      // Mark them as overdue
      const ids = overdueInvoices.map((inv) => inv.id);
      await prisma.invoice.updateMany({
        where: { id: { in: ids } },
        data: { status: "overdue" },
      });

      // Log each one + send overdue notice to customer
      for (const inv of overdueInvoices) {
        logActivity({
          action: "invoice_overdue",
          entity: "invoice",
          entityId: inv.id,
          details: {
            invoiceNumber: inv.invoiceNumber,
            customerEmail: inv.customerEmail,
            dueAt: inv.dueAt?.toISOString(),
            totalCents: inv.totalCents,
          },
        }).catch(() => {});

        // Send overdue notice to customer
        try {
          const amount = `$${(inv.totalCents / 100).toFixed(2)}`;
          await sendEmail({
            to: inv.customerEmail,
            subject: `Overdue Notice — Invoice ${inv.invoiceNumber}`,
            html: `
              <div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto">
                <h2 style="color:#b91c1c">Invoice Overdue</h2>
                <p>Hi ${inv.customerName || "there"},</p>
                <p>Your invoice <strong>${inv.invoiceNumber}</strong> for <strong>${amount} CAD</strong> is now past due. Please arrange payment at your earliest convenience to avoid any disruption to your order.</p>
                <div style="margin:24px 0;padding:16px;background:#fef2f2;border:1px solid #fecaca;border-radius:8px">
                  <p style="margin:0;font-size:14px"><strong>Invoice:</strong> ${inv.invoiceNumber}</p>
                  <p style="margin:4px 0 0;font-size:14px"><strong>Amount:</strong> ${amount} CAD</p>
                  <p style="margin:4px 0 0;font-size:14px"><strong>Due:</strong> ${inv.dueAt ? inv.dueAt.toLocaleDateString("en-CA") : "N/A"}</p>
                  <p style="margin:4px 0 0;font-size:14px;color:#b91c1c"><strong>Status: Overdue</strong></p>
                </div>
                <p>If you've already sent payment, please disregard this message or reply with confirmation.</p>
                <p>Contact us at <a href="mailto:info@lunarprint.ca">info@lunarprint.ca</a> or call <strong>(647) 539-5025</strong>.</p>
                <p style="color:#666;font-size:13px">Thank you,<br>La Lunar Printing</p>
              </div>
            `,
            template: "invoice-overdue-notice",
          });
        } catch {
          // Customer notification is best-effort
        }
      }

      // Send a single summary email to Jay
      const totalOwed = overdueInvoices.reduce((sum, inv) => sum + inv.totalCents, 0);
      const rows = overdueInvoices
        .map(
          (inv) =>
            `<tr><td style="padding:4px 8px;border:1px solid #ddd">${inv.invoiceNumber}</td>` +
            `<td style="padding:4px 8px;border:1px solid #ddd">${inv.customerName || inv.customerEmail}</td>` +
            `<td style="padding:4px 8px;border:1px solid #ddd">$${(inv.totalCents / 100).toFixed(2)}</td>` +
            `<td style="padding:4px 8px;border:1px solid #ddd">${inv.dueAt ? inv.dueAt.toLocaleDateString("en-CA") : "N/A"}</td></tr>`
        )
        .join("");

      await sendEmail({
        to: ADMIN_EMAIL,
        subject: `[Alert] ${overdueInvoices.length} invoice(s) overdue — $${(totalOwed / 100).toFixed(2)} outstanding`,
        html: `
          <h2>Overdue Invoice Alert</h2>
          <p>${overdueInvoices.length} invoice(s) are now past due date + ${GRACE_DAYS} days without payment.</p>
          <p>Overdue notices have been automatically sent to these customers.</p>
          <table style="border-collapse:collapse;width:100%;font-size:14px">
            <thead>
              <tr style="background:#f5f5f5">
                <th style="padding:4px 8px;border:1px solid #ddd;text-align:left">Invoice #</th>
                <th style="padding:4px 8px;border:1px solid #ddd;text-align:left">Customer</th>
                <th style="padding:4px 8px;border:1px solid #ddd;text-align:left">Amount</th>
                <th style="padding:4px 8px;border:1px solid #ddd;text-align:left">Due Date</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
          <p style="margin-top:12px;color:#666;font-size:13px">
            These invoices have <strong>not</strong> been auto-canceled. Please review and follow up manually.
          </p>
        `,
        template: "invoice-overdue-alert",
      });
    }

    return NextResponse.json({
      processed: overdueInvoices.length + dueSoonInvoices.length,
      marked: overdueInvoices.length,
      reminders: remindersCount,
    });
  } catch (err) {
    console.error("[InvoiceOverdueCron] Error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
