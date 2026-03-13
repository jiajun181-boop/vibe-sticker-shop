import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity-log";
import { requirePermission } from "@/lib/admin-auth";

const CAMPAIGN_PREFIX = "campaign:";

// ── GET: List all campaigns ──────────────────────────────────────────
export async function GET(request: NextRequest) {
  const auth = await requirePermission(request, "settings", "edit");
  if (!auth.authenticated) return auth.response;

  try {
    const settings = await prisma.setting.findMany({
      where: { key: { startsWith: CAMPAIGN_PREFIX } },
    });

    const campaigns = settings.map((s) => {
      const data = s.value as Record<string, unknown>;
      return {
        id: s.key.slice(CAMPAIGN_PREFIX.length),
        ...data,
      };
    });

    // Sort newest first by createdAt
    campaigns.sort((a, b) => {
      const da = a.createdAt ? new Date(a.createdAt as string).getTime() : 0;
      const db = b.createdAt ? new Date(b.createdAt as string).getTime() : 0;
      return db - da;
    });

    return NextResponse.json({ campaigns });
  } catch (err) {
    console.error("[Campaigns] GET error:", err);
    return NextResponse.json(
      { error: "Failed to fetch campaigns" },
      { status: 500 }
    );
  }
}

// ── POST: Create a new campaign ──────────────────────────────────────
export async function POST(request: NextRequest) {
  const auth = await requirePermission(request, "settings", "edit");
  if (!auth.authenticated) return auth.response;

  try {
    const body = await request.json();

    const { name, subject, html, targetSegment, scheduledAt } = body;

    if (!name || !subject || !html) {
      return NextResponse.json(
        { error: "name, subject, and html are required" },
        { status: 400 }
      );
    }

    const validSegments = ["all", "repeat", "vip", "b2b", "recent"];
    const segment = validSegments.includes(targetSegment) ? targetSegment : "all";

    const campaignId = `cmp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const settingKey = `${CAMPAIGN_PREFIX}${campaignId}`;

    const campaignData = {
      name,
      subject,
      html,
      targetSegment: segment,
      scheduledAt: scheduledAt || null,
      status: body.status === "scheduled" ? "scheduled" : "draft",
      sentCount: 0,
      failedCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await prisma.setting.create({
      data: {
        key: settingKey,
        value: campaignData as any,
      },
    });

    await logActivity({
      action: "created",
      entity: "campaign",
      entityId: campaignId,
      details: { name, targetSegment: segment, status: campaignData.status },
    });

    return NextResponse.json(
      { id: campaignId, ...campaignData },
      { status: 201 }
    );
  } catch (err) {
    console.error("[Campaigns] POST error:", err);
    return NextResponse.json(
      { error: "Failed to create campaign" },
      { status: 500 }
    );
  }
}
