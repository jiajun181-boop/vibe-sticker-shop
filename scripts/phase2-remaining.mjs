// Phase 2 remaining: steps that didn't run yet (2.0.5 + 2.1-2.5)
import { PrismaClient } from '../node_modules/.prisma/client/index.js';
const p = new PrismaClient();

let deleted = 0, updated = 0, created = 0;

// ═══════════════════════════════════════════════════════════
// 2.0.5 — Clean up inactive products
// Product model has no OrderItem relation, so all inactive products
// are safe to delete (no order history linked directly to Product).
// ═══════════════════════════════════════════════════════════
console.log('=== 2.0.5  Clean up inactive products ===');
const inactiveProducts = await p.product.findMany({
  where: { isActive: false },
  include: { images: { select: { id: true } } },
});

console.log(`  Found ${inactiveProducts.length} inactive products`);

for (const prod of inactiveProducts) {
  // Delete images first
  if (prod.images.length > 0) {
    await p.productImage.deleteMany({ where: { productId: prod.id } });
  }
  await p.product.delete({ where: { id: prod.id } });
  deleted++;
}
console.log(`  Deleted ${deleted} inactive products`);

// ═══════════════════════════════════════════════════════════
// 2.1  RIGID BOARD MATERIALS (type = "Rigid Board")
// ═══════════════════════════════════════════════════════════
console.log('\n=== 2.1  Seed rigid board materials ===');
const rigidBoards = [
  { name: 'Coroplast 4mm', type: 'Rigid Board', family: 'Coroplast', rollSpec: '48×96 sheet', widthIn: 48, lengthFt: 8, thickness: '4mm', rollCost: 11.00, sqftPerRoll: 32, costPerSqft: 0.34, costPerSqm: 3.66, isActive: true },
  { name: 'Coroplast 6mm', type: 'Rigid Board', family: 'Coroplast', rollSpec: '48×96 sheet', widthIn: 48, lengthFt: 8, thickness: '6mm', rollCost: 24.00, sqftPerRoll: 32, costPerSqft: 0.75, costPerSqm: 8.07, isActive: true },
  { name: 'Coroplast 10mm', type: 'Rigid Board', family: 'Coroplast', rollSpec: '48×96 sheet', widthIn: 48, lengthFt: 8, thickness: '10mm', rollCost: 35.75, sqftPerRoll: 32, costPerSqft: 1.12, costPerSqm: 12.06, isActive: true },
  { name: 'Foam Board 5mm', type: 'Rigid Board', family: 'Foam Board', rollSpec: '48×96 sheet', widthIn: 48, lengthFt: 8, thickness: '5mm', rollCost: 15.00, sqftPerRoll: 32, costPerSqft: 0.47, costPerSqm: 5.06, isActive: true },
  { name: 'Foam Board 10mm', type: 'Rigid Board', family: 'Foam Board', rollSpec: '48×96 sheet', widthIn: 48, lengthFt: 8, thickness: '10mm', rollCost: 40.00, sqftPerRoll: 32, costPerSqft: 1.25, costPerSqm: 13.45, isActive: true },
  { name: 'PVC Board 3mm', type: 'Rigid Board', family: 'PVC', rollSpec: '48×96 sheet', widthIn: 48, lengthFt: 8, thickness: '3mm', rollCost: 40.00, sqftPerRoll: 32, costPerSqft: 1.25, costPerSqm: 13.45, isActive: true },
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
  { name: '14pt Card Stock', type: 'Paper', family: 'Cardstock', rollSpec: '12×18/13×19', costPerSqft: 0.10, rollCost: 0.10, sqftPerRoll: 1, costPerSqm: 1.08, isActive: true },
  { name: '100lb Coated Paper', type: 'Paper', family: 'Coated', rollSpec: '12×18', costPerSqft: 0.045, rollCost: 0.045, sqftPerRoll: 1, costPerSqm: 0.48, isActive: true },
  { name: '20lb Bond Paper', type: 'Paper', family: 'Bond', rollSpec: '11×17', costPerSqft: 0.02, rollCost: 0.02, sqftPerRoll: 1, costPerSqm: 0.22, isActive: true },
  { name: 'NCR 2-Part', type: 'Paper', family: 'NCR', rollSpec: '11×17', costPerSqft: 0.089, rollCost: 0.089, sqftPerRoll: 1, costPerSqm: 0.96, isActive: true },
  { name: 'NCR 3-Part', type: 'Paper', family: 'NCR', rollSpec: '11×17', costPerSqft: 0.099, rollCost: 0.099, sqftPerRoll: 1, costPerSqm: 1.07, isActive: true },
  { name: 'NCR 4-Part', type: 'Paper', family: 'NCR', rollSpec: '11×17', costPerSqft: 0.119, rollCost: 0.119, sqftPerRoll: 1, costPerSqm: 1.28, isActive: true },
  { name: 'Envelope #10 Regular', type: 'Paper', family: 'Envelope', costPerSqft: 0.0365, rollCost: 0.0365, sqftPerRoll: 1, costPerSqm: 0.39, isActive: true },
  { name: 'Envelope #10 Window', type: 'Paper', family: 'Envelope', costPerSqft: 0.075, rollCost: 0.075, sqftPerRoll: 1, costPerSqm: 0.81, isActive: true },
  { name: 'Paper Label Stock', type: 'Paper', family: 'Label', costPerSqft: 0.25, rollCost: 0.25, sqftPerRoll: 1, costPerSqm: 2.69, isActive: true },
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
  { name: 'OPP Gloss Lamination', type: 'Lamination', family: 'OPP', rollSpec: '12.8"×1641\'', widthIn: 12.8, costPerSqft: 0.095, rollCost: 165.75, sqftPerRoll: 1744, costPerSqm: 1.02, isActive: true },
  { name: 'OPP Matte Lamination', type: 'Lamination', family: 'OPP', rollSpec: '12.8"×1641\'', widthIn: 12.8, costPerSqft: 0.10, rollCost: 174.00, sqftPerRoll: 1744, costPerSqm: 1.08, isActive: true },
  { name: 'Transfer Tape', type: 'Lamination', family: 'Transfer', costPerSqft: 0, rollCost: 150.00, sqftPerRoll: 0, costPerSqm: 0, isActive: true },
  { name: 'Gold Foil Paper', type: 'Lamination', family: 'Foil', rollSpec: '32cm×100m', costPerSqft: 0, rollCost: 25.00, sqftPerRoll: 0, costPerSqm: 0, isActive: true },
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
  sqftPerRoll: 375,
  costPerSqft: 1.65,   // blueprint value (includes waste factor)
  costPerSqm: 17.76,
  isActive: true,
};

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
  { key: 'ink_cost_color', value: '0.05' },
  { key: 'ink_cost_bw', value: '0.008' },
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

const finalMats = await p.material.findMany();
const finalHw = await p.hardwareItem.findMany();
const finalPresets = await p.pricingPreset.findMany();
const finalProducts = await p.product.findMany();
console.log(`\n  Materials: ${finalMats.length}`);
console.log(`  Hardware:  ${finalHw.length}`);
console.log(`  Presets:   ${finalPresets.length}`);
console.log(`  Products:  ${finalProducts.length}`);

const matsByType = {};
finalMats.forEach(m => { matsByType[m.type] = (matsByType[m.type] || 0) + 1; });
console.log('\n  Materials by type:');
Object.entries(matsByType).sort().forEach(([t, c]) => console.log(`    ${t}: ${c}`));

const prodsByCategory = {};
finalProducts.forEach(pr => { prodsByCategory[pr.category] = (prodsByCategory[pr.category] || 0) + 1; });
console.log('\n  Products by category:');
Object.entries(prodsByCategory).sort().forEach(([c, n]) => console.log(`    ${c}: ${n}`));

await p.$disconnect();
console.log('\nDone.');
