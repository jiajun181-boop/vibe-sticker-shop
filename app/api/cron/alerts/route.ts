import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email/resend";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "orders@lalunar.com";

interface AlertItem {
  id: string;
  label: string;
  count: number;
  severity: "warning" | "critical";
  detail: string;
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

    const alerts: AlertItem[] = [];

    // 1. Paid orders >3 days without entering production
    const stuckOrders = await prisma.$queryRaw`
      SELECT COUNT(*)::int as count FROM "Order" o
      WHERE o.status = 'paid'
      AND o."productionStatus" = 'not_started'
      AND o."createdAt" < ${threeDaysAgo}
      AND NOT EXISTS (
        SELECT 1 FROM "ProductionJob" pj
        JOIN "OrderItem" oi ON oi.id = pj."orderItemId"
        WHERE oi."orderId" = o.id
      )
    ` as Array<{ count: number }>;
    const stuckCount = stuckOrders[0]?.count || 0;
    if (stuckCount > 0) {
      alerts.push({
        id: "orders_no_production",
        label: "Orders >3 days without production",
        count: stuckCount,
        severity: "critical",
        detail: `${stuckCount} paid order(s) have been waiting >3 days with no production jobs created. Possible webhook failure or missed assignment.`,
      });
    }

    // 2. Orders with artwork not uploaded >24h
    const missingArtwork = await prisma.$queryRaw`
      SELECT COUNT(DISTINCT o.id)::int as count FROM "Order" o
      JOIN "OrderItem" oi ON oi."orderId" = o.id
      WHERE o.status IN ('paid', 'pending')
      AND o."createdAt" < ${oneDayAgo}
      AND oi."fileUrl" IS NULL
      AND oi."productType" NOT IN ('service', 'design_help')
      AND NOT EXISTS (
        SELECT 1 FROM "OrderFile" f WHERE f."orderId" = o.id
      )
    ` as Array<{ count: number }>;
    const missingArtCount = missingArtwork[0]?.count || 0;
    if (missingArtCount > 0) {
      alerts.push({
        id: "missing_artwork",
        label: "Orders >24h without artwork",
        count: missingArtCount,
        severity: "warning",
        detail: `${missingArtCount} order(s) placed >24h ago still have no artwork uploaded.`,
      });
    }

    // 3. Low-margin orders (<15%)
    const lowMargin = await prisma.$queryRaw`
      SELECT COUNT(*)::int as count FROM "Order" o
      WHERE o.status = 'paid'
      AND o."totalAmount" > 0
      AND o."materialCost" > 0
      AND ((o."totalAmount" - o."materialCost" - o."laborCost")::float / o."totalAmount") < 0.15
    ` as Array<{ count: number }>;
    const lowMarginCount = lowMargin[0]?.count || 0;
    if (lowMarginCount > 0) {
      alerts.push({
        id: "low_margin",
        label: "Low-margin orders (<15%)",
        count: lowMarginCount,
        severity: "warning",
        detail: `${lowMarginCount} order(s) have profit margin below the 15% floor.`,
      });
    }

    // 4. Invoice overdue (already handled by invoice-overdue cron, but include in summary)
    const overdueInvoices = await prisma.invoice.count({
      where: { status: "overdue" },
    });
    if (overdueInvoices > 0) {
      alerts.push({
        id: "overdue_invoices",
        label: "Overdue invoices",
        count: overdueInvoices,
        severity: overdueInvoices > 5 ? "critical" : "warning",
        detail: `${overdueInvoices} invoice(s) are past due and unpaid.`,
      });
    }

    // 5. Support tickets unhandled >48h
    const staleTickets = await prisma.$queryRaw`
      SELECT COUNT(*)::int as count FROM "SupportTicket" t
      WHERE t.status = 'open'
      AND t."createdAt" < ${twoDaysAgo}
    ` as Array<{ count: number }>;
    const staleTicketCount = staleTickets[0]?.count || 0;
    if (staleTicketCount > 0) {
      alerts.push({
        id: "stale_tickets",
        label: "Support tickets unhandled >48h",
        count: staleTicketCount,
        severity: "critical",
        detail: `${staleTicketCount} support ticket(s) have been open >48h without resolution.`,
      });
    }

    // 6. Products missing cost data
    const missingCost = await prisma.product.count({
      where: {
        isActive: true,
        pricingPresetId: null,
        OR: [{ basePrice: null }, { basePrice: 0 }],
      },
    });
    if (missingCost > 0) {
      alerts.push({
        id: "missing_cost_data",
        label: "Products without pricing preset",
        count: missingCost,
        severity: missingCost > 5 ? "critical" : "warning",
        detail: `${missingCost} active product(s) have no pricing preset — customers could see wrong prices.`,
      });
    }

    // 7. Stale production jobs (queued >7 days)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const staleJobs = await prisma.productionJob.count({
      where: {
        status: "queued",
        createdAt: { lt: sevenDaysAgo },
      },
    });
    if (staleJobs > 0) {
      alerts.push({
        id: "stale_jobs",
        label: "Production jobs queued >7 days",
        count: staleJobs,
        severity: "critical",
        detail: `${staleJobs} production job(s) have been stuck in queue for over a week.`,
      });
    }

    // If no alerts, nothing to send
    if (alerts.length === 0) {
      return NextResponse.json({ alerts: 0, sent: false });
    }

    // Build email
    const criticalCount = alerts.filter((a) => a.severity === "critical").length;
    const warningCount = alerts.filter((a) => a.severity === "warning").length;

    const rows = alerts
      .sort((a, b) => (a.severity === "critical" ? -1 : 1) - (b.severity === "critical" ? -1 : 1))
      .map((a) => {
        const color = a.severity === "critical" ? "#dc2626" : "#d97706";
        const badge = a.severity === "critical" ? "CRITICAL" : "WARNING";
        return `
          <tr>
            <td style="padding:8px;border-bottom:1px solid #eee">
              <span style="background:${color};color:white;padding:2px 6px;border-radius:3px;font-size:11px;font-weight:bold">${badge}</span>
            </td>
            <td style="padding:8px;border-bottom:1px solid #eee">
              <strong>${a.label}</strong> (${a.count})<br/>
              <span style="color:#666;font-size:13px">${a.detail}</span>
            </td>
          </tr>`;
      })
      .join("");

    await sendEmail({
      to: ADMIN_EMAIL,
      subject: `[Lunar Print] ${criticalCount > 0 ? "🚨" : "⚠️"} ${alerts.length} alert(s) — ${criticalCount} critical, ${warningCount} warning`,
      html: `
        <h2 style="margin-bottom:4px">Daily System Alerts</h2>
        <p style="color:#666;margin-top:0">${new Date().toLocaleDateString("en-CA")} — ${alerts.length} issue(s) need attention</p>
        <table style="width:100%;border-collapse:collapse;font-size:14px">
          ${rows}
        </table>
        <p style="margin-top:16px;color:#999;font-size:12px">
          View details at <strong>Admin → System → System Health</strong>
        </p>
      `,
      template: "daily-alerts",
    });

    return NextResponse.json({
      alerts: alerts.length,
      critical: criticalCount,
      warning: warningCount,
      sent: true,
      items: alerts.map((a) => ({ id: a.id, count: a.count, severity: a.severity })),
    });
  } catch (err) {
    console.error("[AlertsCron] Error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
