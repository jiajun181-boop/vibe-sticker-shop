import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin-auth";
import { logActivity } from "@/lib/activity-log";

/**
 * Generate a unique reference number in the format Q-YYYYMMDD-XXXX
 * where XXXX is a random 4-character alphanumeric string.
 */
function generateReference(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let random = "";
  for (let i = 0; i < 4; i++) {
    random += chars[Math.floor(Math.random() * chars.length)];
  }
  return `Q-${y}${m}${d}-${random}`;
}

interface BulkQuoteItem {
  productName: string;
  quantity: number;
  specs?: Record<string, unknown>;
  unitPrice?: number;
}

interface BulkQuoteBody {
  customerName: string;
  customerEmail: string;
  companyName?: string;
  items: BulkQuoteItem[];
  notes?: string;
  validDays?: number;
}

/**
 * POST /api/admin/quotes/bulk — Create a bulk quote with multiple line items.
 *
 * Accepts an array of items and stores them as a single QuoteRequest
 * with the line items serialized in the `description` field as structured
 * JSON text, since the QuoteRequest model stores product details inline.
 *
 * The `productType` field is set to "bulk" to distinguish these from
 * single-product quote requests.
 */
export async function POST(request: NextRequest) {
  const auth = await requirePermission(request, "pricing", "edit");
  if (!auth.authenticated) return auth.response;

  try {
    const body: BulkQuoteBody = await request.json();

    // ── Validation ────────────────────────────────────────────────────
    if (!body.customerName || typeof body.customerName !== "string") {
      return NextResponse.json(
        { error: "customerName is required" },
        { status: 400 }
      );
    }
    if (!body.customerEmail || typeof body.customerEmail !== "string") {
      return NextResponse.json(
        { error: "customerEmail is required" },
        { status: 400 }
      );
    }
    if (!Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json(
        { error: "items array is required and must not be empty" },
        { status: 400 }
      );
    }

    // Validate each line item
    for (let i = 0; i < body.items.length; i++) {
      const item = body.items[i];
      if (!item.productName || typeof item.productName !== "string") {
        return NextResponse.json(
          { error: `items[${i}].productName is required` },
          { status: 400 }
        );
      }
      if (
        typeof item.quantity !== "number" ||
        !Number.isInteger(item.quantity) ||
        item.quantity < 1
      ) {
        return NextResponse.json(
          { error: `items[${i}].quantity must be a positive integer` },
          { status: 400 }
        );
      }
      if (item.unitPrice !== undefined && (typeof item.unitPrice !== "number" || item.unitPrice < 0)) {
        return NextResponse.json(
          { error: `items[${i}].unitPrice must be a non-negative number` },
          { status: 400 }
        );
      }
    }

    // ── Generate unique reference ─────────────────────────────────────
    // Retry up to 5 times in the unlikely event of a collision
    let reference = "";
    for (let attempt = 0; attempt < 5; attempt++) {
      const candidate = generateReference();
      const existing = await prisma.quoteRequest.findUnique({
        where: { reference: candidate },
      });
      if (!existing) {
        reference = candidate;
        break;
      }
    }
    if (!reference) {
      return NextResponse.json(
        { error: "Failed to generate unique reference. Please try again." },
        { status: 500 }
      );
    }

    // ── Compute totals from items ─────────────────────────────────────
    const totalQuantity = body.items.reduce((sum, item) => sum + item.quantity, 0);
    const hasAllPrices = body.items.every((item) => item.unitPrice !== undefined);
    const quotedAmountCents = hasAllPrices
      ? body.items.reduce(
          (sum, item) => sum + Math.round((item.unitPrice ?? 0) * item.quantity),
          0
        )
      : undefined;

    // ── Build description from items ──────────────────────────────────
    // Store the structured items array as a JSON string in `description`
    // so it can be parsed back by the UI for line-item display.
    const itemsSummary = body.items
      .map(
        (item, i) =>
          `${i + 1}. ${item.productName} — qty ${item.quantity}${
            item.unitPrice !== undefined ? ` @ $${(item.unitPrice / 100).toFixed(2)}/ea` : ""
          }${item.specs ? ` (${Object.entries(item.specs).map(([k, v]) => `${k}: ${v}`).join(", ")})` : ""}`
      )
      .join("\n");

    // ── Compute validUntil if validDays provided ──────────────────────
    const validDays = body.validDays ?? 30;

    // ── Create the QuoteRequest ───────────────────────────────────────
    const quote = await prisma.quoteRequest.create({
      data: {
        reference,
        customerName: body.customerName.trim(),
        customerEmail: body.customerEmail.trim().toLowerCase(),
        companyName: body.companyName?.trim() || null,
        productType: "bulk",
        quantity: totalQuantity,
        description: JSON.stringify({
          type: "bulk",
          items: body.items.map((item) => ({
            productName: item.productName,
            quantity: item.quantity,
            specs: item.specs || null,
            unitPrice: item.unitPrice ?? null,
          })),
          summary: itemsSummary,
          validDays,
        }),
        adminNotes: body.notes?.trim() || null,
        ...(quotedAmountCents !== undefined && {
          quotedAmountCents,
          quotedBy: auth.user?.email || "admin",
          quotedAt: new Date(),
        }),
      },
    });

    logActivity({
      action: "bulk_quote_created",
      entity: "QuoteRequest",
      entityId: quote.id,
      actor: auth.user?.email || "admin",
      details: {
        reference: quote.reference,
        customerEmail: quote.customerEmail,
        itemCount: body.items.length,
        totalQuantity,
        quotedAmountCents: quotedAmountCents ?? null,
      },
    });

    return NextResponse.json({
      quote,
      itemCount: body.items.length,
      totalQuantity,
      validDays,
    });
  } catch (error) {
    console.error("[Admin Quotes Bulk POST] Error:", error);
    return NextResponse.json(
      { error: "Failed to create bulk quote" },
      { status: 500 }
    );
  }
}
