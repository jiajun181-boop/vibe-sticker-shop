/**
 * Auto-tagging rules engine.
 * Called after order creation to apply tags based on order properties.
 * Fire-and-forget — never throws.
 */

/**
 * Compute auto-tags for an order (with items loaded).
 * @param {{ totalAmount: number, items: Array<{meta: any, material?: string|null, quantity: number, productName: string}>, customerEmail: string, tags?: string[] }} order
 * @returns {string[]} tags to add (deduped against existing)
 */
export function computeAutoTags(order) {
  const tags = new Set(order.tags || []);
  const items = order.items || [];

  // High-value order (> $500 CAD)
  if (order.totalAmount > 50000) tags.add("high-value");

  // Rush / priority (set by admin or checkout flag)
  // Already handled at creation — no auto logic needed here

  // White ink detection
  for (const item of items) {
    const meta = item.meta && typeof item.meta === "object" ? item.meta : {};
    if (meta.whiteInkMode && meta.whiteInkMode !== "none") {
      tags.add("white-ink");
      break;
    }
  }

  // Sticker / label with contour
  for (const item of items) {
    const meta = item.meta && typeof item.meta === "object" ? item.meta : {};
    if (meta.contourSvg || meta.proofConfirmed) {
      tags.add("has-contour");
      break;
    }
  }

  // Stamp orders
  for (const item of items) {
    const name = (item.productName || "").toLowerCase();
    const meta = item.meta && typeof item.meta === "object" ? item.meta : {};
    if (name.includes("stamp") || meta.stampModel) {
      tags.add("stamp");
      break;
    }
  }

  // Large quantity (any single item > 1000)
  for (const item of items) {
    if (item.quantity > 1000) {
      tags.add("bulk");
      break;
    }
  }

  // Multi-item order
  if (items.length > 3) tags.add("multi-item");

  // Transparent material (needs production attention)
  const transparentMaterials = ["clear-vinyl", "frosted-vinyl", "holographic-vinyl", "clear-static-cling", "frosted-static-cling", "clear-bopp"];
  for (const item of items) {
    const mat = item.material || (item.meta && typeof item.meta === "object" ? item.meta.material : null);
    if (mat && transparentMaterials.includes(mat)) {
      tags.add("transparent-material");
      break;
    }
  }

  // Large format (any item wider or taller than 24")
  for (const item of items) {
    const meta = item.meta && typeof item.meta === "object" ? item.meta : {};
    const w = item.widthIn || Number(meta.width) || 0;
    const h = item.heightIn || Number(meta.height) || 0;
    if (w > 24 || h > 24) {
      tags.add("large-format");
      break;
    }
  }

  // Two-sided print
  for (const item of items) {
    const meta = item.meta && typeof item.meta === "object" ? item.meta : {};
    if (meta.sides === "double" || meta.sides === "2" || meta.sides === 2 || meta.doubleSided === true || meta.doubleSided === "true") {
      tags.add("two-sided");
      break;
    }
  }

  // Custom size
  for (const item of items) {
    const meta = item.meta && typeof item.meta === "object" ? item.meta : {};
    if (meta.sizeMode === "custom" || meta.customWidth) {
      tags.add("custom-size");
      break;
    }
  }

  // Design help requested
  for (const item of items) {
    const meta = item.meta && typeof item.meta === "object" ? item.meta : {};
    if (meta.designHelp === true || meta.designHelp === "true") {
      tags.add("design-help");
      break;
    }
  }

  // Rush production
  for (const item of items) {
    const meta = item.meta && typeof item.meta === "object" ? item.meta : {};
    if (meta.turnaround === "rush" || meta.rushProduction === true || meta.rushProduction === "true") {
      tags.add("rush");
      break;
    }
  }

  // Upload-later artwork intent (customer will send artwork after ordering)
  for (const item of items) {
    const meta = item.meta && typeof item.meta === "object" ? item.meta : {};
    if (meta.artworkIntent === "upload-later") {
      tags.add("upload-later");
      break;
    }
  }

  // Missing artwork (needs follow-up)
  for (const item of items) {
    const meta = item.meta && typeof item.meta === "object" ? item.meta : {};
    const hasFile = !!(item.fileUrl || meta.artworkUrl || meta.fileUrl || meta.stampPreviewUrl);
    if (!hasFile && !meta.fileName) {
      tags.add("missing-artwork");
      break;
    }
  }

  // Booklet / NCR (production-specific workflows)
  for (const item of items) {
    const name = (item.productName || "").toLowerCase();
    if (name.includes("booklet") || name.includes("catalog")) { tags.add("booklet"); break; }
  }
  for (const item of items) {
    const name = (item.productName || "").toLowerCase();
    if (name.includes("ncr") || name.includes("carbonless")) { tags.add("ncr"); break; }
  }

  // Foil press job (business cards with foil)
  for (const item of items) {
    const meta = item.meta && typeof item.meta === "object" ? item.meta : {};
    if (meta.foilCoverage) {
      tags.add("foil-press");
      break;
    }
  }

  // Food-safe label (needs compliance check)
  for (const item of items) {
    const meta = item.meta && typeof item.meta === "object" ? item.meta : {};
    if (meta.foodUse === true || meta.foodUse === "yes") {
      tags.add("food-safe");
      break;
    }
  }

  // Multi-name business card (needs multiple files)
  for (const item of items) {
    const meta = item.meta && typeof item.meta === "object" ? item.meta : {};
    if (meta.names && meta.names > 1) {
      tags.add("multi-name");
      break;
    }
  }

  // Vehicle graphics (wraps, door, DOT, compliance)
  for (const item of items) {
    const name = (item.productName || "").toLowerCase();
    const meta = item.meta && typeof item.meta === "object" ? item.meta : {};
    if (meta.vehicleType || meta.vehicleBody || name.includes("vehicle") || name.includes("wrap") || name.includes("fleet")) {
      tags.add("vehicle");
      const typeId = (meta.vehicleType || "").toLowerCase();
      if (typeId.includes("dot") || typeId.includes("compliance") || typeId.includes("cvor")) {
        tags.add("compliance");
      }
      if (typeId.includes("wrap")) {
        tags.add("wide-format");
      }
      break;
    }
  }

  // Lamination required (vehicle, sign, banner)
  for (const item of items) {
    const meta = item.meta && typeof item.meta === "object" ? item.meta : {};
    if (meta.lamination || meta.laminate) {
      tags.add("lamination");
      break;
    }
  }

  // Numbering (tickets, tags, NCR, order forms)
  for (const item of items) {
    const meta = item.meta && typeof item.meta === "object" ? item.meta : {};
    if (meta.numbering) {
      tags.add("numbering");
      break;
    }
  }

  // Coating (UV, aqueous, etc.)
  for (const item of items) {
    const meta = item.meta && typeof item.meta === "object" ? item.meta : {};
    if (meta.coating && meta.coating !== "none") {
      tags.add("coating");
      break;
    }
  }

  // Folding (brochures, menus, greeting cards)
  for (const item of items) {
    const meta = item.meta && typeof item.meta === "object" ? item.meta : {};
    if (meta.fold && meta.fold !== "none") {
      tags.add("fold");
      break;
    }
  }

  // Floor graphic (safety compliance)
  for (const item of items) {
    const name = (item.productName || "").toLowerCase();
    const meta = item.meta && typeof item.meta === "object" ? item.meta : {};
    if (name.includes("floor") || meta.application === "floor") {
      tags.add("floor-graphic");
      break;
    }
  }

  // Product-name-based tags
  const productNameTags = [
    { keywords: ["canvas"], tag: "canvas" },
    { keywords: ["banner", "backdrop"], tag: "banner" },
    { keywords: ["sign", "foam board", "pvc", "aluminum", "yard sign"], tag: "sign" },
    { keywords: ["business card"], tag: "business-card" },
    { keywords: ["retractable", "x-banner", "display", "tabletop"], tag: "display" },
    { keywords: ["poster"], tag: "wide-format" },
    { keywords: ["decal"], tag: "decal" },
    { keywords: ["vinyl lettering"], tag: "vinyl-lettering" },
    { keywords: ["window film", "window graphic", "perforated"], tag: "window" },
    { keywords: ["a-frame"], tag: "a-frame" },
    { keywords: ["magnetic sign", "magnetic car", "magnetic truck"], tag: "magnetic" },
    { keywords: ["flyer", "brochure", "postcard", "rack card", "door hanger"], tag: "standard-print" },
    { keywords: ["menu", "notepad", "letterhead"], tag: "standard-print" },
    { keywords: ["ticket", "raffle"], tag: "ticket" },
  ];
  for (const rule of productNameTags) {
    for (const item of items) {
      const pName = (item.productName || "").toLowerCase();
      if (rule.keywords.some((kw) => pName.includes(kw))) {
        tags.add(rule.tag);
        break;
      }
    }
  }

  return [...tags];
}

/**
 * Apply auto-tags to an order (server-side, calls Prisma).
 * Non-blocking — never throws.
 * @param {string} orderId
 * @param {import("@prisma/client").PrismaClient} prisma
 */
export async function applyAutoTags(orderId, prisma) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order) return;

    const newTags = computeAutoTags(order);
    if (newTags.length === 0) return;

    // Only update if tags actually changed
    const currentTags = order.tags || [];
    const merged = [...new Set([...currentTags, ...newTags])];
    if (merged.length === currentTags.length) return;

    await prisma.order.update({
      where: { id: orderId },
      data: { tags: merged },
    });
  } catch (err) {
    console.error("[AutoTag] Failed:", err);
  }
}
