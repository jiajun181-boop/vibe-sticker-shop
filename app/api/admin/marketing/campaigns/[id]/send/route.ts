import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity-log";
import { requirePermission } from "@/lib/admin-auth";
import { sendEmail } from "@/lib/email/resend";

const CAMPAIGN_PREFIX = "campaign:";
const BATCH_SIZE = 10;

/**
 * Resolve unique customer emails for a given segment.
 */
async function resolveAudience(segment: string): Promise<string[]> {
  switch (segment) {
    case "repeat": {
      // Customers with 2+ paid orders
      const rows = await prisma.order.groupBy({
        by: ["customerEmail"],
        where: { paymentStatus: "paid" },
        _count: { id: true },
        having: { id: { _count: { gte: 2 } } },
      });
      return rows.map((r) => r.customerEmail);
    }

    case "vip": {
      // Customers with 5+ paid orders OR total spend > $500 (50000 cents)
      const frequentRows = await prisma.order.groupBy({
        by: ["customerEmail"],
        where: { paymentStatus: "paid" },
        _count: { id: true },
        having: { id: { _count: { gte: 5 } } },
      });
      const highSpendRows = await prisma.order.groupBy({
        by: ["customerEmail"],
        where: { paymentStatus: "paid" },
        _sum: { totalAmount: true },
        having: { totalAmount: { _sum: { gt: 50000 } } },
      });

      const emailSet = new Set<string>();
      for (const r of frequentRows) emailSet.add(r.customerEmail);
      for (const r of highSpendRows) emailSet.add(r.customerEmail);
      return Array.from(emailSet);
    }

    case "recent": {
      // Customers who ordered in last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const rows = await prisma.order.findMany({
        where: {
          paymentStatus: "paid",
          createdAt: { gte: thirtyDaysAgo },
        },
        select: { customerEmail: true },
        distinct: ["customerEmail"],
      });
      return rows.map((r) => r.customerEmail);
    }

    case "b2b": {
      // Users with B2B account type
      const users = await prisma.user.findMany({
        where: { accountType: "B2B" },
        select: { email: true },
      });
      return users.map((u) => u.email);
    }

    case "all":
    default: {
      // All unique customer emails from paid orders
      const rows = await prisma.order.findMany({
        where: { paymentStatus: "paid" },
        select: { customerEmail: true },
        distinct: ["customerEmail"],
      });
      return rows.map((r) => r.customerEmail);
    }
  }
}

/**
 * Send emails in batches to avoid overwhelming the provider.
 */
async function sendInBatches(
  recipients: string[],
  subject: string,
  html: string,
  campaignId: string
): Promise<{ sentCount: number; failedCount: number }> {
  let sentCount = 0;
  let failedCount = 0;

  for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
    const batch = recipients.slice(i, i + BATCH_SIZE);

    const results = await Promise.allSettled(
      batch.map((email) =>
        sendEmail({
          to: email,
          subject,
          html,
          template: `campaign:${campaignId}`,
        })
      )
    );

    for (const result of results) {
      if (result.status === "fulfilled" && result.value !== null) {
        sentCount++;
      } else {
        failedCount++;
      }
    }
  }

  return { sentCount, failedCount };
}

// ── POST: Send a campaign ────────────────────────────────────────────
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission(request, "settings", "edit");
  if (!auth.authenticated) return auth.response;

  try {
    const { id } = await params;
    const settingKey = `${CAMPAIGN_PREFIX}${id}`;

    // Load campaign from Setting
    const setting = await prisma.setting.findUnique({
      where: { key: settingKey },
    });

    if (!setting) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 }
      );
    }

    const campaign = setting.value as Record<string, unknown>;

    if (campaign.status === "sent") {
      return NextResponse.json(
        { error: "Campaign has already been sent" },
        { status: 400 }
      );
    }

    const subject = campaign.subject as string;
    const html = campaign.html as string;
    const targetSegment = (campaign.targetSegment as string) || "all";

    // Resolve target audience
    const recipients = await resolveAudience(targetSegment);

    if (recipients.length === 0) {
      return NextResponse.json(
        { error: "No recipients found for the selected segment" },
        { status: 400 }
      );
    }

    // Send emails in batches
    const { sentCount, failedCount } = await sendInBatches(
      recipients,
      subject,
      html,
      id
    );

    // Update campaign status to "sent"
    const updatedCampaign = {
      ...campaign,
      status: "sent",
      sentCount,
      failedCount,
      recipientCount: recipients.length,
      sentAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await prisma.setting.update({
      where: { key: settingKey },
      data: { value: updatedCampaign as any },
    });

    await logActivity({
      action: "sent",
      entity: "campaign",
      entityId: id,
      details: {
        name: campaign.name,
        targetSegment,
        recipientCount: recipients.length,
        sentCount,
        failedCount,
      },
    });

    return NextResponse.json({
      success: true,
      campaignId: id,
      recipientCount: recipients.length,
      sentCount,
      failedCount,
    });
  } catch (err) {
    console.error("[Campaigns] Send error:", err);
    return NextResponse.json(
      { error: "Failed to send campaign" },
      { status: 500 }
    );
  }
}
