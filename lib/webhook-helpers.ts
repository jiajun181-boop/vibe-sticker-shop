/**
 * lib/webhook-helpers.ts — Pure helper functions extracted from webhook-handler.ts
 *
 * These functions have NO side effects, NO database calls, NO external API calls.
 * They transform Stripe metadata/session data into shapes needed for order creation.
 *
 * Extracted for:
 *   - Readability: webhook-handler.ts is shorter and focused on orchestration
 *   - Testability: these pure functions can be unit-tested without mocking
 *   - Reusability: invoice/interac paths can share the same shaping logic
 */

// ── Number parsing ──────────────────────────────────────────────

export function toNumberOrNull(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

// ── Size rows parsing ───────────────────────────────────────────

export interface SizeRow {
  width: number;
  height: number;
  quantity: number;
}

/**
 * Parse multi-size rows from order item meta.
 * Handles both pre-parsed arrays and JSON strings.
 */
export function parseSizeRows(meta: Record<string, unknown> | null): SizeRow[] | null {
  if (!meta) return null;
  const raw = meta.sizeRows;
  let rows: unknown = raw;
  if (typeof raw === "string") {
    try {
      rows = JSON.parse(raw);
    } catch {
      rows = null;
    }
  }
  if (!Array.isArray(rows)) return null;
  const normalized = rows
    .map((row) => {
      if (!row || typeof row !== "object") return null;
      const r = row as Record<string, unknown>;
      const width = toNumberOrNull(r.width ?? r.widthIn);
      const height = toNumberOrNull(r.height ?? r.heightIn);
      const quantity = toNumberOrNull(r.quantity);
      if (width == null || height == null || quantity == null) return null;
      if (width <= 0 || height <= 0 || quantity <= 0) return null;
      return { width, height, quantity };
    })
    .filter(Boolean) as SizeRow[];
  return normalized.length ? normalized : null;
}

// ── Metadata extraction ─────────────────────────────────────────

/**
 * Parse Stripe session metadata.items JSON string into array.
 * Throws on corrupted data (caller should handle).
 */
export function parseMetadataItems(
  metadata: Record<string, string> | null | undefined
): Record<string, unknown>[] {
  if (!metadata || !metadata.items) {
    throw new Error("Missing metadata");
  }
  try {
    const items = JSON.parse(metadata.items);
    if (!Array.isArray(items)) throw new Error("metadata.items is not an array");
    return items;
  } catch (err) {
    throw new Error(`Corrupted metadata: unable to parse order items — ${err instanceof Error ? err.message : "unknown"}`);
  }
}

// ── Order item shaping ──────────────────────────────────────────

export interface ShapedOrderItem {
  productId: string | null;
  productName: string;
  productType: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  widthIn: number | null;
  heightIn: number | null;
  material: string | null;
  finishing: string | null;
  meta: Record<string, unknown> | null;
  specsJson: Record<string, unknown> | null;
  fileKey: string | null;
  fileUrl: string | null;
  fileName: string | null;
}

/**
 * Shape a raw metadata item into the OrderItem create shape.
 * Pure function — no DB access.
 */
export function shapeOrderItem(item: Record<string, unknown>): ShapedOrderItem {
  const meta = item?.meta && typeof item.meta === "object"
    ? (item.meta as Record<string, unknown>)
    : null;
  const widthIn = toNumberOrNull(meta?.width);
  const heightIn = toNumberOrNull(meta?.height);
  const sizeRows = parseSizeRows(meta);
  const sizeMode = meta?.sizeMode === "multi" ? "multi" : "single";

  const fileUrl = (meta?.artworkUrl || meta?.fileUrl || null) as string | null;
  const fileKey = (meta?.artworkKey || meta?.fileKey || null) as string | null;
  const fileName = (meta?.artworkName || meta?.fileName || null) as string | null;

  const specs: Record<string, unknown> = {};
  if (meta?.editorType === "text") {
    specs.editor = {
      type: "text",
      text: meta?.editorText || "",
      font: meta?.editorFont || "",
      color: meta?.editorColor || "",
      widthIn,
      heightIn,
    };
  }
  if (sizeRows && sizeMode === "multi") {
    specs.sizeMode = "multi";
    specs.sizeRows = sizeRows;
  }
  const specsJson = Object.keys(specs).length > 0 ? specs : null;

  return {
    productId: (item.productId as string) || null,
    productName: (item.name as string) || (item.productName as string) || "Item",
    productType: (item.productType as string) || "custom",
    quantity: Number(item.quantity) || 1,
    unitPrice: Number(item.unitAmount) || 0,
    totalPrice: (Number(item.unitAmount) || 0) * (Number(item.quantity) || 1),
    widthIn,
    heightIn,
    material: (meta?.material as string) || null,
    finishing: Array.isArray(meta?.finishings)
      ? (meta.finishings as string[]).join(", ")
      : (meta?.finishing as string) || null,
    meta,
    specsJson,
    fileKey,
    fileUrl,
    fileName,
  };
}

// ── Production job shaping ──────────────────────────────────────

export interface ProductionJobShape {
  isRush: boolean;
  isTwoSided: boolean;
  artworkUrl: string | null;
  artworkKey: string | null;
  materialLabel: string | null;
  finishingLabel: string | null;
  widthIn: number | null;
  heightIn: number | null;
  material: string | null;
  finishing: string | null;
  dueAt: Date;
}

/**
 * Extract production-critical fields from an order item (Prisma-like shape).
 * Pure function — no DB access.
 */
export function shapeProductionJob(orderItem: {
  fileUrl?: string | null;
  fileKey?: string | null;
  widthIn?: number | null;
  heightIn?: number | null;
  material?: string | null;
  finishing?: string | null;
  meta?: unknown;
}): ProductionJobShape {
  const itemMeta = orderItem.meta && typeof orderItem.meta === "object"
    ? (orderItem.meta as Record<string, unknown>)
    : {};
  const isRush = itemMeta.rushProduction === true || itemMeta.rushProduction === "true";
  const isTwoSided = itemMeta.sides === "double" || itemMeta.sides === "2" ||
    itemMeta.doubleSided === true || itemMeta.doubleSided === "true";

  const artworkUrl = orderItem.fileUrl
    || (typeof itemMeta.artworkUrl === "string" ? itemMeta.artworkUrl : null)
    || (typeof itemMeta.fileUrl === "string" ? itemMeta.fileUrl : null)
    || (typeof itemMeta.frontArtworkUrl === "string" ? itemMeta.frontArtworkUrl : null)
    || null;
  const artworkKey = orderItem.fileKey
    || (typeof itemMeta.artworkKey === "string" ? itemMeta.artworkKey : null)
    || (typeof itemMeta.fileKey === "string" ? itemMeta.fileKey : null)
    || null;

  const materialLabel = typeof itemMeta.materialLabel === "string" ? itemMeta.materialLabel
    : typeof itemMeta.stockLabel === "string" ? itemMeta.stockLabel
    : null;
  const finishingLabel = typeof itemMeta.finishingLabel === "string" ? itemMeta.finishingLabel
    : typeof itemMeta.laminationLabel === "string" ? itemMeta.laminationLabel
    : null;

  const dueAt = new Date();
  dueAt.setDate(dueAt.getDate() + (isRush ? 1 : 3));

  return {
    isRush,
    isTwoSided,
    artworkUrl,
    artworkKey,
    materialLabel,
    finishingLabel,
    widthIn: orderItem.widthIn || toNumberOrNull(itemMeta.width) || null,
    heightIn: orderItem.heightIn || toNumberOrNull(itemMeta.height) || null,
    material: orderItem.material || (typeof itemMeta.material === "string" ? itemMeta.material : null),
    finishing: orderItem.finishing || (typeof itemMeta.finishing === "string" ? itemMeta.finishing : null),
    dueAt,
  };
}

// ── Timeline/note helpers ───────────────────────────────────────

export function buildOrderCreatedTimeline(paymentIntent: string) {
  return {
    action: "order_created",
    details: `Paid via Stripe (${paymentIntent})`,
    actor: "system",
  };
}

export function buildSystemNote(sessionId: string) {
  return {
    authorType: "system" as const,
    isInternal: true,
    message: `Order created via Stripe webhook: ${sessionId}`,
  };
}

/**
 * Check if a raw proof should be auto-created for an item.
 */
export function shouldAutoCreateProof(meta: Record<string, unknown> | null): boolean {
  if (!meta) return false;
  const proofConfirmed = meta.proofConfirmed === true || meta.proofConfirmed === "true";
  if (!proofConfirmed) return false;
  const proofImageUrl = meta.processedImageUrl || meta.artworkUrl || meta.fileUrl;
  return !!proofImageUrl;
}

/**
 * Get the proof image URL from item meta.
 */
export function getProofImageUrl(meta: Record<string, unknown>): string | null {
  return (meta.processedImageUrl || meta.artworkUrl || meta.fileUrl || null) as string | null;
}
