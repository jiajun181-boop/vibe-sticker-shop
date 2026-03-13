import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin-auth";
import { logActivity } from "@/lib/activity-log";

const TEMPLATE_PREFIX = "email_template:";

// Default templates that ship with the system
const DEFAULT_TEMPLATES: Record<string, { subject: string; body: string; description: string }> = {
  "order-confirmation": {
    subject: "Order Confirmed — #{orderId}",
    body: "Hi {customerName},\n\nThank you for your order! Your order #{orderId} has been received and is being processed.\n\nWe'll send you an update when production begins.\n\nBest,\nLa Lunar Printing",
    description: "Sent when a customer completes checkout",
  },
  "order-shipped": {
    subject: "Your Order Has Shipped — #{orderId}",
    body: "Hi {customerName},\n\nGreat news! Your order #{orderId} has been shipped.\n\nTracking: {trackingNumber}\nCarrier: {carrier}\n\nThank you for choosing La Lunar Printing!",
    description: "Sent when an order is marked as shipped",
  },
  "invoice-sent": {
    subject: "Invoice {invoiceNumber} from La Lunar Printing",
    body: "Hi {customerName},\n\nPlease find your invoice {invoiceNumber} attached.\n\nAmount: {totalAmount}\nDue: {dueDate}\n\nPayment methods:\n- Interac e-Transfer to orders@lunarprint.ca\n- Cheque or wire transfer\n\nThank you!",
    description: "Sent when an invoice is created for B2B customers",
  },
  "proof-ready": {
    subject: "Your Proof is Ready — #{orderId}",
    body: "Hi {customerName},\n\nYour proof for order #{orderId} is ready for review.\n\nPlease log in to your account to approve or request changes.\n\nBest,\nLa Lunar Printing",
    description: "Sent when a proof is uploaded for customer review",
  },
  "abandoned-cart": {
    subject: "You left something behind!",
    body: "Hi there,\n\nWe noticed you didn't complete your order. Your cart is still saved and waiting for you.\n\nComplete your order: {recoveryUrl}\n\nNeed help? Reply to this email.\n\nBest,\nLa Lunar Printing",
    description: "Sent to recover abandoned carts",
  },
  "reorder-reminder": {
    subject: "Time to reorder?",
    body: "Hi {customerName},\n\nIt's been a while since your last order. Ready to restock?\n\nLog in to reorder with one click: {accountUrl}\n\nBest,\nLa Lunar Printing",
    description: "Weekly reminder for repeat customers",
  },
};

/**
 * GET /api/admin/email-templates
 * List all email templates (defaults merged with custom overrides)
 */
export async function GET(request: NextRequest) {
  const auth = await requirePermission(request, "settings", "view");
  if (!auth.authenticated) return auth.response;

  try {
    // Fetch all custom template overrides from Setting
    const settings = await prisma.setting.findMany({
      where: {
        key: { startsWith: TEMPLATE_PREFIX },
      },
    });

    const customTemplates = new Map<string, any>();
    for (const s of settings) {
      const templateKey = s.key.replace(TEMPLATE_PREFIX, "");
      customTemplates.set(templateKey, s.value);
    }

    // Merge defaults with custom overrides
    const templates = Object.entries(DEFAULT_TEMPLATES).map(
      ([key, defaults]) => {
        const custom = customTemplates.get(key) as Record<string, unknown> | undefined;
        return {
          key,
          subject: (custom?.subject as string) || defaults.subject,
          body: (custom?.body as string) || defaults.body,
          description: defaults.description,
          isCustomized: !!custom,
        };
      }
    );

    return NextResponse.json({ templates });
  } catch (error) {
    console.error("[Email Templates] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch templates" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/email-templates
 * Update an email template (saves as Setting override)
 * Body: { key, subject, body }
 */
export async function PUT(request: NextRequest) {
  const auth = await requirePermission(request, "settings", "edit");
  if (!auth.authenticated) return auth.response;

  try {
    const { key, subject, body } = await request.json();

    if (!key || !DEFAULT_TEMPLATES[key]) {
      return NextResponse.json(
        { error: "Invalid template key" },
        { status: 400 }
      );
    }

    if (!subject || !body) {
      return NextResponse.json(
        { error: "Subject and body are required" },
        { status: 400 }
      );
    }

    const settingKey = `${TEMPLATE_PREFIX}${key}`;

    await prisma.setting.upsert({
      where: { key: settingKey },
      create: { key: settingKey, value: { subject, body } },
      update: { value: { subject, body } },
    });

    logActivity({
      action: "email_template_updated",
      entity: "Setting",
      entityId: settingKey,
      details: { templateKey: key },
    });

    return NextResponse.json({
      key,
      subject,
      body,
      description: DEFAULT_TEMPLATES[key].description,
      isCustomized: true,
    });
  } catch (error) {
    console.error("[Email Templates] Error:", error);
    return NextResponse.json(
      { error: "Failed to update template" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/email-templates
 * Reset a template to defaults
 * Body: { key }
 */
export async function DELETE(request: NextRequest) {
  const auth = await requirePermission(request, "settings", "edit");
  if (!auth.authenticated) return auth.response;

  try {
    const { key } = await request.json();

    if (!key || !DEFAULT_TEMPLATES[key]) {
      return NextResponse.json(
        { error: "Invalid template key" },
        { status: 400 }
      );
    }

    const settingKey = `${TEMPLATE_PREFIX}${key}`;

    await prisma.setting.deleteMany({ where: { key: settingKey } });

    logActivity({
      action: "email_template_reset",
      entity: "Setting",
      entityId: settingKey,
      details: { templateKey: key },
    });

    return NextResponse.json({
      key,
      ...DEFAULT_TEMPLATES[key],
      isCustomized: false,
    });
  } catch (error) {
    console.error("[Email Templates] Error:", error);
    return NextResponse.json(
      { error: "Failed to reset template" },
      { status: 500 }
    );
  }
}
