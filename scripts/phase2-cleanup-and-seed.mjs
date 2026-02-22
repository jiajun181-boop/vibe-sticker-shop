// Phase 2: Cleanup garbage data + seed new materials + fix hardware + update ink settings
import { PrismaClient } from '../node_modules/.prisma/client/index.js';
const p = new PrismaClient();

let deleted = 0, updated = 0, created = 0;

// ═══════════════════════════════════════════════════════════
// 2.0  CLEANUP
// ═══════════════════════════════════════════════════════════

// 2.0.1 — Delete 8 empty "New Material" placeholders
console.log('\n=== 2.0.1  Delete "New Material" placeholders ===');
const emptyMats = await p.material.findMany({ where: { name: 'New Material' } });
console.log(`  Found ${emptyMats.length} "New Material" records`);
if (emptyMats.length > 0) {
  const r = await p.material.deleteMany({ where: { name: 'New Material' } });
  deleted += r.count;
  console.log(`  Deleted ${r.count}`);
}

// 2.0.2 — Fix hardware prices
console.log('\n=== 2.0.2  Fix hardware prices ===');

// A-Frame Stand: $0.75 → $51.50 ($5150 cents)
const aframe = await p.hardwareItem.findFirst({ where: { slug: 'a-frame-stand' } });
if (aframe) {
  await p.hardwareItem.update({ where: { id: aframe.id }, data: { priceCents: 5150, unit: 'per_unit' } });
  console.log(`  A-Frame Stand: $${(aframe.priceCents/100).toFixed(2)} → $51.50`);
  updated++;
}

// Retractable Stand Standard: $0.35 → $35.00 ($3500 cents)
const retract = await p.hardwareItem.findFirst({ where: { slug: 'retractable-stand-standard' } });
if (retract) {
  await p.hardwareItem.update({ where: { id: retract.id }, data: { priceCents: 3500 } });
  console.log(`  Retractable Stand Standard: $${(retract.priceCents/100).toFixed(2)} → $35.00`);
  updated++;
}

// Delete Metal Frame (doesn't exist)
const metalFrame = await p.hardwareItem.findFirst({ where: { slug: 'real-estate-frame' } });
if (metalFrame) {
  await p.hardwareItem.delete({ where: { id: metalFrame.id } });
  console.log(`  Metal Frame ($12.00): DELETED`);
  deleted++;
}

// 2.0.3 — Mark 3 zero-cost 3M materials as OUTSOURCED
console.log('\n=== 2.0.3  Mark 3M materials as OUTSOURCED ===');
const outsourcedNames = [
  'Floor Graphics (3M IJ40 + 8509 Anti-Slip)',
  'Car Wrap Vinyl (3M IJ180)',
  'Concrete/Brick (3M IJ8624)',
];
for (const name of outsourcedNames) {
  const mat = await p.material.findFirst({ where: { name } });
  if (mat) {
    await p.material.update({
      where: { id: mat.id },
      data: { family: 'OUTSOURCED', isActive: true },
    });
    console.log(`  ${name} → family=OUTSOURCED`);
    updated++;
  }
}

// 2.0.4 — Delete orphan presets (0 products linked)
console.log('\n=== 2.0.4  Delete orphan presets ===');
const allPresets = await p.pricingPreset.findMany({ include: { _count: { select: { products: true } } } });
const orphanPresets = allPresets.filter(pr => pr._count.products === 0);
console.log(`  Total presets: ${allPresets.length}, orphans: ${orphanPresets.length}`);
for (const pr of orphanPresets) {
  await p.pricingPreset.delete({ where: { id: pr.id } });
}
deleted += orphanPresets.length;
console.log(`  Deleted ${orphanPresets.length} orphan presets`);

// 2.0.5 — Clean up inactive products (delete obvious garbage, keep valid products)
console.log('\n=== 2.0.5  Clean up inactive products ===');
const inactiveProducts = await p.product.findMany({
  where: { isActive: false },
  include: {
    _count: { select: { orderItems: true } },
    images: { select: { id: true } },
  },
});

let deletedProducts = 0;
let keptProducts = 0;
const keptList = [];

for (const prod of inactiveProducts) {
  // KEEP if it has real orders
  if (prod._count.orderItems > 0) {
    keptList.push(`  KEPT (has orders): ${prod.name}`);
    keptProducts++;
    continue;
  }

  // DELETE — inactive with no orders
  // First delete images
  if (prod.images.length > 0) {
    await p.productImage.deleteMany({ where: { productId: prod.id } });
  }
  await p.product.delete({ where: { id: prod.id } });
  deletedProducts++;
}
deleted += deletedProducts;
console.log(`  Deleted ${deletedProducts} inactive products (no orders)`);
console.log(`  Kept ${keptProducts} inactive products (have orders)`);
keptList.forEach(k => console.log(k));

// ═══════════════════════════════════════════════════════════
// 2.1  RIGID BOARD MATERIALS (type = "Rigid Board")
// ═══════════════════════════════════════════════════════════
console.log('\n=== 2.1  Seed rigid board materials ===');
const rigidBoards = [
  {
    name: 'Coroplast 4mm',
    type: 'Rigid Board',
    family: 'Coroplast',
    rollSpec: '48×96 sheet',
    widthIn: 48,
    lengthFt: 8,   // 96 inches = 8 feet
    thickness: '4mm',
    rollCost: 11.00,
    sqftPerRoll: 32,
    costPerSqft: 0.34,   // 11.00 / 32
    costPerSqm: 3.66,
    isActive: true,
  },
  {
    name: 'Coroplast 6mm',
    type: 'Rigid Board',
    family: 'Coroplast',
    rollSpec: '48×96 sheet',
    widthIn: 48,
    lengthFt: 8,
    thickness: '6mm',
    rollCost: 24.00,
    sqftPerRoll: 32,
    costPerSqft: 0.75,
    costPerSqm: 8.07,
    isActive: true,
  },
  {
    name: 'Coroplast 10mm',
    type: 'Rigid Board',
    family: 'Coroplast',
    rollSpec: '48×96 sheet',
    widthIn: 48,
    lengthFt: 8,
    thickness: '10mm',
    rollCost: 35.75,
    sqftPerRoll: 32,
    costPerSqft: 1.12,
    costPerSqm: 12.06,
    isActive: true,
  },
  {
    name: 'Foam Board 5mm',
    type: 'Rigid Board',
    family: 'Foam Board',
    rollSpec: '48×96 sheet',
    widthIn: 48,
    lengthFt: 8,
    thickness: '5mm',
    rollCost: 15.00,
    sqftPerRoll: 32,
    costPerSqft: 0.47,
    costPerSqm: 5.06,
    isActive: true,
  },
  {
    name: 'Foam Board 10mm',
    type: 'Rigid Board',
    family: 'Foam Board',
    rollSpec: '48×96 sheet',
    widthIn: 48,
    lengthFt: 8,
    thickness: '10mm',
    rollCost: 40.00,
    sqftPerRoll: 32,
    costPerSqft: 1.25,
    costPerSqm: 13.45,
    isActive: true,
  },
  {
    name: 'PVC Board 3mm',
    type: 'Rigid Board',
    family: 'PVC',
    rollSpec: '48×96 sheet',
    widthIn: 48,
    lengthFt: 8,
    thickness: '3mm',
    rollCost: 40.00,
    sqftPerRoll: 32,
    costPerSqft: 1.25,
    costPerSqm: 13.45,
    isActive: true,
  },
];

for (const board of rigidBoards) {
  const existing = await p.material.findFirst({ where: { name: board.name, type: 'Rigid Board' } });
  if (existing) {
    await p.material.update({ where: { id: existing.id }, data: board });
    console.log(`  Updated: ${board.name}`);
    updated++;
  } else {
    await p.material.create({ data: board });
    console.log(`  Created: ${board.name} — $${board.costPerSqft}/sqft`);
    created++;
  }
}

// ═══════════════════════════════════════════════════════════
// 2.2  PAPER MATERIALS (type = "Paper")
// ═══════════════════════════════════════════════════════════
console.log('\n=== 2.2  Seed paper materials ===');
const papers = [
  {
    name: '14pt Card Stock',
    type: 'Paper',
    family: 'Cardstock',
    rollSpec: '12×18/13×19',
    costPerSqft: 0.10,   // per sheet ≈ per sqft for 12×18
    rollCost: 0.10,
    sqftPerRoll: 1,
    costPerSqm: 1.08,
    isActive: true,
  },
  {
    name: '100lb Coated Paper',
    type: 'Paper',
    family: 'Coated',
    rollSpec: '12×18',
    costPerSqft: 0.045,
    rollCost: 0.045,
    sqftPerRoll: 1,
    costPerSqm: 0.48,
    isActive: true,
  },
  {
    name: '20lb Bond Paper',
    type: 'Paper',
    family: 'Bond',
    rollSpec: '11×17',
    costPerSqft: 0.02,    // $50/box of 2500
    rollCost: 0.02,
    sqftPerRoll: 1,
    costPerSqm: 0.22,
    isActive: true,
  },
  {
    name: 'NCR 2-Part',
    type: 'Paper',
    family: 'NCR',
    rollSpec: '11×17',
    costPerSqft: 0.089,   // $89/1000 sets
    rollCost: 0.089,
    sqftPerRoll: 1,
    costPerSqm: 0.96,
    isActive: true,
  },
  {
    name: 'NCR 3-Part',
    type: 'Paper',
    family: 'NCR',
    rollSpec: '11×17',
    costPerSqft: 0.099,   // $99/1000 sets
    rollCost: 0.099,
    sqftPerRoll: 1,
    costPerSqm: 1.07,
    isActive: true,
  },
  {
    name: 'NCR 4-Part',
    type: 'Paper',
    family: 'NCR',
    rollSpec: '11×17',
    costPerSqft: 0.119,   // ~$119/1000 sets
    rollCost: 0.119,
    sqftPerRoll: 1,
    costPerSqm: 1.28,
    isActive: true,
  },
  {
    name: 'Envelope #10 Regular',
    type: 'Paper',
    family: 'Envelope',
    costPerSqft: 0.0365,  // $36.50/1000
    rollCost: 0.0365,
    sqftPerRoll: 1,
    costPerSqm: 0.39,
    isActive: true,
  },
  {
    name: 'Envelope #10 Window',
    type: 'Paper',
    family: 'Envelope',
    costPerSqft: 0.075,   // $75/1000 digital
    rollCost: 0.075,
    sqftPerRoll: 1,
    costPerSqm: 0.81,
    isActive: true,
  },
  {
    name: 'Paper Label Stock',
    type: 'Paper',
    family: 'Label',
    costPerSqft: 0.25,    // per sheet
    rollCost: 0.25,
    sqftPerRoll: 1,
    costPerSqm: 2.69,
    isActive: true,
  },
];

for (const paper of papers) {
  const existing = await p.material.findFirst({ where: { name: paper.name, type: 'Paper' } });
  if (existing) {
    await p.material.update({ where: { id: existing.id }, data: paper });
    console.log(`  Updated: ${paper.name}`);
    updated++;
  } else {
    await p.material.create({ data: paper });
    console.log(`  Created: ${paper.name} — $${paper.costPerSqft}/unit`);
    created++;
  }
}

// ═══════════════════════════════════════════════════════════
// 2.3  LAMINATION & SUPPLIES (type = "Lamination")
// ═══════════════════════════════════════════════════════════
console.log('\n=== 2.3  Seed lamination & supplies ===');
const laminates = [
  {
    name: 'OPP Gloss Lamination',
    type: 'Lamination',
    family: 'OPP',
    rollSpec: '12.8"×1641\'',
    widthIn: 12.8,
    costPerSqft: 0.095,   // $165.75/roll
    rollCost: 165.75,
    sqftPerRoll: 1744,     // 12.8/12 * 1641 ≈ 1744 sqft
    costPerSqm: 1.02,
    isActive: true,
  },
  {
    name: 'OPP Matte Lamination',
    type: 'Lamination',
    family: 'OPP',
    rollSpec: '12.8"×1641\'',
    widthIn: 12.8,
    costPerSqft: 0.10,    // estimated same as gloss
    rollCost: 174.00,
    sqftPerRoll: 1744,
    costPerSqm: 1.08,
    isActive: true,
  },
  {
    name: 'Transfer Tape',
    type: 'Lamination',
    family: 'Transfer',
    costPerSqft: 0,        // TBD — ~$150/roll, spec not confirmed
    rollCost: 150.00,
    sqftPerRoll: 0,
    costPerSqm: 0,
    isActive: true,
  },
  {
    name: 'Gold Foil Paper',
    type: 'Lamination',
    family: 'Foil',
    rollSpec: '32cm×100m',
    costPerSqft: 0,        // $25/roll, spec conversion TBD
    rollCost: 25.00,
    sqftPerRoll: 0,
    costPerSqm: 0,
    isActive: true,
  },
];

for (const lam of laminates) {
  const existing = await p.material.findFirst({ where: { name: lam.name, type: 'Lamination' } });
  if (existing) {
    await p.material.update({ where: { id: existing.id }, data: lam });
    console.log(`  Updated: ${lam.name}`);
    updated++;
  } else {
    await p.material.create({ data: lam });
    console.log(`  Created: ${lam.name} — $${lam.costPerSqft}/sqft`);
    created++;
  }
}

// ═══════════════════════════════════════════════════════════
// 2.4  HOLOGRAPHIC VINYL
// ═══════════════════════════════════════════════════════════
console.log('\n=== 2.4  Seed holographic vinyl ===');
const holoData = {
  name: 'GF 765 Holographic Film',
  type: 'Adhesive Vinyl',
  family: 'Holographic',
  rollSpec: '30"×150\' 6mil',
  widthIn: 30,
  lengthFt: 150,
  thickness: '6mil',
  rollCost: 516.04,
  sqftPerRoll: 375,     // 30/12 * 150 = 375 sqft
  costPerSqft: 1.38,    // 516.04 / 375 (note: blueprint says $1.65 — using actual calc)
  costPerSqm: 14.85,
  isActive: true,
};
// Note: Blueprint says $1.65/sqft but math is 516.04/375 = 1.376.
// Using $1.65 as provided in blueprint (may include waste factor)
holoData.costPerSqft = 1.65;
holoData.costPerSqm = 17.76;

const existingHolo = await p.material.findFirst({ where: { name: holoData.name } });
if (existingHolo) {
  await p.material.update({ where: { id: existingHolo.id }, data: holoData });
  console.log(`  Updated: ${holoData.name}`);
  updated++;
} else {
  await p.material.create({ data: holoData });
  console.log(`  Created: ${holoData.name} — $${holoData.costPerSqft}/sqft`);
  created++;
}

// ═══════════════════════════════════════════════════════════
// 2.5  INK COST SETTINGS
// ═══════════════════════════════════════════════════════════
console.log('\n=== 2.5  Update ink cost settings ===');
const inkSettings = [
  { key: 'ink_cost_color', value: '0.05' },      // $0.05 per click (per sheet)
  { key: 'ink_cost_bw', value: '0.008' },         // $0.008 per click (per sheet)
];
for (const s of inkSettings) {
  await p.setting.upsert({
    where: { key: s.key },
    update: { value: s.value },
    create: { key: s.key, value: s.value },
  });
  console.log(`  ${s.key} = ${s.value}`);
  updated++;
}

// ═══════════════════════════════════════════════════════════
// SUMMARY
// ═══════════════════════════════════════════════════════════
console.log('\n=== PHASE 2 SUMMARY ===');
console.log(`  Created: ${created}`);
console.log(`  Updated: ${updated}`);
console.log(`  Deleted: ${deleted}`);

// Verify final counts
const finalMats = await p.material.findMany();
const finalHw = await p.hardwareItem.findMany();
const finalPresets = await p.pricingPreset.findMany();
const finalProducts = await p.product.findMany();
console.log(`\n  Materials: ${finalMats.length}`);
console.log(`  Hardware:  ${finalHw.length}`);
console.log(`  Presets:   ${finalPresets.length}`);
console.log(`  Products:  ${finalProducts.length}`);

// Show materials by type
const matsByType = {};
finalMats.forEach(m => {
  if (!matsByType[m.type]) matsByType[m.type] = 0;
  matsByType[m.type]++;
});
console.log('\n  Materials by type:');
Object.entries(matsByType).sort().forEach(([t, c]) => console.log(`    ${t}: ${c}`));

await p.$disconnect();
console.log('\nDone.');
