// Phase 4: Calculate and set displayFromPrice for all active products
// Uses the pricing templates directly with minimum dimensions + qty 1

import { PrismaClient } from '../node_modules/.prisma/client/index.js';
import { vinylPrint, boardSign, banner, paperPrint, canvas, vinylCut } from '../lib/pricing/templates.js';

const p = new PrismaClient();

async function mat(name) {
  const m = await p.material.findFirst({ where: { name: { contains: name, mode: 'insensitive' } } });
  return m;
}

async function setting(key, fallback) {
  const s = await p.setting.findUnique({ where: { key } });
  return s ? Number(s.value) : fallback;
}

const inkRate = await setting('ink_rate_sqft', 0.035);
const inkClick = await setting('ink_cost_color', 0.05);

// Category → template mapping
const CATEGORY_TEMPLATE = {
  'stickers-labels-decals': 'vinyl_print',
  'signs-rigid-boards': 'board_sign',
  'banners-displays': 'banner',
  'marketing-business-print': 'paper_print',
  'canvas-prints': 'canvas',
  'vehicle-graphics-fleet': 'vinyl_cut',
  'windows-walls-floors': 'vinyl_print',
};

const CATEGORY_MARGIN = {
  'stickers-labels-decals': 'stickers',
  'signs-rigid-boards': 'signs',
  'banners-displays': 'banners',
  'marketing-business-print': 'print',
  'canvas-prints': 'canvas',
  'vehicle-graphics-fleet': 'vehicle',
  'windows-walls-floors': 'wwf',
};

// Default "from" dimensions per category (smallest common product)
const DEFAULT_DIMS = {
  'stickers-labels-decals': { w: 3, h: 3, qty: 1, opts: { isSticker: true, cutType: 'die_cut' } },
  'signs-rigid-boards': { w: 18, h: 24, qty: 1, opts: { doubleSided: false } },
  'banners-displays': { w: 24, h: 36, qty: 1, opts: {} },
  'marketing-business-print': { w: 3.5, h: 2, qty: 250, opts: { doubleSided: true } },
  'canvas-prints': { w: 8, h: 10, qty: 1, opts: { frameType: 'gallery' } },
  'vehicle-graphics-fleet': { w: 12, h: 4, qty: 1, opts: {} },
  'windows-walls-floors': { w: 12, h: 12, qty: 1, opts: { isSticker: false } },
};

// Pre-fetch materials
const whiteVinyl = await mat('Regular White Vinyl');
const frostedVinyl = await mat('Frosted Vinyl');
const coroplast4mm = await mat('Coroplast 4mm');
const frontlit13oz = await mat('13oz Frontlit Vinyl Banner');
const cardstock14pt = await mat('14pt Card Stock');
const canvasMat = await mat('Canvas');

const products = await p.product.findMany({
  where: { isActive: true },
  select: { id: true, slug: true, name: true, category: true, pricingUnit: true, pricingConfig: true },
  orderBy: { category: 'asc' },
});

let updated = 0;
let skipped = 0;
let errors = 0;

for (const prod of products) {
  try {
    // Skip quote-only products
    if (prod.pricingUnit === 'quote') {
      skipped++;
      continue;
    }

    // Check for outsourced fixedPrices
    const cfg = prod.pricingConfig;
    if (cfg && cfg.fixedPrices) {
      // Find lowest price
      let minCents = Infinity;
      for (const sizePrices of Object.values(cfg.fixedPrices)) {
        for (const cents of Object.values(sizePrices)) {
          if (cents < minCents) minCents = cents;
        }
      }
      if (minCents < Infinity) {
        await p.product.update({ where: { id: prod.id }, data: { displayFromPrice: minCents } });
        console.log('  FROM (outsourced): ' + prod.slug + ' = $' + (minCents / 100).toFixed(2));
        updated++;
        continue;
      }
    }

    // Formula-priced: calculate using template
    const tmpl = CATEGORY_TEMPLATE[prod.category];
    const marginCat = CATEGORY_MARGIN[prod.category];
    const dims = DEFAULT_DIMS[prod.category];
    if (!tmpl || !dims) {
      console.log('  SKIP (no template): ' + prod.slug);
      skipped++;
      continue;
    }

    let result;
    switch (tmpl) {
      case 'vinyl_print':
        result = vinylPrint({
          widthIn: dims.w, heightIn: dims.h, quantity: dims.qty,
          material: prod.category === 'windows-walls-floors' ? (frostedVinyl || whiteVinyl) : whiteVinyl,
          inkRate, lamination: null, options: dims.opts,
          marginCategory: marginCat,
        });
        break;
      case 'board_sign':
        result = boardSign({
          widthIn: dims.w, heightIn: dims.h, quantity: dims.qty,
          boardMaterial: coroplast4mm, vinylMaterial: whiteVinyl, inkRate,
          options: dims.opts, marginCategory: marginCat,
        });
        break;
      case 'banner':
        result = banner({
          widthIn: dims.w, heightIn: dims.h, quantity: dims.qty,
          material: frontlit13oz, inkRate,
          finishing: dims.opts, accessories: [],
          marginCategory: marginCat,
        });
        break;
      case 'paper_print':
        result = paperPrint({
          widthIn: dims.w, heightIn: dims.h, quantity: dims.qty,
          paper: cardstock14pt, inkCostPerClick: inkClick,
          options: dims.opts, lamination: null,
          marginCategory: marginCat,
        });
        break;
      case 'canvas':
        result = canvas({
          widthIn: dims.w, heightIn: dims.h, quantity: dims.qty,
          canvasMaterial: canvasMat, inkRate,
          options: dims.opts, marginCategory: marginCat,
        });
        break;
      case 'vinyl_cut':
        result = vinylCut({
          widthIn: dims.w, heightIn: dims.h, quantity: dims.qty,
          material: whiteVinyl, marginCategory: marginCat,
        });
        break;
    }

    if (result) {
      await p.product.update({ where: { id: prod.id }, data: { displayFromPrice: result.totalCents } });
      console.log('  FROM: ' + prod.slug + ' = $' + (result.totalCents / 100).toFixed(2) + ' (' + tmpl + ')');
      updated++;
    }
  } catch (err) {
    console.log('  ERROR: ' + prod.slug + ' - ' + err.message);
    errors++;
  }
}

console.log('');
console.log('=== SUMMARY ===');
console.log('Updated: ' + updated);
console.log('Skipped: ' + skipped + ' (quote-only or no template)');
console.log('Errors:  ' + errors);

// Verify
const withPrice = await p.product.count({ where: { isActive: true, displayFromPrice: { not: null } } });
const withoutPrice = await p.product.count({ where: { isActive: true, displayFromPrice: null } });
console.log('');
console.log('Products with displayFromPrice: ' + withPrice);
console.log('Products without (should be quote-only): ' + withoutPrice);

await p.$disconnect();
