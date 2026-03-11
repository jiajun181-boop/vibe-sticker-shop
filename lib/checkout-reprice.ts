/**
 * Shared server-side repricing logic for checkout routes (Stripe + Interac).
 *
 * Single source of truth for:
 * 1. Base product repricing (via quoteProduct)
 * 2. Rush surcharge application (RUSH_MULTIPLIER)
 * 3. Design help fee calculation (DESIGN_HELP_CENTS per line item)
 */

import type { Prisma } from "@prisma/client";
import { quoteProduct } from "@/lib/pricing/quote-server.js";
import { RUSH_MULTIPLIER, DESIGN_HELP_CENTS, MIN_UNIT_AMOUNT, PRINT_ONLY_DISCOUNT_RATE } from "@/lib/order-config";

type ProductWithPricingPreset = Prisma.ProductGetPayload<{
  include: { pricingPreset: true };
}>;

interface CartItem {
  productId: string;
  slug?: string;
  name: string;
  unitAmount: number;
  quantity: number;
  meta?: Record<string, string | number | boolean>;
}

interface RepricedResult {
  quantity: number;
  unitAmount: number;
  lineTotal: number;
  rushApplied: boolean;
}

// ─── Meta parsing helpers ───

function parseMetaValue(value: unknown): unknown {
  if (typeof value !== "string") return value;
  const text = value.trim();
  if (!text) return value;
  if (text === "null") return null;
  if (text === "true") return true;
  if (text === "false") return false;
  if ((text.startsWith("[") && text.endsWith("]")) || (text.startsWith("{") && text.endsWith("}"))) {
    try { return JSON.parse(text); } catch { return value; }
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
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  }
  return null;
}

function parseStringArray(value: unknown): string[] {
  const parsed = parseMetaValue(value);
  if (Array.isArray(parsed)) return parsed.map((v) => String(v)).filter((v) => v.length > 0);
  if (typeof parsed === "string") {
    const trimmed = parsed.trim();
    return trimmed ? [trimmed] : [];
  }
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
  const sizeMode = String(parseMetaValue(source.sizeMode) ?? "single");
  return {
    widthIn: toNumberOrNull(parseMetaValue(source.width)),
    heightIn: toNumberOrNull(parseMetaValue(source.height)),
    material: toStringOrNull(parseMetaValue(source.material)),
    sizeLabel: toStringOrNull(parseMetaValue(source.sizeLabel)),
    addons: parseStringArray(source.addons),
    finishings: parseStringArray(source.finishings),
    names: toNumberOrNull(parseMetaValue(source.names)),
    sizeMode,
    sizeRows: parseSizeRows(source.sizeRows),
  };
}

function splitByChargeType(
  selectedIds: string[],
  defs: Array<{ id: string; type?: string }>
): { flat: string[]; perUnit: string[] } {
  const byId = new Map(defs.map((d) => [String(d.id), d]));
  const flat: string[] = [];
  const perUnit: string[] = [];
  for (const id of selectedIds) {
    const def = byId.get(String(id));
    if ((def?.type || "per_unit") === "flat") flat.push(String(id));
    else perUnit.push(String(id));
  }
  return { flat, perUnit };
}

// ─── Core repricing ───

/**
 * Reprice a single cart item using server-side pricing engine.
 * Returns the server-calculated base price (before rush/design help).
 */
export function repriceItem(
  product: ProductWithPricingPreset,
  item: CartItem
): RepricedResult {
  const meta = parseNormalizedMeta(item.meta);
  const names = meta.names && meta.names > 1 ? Math.floor(meta.names) : undefined;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const optsCfg = product.optionsConfig as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const presetCfg = product.pricingPreset?.config as any;
  const addonDefs: Array<{ id: string; type?: string }> = Array.isArray(optsCfg?.addons)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ? optsCfg.addons.filter((a: any) => a && typeof a === "object" && "id" in a)
    : [];
  const finishingDefs: Array<{ id: string; type?: string }> = Array.isArray(presetCfg?.finishings)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ? presetCfg.finishings.filter((f: any) => f && typeof f === "object" && "id" in f)
    : [];

  // Multi-size orders
  if (meta.sizeMode === "multi" && meta.sizeRows.length > 0) {
    const addons = splitByChargeType(meta.addons, addonDefs);
    const finishings = splitByChargeType(meta.finishings, finishingDefs);
    let totalCents = 0;
    let totalQty = 0;
    meta.sizeRows.forEach((row, idx) => {
      const body: Record<string, unknown> = {
        quantity: row.quantity, widthIn: row.widthIn, heightIn: row.heightIn,
      };
      if (meta.material) body.material = meta.material;
      if (meta.sizeLabel) body.sizeLabel = meta.sizeLabel;
      if (names && names > 1) body.names = names;
      const selectedAddons = idx === 0 ? [...addons.perUnit, ...addons.flat] : addons.perUnit;
      const selectedFinishings = idx === 0 ? [...finishings.perUnit, ...finishings.flat] : finishings.perUnit;
      if (selectedAddons.length > 0) body.addons = selectedAddons;
      if (selectedFinishings.length > 0) body.finishings = selectedFinishings;
      const quote = quoteProduct(product, body);
      totalCents += Number(quote.totalCents || 0);
      totalQty += row.quantity;
    });
    if (totalQty <= 0 || totalCents <= 0) {
      throw new Error(`Unable to price item: ${item.name}`);
    }

    // Apply print-only discount for display stands ordered without hardware
    if (String(item.meta?.orderType ?? "").trim() === "print-only") {
      totalCents = Math.round(totalCents * (1 - PRINT_ONLY_DISCOUNT_RATE));
    }

    let unitAmount = Math.max(1, Math.round(totalCents / totalQty));

    // Apply rush surcharge
    const rushApplied = String(item.meta?.rushProduction ?? "false").trim() === "true";
    if (rushApplied) {
      unitAmount = Math.round(unitAmount * RUSH_MULTIPLIER);
    }

    return {
      quantity: totalQty,
      unitAmount,
      lineTotal: unitAmount * totalQty,
      rushApplied,
    };
  }

  // Single-size orders
  const body: Record<string, unknown> = { quantity: item.quantity };
  if (meta.widthIn != null) body.widthIn = meta.widthIn;
  if (meta.heightIn != null) body.heightIn = meta.heightIn;
  if (meta.material) body.material = meta.material;
  if (meta.sizeLabel) body.sizeLabel = meta.sizeLabel;
  if (meta.addons.length > 0) body.addons = meta.addons;
  if (meta.finishings.length > 0) body.finishings = meta.finishings;
  if (names && names > 1) body.names = names;

  const quote = quoteProduct(product, body);
  let unitAmount = Number(quote.unitCents || Math.round(Number(quote.totalCents || 0) / item.quantity));

  if (!Number.isFinite(unitAmount) || unitAmount <= 0) {
    throw new Error(`Unable to price item: ${item.name}`);
  }

  // Apply print-only discount for display stands ordered without hardware
  if (String(item.meta?.orderType ?? "").trim() === "print-only") {
    unitAmount = Math.round(unitAmount * (1 - PRINT_ONLY_DISCOUNT_RATE));
  }

  if (unitAmount < MIN_UNIT_AMOUNT) {
    throw new Error(`Price too low for ${item.name} (minimum $${(MIN_UNIT_AMOUNT / 100).toFixed(2)})`);
  }

  unitAmount = Math.round(unitAmount);

  // Apply rush surcharge
  const rushApplied = String(item.meta?.rushProduction ?? "false").trim() === "true";
  if (rushApplied) {
    unitAmount = Math.round(unitAmount * RUSH_MULTIPLIER);
  }

  return {
    quantity: item.quantity,
    unitAmount,
    lineTotal: unitAmount * item.quantity,
    rushApplied,
  };
}

/**
 * Calculate total design help fee for a set of items.
 * Returns $45 per line item that has designHelp enabled.
 */
export function calculateDesignHelpFee(
  items: Array<{ meta?: Record<string, string | number | boolean> | null }>
): { count: number; totalCents: number } {
  const count = items.filter((item) => {
    const m = item.meta || {};
    return m.designHelp === true || m.designHelp === "true";
  }).length;
  return { count, totalCents: count * DESIGN_HELP_CENTS };
}
