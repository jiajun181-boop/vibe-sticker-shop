// lib/pricing/template-resolver.js
// Resolves which pricing template a product uses + fetches material data from DB.

import { prisma } from "@/lib/prisma";
import * as T from "./templates.js";

// ── Category → Template mapping ──────────────────────────────────
const CATEGORY_TEMPLATE = {
  "stickers-labels-decals": "vinyl_print",
  "signs-rigid-boards": "board_sign",
  "banners-displays": "banner",
  "marketing-business-print": "paper_print",
  "canvas-prints": "canvas",
  "vehicle-graphics-fleet": "vinyl_cut",
  "windows-walls-floors": "vinyl_print", // same as stickers (vinyl on glass)
};

// ── Category → Margin category mapping ───────────────────────────
// Maps product.category to the margin tier category in templates.js
const CATEGORY_MARGIN = {
  "stickers-labels-decals": "stickers",
  "signs-rigid-boards": "signs",
  "banners-displays": "banners",
  "marketing-business-print": "print",
  "canvas-prints": "canvas",
  "vehicle-graphics-fleet": "vehicle",
  "windows-walls-floors": "wwf",
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
  matte: "Regular White Vinyl (Orajet 3164)", // matte = white vinyl + matte lamination
  clear: "Clear Vinyl",
  "glossy-paper": "Paper Label Stock",
  "white-bopp": "Paper Label Stock",
  "clear-bopp": "Clear Vinyl",
  "kraft-paper": "Paper Label Stock",
  silver: "Paper Label Stock",
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
  // ── Marketing print paper IDs (kebab-case from marketing-print-order-config) ──
  "14pt-gloss": "14pt Card Stock",
  "14pt-matte": "14pt Card Stock",
  "16pt-gloss": "14pt Card Stock",
  "16pt-matte": "14pt Card Stock",
  "18pt-cotton": "14pt Card Stock",
  "32pt-ultra": "14pt Card Stock",
  "17pt-magnet": "14pt Card Stock",
  "100lb-gloss-text": "100lb Coated Paper",
  "80lb-gloss-text": "100lb Coated Paper",
  "80lb-matte-text": "100lb Coated Paper",
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
};

async function findMaterial(nameOrAlias) {
  const dbName = MATERIAL_ALIASES[nameOrAlias] || nameOrAlias;
  // Try exact name match first
  let mat = await prisma.material.findFirst({
    where: { name: dbName, isActive: true },
  });
  // Fallback: case-insensitive partial match
  if (!mat) {
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

// ═══════════════════════════════════════════════════════════════════
// MAIN: resolve template and compute price
// ═══════════════════════════════════════════════════════════════════
export async function calculatePrice(product, input) {
  const template = CATEGORY_TEMPLATE[product.category];
  const marginCategory = CATEGORY_MARGIN[product.category] || "stickers";

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

  const inkRate = await getInkRate();

  // ── Resolve material from input or product defaults ──
  const materialId = input.material || input.options?.material || "white_vinyl";

  switch (template) {
    // ────────────────────────────────────────────────────────────
    case "vinyl_print": {
      const material = await findMaterial(materialId);
      if (!material) throw Object.assign(new Error(`Material not found: ${materialId}`), { status: 422 });

      let lamination = null;
      const lamId = input.options?.lamination;
      if (lamId && lamId !== "none") {
        lamination = await findMaterial(lamId === "gloss" ? "gloss_lam" : lamId === "matte" ? "matte_lam" : lamId);
      }

      return T.vinylPrint({
        widthIn: input.widthIn,
        heightIn: input.heightIn,
        quantity: input.quantity,
        material,
        inkRate,
        lamination,
        options: input.options,
        marginCategory,
      });
    }

    // ────────────────────────────────────────────────────────────
    case "board_sign": {
      const boardId = input.options?.board || materialId || "coroplast_4mm";
      const boardMaterial = await findMaterial(boardId);
      if (!boardMaterial) throw Object.assign(new Error(`Board material not found: ${boardId}`), { status: 422 });

      const vinylMaterial = await findMaterial("white_vinyl");

      return T.boardSign({
        widthIn: input.widthIn,
        heightIn: input.heightIn,
        quantity: input.quantity,
        boardMaterial,
        vinylMaterial,
        inkRate,
        options: input.options,
        marginCategory,
      });
    }

    // ────────────────────────────────────────────────────────────
    case "banner": {
      const material = await findMaterial(materialId);
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

      return T.banner({
        widthIn: input.widthIn,
        heightIn: input.heightIn,
        quantity: input.quantity,
        material,
        inkRate,
        finishing: input.options || {},
        accessories,
        marginCategory,
      });
    }

    // ────────────────────────────────────────────────────────────
    case "paper_print": {
      const paperId = materialId || "14pt_cardstock";
      const paper = await findMaterial(paperId);
      if (!paper) throw Object.assign(new Error(`Paper material not found: ${paperId}`), { status: 422 });

      const inkCostPerClick = await getSettingNum("ink_cost_color", 0.05);

      let lamination = null;
      const lamId = input.options?.lamination;
      if (lamId && lamId !== "none") {
        lamination = await findMaterial(lamId === "gloss" ? "gloss_lam" : lamId === "matte" ? "matte_lam" : lamId);
      }

      return T.paperPrint({
        widthIn: input.widthIn || 3.5,
        heightIn: input.heightIn || 2,
        quantity: input.quantity,
        paper,
        inkCostPerClick,
        options: input.options,
        lamination,
        marginCategory,
      });
    }

    // ────────────────────────────────────────────────────────────
    case "canvas": {
      const canvasMaterial = await findMaterial("canvas");

      return T.canvas({
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
      });
    }

    // ────────────────────────────────────────────────────────────
    case "vinyl_cut": {
      const material = await findMaterial(materialId || "white_vinyl");
      if (!material) throw Object.assign(new Error(`Material not found: ${materialId}`), { status: 422 });

      return T.vinylCut({
        widthIn: input.widthIn,
        heightIn: input.heightIn,
        quantity: input.quantity,
        material,
        marginCategory,
      });
    }

    default:
      throw Object.assign(new Error(`No pricing template for category: ${product.category}`), { status: 422 });
  }
}
