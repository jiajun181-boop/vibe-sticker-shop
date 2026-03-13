import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email/resend";

const REPORT_RECIPIENTS = ["jay@lunarprint.ca"];

/**
 * GET /api/cron/daily-report
 * Sends a daily business summary email.
 * Scheduled via Vercel cron: every day at 8pm ET.
 */
export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);

    // Today's stats
    const [
      todayOrders,
      todayRevenue,
      todayNewCustomers,
      pendingProduction,
      overdueInvoices,
      openTickets,
    ] = await Promise.all([
      prisma.order.count({
        where: {
          paymentStatus: "paid",
          paidAt: { gte: todayStart },
        },
      }),
      prisma.order.aggregate({
        where: {
          paymentStatus: "paid",
          paidAt: { gte: todayStart },
        },
        _sum: { totalAmount: true },
      }),
      prisma.user.count({
        where: { createdAt: { gte: todayStart } },
      }),
      prisma.productionJob.count({
        where: { status: { in: ["queued", "assigned", "printing"] } },
      }),
      prisma.invoice.count({
        where: { status: "overdue" },
      }),
      prisma.supportTicket.count({
        where: { status: { in: ["open", "in_progress"] } },
      }),
    ]);

    const revenue = todayRevenue._sum.totalAmount || 0;
    const formattedRevenue = new Intl.NumberFormat("en-CA", {
      style: "currency",
      currency: "CAD",
    }).format(revenue / 100);

    // Build email
    const subject = `Daily Report — ${todayStart.toLocaleDateString("en-CA")} — ${formattedRevenue} revenue`;

    const html = `
      <div style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #111; margin-bottom: 24px;">Daily Business Report</h2>
        <p style="color: #666; font-size: 14px;">${todayStart.toLocaleDateString("en-CA", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>

        <table style="width: 100%; border-collapse: collapse; margin: 24px 0;">
          <tr style="border-bottom: 1px solid #eee;">
            <td style="padding: 12px 0; font-size: 14px; color: #666;">Orders Today</td>
            <td style="padding: 12px 0; font-size: 20px; font-weight: bold; text-align: right;">${todayOrders}</td>
          </tr>
          <tr style="border-bottom: 1px solid #eee;">
            <td style="padding: 12px 0; font-size: 14px; color: #666;">Revenue</td>
            <td style="padding: 12px 0; font-size: 20px; font-weight: bold; text-align: right; color: #16a34a;">${formattedRevenue}</td>
          </tr>
          <tr style="border-bottom: 1px solid #eee;">
            <td style="padding: 12px 0; font-size: 14px; color: #666;">New Customers</td>
            <td style="padding: 12px 0; font-size: 20px; font-weight: bold; text-align: right;">${todayNewCustomers}</td>
          </tr>
          <tr style="border-bottom: 1px solid #eee;">
            <td style="padding: 12px 0; font-size: 14px; color: #666;">Jobs in Production</td>
            <td style="padding: 12px 0; font-size: 20px; font-weight: bold; text-align: right;">${pendingProduction}</td>
          </tr>
          <tr style="border-bottom: 1px solid #eee;">
            <td style="padding: 12px 0; font-size: 14px; color: #666;">Overdue Invoices</td>
            <td style="padding: 12px 0; font-size: 20px; font-weight: bold; text-align: right; ${overdueInvoices > 0 ? "color: #dc2626;" : ""}">${overdueInvoices}</td>
          </tr>
          <tr>
            <td style="padding: 12px 0; font-size: 14px; color: #666;">Open Support Tickets</td>
            <td style="padding: 12px 0; font-size: 20px; font-weight: bold; text-align: right;">${openTickets}</td>
          </tr>
        </table>

        <a href="https://www.lunarprint.ca/admin" style="display: inline-block; background: #111; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 600;">
          Open Admin Dashboard
        </a>

        <p style="margin-top: 32px; font-size: 12px; color: #999;">
          This is an automated daily report from La Lunar Printing.
        </p>
      </div>
    `;

    for (const recipient of REPORT_RECIPIENTS) {
      await sendEmail({
        to: recipient,
        subject,
        html,
        template: "daily-report",
      });
    }

    return NextResponse.json({
      sent: true,
      recipients: REPORT_RECIPIENTS.length,
      stats: {
        orders: todayOrders,
        revenue,
        newCustomers: todayNewCustomers,
        pendingProduction,
        overdueInvoices,
        openTickets,
      },
    });
  } catch (error) {
    console.error("[Daily Report Cron] Error:", error);
    return NextResponse.json(
      { error: "Failed to generate daily report" },
      { status: 500 }
    );
  }
}
