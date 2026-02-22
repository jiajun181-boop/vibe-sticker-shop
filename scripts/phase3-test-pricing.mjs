// Phase 3 Round 2: Test pricing with tiered margins, setup fees, ink-per-piece
import { PrismaClient } from '../node_modules/.prisma/client/index.js';
import { vinylPrint, boardSign, banner, paperPrint, canvas, vinylCut, getMargin } from '../lib/pricing/templates.js';

const p = new PrismaClient();

async function mat(name) {
  const m = await p.material.findFirst({ where: { name: { contains: name, mode: 'insensitive' } } });
  if (!m) throw new Error(`Material not found: ${name}`);
  return m;
}

async function setting(key, fallback) {
  const s = await p.setting.findUnique({ where: { key } });
  return s ? Number(s.value) : fallback;
}

const inkRate = await setting('ink_rate_sqft', 0.035);
const inkClick = await setting('ink_cost_color', 0.05);

console.log(`Ink rate (large format): $${inkRate}/sqft`);
console.log(`Ink cost (paper click): $${inkClick}/click`);
console.log('');

console.log('Margin tiers:');
for (const [cat, qty] of [
  ['stickers', 25], ['stickers', 100], ['signs', 10], ['banners', 1],
  ['print', 250], ['print', 500], ['canvas', 1], ['vehicle', 5],
]) {
  console.log(`  ${cat} @ qty ${qty}: ${(getMargin(cat, qty) * 100).toFixed(0)}%`);
}
console.log('');

const tests = [];

// TEST 1: Die-cut stickers 3×3" × 100
tests.push(async () => {
  const material = await mat('Regular White Vinyl');
  const result = vinylPrint({
    widthIn: 3, heightIn: 3, quantity: 100,
    material, inkRate, lamination: null,
    options: { isSticker: true, cutType: 'die_cut' },
    marginCategory: 'stickers',
  });
  return { name: '1. Die-Cut Stickers 3×3" × 100 (White Vinyl)', ...result };
});

// TEST 1b: Stickers × 25 — must be ≥ $25
tests.push(async () => {
  const material = await mat('Regular White Vinyl');
  const result = vinylPrint({
    widthIn: 3, heightIn: 3, quantity: 25,
    material, inkRate, lamination: null,
    options: { isSticker: true, cutType: 'die_cut' },
    marginCategory: 'stickers',
  });
  return { name: '1b. Stickers 3×3" × 25 — TARGET ≥$25', ...result };
});

// TEST 2: Window decal 24×36" × 1 (WWF)
tests.push(async () => {
  const material = await mat('Frosted Vinyl');
  const result = vinylPrint({
    widthIn: 24, heightIn: 36, quantity: 1,
    material, inkRate, lamination: null,
    options: { isSticker: false },
    marginCategory: 'wwf',
  });
  return { name: '2. Window Decal 24×36" × 1 (Frosted Vinyl, WWF)', ...result };
});

// TEST 3: Yard sign 18×24" × 10 double-sided
tests.push(async () => {
  const board = await mat('Coroplast 4mm');
  const vinyl = await mat('Regular White Vinyl');
  const result = boardSign({
    widthIn: 18, heightIn: 24, quantity: 10,
    boardMaterial: board, vinylMaterial: vinyl, inkRate,
    options: { doubleSided: true },
    marginCategory: 'signs',
  });
  return { name: '3. Yard Sign 18×24" × 10 (Coroplast 4mm, 2-sided)', ...result };
});

// TEST 4: Foam board 24×36" × 1
tests.push(async () => {
  const board = await mat('Foam Board 5mm');
  const vinyl = await mat('Regular White Vinyl');
  const result = boardSign({
    widthIn: 24, heightIn: 36, quantity: 1,
    boardMaterial: board, vinylMaterial: vinyl, inkRate,
    options: { doubleSided: false },
    marginCategory: 'signs',
  });
  return { name: '4. Foam Board 24×36" × 1 (5mm, 1-sided)', ...result };
});

// TEST 5: Vinyl banner 36×72" × 1 (grommets+hems)
tests.push(async () => {
  const material = await mat('13oz Frontlit Vinyl Banner');
  const result = banner({
    widthIn: 36, heightIn: 72, quantity: 1,
    material, inkRate,
    finishing: { grommets: true, hems: true },
    accessories: [],
    marginCategory: 'banners',
  });
  return { name: '5. Vinyl Banner 36×72" × 1 (13oz, Grommets+Hems)', ...result };
});

// TEST 6: Retractable banner + stand — TARGET ~$138
tests.push(async () => {
  const material = await mat('PET Grey Back');
  const stand = await p.hardwareItem.findFirst({ where: { slug: 'retractable-stand-standard' } });
  const result = banner({
    widthIn: 33, heightIn: 81, quantity: 1,
    material, inkRate,
    finishing: {},
    accessories: stand ? [{ ...stand, quantity: 1 }] : [],
    marginCategory: 'banners',
  });
  return { name: '6. Retractable 33×81" + Stand — TARGET ~$138', ...result };
});

// TEST 7: Business cards 3.5×2" × 250
tests.push(async () => {
  const paper = await mat('14pt Card Stock');
  const lam = await mat('OPP Gloss Lamination');
  const result = paperPrint({
    widthIn: 3.5, heightIn: 2, quantity: 250,
    paper, inkCostPerClick: inkClick,
    options: { doubleSided: true, roundedCorners: false },
    lamination: lam,
    marginCategory: 'print',
  });
  return { name: '7. Business Cards 3.5×2" × 250 (14pt, Gloss, 2-sided)', ...result };
});

// TEST 8: Flyers 8.5×11" × 500 double-sided — TARGET ~$178
tests.push(async () => {
  const paper = await mat('100lb Coated Paper');
  const result = paperPrint({
    widthIn: 8.5, heightIn: 11, quantity: 500,
    paper, inkCostPerClick: inkClick,
    options: { doubleSided: true },
    lamination: null,
    marginCategory: 'print',
  });
  return { name: '8. Flyers 8.5×11" × 500 2-sided — TARGET ~$178', ...result };
});

// TEST 9: Canvas 16×20" × 1 — min $49
tests.push(async () => {
  const canvasMat = await mat('Canvas');
  const result = canvas({
    widthIn: 16, heightIn: 20, quantity: 1,
    canvasMaterial: canvasMat, inkRate,
    options: { frameType: 'gallery' },
    marginCategory: 'canvas',
  });
  return { name: '9. Canvas 16×20" × 1 (Gallery Wrap) — MIN $49', ...result };
});

// TEST 10: Vinyl lettering 12×4" × 5
tests.push(async () => {
  const material = await mat('Regular White Vinyl');
  const result = vinylCut({
    widthIn: 12, heightIn: 4, quantity: 5,
    material,
    marginCategory: 'vehicle',
  });
  return { name: '10. Vinyl Lettering 12×4" × 5 (Cut Only)', ...result };
});

// ═══ RUN ═══
console.log('═══════════════════════════════════════════════════');
console.log('  PHASE 3 ROUND 2 — PRICING TEST RESULTS');
console.log('═══════════════════════════════════════════════════');

for (const testFn of tests) {
  try {
    const r = await testFn();
    const total = (r.totalCents / 100).toFixed(2);
    const unit = (r.unitCents / 100).toFixed(2);
    console.log(`\n${r.name}`);
    console.log(`  TOTAL: $${total} CAD  |  UNIT: $${unit}/ea  |  Level: ${r.priceLevel}`);
    console.log('  Breakdown:');
    for (const [k, v] of Object.entries(r.breakdown)) {
      if (k === 'profitMargin') {
        console.log(`    ${k}: ${(v * 100).toFixed(0)}%`);
      } else {
        console.log(`    ${k}: $${(v / 100).toFixed(2)}`);
      }
    }
    if (r.meta?.marginCategory) console.log(`  Margin: ${r.meta.marginCategory}`);
    if (r.meta?.setupFee) console.log(`  Setup fee: $${r.meta.setupFee.toFixed(2)}`);
    if (r.meta?.accessoryDetails?.length > 0) {
      for (const a of r.meta.accessoryDetails) {
        console.log(`  Accessory: ${a.name} — cost $${a.cost.toFixed(2)} → sell $${a.sellingPrice.toFixed(2)} (×2.5)`);
      }
    }
  } catch (err) {
    console.log(`\n  ERROR: ${err.message}`);
  }
}

console.log('\n═══════════════════════════════════════════════════');
console.log('VALIDATION TARGETS:');
console.log('  Test 1b (Stickers ×25):       ≥ $25.00');
console.log('  Test 6  (Retractable+Stand):   ~ $138');
console.log('  Test 8  (Flyers 500 2-sided):  ~ $178');
console.log('  Test 9  (Canvas 16×20):        ≥ $49.00');
console.log('═══════════════════════════════════════════════════');
await p.$disconnect();
