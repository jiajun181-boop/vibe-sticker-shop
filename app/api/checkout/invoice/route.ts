import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { quoteProduct } from "@/lib/pricing/quote-server.js";
import { checkoutLimiter, getClientIp } from "@/lib/rate-limit";
import { getUserFromRequest } from "@/lib/auth";

const MetaSchema = z.record(z.string(), z.union([z.string(), z.number(), z.boolean()]));

const CartItemSchema = z.object({
  productId: z.string(),
  slug: z.string(),
  name: z.string(),
  unitAmount: z.number().int().nonnegative(),
  quantity: z.number().int().positive(),
  meta: MetaSchema.optional(),
});

const InvoiceCheckoutSchema = z.object({
  items: z.array(CartItemSchema).min(1, "Cart is empty"),
  companyName: z.string().nullable().optional(),
  contactName: z.string().min(1),
  email: z.string().email(),
  poNumber: z.string().nullable().optional(),
  paymentTerms: z.enum(["net15", "net30", "net45"]).default("net30"),
  notes: z.string().nullable().optional(),
});

function parseMetaValue(value: unknown): unknown {
  if (typeof value !== "string") return value;
  const text = value.trim();
  if (!text) return value;
  if ((text.startsWith("[") && text.endsWith("]")) || (text.startsWith("{") && text.endsWith("}"))) {
    try {
      return JSON.parse(text);
    } catch {
      return value;
    }
  }
  return value;
}

function toNumberOrNull(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

function toStringOrNull(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const text = value.trim();
  return text ? text : null;
}

function parseStringArray(value: unknown): string[] {
  const parsed = parseMetaValue(value);
  if (Array.isArray(parsed)) {
    return parsed.map((v) => String(v)).filter(Boolean);
  }
  if (typeof parsed === "string" && parsed.trim()) return [parsed.trim()];
  return [];
}

function parseSizeRows(value: unknown): Array<{ widthIn: number; heightIn: number; quantity: number }> {
  const parsed = parseMetaValue(value);
  if (!Array.isArray(parsed)) return [];
  return parsed
    .map((row) => {
      if (!row || typeof row !== "object") return null;
      const r = row as Record<string, unknown>;
      const width = toNumberOrNull(r.width ?? r.widthIn);
      const height = toNumberOrNull(r.height ?? r.heightIn);
      const quantity = toNumberOrNull(r.quantity);
      if (width == null || height == null || quantity == null) return null;
      if (width <= 0 || height <= 0 || quantity <= 0) return null;
      return { widthIn: width, heightIn: height, quantity: Math.floor(quantity) };
    })
    .filter((r): r is { widthIn: number; heightIn: number; quantity: number } => !!r);
}

function parseNormalizedMeta(meta: Record<string, string | number | boolean> | undefined) {
  const source = meta || {};
  return {
    widthIn: toNumberOrNull(parseMetaValue(source.width)),
    heightIn: toNumberOrNull(parseMetaValue(source.height)),
    material: toStringOrNull(parseMetaValue(source.material)),
    sizeLabel: toStringOrNull(parseMetaValue(source.sizeLabel)),
    addons: parseStringArray(source.addons),
    finishings: parseStringArray(source.finishings),
    names: toNumberOrNull(parseMetaValue(source.names)),
    sizeMode: String(parseMetaValue(source.sizeMode) ?? "single"),
    sizeRows: parseSizeRows(source.sizeRows),
  };
}

type CartItem = z.infer<typeof CartItemSchema>;

async function findActiveProduct(item: CartItem) {
  const byId = await prisma.product.findFirst({
    where: { id: item.productId, isActive: true },
    include: { pricingPreset: true },
  });
  if (byId) return byId;
  return prisma.product.findFirst({
    where: { slug: item.slug, isActive: true },
    include: { pricingPreset: true },
  });
}

function repriceSingleItem(product: Awaited<ReturnType<typeof findActiveProduct>>, item: CartItem) {
  if (!product) throw new Error(`Product unavailable: ${item.name}`);
  const meta = parseNormalizedMeta(item.meta);
  const names = meta.names && meta.names > 1 ? Math.floor(meta.names) : undefined;

  if (meta.sizeMode === "multi" && meta.sizeRows.length > 0) {
    let totalCents = 0;
    let totalQty = 0;
    for (const row of meta.sizeRows) {
      const body: Record<string, unknown> = {
        quantity: row.quantity,
        widthIn: row.widthIn,
        heightIn: row.heightIn,
        addons: meta.addons,
        finishings: meta.finishings,
      };
      if (meta.material) body.material = meta.material;
      if (meta.sizeLabel) body.sizeLabel = meta.sizeLabel;
      if (names && names > 1) body.names = names;
      const quote = quoteProduct(product, body);
      totalCents += Number(quote.totalCents || 0);
      totalQty += row.quantity;
    }
    if (totalQty <= 0 || totalCents <= 0) throw new Error(`Unable to price item: ${item.name}`);
    const unitAmount = Math.max(1, Math.round(totalCents / totalQty));
    return { quantity: totalQty, unitAmount, lineTotal: unitAmount * totalQty };
  }

  const body: Record<string, unknown> = {
    quantity: item.quantity,
    addons: meta.addons,
    finishings: meta.finishings,
  };
  if (meta.widthIn != null) body.widthIn = meta.widthIn;
  if (meta.heightIn != null) body.heightIn = meta.heightIn;
  if (meta.material) body.material = meta.material;
  if (meta.sizeLabel) body.sizeLabel = meta.sizeLabel;
  if (names && names > 1) body.names = names;

  const quote = quoteProduct(product, body);
  const unitAmount = Number(quote.unitCents || Math.round(Number(quote.totalCents || 0) / item.quantity));
  if (!Number.isFinite(unitAmount) || unitAmount <= 0) throw new Error(`Unable to price item: ${item.name}`);
  return { quantity: item.quantity, unitAmount: Math.round(unitAmount), lineTotal: Math.round(unitAmount) * item.quantity };
}

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const { success } = checkoutLimiter.check(ip);
    if (!success) {
      return NextResponse.json(
        { error: "Too many checkout attempts. Please try again shortly.", code: "RATE_LIMIT" },
        { status: 429 }
      );
    }

    const body = await req.json();
    const parsed = InvoiceCheckoutSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation Error", code: "VALIDATION_ERROR", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const user = await getUserFromRequest(req);
    const { items, companyName, contactName, email, poNumber, paymentTerms, notes } = parsed.data;

    const pricedItems = await Promise.all(
      items.map(async (item) => {
        const product = await findActiveProduct(item);
        if (!product) throw new Error(`Product unavailable: ${item.name}`);
        const repriced = repriceSingleItem(product, item);
        return {
          product,
          item,
          repriced,
        };
      })
    );

    const subtotalAmount = pricedItems.reduce((sum, p) => sum + p.repriced.lineTotal, 0);
    const shippingAmount = subtotalAmount >= 15000 ? 0 : 1500;
    const taxAmount = Math.round((subtotalAmount + shippingAmount) * 0.13);
    const totalAmount = subtotalAmount + shippingAmount + taxAmount;

    const created = await prisma.order.create({
      data: {
        customerEmail: email,
        customerName: contactName,
        userId: user?.id || null,
        subtotalAmount,
        taxAmount,
        shippingAmount,
        totalAmount,
        status: "pending",
        paymentStatus: "unpaid",
        productionStatus: "not_started",
        tags: ["invoice_checkout", paymentTerms, ...(poNumber ? ["has_po"] : [])],
        notes: {
          create: [
            {
              authorType: "staff",
              isInternal: true,
              message: `Invoice checkout request${companyName ? ` | Company: ${companyName}` : ""}${poNumber ? ` | PO: ${poNumber}` : ""}${notes ? ` | Notes: ${notes}` : ""}`,
            },
          ],
        },
        timeline: {
          create: [
            {
              action: "Invoice checkout requested",
              details: `Terms ${paymentTerms.toUpperCase()}${poNumber ? ` | PO ${poNumber}` : ""}`,
              actor: "customer",
            },
            {
              action: "Awaiting payment",
              details: `Payment terms: ${paymentTerms.toUpperCase()}`,
              actor: "system",
            },
          ],
        },
        items: {
          create: pricedItems.map(({ product, item, repriced }) => ({
            productId: product.id,
            productName: product.name || item.name,
            productType: product.type,
            quantity: repriced.quantity,
            unitPrice: repriced.unitAmount,
            totalPrice: repriced.lineTotal,
            meta: item.meta || null,
          })),
        },
      },
      select: { id: true, customerEmail: true, totalAmount: true },
    });

    return NextResponse.json({
      ok: true,
      orderId: created.id,
      totalAmount: created.totalAmount,
      customerEmail: created.customerEmail,
    });
  } catch (error) {
    console.error("[Invoice checkout] error:", error);
    const message = error instanceof Error ? error.message : "Failed to submit invoice order";
    const status = message.includes("Product unavailable") ? 409 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
