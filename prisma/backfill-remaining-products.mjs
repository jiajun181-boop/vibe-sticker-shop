#!/usr/bin/env node
// prisma/backfill-remaining-products.mjs
// Creates/updates all remaining products with competitive priceByQty pricing.
// Covers: stickers, labels, stamps, decals, POS, packaging, booklets.
// Run: node prisma/backfill-remaining-products.mjs

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// ── Helpers ──

/** Convert { qty: dollarAmount } to { qty: centsAmount } */
function d2c(table) {
  const r = {};
  for (const [q, d] of Object.entries(table)) r[q] = Math.round(d * 100);
  return r;
}

/** Scale every value in a priceByQty map by a factor */
function scalePBQ(pbq, factor) {
  const r = {};
  for (const [q, c] of Object.entries(pbq)) r[q] = Math.round(c * factor);
  return r;
}

/** Dampened area factor: both small and large sizes are dampened to avoid extremes.
 *  Small sizes (ratio<1): ratio^0.4 — prevents tiny items from being unreasonably cheap.
 *  Large sizes (ratio>1): ratio^0.55 — prevents large items from being linearly expensive. */
function areaFactor(w, h, baseW, baseH) {
  const raw = (w * h) / (baseW * baseH);
  if (raw <= 1) return Math.pow(raw, 0.4);
  return Math.pow(raw, 0.55);
}

// ── Product definitions ──

const ALL_PRODUCTS = [];

// =========================================================================
//  1. DIE-CUT STICKERS
// =========================================================================
// Market ref: StickerMule 3" die-cut 50=$69, Zoom Printing 3" 50=~$35
// Our 3" base: 25=$14.99, competitive entry + steep volume discounts
{
  const BASE = d2c({ 25: 14.99, 50: 24.99, 100: 39.99, 250: 69.99, 500: 99.99, 1000: 149.99 });
  const QTYS = [25, 50, 100, 250, 500, 1000];
  const baseW = 3, baseH = 3;
  const dims = [
    { w: 2, h: 2 }, { w: 3, h: 3 }, { w: 4, h: 4 },
    { w: 5, h: 5 }, { w: 6, h: 6 },
  ];

  ALL_PRODUCTS.push({
    slug: "die-cut-stickers",
    name: "Die-Cut Stickers",
    category: "stickers",
    desc: "Custom die-cut vinyl stickers cut to any shape. Waterproof, UV resistant, perfect for laptops, water bottles, packaging, and brand promotion. Available in white vinyl, clear, holographic, and kraft. Printed in Toronto with Canada-wide shipping.",
    sizes: dims.map((d) => ({
      label: `${d.w}" × ${d.h}"`,
      widthIn: d.w,
      heightIn: d.h,
      quantityChoices: QTYS,
      priceByQty: scalePBQ(BASE, areaFactor(d.w, d.h, baseW, baseH)),
    })),
  });
}

// =========================================================================
//  2. KISS-CUT STICKERS
// =========================================================================
// Simpler cut = ~10% cheaper than die-cut
{
  const BASE = d2c({ 25: 12.99, 50: 21.99, 100: 35.99, 250: 62.99, 500: 89.99, 1000: 134.99 });
  const QTYS = [25, 50, 100, 250, 500, 1000];
  const baseW = 3, baseH = 3;
  const dims = [
    { w: 2, h: 2 }, { w: 3, h: 3 }, { w: 4, h: 4 }, { w: 5, h: 5 },
  ];

  ALL_PRODUCTS.push({
    slug: "kiss-cut-stickers",
    name: "Kiss-Cut Stickers",
    category: "stickers",
    desc: "Custom kiss-cut stickers on a square backing — easy to peel, great for giveaways, product packaging, and marketing kits. Available in white vinyl, clear, and holographic finishes. Printed in Toronto with fast Canadian shipping.",
    sizes: dims.map((d) => ({
      label: `${d.w}" × ${d.h}"`,
      widthIn: d.w,
      heightIn: d.h,
      quantityChoices: QTYS,
      priceByQty: scalePBQ(BASE, areaFactor(d.w, d.h, baseW, baseH)),
    })),
  });
}

// =========================================================================
//  3. STICKER SHEETS
// =========================================================================
{
  const BASE = d2c({ 10: 14.99, 25: 29.99, 50: 49.99, 100: 79.99, 250: 149.99 });
  const QTYS = [10, 25, 50, 100, 250];
  const baseW = 8.5, baseH = 11;

  ALL_PRODUCTS.push({
    slug: "sticker-sheets",
    name: "Sticker Sheets",
    category: "stickers",
    desc: "Custom sticker sheets with multiple designs on one page. Kiss-cut or micro-perf options on white vinyl, clear, or kraft material. Perfect for product labelling, planner stickers, and retail packaging. Printed in Toronto.",
    sizes: [
      {
        label: 'Letter (8.5" × 11")',
        widthIn: 8.5, heightIn: 11,
        quantityChoices: QTYS,
        priceByQty: BASE,
      },
      {
        label: 'Tabloid (11" × 17")',
        widthIn: 11, heightIn: 17,
        quantityChoices: QTYS,
        priceByQty: scalePBQ(BASE, areaFactor(11, 17, baseW, baseH)),
      },
    ],
  });
}

// =========================================================================
//  4. STICKER ROLLS
// =========================================================================
// Roll labels — higher minimum qty, strong volume discounts
// Market ref: StickerGiant 2" circle roll 500=~$45, 1000=~$65
{
  const BASE = d2c({ 250: 29.99, 500: 44.99, 1000: 69.99, 2500: 129.99, 5000: 199.99 });
  const QTYS = [250, 500, 1000, 2500, 5000];
  const baseW = 2, baseH = 2; // 2"×2" base

  // All shape+size combos from the frontend
  const dims = [
    // Circles
    { w: 1, h: 1 }, { w: 1.5, h: 1.5 }, { w: 2, h: 2 },
    { w: 2.5, h: 2.5 }, { w: 3, h: 3 }, { w: 4, h: 4 },
    // Squares (same dims as circles — will overlap!)
    // Actually circles & squares share w×h, so dimension match can't distinguish.
    // Use one set of entries covering both shapes.
    // Rectangles
    { w: 1, h: 2 }, { w: 1.5, h: 3 }, { w: 2, h: 3 },
    { w: 2, h: 4 }, { w: 3, h: 4 },
    // Ovals
    { w: 1.5, h: 2 }, { w: 2, h: 3 }, // 2×3 already covered
    { w: 2.5, h: 3.5 },
  ];

  // Deduplicate by w×h key
  const seen = new Set();
  const uniqueDims = [];
  for (const d of dims) {
    const key = `${d.w}×${d.h}`;
    if (!seen.has(key)) {
      seen.add(key);
      uniqueDims.push(d);
    }
  }

  ALL_PRODUCTS.push({
    slug: "sticker-rolls",
    name: "Sticker Rolls",
    category: "stickers",
    desc: "Custom roll labels and stickers for high-volume applications. BOPP material in white, clear, kraft, or silver foil. Ideal for product labelling, food packaging, bottle labels, and shipping. Printed in Toronto with Canada-wide delivery.",
    sizes: uniqueDims.map((d) => ({
      label: `${d.w}" × ${d.h}"`,
      widthIn: d.w,
      heightIn: d.h,
      quantityChoices: QTYS,
      priceByQty: scalePBQ(BASE, areaFactor(d.w, d.h, baseW, baseH)),
    })),
  });
}

// =========================================================================
//  5. VINYL LETTERING
// =========================================================================
// Per-set pricing by letter height. widthIn = height × 4 (estimate)
{
  const BASE = d2c({ 1: 7.99, 2: 13.99, 5: 29.99, 10: 49.99, 25: 99.99, 50: 169.99 });
  const QTYS = [1, 2, 5, 10, 25, 50];
  const baseW = 8, baseH = 2; // 2" letter height base

  const heights = [
    { val: 1, w: 4, h: 1 },
    { val: 2, w: 8, h: 2 },
    { val: 3, w: 12, h: 3 },
    { val: 4, w: 16, h: 4 },
    { val: 6, w: 24, h: 6 },
    { val: 8, w: 32, h: 8 },
    { val: 12, w: 48, h: 12 },
  ];

  ALL_PRODUCTS.push({
    slug: "vinyl-lettering",
    name: "Vinyl Lettering",
    category: "stickers",
    desc: "Custom vinyl lettering for storefronts, vehicles, walls, and windows. Available in standard and reflective vinyl, multiple colours including gold and silver. UV and weather resistant for outdoor durability. Cut in Toronto, shipped across Canada.",
    sizes: heights.map((h) => ({
      label: `${h.val}" Letter Height`,
      widthIn: h.w,
      heightIn: h.h,
      quantityChoices: QTYS,
      priceByQty: scalePBQ(BASE, areaFactor(h.w, h.h, baseW, baseH)),
    })),
  });
}

// =========================================================================
//  6. SAFETY LABELS
// =========================================================================
{
  const BASE = d2c({ 10: 9.99, 25: 19.99, 50: 34.99, 100: 54.99, 250: 99.99, 500: 159.99 });
  const QTYS = [10, 25, 50, 100, 250, 500];
  const baseW = 2, baseH = 3;
  const dims = [
    { w: 2, h: 3 }, { w: 3, h: 5 }, { w: 4, h: 6 }, { w: 7, h: 10 },
  ];

  ALL_PRODUCTS.push({
    slug: "safety-labels",
    name: "Safety Labels",
    category: "stickers",
    desc: "Custom safety and compliance labels for workplaces, warehouses, and construction sites. Durable vinyl, polyester, or reflective materials. Fire/emergency, hazard, PPE, and electrical/chemical categories. OSHA and WHMIS compliant designs. Printed in Toronto.",
    sizes: dims.map((d) => ({
      label: `${d.w}" × ${d.h}"`,
      widthIn: d.w,
      heightIn: d.h,
      quantityChoices: QTYS,
      priceByQty: scalePBQ(BASE, areaFactor(d.w, d.h, baseW, baseH)),
    })),
  });
}

// =========================================================================
//  7. INDUSTRIAL LABELS
// =========================================================================
{
  const BASE = d2c({ 25: 14.99, 50: 24.99, 100: 39.99, 250: 69.99, 500: 109.99, 1000: 169.99 });
  const QTYS = [25, 50, 100, 250, 500, 1000];
  const baseW = 2, baseH = 4;

  // All type sizes, deduplicated
  const allDims = [
    // asset-tag
    { w: 1.5, h: 3 }, { w: 2, h: 4 }, { w: 3, h: 5 },
    // pipe-marker
    { w: 1, h: 8 }, { w: 2, h: 8 }, { w: 4, h: 24 },
    // warehouse
    // 2×4 already above, 3×5 already above
    { w: 4, h: 6 },
    // cable
    { w: 0.5, h: 1.5 }, { w: 0.75, h: 2 }, { w: 1, h: 3 },
  ];

  // Deduplicate
  const seen = new Set();
  const uniqueDims = [];
  for (const d of allDims) {
    const key = `${d.w}×${d.h}`;
    if (!seen.has(key)) { seen.add(key); uniqueDims.push(d); }
  }

  ALL_PRODUCTS.push({
    slug: "industrial-labels",
    name: "Industrial Labels",
    category: "stickers",
    desc: "Durable industrial labels for asset tracking, pipe marking, warehouse organisation, and cable identification. Available in vinyl, polyester, and aluminium foil with optional extra-durable lamination. Designed for harsh environments. Toronto printing.",
    sizes: uniqueDims.map((d) => ({
      label: `${d.w}" × ${d.h}"`,
      widthIn: d.w,
      heightIn: d.h,
      quantityChoices: QTYS,
      priceByQty: scalePBQ(BASE, areaFactor(d.w, d.h, baseW, baseH)),
    })),
  });
}

// =========================================================================
//  8–15. STAMPS (8 models, each its own product)
// =========================================================================
// Market ref: VistaPrint stamps $25-55, Rubber Stamp Creation $20-45
{
  const QTYS = [1, 2, 3, 5, 10];

  const STAMP_MODELS = [
    // Rectangular
    {
      slug: "stamps-s510", name: "Self-Inking Stamp — S510 (26 × 9 mm)",
      w: 1.02, h: 0.35,
      desc: "Compact self-inking stamp (26 × 9 mm) — perfect for initials, date stamps, and short text. Trodat-compatible mechanism with replaceable ink pad. Available in 5 ink colours.",
      pbq: d2c({ 1: 19.99, 2: 37.99, 3: 53.99, 5: 84.99, 10: 149.99 }),
    },
    {
      slug: "stamps-s520", name: "Self-Inking Stamp — S520 (38 × 14 mm)",
      w: 1.50, h: 0.55,
      desc: "Medium self-inking stamp (38 × 14 mm) — ideal for return addresses, one-line messages, and signatures. Crisp impressions up to 10,000 uses before re-inking.",
      pbq: d2c({ 1: 24.99, 2: 46.99, 3: 66.99, 5: 104.99, 10: 184.99 }),
    },
    {
      slug: "stamps-s542", name: "Self-Inking Stamp — S542 (58 × 22 mm)",
      w: 2.28, h: 0.87,
      desc: "Large self-inking stamp (58 × 22 mm) — great for 3-line addresses, business info, and custom messages. Professional quality with replaceable ink cartridge.",
      pbq: d2c({ 1: 34.99, 2: 65.99, 3: 94.99, 5: 149.99, 10: 264.99 }),
    },
    {
      slug: "stamps-s827", name: "Self-Inking Stamp — S827 (60 × 40 mm)",
      w: 2.36, h: 1.57,
      desc: "Extra-large self-inking stamp (60 × 40 mm) — fits logos, QR codes, full address blocks, and detailed artwork. Heavy-duty mechanism for office and warehouse use.",
      pbq: d2c({ 1: 49.99, 2: 94.99, 3: 134.99, 5: 209.99, 10: 369.99 }),
    },
    // Round
    {
      slug: "stamps-r512", name: "Self-Inking Stamp — R512 (∅ 12 mm)",
      w: 0.47, h: 0.47,
      desc: "Tiny round self-inking stamp (∅ 12 mm) — perfect for loyalty card stamps, checkmarks, and small icons. Compact pocket-sized design.",
      pbq: d2c({ 1: 19.99, 2: 37.99, 3: 53.99, 5: 84.99, 10: 149.99 }),
    },
    {
      slug: "stamps-r524", name: "Self-Inking Stamp — R524 (∅ 25 mm)",
      w: 0.98, h: 0.98,
      desc: "Medium round self-inking stamp (∅ 25 mm) — ideal for company seals, monograms, and circular logos. Professional notary-style format.",
      pbq: d2c({ 1: 29.99, 2: 56.99, 3: 80.99, 5: 124.99, 10: 219.99 }),
    },
    {
      slug: "stamps-r532", name: "Self-Inking Stamp — R532 (∅ 30 mm)",
      w: 1.18, h: 1.18,
      desc: "Large round self-inking stamp (∅ 30 mm) — great for corporate seals, emblem stamps, and detailed circular designs. Built for frequent office use.",
      pbq: d2c({ 1: 34.99, 2: 65.99, 3: 94.99, 5: 149.99, 10: 264.99 }),
    },
    {
      slug: "stamps-r552", name: "Self-Inking Stamp — R552 (∅ 50 mm)",
      w: 1.97, h: 1.97,
      desc: "Extra-large round self-inking stamp (∅ 50 mm) — maximum impression area for detailed logos, quality seals, and inspection stamps. Heavy-duty professional mechanism.",
      pbq: d2c({ 1: 54.99, 2: 104.99, 3: 149.99, 5: 234.99, 10: 409.99 }),
    },
  ];

  for (const m of STAMP_MODELS) {
    ALL_PRODUCTS.push({
      slug: m.slug,
      name: m.name,
      category: "stickers",
      desc: m.desc,
      sizes: [{
        label: m.name.split(" — ")[1] || m.slug,
        widthIn: m.w,
        heightIn: m.h,
        quantityChoices: QTYS,
        priceByQty: m.pbq,
      }],
    });
  }
}

// =========================================================================
//  16–18. DECALS (window, wall, floor)
// =========================================================================
// All share same sizes. Floor = 1.3× (anti-slip lamination).
{
  const BASE = d2c({ 1: 9.99, 5: 39.99, 10: 69.99, 25: 149.99, 50: 249.99, 100: 399.99 });
  const QTYS = [1, 5, 10, 25, 50, 100];
  const baseW = 4, baseH = 4;
  const dims = [
    { w: 4, h: 4 }, { w: 8, h: 8 }, { w: 12, h: 12 },
    { w: 24, h: 24 }, { w: 12, h: 36 },
  ];

  const buildSizes = (factor) =>
    dims.map((d) => ({
      label: `${d.w}" × ${d.h}"`,
      widthIn: d.w,
      heightIn: d.h,
      quantityChoices: QTYS,
      priceByQty: scalePBQ(BASE, areaFactor(d.w, d.h, baseW, baseH) * factor),
    }));

  ALL_PRODUCTS.push({
    slug: "decals-window",
    name: "Window Decals",
    category: "windows-walls-floors",
    desc: "Custom window decals and clings for storefronts, offices, and vehicles. Available in clear, white, perforated (see-through), and reflective vinyl. Front or inside-glass adhesive options. UV resistant for long-lasting outdoor use. Toronto printing.",
    sizes: buildSizes(1.0),
  });

  ALL_PRODUCTS.push({
    slug: "decals-wall",
    name: "Wall Decals",
    category: "windows-walls-floors",
    desc: "Custom wall decals for offices, retail spaces, restaurants, and home decor. Removable adhesive won't damage paint. Available in clear, white, and reflective vinyl. Perfect for branding, wayfinding, and decorative graphics. Printed in Toronto.",
    sizes: buildSizes(1.0),
  });

  ALL_PRODUCTS.push({
    slug: "decals-floor",
    name: "Floor Decals",
    category: "windows-walls-floors",
    desc: "Custom floor decals with anti-slip lamination for safety. Ideal for retail wayfinding, social distancing markers, event graphics, and warehouse markings. Durable outdoor-rated vinyl with textured surface. Toronto production, Canada-wide shipping.",
    sizes: buildSizes(1.3), // anti-slip lamination premium
  });
}

// =========================================================================
//  19. SHELF DISPLAYS
// =========================================================================
{
  const QTYS = [25, 50, 100, 250, 500];
  const baseTalker = d2c({ 25: 14.99, 50: 24.99, 100: 39.99, 250: 69.99, 500: 109.99 });
  const baseW = 3.5, baseH = 5;

  const dims = [
    // Talkers
    { w: 3.5, h: 5 },
    { w: 4, h: 6 },
    // Wobblers
    { w: 3, h: 3 },
    { w: 3.5, h: 3.5 },
    // Strips
    { w: 1.25, h: 48 },
    { w: 1.25, h: 36 },
  ];

  ALL_PRODUCTS.push({
    slug: "shelf-displays",
    name: "Shelf Displays",
    category: "marketing-business",
    desc: "Custom shelf talkers, wobblers, and shelf strips for retail point-of-purchase displays. Printed on 14pt or 16pt cardstock with gloss or matte coating. Attract attention and drive sales at the shelf. Toronto printing with Canada-wide delivery.",
    sizes: dims.map((d) => ({
      label: `${d.w}" × ${d.h}"`,
      widthIn: d.w,
      heightIn: d.h,
      quantityChoices: QTYS,
      priceByQty: scalePBQ(baseTalker, areaFactor(d.w, d.h, baseW, baseH)),
    })),
  });
}

// =========================================================================
//  20. TABLE TENTS
// =========================================================================
// Frontend sends widthIn = size.w * 2 (folded tent)
{
  const QTYS = [25, 50, 100, 250, 500];
  const BASE = d2c({ 25: 19.99, 50: 29.99, 100: 44.99, 250: 79.99, 500: 129.99 });
  // Base is 4×6 tent → sent as 8×6
  const baseW = 8, baseH = 6;

  const dims = [
    { label: '4" × 6"', w: 8, h: 6 },     // 4×6 tent → w*2 = 8
    { label: '5" × 7"', w: 10, h: 7 },    // 5×7 tent → w*2 = 10
    { label: '6" × 8"', w: 12, h: 8 },    // 6×8 tent → w*2 = 12
  ];

  ALL_PRODUCTS.push({
    slug: "table-tents",
    name: "Table Tents",
    category: "marketing-business",
    desc: "Custom table tents for restaurants, cafes, bars, and events. Double-sided printing on 14pt or 16pt cardstock with optional coating. Perfect for menus, promotions, reservations, and event signage. Printed in Toronto.",
    sizes: dims.map((d) => ({
      label: d.label,
      widthIn: d.w,
      heightIn: d.h,
      quantityChoices: QTYS,
      priceByQty: scalePBQ(BASE, areaFactor(d.w, d.h, baseW, baseH)),
    })),
  });
}

// =========================================================================
//  21. RETAIL TAGS
// =========================================================================
{
  const QTYS = [100, 250, 500, 1000, 2500];
  const BASE = d2c({ 100: 14.99, 250: 29.99, 500: 49.99, 1000: 79.99, 2500: 149.99 });
  const baseW = 1.5, baseH = 2.5;

  const dims = [
    { w: 1.5, h: 2.5 }, { w: 2, h: 3 }, { w: 2.5, h: 4 }, { w: 3, h: 5 },
  ];

  ALL_PRODUCTS.push({
    slug: "retail-tags",
    name: "Retail Tags",
    category: "marketing-business",
    desc: "Custom retail hang tags for clothing, jewellery, gifts, and artisan products. Printed on premium cardstock (14pt, 16pt, or kraft) with optional coating, rounded corners, and string holes. Elevate your brand at the point of sale. Toronto printing.",
    sizes: dims.map((d) => ({
      label: `${d.w}" × ${d.h}"`,
      widthIn: d.w,
      heightIn: d.h,
      quantityChoices: QTYS,
      priceByQty: scalePBQ(BASE, areaFactor(d.w, d.h, baseW, baseH)),
    })),
  });
}

// =========================================================================
//  22. PACKAGING INSERTS (insert cards)
// =========================================================================
{
  const QTYS = [100, 250, 500, 1000, 2500];
  const BASE = d2c({ 100: 12.99, 250: 24.99, 500: 39.99, 1000: 64.99, 2500: 119.99 });
  const baseW = 3.5, baseH = 2;

  const dims = [
    { w: 3.5, h: 2 },   // business card size
    { w: 4, h: 6 },
    { w: 5, h: 7 },
  ];

  ALL_PRODUCTS.push({
    slug: "inserts-packaging",
    name: "Packaging Inserts",
    category: "marketing-business",
    desc: "Custom packaging insert cards for e-commerce orders, product boxes, and thank-you cards. Printed on 14pt or 16pt cardstock with optional UV coating. Add discount codes, care instructions, or brand stories to every order. Toronto printing.",
    sizes: dims.map((d) => ({
      label: `${d.w}" × ${d.h}"`,
      widthIn: d.w,
      heightIn: d.h,
      quantityChoices: QTYS,
      priceByQty: scalePBQ(BASE, areaFactor(d.w, d.h, baseW, baseH)),
    })),
  });
}

// =========================================================================
//  23. STICKER SEALS
// =========================================================================
{
  const QTYS = [100, 250, 500, 1000, 2500];
  const BASE = d2c({ 100: 9.99, 250: 19.99, 500: 34.99, 1000: 54.99, 2500: 99.99 });
  const baseW = 1.5, baseH = 1.5;

  const dims = [
    { w: 1.5, h: 1.5 },   // 1.5" round
    { w: 2, h: 2 },       // 2" round
    { w: 2, h: 2 },       // 2" square — same dims, will be deduplicated
  ];

  // Deduplicate
  const seen = new Set();
  const uniqueDims = [];
  for (const d of dims) {
    const key = `${d.w}×${d.h}`;
    if (!seen.has(key)) { seen.add(key); uniqueDims.push(d); }
  }

  ALL_PRODUCTS.push({
    slug: "sticker-seals",
    name: "Sticker Seals",
    category: "marketing-business",
    desc: "Custom sticker seals for packaging, envelopes, gift wrapping, and product bags. Available in gloss, matte, and kraft finishes. Perfect for bakeries, boutiques, and e-commerce brands adding a premium touch. Printed in Toronto.",
    sizes: uniqueDims.map((d) => ({
      label: `${d.w}" × ${d.h}"`,
      widthIn: d.w,
      heightIn: d.h,
      quantityChoices: QTYS,
      priceByQty: scalePBQ(BASE, areaFactor(d.w, d.h, baseW, baseH)),
    })),
  });
}

// =========================================================================
//  24–26. BOOKLETS (3 binding types)
// =========================================================================
// The order page sends slug per binding type. Page count is metadata only.
// Pricing based on ~16-page standard. Competitive with Zoom/VistaPrint.
// Market ref: Zoom 8.5×11 saddle-stitch 16pp — 100=$250-350
{
  const QTYS = [25, 50, 100, 250, 500, 1000];
  // Base: half-letter (5.5×8.5), saddle-stitch
  const SADDLE_BASE = d2c({ 25: 74.99, 50: 124.99, 100: 199.99, 250: 349.99, 500: 549.99, 1000: 849.99 });
  const baseW = 5.5, baseH = 8.5;

  const BOOK_SIZES = [
    { label: '5.5" × 8.5"', w: 5.5, h: 8.5 },
    { label: '8.5" × 11"', w: 8.5, h: 11 },
    { label: '6" × 9"', w: 6, h: 9 },
    { label: '8.5" × 5.5" (landscape)', w: 8.5, h: 5.5 },
  ];

  const buildBookletSizes = (bindingMult) =>
    BOOK_SIZES.map((s) => ({
      label: s.label,
      widthIn: s.w,
      heightIn: s.h,
      quantityChoices: QTYS,
      priceByQty: scalePBQ(SADDLE_BASE, areaFactor(s.w, s.h, baseW, baseH) * bindingMult),
    }));

  ALL_PRODUCTS.push({
    slug: "booklets-saddle-stitch",
    name: "Booklets — Saddle Stitch",
    category: "marketing-prints",
    desc: "Saddle-stitched booklets (staple-bound) — the most popular and affordable binding for 8–64 pages. Ideal for catalogues, programs, magazines, lookbooks, and instruction manuals. Full-colour on premium paper with cover coating options. Printed in Toronto.",
    sizes: buildBookletSizes(1.0),
  });

  ALL_PRODUCTS.push({
    slug: "booklets-perfect-bound",
    name: "Booklets — Perfect Bound",
    category: "marketing-prints",
    desc: "Perfect-bound booklets with a flat spine for a professional, book-like finish. Suitable for 24–400 pages — ideal for annual reports, catalogues, training manuals, and coffee-table publications. Glue-bound with printed spine. Toronto production.",
    sizes: buildBookletSizes(1.2),
  });

  ALL_PRODUCTS.push({
    slug: "booklets-wire-o",
    name: "Booklets — Wire-O Bound",
    category: "marketing-prints",
    desc: "Wire-O bound booklets that lay flat when open — perfect for notebooks, planners, recipe books, and reference manuals. 12–200 pages with metal wire binding in black or white. Premium paper and cover options. Printed in Toronto.",
    sizes: buildBookletSizes(1.35),
  });
}


// ══════════════════════════════════════════════════════════════════════════
//  MAIN — Upsert all products
// ══════════════════════════════════════════════════════════════════════════

async function main() {
  let created = 0;
  let updated = 0;

  for (const prod of ALL_PRODUCTS) {
    const optionsConfig = {
      sizes: prod.sizes,
      ui: { hideTierPricing: true },
    };

    const existing = await prisma.product.findFirst({ where: { slug: prod.slug } });

    if (existing) {
      await prisma.product.update({
        where: { id: existing.id },
        data: {
          name: prod.name,
          description: prod.desc,
          optionsConfig,
          isActive: true,
        },
      });
      console.log(`  ~ Updated: ${prod.slug} (${prod.sizes.length} sizes)`);
      updated++;
    } else {
      await prisma.product.create({
        data: {
          slug: prod.slug,
          name: prod.name,
          description: prod.desc,
          category: prod.category,
          basePrice: 0,
          pricingUnit: "per_piece",
          isActive: true,
          optionsConfig,
        },
      });
      console.log(`  + Created: ${prod.slug} (${prod.sizes.length} sizes)`);
      created++;
    }

    // Print sample pricing for first and last size
    const first = prod.sizes[0];
    const last = prod.sizes[prod.sizes.length - 1];
    const firstQtys = Object.keys(first.priceByQty);
    const loQ = firstQtys[0];
    const hiQ = firstQtys[firstQtys.length - 1];
    console.log(
      `    ${first.label}: ${loQ}=$${(first.priceByQty[loQ] / 100).toFixed(2)}, ${hiQ}=$${(first.priceByQty[hiQ] / 100).toFixed(2)}`
    );
    if (prod.sizes.length > 1) {
      const lastQtys = Object.keys(last.priceByQty);
      const lQ2 = lastQtys[0];
      const hQ2 = lastQtys[lastQtys.length - 1];
      console.log(
        `    ${last.label}: ${lQ2}=$${(last.priceByQty[lQ2] / 100).toFixed(2)}, ${hQ2}=$${(last.priceByQty[hQ2] / 100).toFixed(2)}`
      );
    }
  }

  console.log(`\nDone — ${created} created, ${updated} updated (${ALL_PRODUCTS.length} total).`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
