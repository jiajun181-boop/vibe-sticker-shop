import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/admin-auth";

const PREF_KEY_PREFIX = "notification_pref:";

// Available notification categories
const NOTIFICATION_CATEGORIES = [
  { key: "new_order", label: "New Orders", defaultEnabled: true },
  { key: "payment_received", label: "Payment Received", defaultEnabled: true },
  { key: "order_canceled", label: "Order Canceled", defaultEnabled: true },
  { key: "low_stock", label: "Low Stock Alerts", defaultEnabled: true },
  { key: "new_review", label: "New Reviews", defaultEnabled: false },
  { key: "new_support_ticket", label: "New Support Tickets", defaultEnabled: true },
  { key: "production_complete", label: "Production Complete", defaultEnabled: false },
  { key: "invoice_overdue", label: "Invoice Overdue", defaultEnabled: true },
  { key: "new_quote_request", label: "New Quote Requests", defaultEnabled: true },
  { key: "system_alert", label: "System Alerts", defaultEnabled: true },
];

/**
 * GET /api/admin/notification-preferences
 * Returns the admin's notification preferences
 */
export async function GET(request: NextRequest) {
  const session = await getAdminSession(request);
  if (!session?.authenticated || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const settingKey = `${PREF_KEY_PREFIX}${session.user.id}`;
    const setting = await prisma.setting.findUnique({
      where: { key: settingKey },
    });

    const savedPrefs = (setting?.value as Record<string, boolean>) || {};

    // Merge with defaults
    const preferences = NOTIFICATION_CATEGORIES.map((cat) => ({
      key: cat.key,
      label: cat.label,
      enabled: savedPrefs[cat.key] !== undefined ? savedPrefs[cat.key] : cat.defaultEnabled,
    }));

    return NextResponse.json({ preferences });
  } catch (error) {
    console.error("[Notification Preferences] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch preferences" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/notification-preferences
 * Update notification preferences
 * Body: { preferences: { [key: string]: boolean } }
 */
export async function PUT(request: NextRequest) {
  const session = await getAdminSession(request);
  if (!session?.authenticated || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { preferences } = await request.json();

    if (!preferences || typeof preferences !== "object") {
      return NextResponse.json(
        { error: "Preferences object is required" },
        { status: 400 }
      );
    }

    // Validate keys
    const validKeys = new Set(NOTIFICATION_CATEGORIES.map((c) => c.key));
    const cleanPrefs: Record<string, boolean> = {};
    for (const [key, value] of Object.entries(preferences)) {
      if (validKeys.has(key) && typeof value === "boolean") {
        cleanPrefs[key] = value;
      }
    }

    const settingKey = `${PREF_KEY_PREFIX}${session.user.id}`;

    await prisma.setting.upsert({
      where: { key: settingKey },
      create: { key: settingKey, value: cleanPrefs },
      update: { value: cleanPrefs },
    });

    // Return merged result
    const result = NOTIFICATION_CATEGORIES.map((cat) => ({
      key: cat.key,
      label: cat.label,
      enabled: cleanPrefs[cat.key] !== undefined ? cleanPrefs[cat.key] : cat.defaultEnabled,
    }));

    return NextResponse.json({ preferences: result });
  } catch (error) {
    console.error("[Notification Preferences] Error:", error);
    return NextResponse.json(
      { error: "Failed to update preferences" },
      { status: 500 }
    );
  }
}
