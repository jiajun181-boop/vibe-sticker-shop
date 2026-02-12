#!/usr/bin/env node
// prisma/backfill-marketing-prints-all.mjs
// Comprehensive product configuration for ALL marketing-prints products.
// Updates sizes, pricing, finishings, descriptions & SEO with geo targeting.
// Run: node prisma/backfill-marketing-prints-all.mjs

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// ── Flyer baseline pricing (4.25" × 5.5" = 23.375 sq in) ──
const BASE_AREA = 4.25 * 5.5; // 23.375
const QTY_ALL = [25, 50, 75, 100, 250, 500, 750, 1000, 2500, 5000, 10000];
const QTY_MEDIUM = [50, 100, 250, 500, 1000, 2500, 5000];
const QTY_SMALL = [25, 50, 100, 250, 500, 1000];
const QTY_BOOKLET = [25, 50, 100, 250, 500, 1000, 2500];
const QTY_BULK = [250, 500, 1000, 2500, 5000, 10000];

const SINGLE = {
  25: 17.04, 50: 23.99, 75: 29.38, 100: 35.26, 250: 67.58,
  500: 87.16, 750: 102.83, 1000: 116.54, 2500: 156.10, 5000: 222.81, 10000: 388.82,
};
const DOUBLE = {
  25: 19.23, 50: 27.07, 75: 33.15, 100: 39.78, 250: 76.24,
  500: 98.34, 750: 116.02, 1000: 131.49, 2500: 161.91, 5000: 243.05, 10000: 433.90,
};

function scalePBQ(w, h, baseTable, multiplier = 1.0, qtys = null) {
  const ratio = (w * h) / BASE_AREA;
  const result = {};
  for (const q of (qtys || QTY_ALL)) {
    if (baseTable[q] == null) continue;
    result[String(q)] = Math.round(baseTable[q] * 100 * ratio * multiplier);
  }
  return result;
}

// ── Size helpers ──
function ssBoth(label, w, h, opts = {}) {
  const qtys = opts.qtys || QTY_ALL;
  const base = { widthIn: w, heightIn: h, quantityChoices: qtys };
  if (opts.recommended) base.recommended = true;
  if (opts.notes) base.notes = opts.notes;
  return [
    { ...base, label: `${label} - Single Sided`, priceByQty: scalePBQ(w, h, SINGLE, opts.mult || 1.0, qtys) },
    { ...base, label: `${label} - Double Sided`, priceByQty: scalePBQ(w, h, DOUBLE, opts.mult || 1.0, qtys) },
  ];
}

function ssOnly(label, w, h, opts = {}) {
  const qtys = opts.qtys || QTY_ALL;
  const r = { label, widthIn: w, heightIn: h, quantityChoices: qtys, priceByQty: scalePBQ(w, h, opts.base || SINGLE, opts.mult || 1.0, qtys) };
  if (opts.recommended) r.recommended = true;
  if (opts.notes) r.notes = opts.notes;
  return r;
}

function dsOnly(label, w, h, opts = {}) {
  const qtys = opts.qtys || QTY_ALL;
  const r = { label, widthIn: w, heightIn: h, quantityChoices: qtys, priceByQty: scalePBQ(w, h, DOUBLE, opts.mult || 1.0, qtys) };
  if (opts.recommended) r.recommended = true;
  if (opts.notes) r.notes = opts.notes;
  return r;
}

// ── UI presets ──
function baseUI(extra = {}) {
  return {
    hideTierPricing: true,
    hideMaterials: true,
    hideFinishings: false,
    defaultMaterialId: "14pt_c2s",
    allowedMaterials: ["14pt_c2s"],
    ...extra,
  };
}

const ROUNDED = [{ id: "rounded", name: "Rounded Corners", type: "per_unit", unitCents: 2 }];

// ═══════════════════════════════════════════════════════════
// PRODUCT CONFIGS — keyed by slug
// ═══════════════════════════════════════════════════════════
const PRODUCTS = {

  // ━━━━━━━━━ FLYERS ━━━━━━━━━
  // Half Letter, Letter, Tabloid — 100lb gloss text
  "flyers": {
    description: "Custom flyer printing in Toronto & the GTA on premium 100lb gloss text stock. Vibrant full-colour for event promotions, real estate open houses, restaurant specials, and business marketing. Half letter, letter, and tabloid sizes with optional gloss, matte, or soft-touch lamination. Fast 2–3 business day turnaround with shipping across Ontario and Canada.",
    sizes: [
      ...ssBoth('5.5" × 8.5" (Half Letter)', 5.5, 8.5, { recommended: true }),
      ...ssBoth('8.5" × 11" (Letter)', 8.5, 11),
      ...ssBoth('11" × 17" (Tabloid)', 11, 17),
    ],
    addons: ROUNDED,
    quantityRange: { min: 25, max: 10000, step: 1 },
    ui: baseUI({ variantLabel: "Sides", allowedAddons: ["rounded"], allowedFinishings: ["lam_gloss", "lam_matte", "lam_soft_touch"] }),
  },

  // ━━━━━━━━━ POSTCARDS ━━━━━━━━━
  // Common sizes, 14pt cardstock
  "postcards": {
    description: "Premium postcard printing on thick 14pt cardstock — perfect for direct mail, EDDM campaigns, event invitations, and promotional handouts. Standard sizes from 4\" × 6\" to 6\" × 9\". Full-colour both sides with UV coating or lamination options. Bulk discounts for 250+. Printed in Toronto, shipped across Ontario and Canada.",
    sizes: [
      ...ssBoth('4" × 6" (Standard)', 4, 6, { recommended: true }),
      ...ssBoth('4.25" × 6" (USPS / Canada Post)', 4.25, 6),
      ...ssBoth('5" × 7"', 5, 7),
      ...ssBoth('6" × 9" (Jumbo)', 6, 9),
      ...ssBoth('4.25" × 5.5" (Quarter Letter)', 4.25, 5.5),
      ...ssBoth('8.5" × 5.5" (Half Letter)', 8.5, 5.5),
    ],
    addons: ROUNDED,
    quantityRange: { min: 25, max: 10000, step: 1 },
    ui: baseUI({ variantLabel: "Sides", allowedAddons: ["rounded"], allowedFinishings: ["lam_gloss", "lam_matte", "lam_soft_touch"] }),
  },

  // ━━━━━━━━━ BROCHURES ━━━━━━━━━
  // Bi-fold (对折), Tri-fold (三折), Gate fold / Quad-fold (四折)
  "brochures": {
    description: "Professional brochure printing — bi-fold, tri-fold, and gate-fold options on premium coated stock. Ideal for corporate presentations, product catalogues, tourism guides, real estate listings, and trade show handouts. Full-colour both sides with crisp score lines. Optional lamination. Serving Toronto, Mississauga, Brampton, and the GTA.",
    sizes: [
      dsOnly('8.5" × 11" Tri-Fold (6 Panels)', 8.5, 11, { mult: 1.15, recommended: true }),
      dsOnly('8.5" × 11" Bi-Fold (4 Panels)', 8.5, 11, { mult: 1.1 }),
      dsOnly('8.5" × 11" Gate Fold (8 Panels)', 8.5, 11, { mult: 1.25 }),
      dsOnly('8.5" × 14" Tri-Fold (6 Panels)', 8.5, 14, { mult: 1.15 }),
      dsOnly('8.5" × 14" Bi-Fold (4 Panels)', 8.5, 14, { mult: 1.1 }),
      dsOnly('8.5" × 14" Gate Fold (8 Panels)', 8.5, 14, { mult: 1.25 }),
      dsOnly('11" × 17" Bi-Fold (4 Panels)', 11, 17, { mult: 1.1 }),
      dsOnly('11" × 17" Tri-Fold (6 Panels)', 11, 17, { mult: 1.15 }),
    ],
    addons: ROUNDED,
    quantityRange: { min: 50, max: 10000, step: 1 },
    ui: baseUI({ sizeMode: "dropdown", allowedAddons: ["rounded"], allowedFinishings: ["lam_gloss", "lam_matte", "lam_soft_touch", "scoring", "folding"] }),
  },

  // ━━━━━━━━━ POSTERS ━━━━━━━━━
  "posters": {
    description: "Large-format poster printing with vivid full-colour on premium gloss or matte paper. Sizes from 11\" × 17\" tabloid to 24\" × 36\". Ideal for retail signage, trade show displays, concert promotions, office décor, and event advertising. Optional lamination for durability. Same-week turnaround in Toronto and the GTA.",
    sizes: [
      ssOnly('11" × 17" (Tabloid)', 11, 17),
      ssOnly('13" × 19"', 13, 19),
      ssOnly('18" × 24"', 18, 24, { recommended: true }),
      ssOnly('24" × 36"', 24, 36),
    ],
    addons: [],
    quantityRange: { min: 1, max: 500, step: 1 },
    ui: baseUI({ sizeMode: "dropdown", allowedAddons: [], allowedFinishings: ["lam_gloss", "lam_matte"] }),
  },

  // ━━━━━━━━━ BOOKLETS ━━━━━━━━━
  // Saddle stitch (钉装), Perfect binding (胶装), Wire-O — page counts in multiples of 4
  "booklets": {
    description: "Custom booklet and catalogue printing with saddle-stitch, perfect binding, or Wire-O options. Page counts from 8 to 48 pages (multiples of 4). Premium coated stock with full-colour throughout — ideal for product catalogues, event programs, training manuals, lookbooks, and corporate reports. Serving Toronto, the GTA, and all of Ontario.",
    sizes: [
      // 5.5" × 8.5" (Half Letter)
      dsOnly('5.5" × 8.5" — 8 Pages', 5.5, 8.5, { mult: 4, qtys: QTY_BOOKLET }),
      dsOnly('5.5" × 8.5" — 12 Pages', 5.5, 8.5, { mult: 6, qtys: QTY_BOOKLET }),
      dsOnly('5.5" × 8.5" — 16 Pages', 5.5, 8.5, { mult: 8, qtys: QTY_BOOKLET }),
      dsOnly('5.5" × 8.5" — 24 Pages', 5.5, 8.5, { mult: 12, qtys: QTY_BOOKLET }),
      dsOnly('5.5" × 8.5" — 32 Pages', 5.5, 8.5, { mult: 16, qtys: QTY_BOOKLET }),
      dsOnly('5.5" × 8.5" — 48 Pages', 5.5, 8.5, { mult: 24, qtys: QTY_BOOKLET }),
      // 8.5" × 11" (Letter)
      dsOnly('8.5" × 11" — 8 Pages', 8.5, 11, { mult: 4, qtys: QTY_BOOKLET, recommended: true }),
      dsOnly('8.5" × 11" — 12 Pages', 8.5, 11, { mult: 6, qtys: QTY_BOOKLET }),
      dsOnly('8.5" × 11" — 16 Pages', 8.5, 11, { mult: 8, qtys: QTY_BOOKLET }),
      dsOnly('8.5" × 11" — 24 Pages', 8.5, 11, { mult: 12, qtys: QTY_BOOKLET }),
      dsOnly('8.5" × 11" — 32 Pages', 8.5, 11, { mult: 16, qtys: QTY_BOOKLET }),
      dsOnly('8.5" × 11" — 48 Pages', 8.5, 11, { mult: 24, qtys: QTY_BOOKLET }),
    ],
    addons: [],
    quantityRange: { min: 25, max: 2500, step: 1 },
    ui: baseUI({ sizeMode: "dropdown", allowedAddons: [], finishingMode: "multi", allowedFinishings: ["lam_gloss", "lam_matte", "staple_binding", "perfect_binding", "wire_o_binding"] }),
  },

  // ━━━━━━━━━ MENUS ━━━━━━━━━
  // Laminated menus (塑封) + Placemat paper (餐垫纸)
  "menus": {
    description: "Restaurant menu printing in Toronto & the GTA. Durable laminated menus on thick cardstock — splash-proof and long-lasting — or affordable disposable placemat paper menus. Bi-fold, tri-fold, and single-sheet formats. Perfect for restaurants, cafés, bars, breweries, and catering services. Fast turnaround across Ontario.",
    sizes: [
      // Laminated menus (14pt card + heavy lamination)
      dsOnly('8.5" × 11" Single Sheet — Laminated', 8.5, 11, { mult: 1.3, recommended: true, notes: "14pt card, splash-proof" }),
      dsOnly('8.5" × 11" Bi-Fold — Laminated', 8.5, 11, { mult: 1.4, notes: "14pt card, splash-proof" }),
      dsOnly('8.5" × 14" Tri-Fold — Laminated', 8.5, 14, { mult: 1.4, notes: "14pt card, splash-proof" }),
      dsOnly('8.5" × 14" Bi-Fold — Laminated', 8.5, 14, { mult: 1.4, notes: "14pt card, splash-proof" }),
      dsOnly('11" × 17" Bi-Fold — Laminated', 11, 17, { mult: 1.4, notes: "14pt card, splash-proof" }),
      // Placemat paper (餐垫纸 — disposable, lightweight)
      ssOnly('12" × 18" Placemat Paper', 12, 18, { mult: 0.5, notes: "60lb uncoated, disposable", qtys: QTY_BULK }),
      ssOnly('11" × 17" Placemat Paper', 11, 17, { mult: 0.5, notes: "60lb uncoated, disposable", qtys: QTY_BULK }),
    ],
    addons: ROUNDED,
    quantityRange: { min: 25, max: 10000, step: 1 },
    ui: baseUI({ sizeMode: "dropdown", allowedAddons: ["rounded"], allowedFinishings: ["lam_gloss", "lam_matte", "lam_soft_touch", "scoring", "folding"] }),
  },

  // ━━━━━━━━━ RACK CARDS ━━━━━━━━━
  // Perforated tear-off option at bottom
  "rack-cards": {
    description: "Rack card printing for hotels, tourism offices, real estate agents, and retail displays in Toronto & Ontario. Standard 4\" × 9\" and 3.5\" × 8.5\" on sturdy 14pt cardstock. Optional perforated tear-off section for coupons, appointment cards, or contact info. UV gloss, matte, or soft-touch lamination available.",
    sizes: [
      ...ssBoth('4" × 9"', 4, 9, { recommended: true }),
      ...ssBoth('3.5" × 8.5"', 3.5, 8.5),
    ],
    addons: ROUNDED,
    quantityRange: { min: 100, max: 10000, step: 1 },
    ui: baseUI({ variantLabel: "Sides", allowedAddons: ["rounded"], finishingMode: "multi", allowedFinishings: ["lam_gloss", "lam_matte", "lam_soft_touch", "perforation"] }),
  },

  // ━━━━━━━━━ DOOR HANGERS ━━━━━━━━━
  // 3.5" × 8.5" and 4.25" × 11" only
  "door-hangers": {
    description: "Custom door hanger printing with die-cut door-knob hole. 3.5\" × 8.5\" and 4.25\" × 11\" on durable 14pt cardstock. Ideal for real estate, landscaping, home services, restaurant delivery, and political campaigns in Toronto and the GTA. Full-colour both sides with optional lamination and rounded corners.",
    sizes: [
      ...ssBoth('3.5" × 8.5"', 3.5, 8.5, { recommended: true }),
      ...ssBoth('4.25" × 11"', 4.25, 11),
    ],
    addons: ROUNDED,
    quantityRange: { min: 100, max: 10000, step: 1 },
    ui: baseUI({ variantLabel: "Sides", allowedAddons: ["rounded"], allowedFinishings: ["lam_gloss", "lam_matte", "lam_soft_touch", "die_cut"] }),
  },

  // ━━━━━━━━━ PRESENTATION FOLDERS ━━━━━━━━━
  // 9" × 12" and 9" × 14.5"
  "presentation-folders": {
    description: "Professional presentation folder printing with glued pockets and optional business card slits. 9\" × 12\" standard and 9\" × 14.5\" legal sizes on premium 14pt cardstock. Gloss, matte, or soft-touch lamination with optional foil stamping. Ideal for corporate meetings, sales proposals, real estate packages, and legal firms in Toronto, Mississauga, and the GTA.",
    sizes: [
      dsOnly('9" × 12" Standard', 9, 12, { mult: 3, qtys: [100, 250, 500, 1000, 2500], recommended: true }),
      dsOnly('9" × 12" w/ Business Card Slit', 9, 12, { mult: 3.2, qtys: [100, 250, 500, 1000, 2500] }),
      dsOnly('9" × 14.5" Legal', 9, 14.5, { mult: 3.3, qtys: [100, 250, 500, 1000, 2500] }),
      dsOnly('9" × 14.5" Legal w/ Business Card Slit', 9, 14.5, { mult: 3.5, qtys: [100, 250, 500, 1000, 2500] }),
    ],
    addons: [],
    quantityRange: { min: 100, max: 2500, step: 1 },
    ui: baseUI({ sizeMode: "dropdown", allowedAddons: [], finishingMode: "multi", allowedFinishings: ["lam_gloss", "lam_matte", "lam_soft_touch", "foil_stamping"] }),
  },

  // ━━━━━━━━━ NCR INVOICES ━━━━━━━━━
  // 2-Part, 3-Part, 4-Part carbonless
  "ncr-invoices": {
    description: "Carbonless NCR form printing — 2-part, 3-part, and 4-part configurations on premium NCR paper. Ideal for invoices, receipts, work orders, purchase orders, and delivery slips. Optional sequential numbering and perforation. Perfect for contractors, auto shops, restaurants, and service businesses in Toronto, the GTA, and Ontario.",
    sizes: [
      ssOnly('5.5" × 8.5" — 2 Part NCR', 5.5, 8.5, { mult: 2.5, qtys: QTY_MEDIUM }),
      ssOnly('5.5" × 8.5" — 3 Part NCR', 5.5, 8.5, { mult: 3.5, qtys: QTY_MEDIUM }),
      ssOnly('5.5" × 8.5" — 4 Part NCR', 5.5, 8.5, { mult: 4.5, qtys: QTY_MEDIUM }),
      ssOnly('8.5" × 11" — 2 Part NCR', 8.5, 11, { mult: 2.5, qtys: QTY_MEDIUM, recommended: true }),
      ssOnly('8.5" × 11" — 3 Part NCR', 8.5, 11, { mult: 3.5, qtys: QTY_MEDIUM }),
      ssOnly('8.5" × 11" — 4 Part NCR', 8.5, 11, { mult: 4.5, qtys: QTY_MEDIUM }),
    ],
    addons: [],
    quantityRange: { min: 50, max: 5000, step: 1 },
    ui: baseUI({ sizeMode: "dropdown", allowedAddons: [], finishingMode: "multi", allowedFinishings: ["numbering", "perforation"] }),
  },

  // ━━━━━━━━━ LETTERHEAD ━━━━━━━━━
  "letterhead": {
    description: "Custom letterhead printing on premium 70lb or 100lb uncoated stock. Full-colour for professional business correspondence. Perfect for law firms, accounting offices, medical practices, and corporate headquarters in Toronto and the GTA. Matching envelopes and business cards available.",
    sizes: [
      ...ssBoth('8.5" × 11" (Letter)', 8.5, 11, { recommended: true }),
    ],
    addons: [],
    quantityRange: { min: 100, max: 5000, step: 1 },
    ui: baseUI({ variantLabel: "Sides", allowedAddons: [], allowedFinishings: ["lam_gloss", "lam_matte"] }),
  },

  // ━━━━━━━━━ NOTEPADS ━━━━━━━━━
  "notepads": {
    description: "Custom notepad printing with chipboard backing and glued edge. Available in 25, 50, and 100 sheet counts in multiple sizes. Great for trade shows, conference giveaways, office supplies, and branded merchandise. Full-colour cover page with your logo. Serving businesses across Toronto, Ontario, and Canada.",
    sizes: [
      ssOnly('4.25" × 5.5" — 25 Sheets', 4.25, 5.5, { mult: 25, qtys: QTY_SMALL }),
      ssOnly('4.25" × 5.5" — 50 Sheets', 4.25, 5.5, { mult: 50, qtys: QTY_SMALL }),
      ssOnly('5.5" × 8.5" — 25 Sheets', 5.5, 8.5, { mult: 25, qtys: QTY_SMALL }),
      ssOnly('5.5" × 8.5" — 50 Sheets', 5.5, 8.5, { mult: 50, qtys: QTY_SMALL, recommended: true }),
      ssOnly('5.5" × 8.5" — 100 Sheets', 5.5, 8.5, { mult: 100, qtys: QTY_SMALL }),
      ssOnly('8.5" × 11" — 25 Sheets', 8.5, 11, { mult: 25, qtys: QTY_SMALL }),
      ssOnly('8.5" × 11" — 50 Sheets', 8.5, 11, { mult: 50, qtys: QTY_SMALL }),
      ssOnly('8.5" × 11" — 100 Sheets', 8.5, 11, { mult: 100, qtys: QTY_SMALL }),
    ],
    addons: [],
    quantityRange: { min: 25, max: 1000, step: 1 },
    ui: baseUI({ sizeMode: "dropdown", allowedAddons: [], allowedFinishings: [], hideFinishings: true }),
  },

  // ━━━━━━━━━ GREETING CARDS ━━━━━━━━━
  // Exact fold sizes: 10×7→5×7, 8.5×11→8.5×5.5, 8.5×5.5→4.25×5.5
  "greeting-cards": {
    description: "Custom greeting card printing on premium scored cardstock. Perfect for holidays, birthdays, corporate thank-you cards, and special occasions. Choose from popular fold sizes with matching envelopes available. Optional foil stamping and soft-touch lamination for a luxury finish. Printed in Toronto, shipped across Ontario and Canada.",
    sizes: [
      dsOnly('5" × 7" (Opens to 10" × 7")', 10, 7, { mult: 1.1, recommended: true }),
      dsOnly('8.5" × 5.5" (Opens to 8.5" × 11")', 8.5, 11, { mult: 1.1 }),
      dsOnly('4.25" × 5.5" (Opens to 8.5" × 5.5")', 8.5, 5.5, { mult: 1.1 }),
    ],
    addons: ROUNDED,
    quantityRange: { min: 25, max: 5000, step: 1 },
    ui: baseUI({ sizeMode: "dropdown", allowedAddons: ["rounded"], allowedFinishings: ["lam_gloss", "lam_matte", "lam_soft_touch", "foil_stamping"] }),
  },

  // ━━━━━━━━━ INVITATION CARDS ━━━━━━━━━
  // Common sizes
  "invitation-cards": {
    description: "Custom invitation card printing for weddings, galas, corporate events, and celebrations. Premium cardstock with optional foil stamping, embossing, and matching envelope sets. Sizes from 4\" × 6\" to 6\" × 9\" including square format. Serving Toronto, Vaughan, Richmond Hill, Markham, and the GTA with rush options.",
    sizes: [
      ...ssBoth('4" × 6"', 4, 6),
      ...ssBoth('4.25" × 5.5" (A2)', 4.25, 5.5),
      ...ssBoth('5" × 7" (A7)', 5, 7, { recommended: true }),
      ...ssBoth('5" × 5" (Square)', 5, 5),
      ...ssBoth('6" × 9"', 6, 9),
    ],
    addons: ROUNDED,
    quantityRange: { min: 25, max: 2500, step: 1 },
    ui: baseUI({ variantLabel: "Sides", allowedAddons: ["rounded"], allowedFinishings: ["lam_gloss", "lam_matte", "lam_soft_touch", "foil_stamping"] }),
  },

  // ━━━━━━━━━ CERTIFICATES ━━━━━━━━━
  "certificates": {
    description: "Custom certificate printing for awards, diplomas, training completion, and corporate recognition. Premium heavy-weight stock with optional foil stamping for an elegant gold or silver finish. Portrait and landscape formats in letter and half-letter sizes. Ideal for schools, businesses, and organizations in Toronto and Ontario.",
    sizes: [
      ssOnly('8.5" × 11" (Portrait)', 8.5, 11, { recommended: true }),
      ssOnly('8.5" × 11" (Landscape)', 11, 8.5),
      ssOnly('5.5" × 8.5" (Half Letter)', 5.5, 8.5),
    ],
    addons: [],
    quantityRange: { min: 25, max: 2500, step: 1 },
    ui: baseUI({ sizeMode: "dropdown", allowedAddons: [], allowedFinishings: ["lam_gloss", "lam_matte", "foil_stamping"] }),
  },

  // ━━━━━━━━━ COUPONS ━━━━━━━━━
  "coupons": {
    description: "Custom coupon and voucher printing for retail promotions, restaurant offers, and loyalty programs. Sturdy cardstock with optional perforation for tear-off sections and sequential numbering for tracking redemption. Business card to rack card sizes. Ideal for Toronto businesses running campaigns across the GTA and Ontario.",
    sizes: [
      ...ssBoth('2" × 3.5" (Business Card)', 2, 3.5),
      ...ssBoth('3.5" × 8.5" (Rack Card)', 3.5, 8.5, { recommended: true }),
      ...ssBoth('4.25" × 5.5" (Quarter Sheet)', 4.25, 5.5),
    ],
    addons: [],
    quantityRange: { min: 100, max: 10000, step: 1 },
    ui: baseUI({ variantLabel: "Sides", allowedAddons: [], finishingMode: "multi", allowedFinishings: ["lam_gloss", "lam_matte", "perforation", "numbering"] }),
  },

  // ━━━━━━━━━ BOOKMARKS ━━━━━━━━━
  "bookmarks": {
    description: "Custom bookmark printing on thick 14pt cardstock with optional rounded corners. Gloss, matte, or soft-touch lamination for a premium feel. Perfect for bookstores, libraries, schools, churches, author signings, and promotional giveaways. Full-colour single or double-sided. Serving Toronto, the GTA, and all of Canada.",
    sizes: [
      ...ssBoth('2" × 6"', 2, 6, { recommended: true }),
      ...ssBoth('2" × 7"', 2, 7),
      ...ssBoth('2" × 8"', 2, 8),
      ...ssBoth('2.5" × 7"', 2.5, 7),
    ],
    addons: ROUNDED,
    quantityRange: { min: 100, max: 10000, step: 1 },
    ui: baseUI({ variantLabel: "Sides", allowedAddons: ["rounded"], allowedFinishings: ["lam_gloss", "lam_matte", "lam_soft_touch"] }),
  },

  // ━━━━━━━━━ TAGS / HANG TAGS ━━━━━━━━━
  "tags-hang-tags": {
    description: "Custom hang tag and product tag printing for retail, clothing, jewellery, and artisan goods. Thick 14pt cardstock with optional hole punch (1/8\" or 1/4\"), rounded corners, and lamination. Full-colour single or double-sided. Ideal for boutiques, craft fairs, Etsy shops, and e-commerce brands in Toronto and across Canada.",
    sizes: [
      ...ssBoth('2" × 3.5"', 2, 3.5, { recommended: true }),
      ...ssBoth('2" × 4"', 2, 4),
      ...ssBoth('2.5" × 4"', 2.5, 4),
      ...ssBoth('3" × 5"', 3, 5),
      ...ssBoth('1.5" × 3" (Mini)', 1.5, 3),
    ],
    addons: ROUNDED,
    quantityRange: { min: 100, max: 10000, step: 1 },
    ui: baseUI({ variantLabel: "Sides", allowedAddons: ["rounded"], finishingMode: "multi", allowedFinishings: ["lam_gloss", "lam_matte", "hole_punch_125", "hole_punch_250"] }),
  },

  // ━━━━━━━━━ TICKETS ━━━━━━━━━
  // Common sizes, numbering, perforation
  "tickets": {
    description: "Custom event ticket printing with optional sequential numbering and perforated tear-off stubs. Perfect for concerts, festivals, raffles, fundraisers, sporting events, and galas. Sturdy cardstock with professional look. Fast turnaround for events in Toronto, the GTA, and Ontario. Raffle to full-size ticket formats available.",
    sizes: [
      ssOnly('2" × 5.5" (Standard)', 2, 5.5, { recommended: true }),
      ssOnly('2" × 7"', 2, 7),
      ssOnly('2.75" × 8.5"', 2.75, 8.5),
      ssOnly('3.5" × 8.5"', 3.5, 8.5),
      ssOnly('2" × 4" (Raffle)', 2, 4),
    ],
    addons: [],
    quantityRange: { min: 100, max: 10000, step: 1 },
    ui: baseUI({ sizeMode: "dropdown", allowedAddons: [], finishingMode: "multi", allowedFinishings: ["perforation", "numbering", "lam_gloss", "lam_matte"] }),
  },

  // ━━━━━━━━━ CALENDARS ━━━━━━━━━
  // Table: 5×7, half letter | Wall: half letter, letter
  "calendars": {
    description: "Custom calendar printing — desk and wall formats with Wire-O or saddle-stitch binding. Full-colour on every page with premium coated stock. Available in desk (5\" × 7\", 5.5\" × 8.5\") and wall (5.5\" × 8.5\", 8.5\" × 11\") sizes. Perfect for corporate gifts, promotional items, and year-end marketing. Serving Toronto businesses and organizations across Ontario.",
    sizes: [
      // Desk / Table calendars
      dsOnly('5" × 7" Desk — 12 Months', 5, 7, { mult: 13, qtys: QTY_SMALL }),
      dsOnly('5.5" × 8.5" Desk — 12 Months', 5.5, 8.5, { mult: 13, qtys: QTY_SMALL, recommended: true }),
      // Wall calendars
      dsOnly('5.5" × 8.5" Wall — 12 Months', 5.5, 8.5, { mult: 13, qtys: QTY_SMALL }),
      dsOnly('8.5" × 11" Wall — 12 Months', 8.5, 11, { mult: 13, qtys: QTY_SMALL }),
    ],
    addons: [],
    quantityRange: { min: 25, max: 1000, step: 1 },
    ui: baseUI({ sizeMode: "dropdown", allowedAddons: [], finishingMode: "multi", allowedFinishings: ["lam_gloss", "lam_matte", "staple_binding", "wire_o_binding"] }),
  },

  // ━━━━━━━━━ PRODUCT INSERTS ━━━━━━━━━
  // 20lb bond, 100lb gloss text, 14pt cardstock
  "product-inserts": {
    description: "Custom product insert printing for e-commerce packaging, thank-you cards, instruction sheets, and promotional flyers. Choose from lightweight 20lb bond, medium-weight 100lb gloss text, or premium 14pt cardstock. Multiple sizes for any packaging need. Fast bulk printing for online sellers, retailers, and subscription boxes in Toronto and across Canada.",
    sizes: [
      // 20lb Bond (lightweight, economical)
      ...ssBoth('4" × 6" — 20lb Bond', 4, 6, { mult: 0.4, notes: "Lightweight" }),
      ...ssBoth('5" × 7" — 20lb Bond', 5, 7, { mult: 0.4, notes: "Lightweight" }),
      ...ssBoth('8.5" × 11" — 20lb Bond', 8.5, 11, { mult: 0.4, notes: "Lightweight" }),
      // 100lb Gloss Text (mid-weight, vibrant)
      ...ssBoth('3" × 5" — 100lb Gloss', 3, 5, { mult: 0.7, notes: "Glossy, vivid" }),
      ...ssBoth('4" × 6" — 100lb Gloss', 4, 6, { mult: 0.7, recommended: true, notes: "Glossy, vivid" }),
      ...ssBoth('5" × 7" — 100lb Gloss', 5, 7, { mult: 0.7, notes: "Glossy, vivid" }),
      ...ssBoth('8.5" × 11" — 100lb Gloss', 8.5, 11, { mult: 0.7, notes: "Glossy, vivid" }),
      // 14pt Cardstock (thick, premium)
      ...ssBoth('3" × 5" — 14pt Card', 3, 5, { notes: "Premium thick" }),
      ...ssBoth('4" × 6" — 14pt Card', 4, 6, { notes: "Premium thick" }),
      ...ssBoth('5" × 7" — 14pt Card', 5, 7, { notes: "Premium thick" }),
    ],
    addons: ROUNDED,
    quantityRange: { min: 100, max: 10000, step: 1 },
    ui: baseUI({ variantLabel: "Sides", allowedAddons: ["rounded"], allowedFinishings: ["lam_gloss", "lam_matte"] }),
  },

  // ━━━━━━━━━ BOX SLEEVES ━━━━━━━━━
  // Rectangular + Custom die-cut shape (异形)
  "box-sleeves": {
    description: "Custom printed box sleeves and product wraps for retail packaging, gift boxes, and product bundling. Standard rectangular sizes or custom die-cut shapes for unique packaging. Full-colour CMYK on sturdy cardstock with optional gloss or matte lamination. Ideal for cosmetics, food packaging, candles, and retail products in Toronto and the GTA.",
    sizes: [
      // Rectangular standard sizes
      dsOnly('3" × 3" × 6" (Small)', 12, 6, { mult: 2, qtys: [100, 250, 500, 1000, 2500] }),
      dsOnly('4" × 4" × 6" (Medium)', 16, 6, { mult: 2, qtys: [100, 250, 500, 1000, 2500], recommended: true }),
      dsOnly('3" × 3" × 8" (Tall)', 12, 8, { mult: 2, qtys: [100, 250, 500, 1000, 2500] }),
      dsOnly('4" × 4" × 8" (Large)', 16, 8, { mult: 2, qtys: [100, 250, 500, 1000, 2500] }),
      // Custom die-cut (异形)
      dsOnly('Custom Die-Cut Shape', 12, 8, { mult: 3, qtys: [250, 500, 1000, 2500], notes: "Custom shape — contact for exact quote" }),
    ],
    addons: [],
    quantityRange: { min: 100, max: 2500, step: 1 },
    ui: baseUI({ sizeMode: "dropdown", allowedAddons: [], finishingMode: "multi", allowedFinishings: ["lam_gloss", "lam_matte", "die_cut"] }),
  },

  // ━━━━━━━━━ TABLE DISPLAY CARDS ━━━━━━━━━
  "table-display-cards": {
    description: "Custom table tent and display card printing for restaurants, trade shows, conferences, and retail counters. Scored for easy folding on sturdy 14pt cardstock. Full-colour both sides with optional lamination. Perfect for daily specials, promotions, event schedules, and product displays. Fast printing in Toronto and the GTA.",
    sizes: [
      dsOnly('4" × 6" Tent Card', 8, 6, { mult: 1.1, recommended: true }),
      dsOnly('5" × 7" Tent Card', 10, 7, { mult: 1.1 }),
      dsOnly('3.5" × 8.5" Tent Card', 7, 8.5, { mult: 1.1 }),
    ],
    addons: ROUNDED,
    quantityRange: { min: 50, max: 5000, step: 1 },
    ui: baseUI({ sizeMode: "dropdown", allowedAddons: ["rounded"], allowedFinishings: ["lam_gloss", "lam_matte", "scoring"] }),
  },

  // ━━━━━━━━━ ORDER FORMS ━━━━━━━━━
  "order-forms-single": {
    description: "Custom order form printing for restaurants, wholesale distributors, and service businesses. Single-sheet forms on quality paper with optional perforation and sequential numbering for easy tracking. Half letter and letter sizes. Serving Toronto restaurants, contractors, and businesses across Ontario.",
    sizes: [
      ...ssBoth('5.5" × 8.5" (Half Letter)', 5.5, 8.5),
      ...ssBoth('8.5" × 11" (Letter)', 8.5, 11, { recommended: true }),
    ],
    addons: [],
    quantityRange: { min: 100, max: 5000, step: 1 },
    ui: baseUI({ variantLabel: "Sides", allowedAddons: [], finishingMode: "multi", allowedFinishings: ["lam_gloss", "lam_matte", "perforation", "numbering"] }),
  },

  // ━━━━━━━━━ RELEASE / WAIVER FORMS ━━━━━━━━━
  "release-forms": {
    description: "Custom release form, waiver, and consent form printing for gyms, fitness studios, adventure sports, medical offices, spas, and event venues. Professional formatting on quality paper with optional perforation for tear-off receipts. Half letter and letter sizes. Serving businesses across Toronto, the GTA, and Ontario.",
    sizes: [
      ...ssBoth('5.5" × 8.5" (Half Letter)', 5.5, 8.5),
      ...ssBoth('8.5" × 11" (Letter)', 8.5, 11, { recommended: true }),
    ],
    addons: [],
    quantityRange: { min: 100, max: 5000, step: 1 },
    ui: baseUI({ variantLabel: "Sides", allowedAddons: [], finishingMode: "multi", allowedFinishings: ["lam_gloss", "lam_matte", "perforation"] }),
  },
};

// ── Slugs to deactivate (duplicates) ──
const DEACTIVATE_SLUGS = ["mp-flyers", "catalog-booklets"];

// ═══════════════════════════════════════════════════════════
async function main() {
  let updated = 0;
  let notFound = 0;
  let deactivated = 0;

  // Deactivate duplicates
  for (const slug of DEACTIVATE_SLUGS) {
    const p = await prisma.product.findFirst({ where: { slug } });
    if (p && p.isActive) {
      await prisma.product.update({ where: { id: p.id }, data: { isActive: false } });
      console.log(`  x Deactivated duplicate: ${slug}`);
      deactivated++;
    }
  }

  // Update all product configs
  for (const [slug, config] of Object.entries(PRODUCTS)) {
    const product = await prisma.product.findFirst({ where: { slug, isActive: true } });
    if (!product) {
      console.log(`  x ${slug} -- not found or inactive, skipping`);
      notFound++;
      continue;
    }

    const existing = product.optionsConfig && typeof product.optionsConfig === "object" ? product.optionsConfig : {};

    const newConfig = {
      ...existing,
      sizes: config.sizes,
      quantityRange: config.quantityRange,
      ...(config.addons && config.addons.length > 0 ? { addons: config.addons } : {}),
      ui: {
        ...(existing.ui || {}),
        ...config.ui,
      },
    };

    const updateData = { optionsConfig: newConfig };
    if (config.description) {
      updateData.description = config.description;
    }

    await prisma.product.update({
      where: { id: product.id },
      data: updateData,
    });

    const sizeCount = config.sizes.length;
    const finishings = config.ui.allowedFinishings?.length || 0;
    console.log(`  + ${slug} -- ${sizeCount} sizes, ${finishings} finishings, SEO desc updated`);
    updated++;
  }

  console.log(`\nDone -- ${updated} updated, ${notFound} not found, ${deactivated} deactivated.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
