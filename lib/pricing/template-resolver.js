// lib/pricing/template-resolver.js
// Resolves which pricing template a product uses + fetches material data from DB.

import { prisma } from "@/lib/prisma";
import * as T from "./templates.js";
import { calcVinylPrice, PRINT_MODE_MULTIPLIERS, LAMINATION_MULTIPLIERS } from "./sticker-pricing.js";
import {
  buildStickerRefLedger,
  buildVinylPrintLedger,
  buildBoardSignLedger,
  buildBannerLedger,
  buildPaperPrintLedger,
  buildCanvasLedger,
  buildVinylCutLedger,
} from "./ledger-wrappers.js";

// ── Category → Template mapping ──────────────────────────────────
const CATEGORY_TEMPLATE = {
  "stickers-labels-decals": "vinyl_print",
  "signs-rigid-boards": "board_sign",
  "banners-displays": "banner",
  "marketing-business-print": "paper_print",
  "marketing-prints": "paper_print", // alias — some seeds use this category name
  "canvas-prints": "canvas",
  "vehicle-graphics-fleet": "vinyl_cut",
  "vehicle-branding-advertising": "vinyl_cut", // vehicle wraps, decals
  "windows-walls-floors": "vinyl_print", // same as stickers (vinyl on glass)
  "display-stands": "banner", // banner stands, X-frames
  "fleet-compliance-id": "vinyl_print", // TSSA, CVOR, DOT stickers
  "safety-warning-decals": "vinyl_print", // safety label stickers
  "facility-asset-labels": "vinyl_print", // floor graphics, labels
  "packaging": "paper_print", // packaging inserts, thank-you cards
  "retail-promo": "paper_print", // wobblers, shelf talkers, danglers
  "large-format-graphics": "vinyl_print", // window graphics, wall murals, floor graphics
};

// ── Slug-level template overrides ───────────────────────────────
// Some products need a different pricing template than their category default.
const SLUG_TEMPLATE_OVERRIDE = {
  "magnetic-car-signs": "vinyl_print", // magnetic signs are printed, not just cut vinyl
};

// ── Slug-level synthetic materials ──────────────────────────────
// For products whose real material cost differs greatly from the DB alias.
const SLUG_SYNTHETIC_MATERIAL = {
  "magnetic-car-signs": { name: "Magnetic Vinyl 30mil", costPerSqft: 4.00 },
  "magnet-stickers": { name: "Magnetic Vinyl 30mil", costPerSqft: 4.00 },
};

// ── Category → Margin category mapping ───────────────────────────
// Maps product.category to the margin tier category in templates.js
const CATEGORY_MARGIN = {
  "stickers-labels-decals": "stickers",
  "signs-rigid-boards": "signs",
  "banners-displays": "banners",
  "marketing-business-print": "print",
  "marketing-prints": "print", // alias — some seeds use this category name
  "canvas-prints": "canvas",
  "vehicle-graphics-fleet": "vehicle",
  "vehicle-branding-advertising": "vehicle",
  "windows-walls-floors": "wwf",
  "display-stands": "banners",
  "fleet-compliance-id": "stickers",
  "safety-warning-decals": "stickers",
  "facility-asset-labels": "stickers",
  "packaging": "print",
  "retail-promo": "print",
  "large-format-graphics": "wwf",
};

// ── Material name aliases → DB name lookup ───────────────────────
const MATERIAL_ALIASES = {
  // Vinyl
  white_vinyl: "Regular White Vinyl (Orajet 3164)",
  clear_vinyl: "Clear Vinyl",
  frosted_vinyl: "Frosted Vinyl (Etch Glass)",
  reflective: "Reflective Vinyl",
  holographic: "GF 765 Holographic Film",
  static_white: "White Static Cling",
  static_clear: "Clear Static Cling",
  removable_white: "Removable White Vinyl",
  perforated: "Perforated Vinyl (Removable)",
  translucent: "Translucent Vinyl (Removable)",
  blockout_perm: "Blockout Vinyl (Permanent)",
  blockout_remov: "Blockout Vinyl (Removable)",
  poster_paper: "Poster Paper (Matte/Gloss 220gsm)",
  paper_label: "Paper Label Stock",
  // Boards
  coroplast_4mm: "Coroplast 4mm",
  coroplast_6mm: "Coroplast 6mm",
  coroplast_10mm: "Coroplast 10mm",
  foam_5mm: "Foam Board 5mm",
  foam_10mm: "Foam Board 10mm",
  pvc_3mm: "PVC Board 3mm",
  // Banners
  "13oz_frontlit": "13oz Frontlit Vinyl Banner",
  "8oz_mesh": "8oz Mesh Vinyl Banner",
  pet_greyback: "PET Grey Back (Roll-up) 10oz FR",
  pet_doublesided: "PET 15oz Double-Sided FR",
  // Paper
  "14pt_cardstock": "14pt Card Stock",
  "100lb_coated": "100lb Coated Paper",
  "20lb_bond": "20lb Bond Paper",
  ncr_2part: "NCR 2-Part",
  ncr_3part: "NCR 3-Part",
  ncr_4part: "NCR 4-Part",
  envelope_regular: "Envelope #10 Regular",
  envelope_window: "Envelope #10 Window",
  // Canvas
  canvas: "Canvas",
  // Lamination
  gloss_lam: "OPP Gloss Lamination",
  matte_lam: "OPP Matte Lamination",
  // ── Frontend material IDs (kebab-case from order configs) ──
  "white-vinyl": "Regular White Vinyl (Orajet 3164)",
  "matte-vinyl": "Regular White Vinyl (Orajet 3164)",
  matte: "Regular White Vinyl (Orajet 3164)", // legacy alias
  "clear-vinyl": "Clear Vinyl",
  clear: "Clear Vinyl", // legacy alias
  "frosted-vinyl": "Frosted Vinyl (Etch Glass)",
  "holographic-vinyl": "GF 765 Holographic Film",
  holographic: "GF 765 Holographic Film", // legacy alias
  "3m-reflective": "Reflective Vinyl",
  reflective: "Reflective Vinyl", // legacy alias
  "heavy-duty-vinyl": "Regular White Vinyl (Orajet 3164)",
  "gloss-paper": "Paper Label Stock",
  "glossy-paper": "Paper Label Stock", // legacy alias
  "matte-paper": "Paper Label Stock",
  "soft-touch-paper": "Paper Label Stock",
  "foil-stamping": "Paper Label Stock",
  "clear-static-cling": "Clear Static Cling",
  "frosted-static-cling": "Clear Static Cling",
  "white-static-cling": "White Static Cling",
  // Roll labels BOPP
  "white-gloss-bopp": "Paper Label Stock",
  "matte-white-bopp": "Paper Label Stock",
  "clear-bopp": "Clear Vinyl",
  "silver-brushed-bopp": "Paper Label Stock",
  "freezer-grade-bopp": "Paper Label Stock",
  "white-bopp": "Paper Label Stock", // legacy alias
  "kraft-paper": "Paper Label Stock",
  silver: "Paper Label Stock",
  // Other sticker materials
  outdoor: "Regular White Vinyl (Orajet 3164)",
  indoor: "Regular White Vinyl (Orajet 3164)",
  "floor-nonslip": "Regular White Vinyl (Orajet 3164)",
  "transfer-vinyl": "Regular White Vinyl (Orajet 3164)",
  "white-cling": "White Static Cling",
  "clear-cling": "Clear Static Cling",
  "magnetic-vinyl": "Regular White Vinyl (Orajet 3164)",
  // ── Sign board materials (kebab-case from sign-order-config) ──
  "4mm-coroplast": "Coroplast 4mm",
  "6mm-coroplast": "Coroplast 6mm",
  "3/16-foam": "Foam Board 5mm",
  "1/2-foam": "Foam Board 10mm",
  gatorboard: "Foam Board 10mm",
  "3mm-pvc": "PVC Board 3mm",
  "6mm-pvc": "PVC Board 3mm",
  "clear-acrylic": "Coroplast 4mm",
  "frosted-acrylic": "Coroplast 4mm",
  "black-acrylic": "Coroplast 4mm",
  "aluminum-040": "Coroplast 4mm",
  "aluminum-063": "Coroplast 4mm",
  "acm-dibond": "Coroplast 4mm",
  "aluminum-panel": "Coroplast 4mm",
  // ── Standalone sign configurator material IDs ──
  // Yard signs (corrugated plastic / Coroplast)
  "4mm-corrugated": "Coroplast 4mm",
  "6mm-corrugated": "Coroplast 6mm",
  "10mm-corrugated": "Coroplast 10mm",
  // A-Frame sign inserts
  "corrugated-inserts": "Coroplast 4mm",
  "aluminum-inserts": "Coroplast 4mm",  // no aluminum material in DB yet
  "pvc-inserts": "PVC Board 3mm",
  // Aluminum sign thicknesses (no aluminum material in DB yet — map to Coroplast)
  "0.040": "Coroplast 4mm",
  "0.063": "Coroplast 4mm",
  "0.080": "Coroplast 4mm",
  // Foam board thicknesses
  "3mm": "PVC Board 3mm",       // 3mm foam → closest DB material
  "5mm": "Foam Board 5mm",
  "10mm": "Foam Board 10mm",
  // Magnetic sign thicknesses
  "30mil": "Regular White Vinyl (Orajet 3164)",
  "45mil": "Regular White Vinyl (Orajet 3164)",
  // PVC sign thicknesses
  "6mm": "PVC Board 3mm",       // 6mm PVC → closest DB material
  // Note: "3mm" already mapped above; "10mm" already mapped above
  // ── Banner materials (kebab-case from banner-order-config) ──
  "13oz-vinyl": "13oz Frontlit Vinyl Banner",
  "15oz-blockout": "PET 15oz Double-Sided FR",
  "mesh-standard": "8oz Mesh Vinyl Banner",
  "mesh-heavy": "8oz Mesh Vinyl Banner",
  "18oz-vinyl": "13oz Frontlit Vinyl Banner",
  "premium-vinyl": "PET Grey Back (Roll-up) 10oz FR",
  polyester: "13oz Frontlit Vinyl Banner",
  satin: "13oz Frontlit Vinyl Banner",
  fabric: "13oz Frontlit Vinyl Banner",
  vinyl: "13oz Frontlit Vinyl Banner",
  // ── Vehicle materials (kebab-case from vehicle-order-config) ──
  "cast-vinyl": "Regular White Vinyl (Orajet 3164)",
  calendered: "Regular White Vinyl (Orajet 3164)",
  "avery-cast": "Regular White Vinyl (Orajet 3164)",
  "outdoor-vinyl": "Regular White Vinyl (Orajet 3164)",
  "magnetic-30mil": "Regular White Vinyl (Orajet 3164)",
  // ── Notepad paper IDs ──
  "70lb-offset": "100lb Coated Paper",
  "60lb-recycled": "20lb Bond Paper",
  // ── Marketing print paper IDs (kebab-case from marketing-print-order-config) ──
  "14pt-gloss": "14pt Card Stock",
  "14pt-matte": "14pt Card Stock",
  "16pt-gloss": "14pt Card Stock",
  "16pt-matte": "14pt Card Stock",
  "32pt-ultra": "14pt Card Stock",
  "17pt-magnet": "14pt Card Stock",
  "100lb-gloss-text": "100lb Coated Paper",
  "80lb-gloss-text": "100lb Coated Paper",
  "80lb-matte-text": "100lb Coated Paper",
  "100lb-gloss": "100lb Coated Paper",
  "100lb-matte": "100lb Coated Paper",
  "adhesive": "Regular White Vinyl (Orajet 3164)",
  "backlit-film": "Backlit Film",
  classic: "14pt Card Stock",
  gloss: "14pt Card Stock",
  "soft-touch": "14pt Card Stock",
  "gold-foil": "14pt Card Stock",
  linen: "14pt Card Stock",
  pearl: "14pt Card Stock",
  thick: "14pt Card Stock",
  magnet: "14pt Card Stock",
  // ── Surface/WWF materials (kebab-case from surface/wwf configs) ──
  "perforated-vinyl": "Perforated Vinyl (Removable)",
  "transparent-film": "Translucent Vinyl (Removable)",
  "clear-film": "Clear Vinyl",
  "frosted-film": "Frosted Vinyl (Etch Glass)",
  "static-cling-frosted": "White Static Cling",
  "static-cling-clear": "Clear Static Cling",
  "blockout-vinyl": "Blockout Vinyl (Permanent)",
  "blockout-vinyl-rem": "Blockout Vinyl (Removable)",
  "removable-white": "Removable White Vinyl",
  "wall-repositionable": "Removable White Vinyl",
  "clear-vinyl": "Clear Vinyl",
  "floor-vinyl": "Regular White Vinyl (Orajet 3164)",
  "floor-anti-slip": "Regular White Vinyl (Orajet 3164)",
  // ── Additional surface/WWF material IDs ──
  "wall-permanent": "Regular White Vinyl (Orajet 3164)",
  "wall-fabric": "Regular White Vinyl (Orajet 3164)",
  "floor-vinyl-nonslip": "Regular White Vinyl (Orajet 3164)",
  "floor-removable": "Removable White Vinyl",
  // ── Booklet interior papers ──
  "100lb-matte-text": "100lb Coated Paper",
  "80lb-uncoated": "100lb Coated Paper",
  // ── Letterhead / envelope papers ──
  "70lb-white-offset": "100lb Coated Paper",
  "24lb-bond": "20lb Bond Paper",
  "20lb-bond": "20lb Bond Paper",
  // ── Marketing print C2S cardstock variants ──
  "14pt-c2s": "14pt Card Stock",
  "16pt-c2s": "14pt Card Stock",
  "18pt-c2s": "14pt Card Stock",
  // ── Banner config alias ──
  "pet-grey-back": "PET Grey Back (Roll-up) 10oz FR",
};

// ── Material family classification ──────────────────────────────────
// Maps DB material names to their material family for cross-template validation.
// Prevents impossible combos like business cards priced with sticker vinyl.
const MATERIAL_DB_FAMILY = {
  // Vinyl family — printed/cut vinyl, used in vinyl_print and vinyl_cut
  "Regular White Vinyl (Orajet 3164)": "vinyl",
  "Clear Vinyl": "vinyl",
  "Frosted Vinyl (Etch Glass)": "vinyl",
  "Reflective Vinyl": "vinyl",
  "GF 765 Holographic Film": "vinyl",
  "White Static Cling": "vinyl",
  "Clear Static Cling": "vinyl",
  "Removable White Vinyl": "vinyl",
  "Perforated Vinyl (Removable)": "vinyl",
  "Translucent Vinyl (Removable)": "vinyl",
  "Blockout Vinyl (Permanent)": "vinyl",
  "Blockout Vinyl (Removable)": "vinyl",
  "Poster Paper (Matte/Gloss 220gsm)": "vinyl", // large-format, vinyl_print workflow
  // Board family — rigid substrates for signs
  "Coroplast 4mm": "board",
  "Coroplast 6mm": "board",
  "Coroplast 10mm": "board",
  "Foam Board 5mm": "board",
  "Foam Board 10mm": "board",
  "PVC Board 3mm": "board",
  // Banner family — flexible banner media
  "13oz Frontlit Vinyl Banner": "banner",
  "8oz Mesh Vinyl Banner": "banner",
  "PET Grey Back (Roll-up) 10oz FR": "banner",
  "PET 15oz Double-Sided FR": "banner",
  // Paper family — small-format paper stocks
  "14pt Card Stock": "paper",
  "100lb Coated Paper": "paper",
  "20lb Bond Paper": "paper",
  "NCR 2-Part": "paper",
  "NCR 3-Part": "paper",
  "NCR 4-Part": "paper",
  "Envelope #10 Regular": "paper",
  "Envelope #10 Window": "paper",
  "Backlit Film": "paper", // translucent film used in marketing print context
  // Label family — adhesive label stock (valid for both stickers and paper prints)
  "Paper Label Stock": "label",
  // Canvas family
  "Canvas": "canvas",
  // Lamination — add-on, not a primary material
  "OPP Gloss Lamination": "lamination",
  "OPP Matte Lamination": "lamination",
};

// Which material families each pricing template accepts.
// null = skip validation (template uses internal mapping or hardcoded material).
const TEMPLATE_VALID_FAMILIES = {
  vinyl_print: ["vinyl", "label"],  // stickers + paper labels
  board_sign: ["board"],            // rigid sign substrates only
  banner: ["banner"],               // banner media only
  paper_print: ["paper", "label"],  // paper stocks + label stock
  canvas: null,                     // hardcoded to "Canvas" material
  vinyl_cut: ["vinyl"],             // cut vinyl only
};

/**
 * Get the pricing template name for a product.
 * @param {{ slug?: string, category?: string }} product
 * @returns {string|null}
 */
export function getProductTemplate(product) {
  return SLUG_TEMPLATE_OVERRIDE[product?.slug] || CATEGORY_TEMPLATE[product?.category] || null;
}

/**
 * Validate whether a material alias is compatible with a pricing template.
 * Returns { valid: true } or { valid: false, reason, ... } with operator-readable detail.
 *
 * @param {string} materialAlias - material ID/alias from operator input
 * @param {string} template - pricing template name (vinyl_print, paper_print, etc.)
 * @returns {{ valid: boolean, reason?: string, materialFamily?: string, allowedFamilies?: string[], resolvedDbName?: string }}
 */
export function validateMaterialForTemplate(materialAlias, template, options = {}) {
  if (!materialAlias || !template) return { valid: true };

  const allowedFamilies = TEMPLATE_VALID_FAMILIES[template];
  if (!allowedFamilies) return { valid: true }; // null = no validation needed

  // Resolve alias to DB material name
  const dbName = MATERIAL_ALIASES[materialAlias] || materialAlias;
  const family = MATERIAL_DB_FAMILY[dbName];

  // Unknown material family
  if (!family) {
    if (options.strict) {
      return {
        valid: false,
        reason: `"${materialAlias}" is not a recognized material. Use a known material alias or exact DB name.`,
        resolvedDbName: dbName,
        allowedFamilies,
      };
    }
    return { valid: true }; // permissive for storefront
  }

  // Lamination is an add-on, not a primary material
  if (family === "lamination") {
    return {
      valid: false,
      reason: `"${materialAlias}" is a lamination add-on, not a primary material`,
      materialFamily: family,
      allowedFamilies,
      resolvedDbName: dbName,
    };
  }

  if (!allowedFamilies.includes(family)) {
    const familyLabels = { vinyl: "vinyl/sticker", board: "sign board", banner: "banner", paper: "paper", label: "label", canvas: "canvas" };
    return {
      valid: false,
      reason: `"${materialAlias}" is a ${familyLabels[family] || family} material — not compatible with ${template} pricing. Valid families: ${allowedFamilies.join(", ")}`,
      materialFamily: family,
      allowedFamilies,
      resolvedDbName: dbName,
    };
  }

  return { valid: true, materialFamily: family, resolvedDbName: dbName };
}

// ── Sticker material ID mapping (frontend kebab-case → calcVinylPrice underscore IDs) ──
const STICKER_MAT_MAP = {
  "white-vinyl": "white_vinyl",
  "matte-vinyl": "matte_vinyl",
  "clear-vinyl": "clear_vinyl",
  "frosted-vinyl": "frosted_vinyl",
  "heavy-duty-vinyl": "heavy_duty_vinyl",
  "3m-reflective": "reflective_3m",
  "holographic-vinyl": "frosted_vinyl", // use frosted pricing as proxy
  "holographic": "frosted_vinyl",       // short alias from die-cut/kiss-cut configurators
  "kraft": "kraft_paper",               // kraft paper from die-cut configurator
  "gloss-paper": "paper_gloss",
  "matte-paper": "paper_matte",
  "soft-touch-paper": "paper_soft",
  "foil-stamping": "paper_foil",
  "clear-static-cling": "static_cling_clear",
  "frosted-static-cling": "static_cling_frosted",
  "white-static-cling": "static_cling_white",
};

/** Setup / plate fee — covers file prep, die creation, machine setup.
 *  Overridable via Setting key "pricing.setup.sticker" (in dollars). */
const STICKER_SETUP_FEE_CENTS_DEFAULT = 1200; // $12 CAD

/**
 * Sticker reference-table pricing — uses the competitor-calibrated
 * BASE_PRICE_TABLE via calcVinylPrice instead of cost-based vinylPrint.
 * Adds a flat $12 setup fee so small orders are profitable while
 * large orders see clear volume discounts.
 */
function calculateStickerRefPrice(input, settings) {
  const matId = STICKER_MAT_MAP[input.material] || input.material?.replace(/-/g, '_') || "white_vinyl";
  const cutType = input.options?.cutType || "die_cut";

  const opts = {};
  if (input.options?.shapeSurcharge) opts.shapeSurcharge = Number(input.options.shapeSurcharge);
  const pm = input.options?.printMode;
  if (pm && PRINT_MODE_MULTIPLIERS[pm]) opts.printModeMultiplier = PRINT_MODE_MULTIPLIERS[pm];
  const lam = input.options?.lamination;
  if (lam && lam !== "none" && LAMINATION_MULTIPLIERS[lam]) opts.laminationMultiplier = LAMINATION_MULTIPLIERS[lam];
  if (input.options?.turnaroundMultiplier) opts.turnaroundMultiplier = Number(input.options.turnaroundMultiplier);

  const result = calcVinylPrice(
    input.widthIn || 2,
    input.heightIn || 2,
    input.quantity,
    matId,
    cutType,
    opts,
  );

  // Setup fee — overridable via settings (stored in dollars, convert to cents)
  const setupFeeDollars = settings?.["pricing.setup.sticker"] ?? 12.00;
  const setupFeeCents = Math.round(setupFeeDollars * 100);

  const refCents = Math.round(result.totalPrice * 100);
  const totalCents = refCents + setupFeeCents;
  const unitCents = Math.round(totalCents / input.quantity);

  const stickerResult = {
    totalCents,
    unitCents,
    currency: "CAD",
    template: "sticker_ref",
    priceLevel: "retail",
    breakdown: {
      referenceTotal: refCents,
      setupFee: setupFeeCents,
      finalPrice: totalCents,
    },
    meta: {
      material: matId,
      cutType,
      widthIn: input.widthIn,
      heightIn: input.heightIn,
      pricingModel: "reference_table",
    },
  };

  // Attach Quote Ledger
  try {
    stickerResult.quoteLedger = buildStickerRefLedger(stickerResult, input);
  } catch { /* non-critical */ }

  return stickerResult;
}

async function findMaterial(nameOrAlias, findOpts = {}) {
  const dbName = MATERIAL_ALIASES[nameOrAlias] || nameOrAlias;
  // Try exact name match first
  let mat = await prisma.material.findFirst({
    where: { name: dbName, isActive: true },
  });
  // Fallback: case-insensitive partial match (skipped in strict/admin mode)
  if (!mat && !findOpts.exactOnly) {
    mat = await prisma.material.findFirst({
      where: { name: { contains: dbName, mode: "insensitive" }, isActive: true },
    });
  }
  return mat;
}

async function findHardwareItems(slugs) {
  if (!Array.isArray(slugs) || slugs.length === 0) return [];
  return prisma.hardwareItem.findMany({
    where: { slug: { in: slugs }, isActive: true },
  });
}

async function getSettingNum(key, fallback) {
  const s = await prisma.setting.findUnique({ where: { key } });
  return s ? Number(s.value) : fallback;
}

async function getInkRate() {
  return getSettingNum("ink_rate_sqft", 0.035);
}

/**
 * Batch-fetch all pricing.* settings for passing to template functions.
 * Returns a flat { key: numericValue } object.
 */
async function getPricingSettings() {
  try {
    const rows = await prisma.setting.findMany({
      where: { key: { startsWith: "pricing." } },
    });
    const result = {};
    for (const r of rows) {
      result[r.key] = typeof r.value === "number" ? r.value : Number(r.value);
    }
    return result;
  } catch {
    return {}; // fallback — template functions use their own defaults
  }
}

// ── Outsourced product pricing ───────────────────────────────────
// fixedPrices values are TOTAL CENTS per tier (not unit cents).
// e.g. { "3.5\" × 2\" - Double Sided": { "500": 6800 } } means $68 for 500.
function getOutsourcedPrice(product, input) {
  const cfg = product.pricingConfig || product.optionsConfig;
  if (!cfg) return null;

  const fixedPrices = cfg.fixedPrices;
  if (!fixedPrices) return null;

  const sizeKey = input.sizeLabel || `${input.widthIn}x${input.heightIn}`;
  const sizePrices = fixedPrices[sizeKey];
  if (!sizePrices) return null;

  const qty = input.quantity;
  const qtyKeys = Object.keys(sizePrices).map(Number).sort((a, b) => a - b);
  let matchQty = qtyKeys[0];
  for (const q of qtyKeys) {
    if (qty >= q) matchQty = q;
  }
  const totalCents = sizePrices[String(matchQty)];
  if (!totalCents) return null;

  const unitCents = Math.round(totalCents / qty);
  return {
    totalCents,
    unitCents,
    currency: "CAD",
    template: "outsourced",
    priceLevel: "retail",
    breakdown: {
      fixedPrice: totalCents,
      profitMargin: 0,
      finalPrice: totalCents,
    },
    meta: { sizeKey, qtyTier: matchQty, source: "fixedPrices" },
  };
}

// ── Poster fixed pricing (large-format, area-based) ──────────────
// Posters use a different cost structure than small-format paper prints.
// Unit prices in cents by size "WxH" and quantity tier.
const POSTER_UNIT_PRICES = {
  "11x17":  { 1: 899, 5: 649, 10: 549, 25: 449, 50: 399, 100: 349 },
  "18x24":  { 1: 1499, 5: 1049, 10: 899, 25: 749, 50: 649, 100: 549 },
  "24x36":  { 1: 2499, 5: 1749, 10: 1499, 25: 1249, 50: 1099, 100: 949 },
  "27x40":  { 1: 2999, 5: 2099, 10: 1799, 25: 1499, 50: 1299, 100: 1099 },
  "36x48":  { 1: 4499, 5: 3149, 10: 2699, 25: 2249, 50: 1949, 100: 1699 },
};

function getPosterPrice(input) {
  const w = Math.round(input.widthIn || 0);
  const h = Math.round(input.heightIn || 0);
  const sizeKey = `${w}x${h}`;
  const qty = input.quantity || 1;
  const tiers = POSTER_UNIT_PRICES[sizeKey];

  let unitCents;
  if (tiers) {
    const qtyKeys = Object.keys(tiers).map(Number).sort((a, b) => a - b);
    let matchQty = qtyKeys[0];
    for (const q of qtyKeys) { if (qty >= q) matchQty = q; }
    unitCents = tiers[matchQty];
  } else {
    // Custom size: area-based pricing ($3.50/sqft base, with volume discounts)
    const areaSqFt = (input.widthIn * input.heightIn) / 144;
    const basePerUnit = Math.max(899, Math.round(areaSqFt * 350));
    const discount = qty >= 100 ? 0.60 : qty >= 50 ? 0.55 : qty >= 25 ? 0.50 : qty >= 10 ? 0.40 : qty >= 5 ? 0.28 : 0;
    unitCents = Math.round(basePerUnit * (1 - discount));
  }

  const totalCents = unitCents * qty;
  return {
    totalCents,
    unitCents,
    currency: "CAD",
    template: "poster_fixed",
    priceLevel: "retail",
    breakdown: { sizeKey, qtyTier: qty },
    meta: { source: "poster_fixed" },
  };
}

// ═══════════════════════════════════════════════════════════════════
// MAIN: resolve template and compute price
// ═══════════════════════════════════════════════════════════════════
export async function calculatePrice(product, input, calcOptions = {}) {
  const template = SLUG_TEMPLATE_OVERRIDE[product.slug] || CATEGORY_TEMPLATE[product.category];
  const marginCategory = CATEGORY_MARGIN[product.category] || "stickers";
  const fOpts = calcOptions.strict ? { exactOnly: true } : {};

  // ── Quote-only products (vehicle wraps, floor decals) ──
  if (product.pricingUnit === "quote") {
    return {
      totalCents: 0,
      unitCents: 0,
      currency: "CAD",
      template: "quote_only",
      priceLevel: "retail",
      breakdown: {},
      meta: { message: "Contact us for a quote" },
    };
  }

  // ── Outsourced products: fixed prices from backend ──
  const outsourced = getOutsourcedPrice(product, input);
  if (outsourced) return outsourced;

  // ── Poster pricing override (area-based, bypasses paper_print template) ──
  if (product.slug === "posters" || product.slug?.startsWith("posters-")) {
    return getPosterPrice(input);
  }

  // ── PricingPreset tier lookup (for products with per-size pricing) ──
  if (product.pricingPreset?.config?.sizes && input.sizeLabel) {
    const sizeEntry = product.pricingPreset.config.sizes.find(
      (s) => s.label === input.sizeLabel
    );
    if (sizeEntry?.tiers) {
      const qty = input.quantity;
      const tiers = [...sizeEntry.tiers].sort((a, b) => a.qty - b.qty);
      let matched = tiers[0];
      for (const tier of tiers) {
        if (qty >= tier.qty) matched = tier;
      }
      const totalCents = Math.round(matched.unitPrice * qty * 100);
      const unitCents = Math.round(matched.unitPrice * 100);
      return {
        totalCents,
        unitCents,
        currency: "CAD",
        template: "preset",
        priceLevel: "retail",
        breakdown: { presetKey: product.pricingPreset.key, sizeLabel: input.sizeLabel },
        meta: { qtyTier: matched.qty, source: "pricingPreset" },
      };
    }
  }

  const [inkRate, settings] = await Promise.all([getInkRate(), getPricingSettings()]);

  // ── Resolve material from input or product defaults ──
  const materialId = input.material || input.options?.material || "white_vinyl";

  switch (template) {
    // ────────────────────────────────────────────────────────────
    case "vinyl_print": {
      // Sticker products: use reference-table pricing for competitive accuracy
      // and meaningful quantity-based price differences.
      // Auto-detect sticker products by category OR explicit flag.
      const isStickerProduct =
        input.options?.isSticker ||
        product.category === "stickers-labels-decals" ||
        product.type === "sticker";
      if (isStickerProduct && !SLUG_SYNTHETIC_MATERIAL[product.slug]) {
        return calculateStickerRefPrice(input, settings);
      }

      const material = SLUG_SYNTHETIC_MATERIAL[product.slug] || await findMaterial(materialId, fOpts);
      if (!material) throw Object.assign(new Error(`Material not found: ${materialId}`), { status: 422 });

      let lamination = null;
      const lamId = input.options?.lamination;
      if (lamId && lamId !== "none") {
        lamination = await findMaterial(lamId === "gloss" ? "gloss_lam" : lamId === "matte" ? "matte_lam" : lamId, fOpts);
      }

      const vpResult = T.vinylPrint({
        widthIn: input.widthIn,
        heightIn: input.heightIn,
        quantity: input.quantity,
        material,
        inkRate,
        lamination,
        options: input.options,
        marginCategory,
        settings,
      });
      try { vpResult.quoteLedger = buildVinylPrintLedger(vpResult, { ...input, slug: product.slug }); } catch { /* non-critical */ }
      return vpResult;
    }

    // ────────────────────────────────────────────────────────────
    case "board_sign": {
      const boardId = input.options?.board || materialId || "coroplast_4mm";
      const boardMaterial = await findMaterial(boardId, fOpts);
      if (!boardMaterial) throw Object.assign(new Error(`Board material not found: ${boardId}`), { status: 422 });

      const vinylMaterial = await findMaterial("white_vinyl", fOpts);
      if (!vinylMaterial) throw Object.assign(new Error("Vinyl face material not found in database"), { status: 422 });

      const bsResult = T.boardSign({
        widthIn: input.widthIn,
        heightIn: input.heightIn,
        quantity: input.quantity,
        boardMaterial,
        vinylMaterial,
        inkRate,
        options: input.options,
        marginCategory,
        settings,
      });
      try { bsResult.quoteLedger = buildBoardSignLedger(bsResult, { ...input, slug: product.slug }); } catch { /* non-critical */ }
      return bsResult;
    }

    // ────────────────────────────────────────────────────────────
    case "banner": {
      const material = await findMaterial(materialId, fOpts);
      if (!material) throw Object.assign(new Error(`Material not found: ${materialId}`), { status: 422 });

      // Resolve accessories from HardwareItem table
      let accessories = [];
      if (Array.isArray(input.accessories)) {
        const slugs = input.accessories.map(a => a.id || a.slug);
        const hwItems = await findHardwareItems(slugs);
        accessories = input.accessories.map(a => {
          const hw = hwItems.find(h => h.slug === (a.id || a.slug));
          return hw ? { ...hw, quantity: a.quantity || 1 } : null;
        }).filter(Boolean);
      }

      const bnResult = T.banner({
        widthIn: input.widthIn,
        heightIn: input.heightIn,
        quantity: input.quantity,
        material,
        inkRate,
        finishing: input.options || {},
        accessories,
        marginCategory,
        settings,
      });
      try { bnResult.quoteLedger = buildBannerLedger(bnResult, { ...input, slug: product.slug }); } catch { /* non-critical */ }
      return bnResult;
    }

    // ────────────────────────────────────────────────────────────
    case "paper_print": {
      const paperId = materialId || "14pt_cardstock";
      const paper = await findMaterial(paperId, fOpts);
      if (!paper) throw Object.assign(new Error(`Paper material not found: ${paperId}`), { status: 422 });

      const inkCostPerClick = await getSettingNum("ink_cost_color", 0.05);

      let lamination = null;
      const lamId = input.options?.lamination;
      if (lamId && lamId !== "none") {
        lamination = await findMaterial(lamId === "gloss" ? "gloss_lam" : lamId === "matte" ? "matte_lam" : lamId, fOpts);
      }

      const ppResult = T.paperPrint({
        widthIn: input.widthIn || 3.5,
        heightIn: input.heightIn || 2,
        quantity: input.quantity,
        paper,
        inkCostPerClick,
        options: input.options,
        lamination,
        marginCategory,
        settings,
      });
      try { ppResult.quoteLedger = buildPaperPrintLedger(ppResult, { ...input, slug: product.slug }); } catch { /* non-critical */ }
      return ppResult;
    }

    // ────────────────────────────────────────────────────────────
    case "canvas": {
      const canvasMaterial = await findMaterial("canvas", fOpts);
      if (!canvasMaterial) throw Object.assign(new Error("Canvas material not found in database"), { status: 422 });

      const cvResult = T.canvas({
        widthIn: input.widthIn,
        heightIn: input.heightIn,
        quantity: input.quantity,
        canvasMaterial,
        inkRate,
        options: {
          frameType: input.options?.frameType || "gallery",
          lamination: null,
        },
        marginCategory,
        settings,
      });
      try { cvResult.quoteLedger = buildCanvasLedger(cvResult, { ...input, slug: product.slug }); } catch { /* non-critical */ }
      return cvResult;
    }

    // ────────────────────────────────────────────────────────────
    case "vinyl_cut": {
      const material = await findMaterial(materialId || "white_vinyl", fOpts);
      if (!material) throw Object.assign(new Error(`Material not found: ${materialId}`), { status: 422 });

      const vcResult = T.vinylCut({
        widthIn: input.widthIn,
        heightIn: input.heightIn,
        quantity: input.quantity,
        material,
        marginCategory,
        settings,
      });
      try { vcResult.quoteLedger = buildVinylCutLedger(vcResult, { ...input, slug: product.slug }); } catch { /* non-critical */ }
      return vcResult;
    }

    default:
      throw Object.assign(new Error(`No pricing template for category: ${product.category}`), { status: 422 });
  }
}
