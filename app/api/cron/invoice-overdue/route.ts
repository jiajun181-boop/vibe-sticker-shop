import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email/resend";
import { logActivity } from "@/lib/activity-log";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "orders@lalunar.com";
const GRACE_DAYS = 7; // payment terms + 7 days before marking overdue

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();

    // Find invoices that are "sent" and past their due date + grace period
    const overdueInvoices = await prisma.invoice.findMany({
      where: {
        status: "sent",
        dueAt: { lt: new Date(now.getTime() - GRACE_DAYS * 24 * 60 * 60 * 1000) },
      },
      take: 100,
    });

    if (overdueInvoices.length === 0) {
      return NextResponse.json({ processed: 0, marked: 0 });
    }

    // Mark them as overdue
    const ids = overdueInvoices.map((inv) => inv.id);
    await prisma.invoice.updateMany({
      where: { id: { in: ids } },
      data: { status: "overdue" },
    });

    // Log each one
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

    return NextResponse.json({
      processed: overdueInvoices.length,
      marked: overdueInvoices.length,
      totalOwedCents: totalOwed,
    });
  } catch (err) {
    console.error("[InvoiceOverdueCron] Error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
