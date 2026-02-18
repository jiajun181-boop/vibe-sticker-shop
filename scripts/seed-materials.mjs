#!/usr/bin/env node
/**
 * Seed all 32 materials into the Material table.
 * Also stores ink cost settings.
 *
 * Run:  node scripts/seed-materials.mjs
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const MATERIALS = [
  // ── Adhesive Vinyl (带胶) ──
  { sortOrder: 1,  type: "Adhesive Vinyl", name: "Regular White Vinyl (Orajet 3164)", family: null, rollSpec: '54"×150\' | 4mil | Gloss | Perm', minWidthIn: 9, widthIn: 53.25, minLengthFt: 10, lengthFt: 150, lengthIn: 1800, thickness: "4mil", texture: "Gloss", rollCost: 213.06, sqftPerRoll: 665.625, costPerSqft: 0.32, costPerSqm: 3.45, lamination: "Gloss/Matte", printMode: "cmyk" },
  { sortOrder: 2,  type: "Adhesive Vinyl", name: "Blockout Vinyl (Permanent)", family: null, rollSpec: '54"×150\' | 4mil | Matte/Gloss | Perm', minWidthIn: 9, widthIn: 54, minLengthFt: 10, lengthFt: 150, lengthIn: 1800, thickness: "4mil", texture: "Matte/Gloss", rollCost: 129.00, sqftPerRoll: 675.00, costPerSqft: 0.19, costPerSqm: 2.06, lamination: "Gloss/Matte", printMode: "cmyk" },
  { sortOrder: 3,  type: "Adhesive Vinyl", name: "Blockout Vinyl (Removable)", family: null, rollSpec: '54"×150\' | 4mil | Matte/Gloss | Rem', minWidthIn: 9, widthIn: 54, minLengthFt: 10, lengthFt: 150, lengthIn: 1800, thickness: "4mil", texture: "Matte/Gloss", rollCost: 152.84, sqftPerRoll: 675.00, costPerSqft: 0.23, costPerSqm: 2.44, lamination: "Gloss/Matte", printMode: "cmyk" },
  { sortOrder: 4,  type: "Adhesive Vinyl", name: "Perforated Vinyl (Removable)", family: null, rollSpec: '54"×150\' | 6mil | Gloss | Rem PSA', minWidthIn: 9, widthIn: 54, minLengthFt: 10, lengthFt: 150, lengthIn: 1800, thickness: "6mil", texture: "Gloss", rollCost: 285.72, sqftPerRoll: 675.00, costPerSqft: 0.42, costPerSqm: 4.56, lamination: "Gloss/Matte", printMode: "cmyk" },
  { sortOrder: 5,  type: "Adhesive Vinyl", name: "Removable White Vinyl", family: null, rollSpec: '54"×150\' | 3.2mil | Gloss/Matte | Rem', minWidthIn: 9, widthIn: 54, minLengthFt: 10, lengthFt: 150, lengthIn: 1800, thickness: "3.2mil", texture: "Matte/Gloss", rollCost: 201.49, sqftPerRoll: 675.00, costPerSqft: 0.30, costPerSqm: 3.21, lamination: "Gloss/Matte", printMode: "cmyk" },
  { sortOrder: 6,  type: "Adhesive Vinyl", name: "Reflective Vinyl", family: null, rollSpec: '1.24m×45.7m | Reflective', minWidthIn: 9, widthIn: 49, minLengthFt: 10, lengthFt: 149.93, lengthIn: 1799.21, thickness: null, texture: "Reflective", rollCost: 243.86, sqftPerRoll: 609.97, costPerSqft: 0.40, costPerSqm: 4.30, lamination: "Gloss/Matte", printMode: "cmyk" },
  { sortOrder: 7,  type: "Adhesive Vinyl", name: "Clear Vinyl", family: null, rollSpec: '54"×150\' | 3mil | Rem', minWidthIn: 9, widthIn: 54, minLengthFt: 10, lengthFt: 150, lengthIn: 1800, thickness: "3mil", texture: null, rollCost: 286.96, sqftPerRoll: 675.00, costPerSqft: 0.43, costPerSqm: 4.58, lamination: "Gloss/Matte", printMode: "cmyk" },
  { sortOrder: 8,  type: "Adhesive Vinyl", name: "Translucent Vinyl (Removable)", family: null, rollSpec: '54"×150\' | White | Semi-Gloss | Rem', minWidthIn: 9, widthIn: 54, minLengthFt: 10, lengthFt: 150, lengthIn: 1800, thickness: null, texture: "Semi-Gloss", rollCost: 381.92, sqftPerRoll: 675.00, costPerSqft: 0.57, costPerSqm: 6.09, lamination: "Gloss/Matte", printMode: "cmyk" },
  { sortOrder: 9,  type: "Adhesive Vinyl", name: "Frosted Vinyl (Etch Glass)", family: null, rollSpec: '60"×100\' | 3mil | Perm', minWidthIn: 9, widthIn: 60, minLengthFt: 10, lengthFt: 150, lengthIn: 1800, thickness: "3mil", texture: null, rollCost: 519.06, sqftPerRoll: 750.00, costPerSqft: 0.69, costPerSqm: 7.45, lamination: "Gloss/Matte", printMode: "cmyk" },
  { sortOrder: 10, type: "Adhesive Vinyl", name: "Floor Graphics (3M IJ40 + 8509 Anti-Slip)", family: null, rollSpec: '3M combo (quoted separately)', minWidthIn: 9, widthIn: null, minLengthFt: 10, lengthFt: null, lengthIn: 0, thickness: null, texture: null, rollCost: 0, sqftPerRoll: 0, costPerSqft: 0, costPerSqm: 0, lamination: "Anti-Slip", printMode: "cmyk" },
  { sortOrder: 11, type: "Adhesive Vinyl", name: "Car Wrap Vinyl (3M IJ180)", family: null, rollSpec: '3M (quoted separately)', minWidthIn: 9, widthIn: null, minLengthFt: 10, lengthFt: null, lengthIn: 0, thickness: null, texture: null, rollCost: 0, sqftPerRoll: 0, costPerSqft: 0, costPerSqm: 0, lamination: "3M matched", printMode: "cmyk" },
  { sortOrder: 12, type: "Adhesive Vinyl", name: "Concrete/Brick (3M IJ8624)", family: null, rollSpec: '3M (quoted separately)', minWidthIn: 9, widthIn: null, minLengthFt: 10, lengthFt: null, lengthIn: 0, thickness: null, texture: null, rollCost: 0, sqftPerRoll: 0, costPerSqft: 0, costPerSqm: 0, lamination: "3M matched", printMode: "cmyk" },

  // ── Non-Adhesive (无胶) ──
  { sortOrder: 13, type: "Non-Adhesive", name: "Poster Paper (Matte/Gloss 220gsm)", family: null, rollSpec: '54"×100\' | Gloss 220gsm', minWidthIn: 9, widthIn: 54, minLengthFt: 10, lengthFt: 100, lengthIn: 1200, thickness: "220gsm", texture: "Gloss", rollCost: 154.04, sqftPerRoll: 450.00, costPerSqft: 0.34, costPerSqm: 3.68, lamination: "Gloss/Matte", printMode: "cmyk" },
  { sortOrder: 14, type: "Non-Adhesive", name: "Canvas", family: null, rollSpec: '54"×82\' | 22mil', minWidthIn: 9, widthIn: 54, minLengthFt: 10, lengthFt: 82, lengthIn: 984, thickness: "22mil", texture: null, rollCost: 207.22, sqftPerRoll: 369.00, costPerSqft: 0.56, costPerSqm: 6.04, lamination: "Gloss/Matte", printMode: "cmyk" },
  { sortOrder: 15, type: "Non-Adhesive", name: "Backlit Film", family: null, rollSpec: '54"×100\' | 8.4mil | Gloss', minWidthIn: 9, widthIn: 54, minLengthFt: 10, lengthFt: 100, lengthIn: 1200, thickness: "8.4mil", texture: "Gloss", rollCost: 550.75, sqftPerRoll: 450.00, costPerSqft: 1.22, costPerSqm: 13.17, lamination: "Gloss/Matte", printMode: "cmyk" },
  { sortOrder: 16, type: "Non-Adhesive", name: "White Static Cling", family: null, rollSpec: '54"×150\' | 7mil', minWidthIn: 9, widthIn: 54, minLengthFt: 10, lengthFt: 150, lengthIn: 1800, thickness: "7mil", texture: null, rollCost: 295.51, sqftPerRoll: 675.00, costPerSqft: 0.44, costPerSqm: 4.71, lamination: "Gloss/Matte", printMode: "cmyk" },
  { sortOrder: 17, type: "Non-Adhesive", name: "Clear Static Cling", family: null, rollSpec: '54"×150\' | 7mil | Clear', minWidthIn: 9, widthIn: 54, minLengthFt: 10, lengthFt: 150, lengthIn: 1800, thickness: "7mil", texture: "Clear", rollCost: 285.36, sqftPerRoll: 675.00, costPerSqft: 0.42, costPerSqm: 4.55, lamination: "Gloss/Matte", printMode: "cmyk" },
  { sortOrder: 18, type: "Non-Adhesive", name: "Clear Film", family: null, rollSpec: '54"×100\' | 5mil | Clear', minWidthIn: 9, widthIn: 54, minLengthFt: 10, lengthFt: 100, lengthIn: 1200, thickness: "5mil", texture: "Clear", rollCost: 407.25, sqftPerRoll: 450.00, costPerSqft: 0.91, costPerSqm: 9.74, lamination: "Gloss/Matte", printMode: "cmyk" },
  { sortOrder: 19, type: "Non-Adhesive", name: "Frosted Static", family: null, rollSpec: '1.52m×50m | Frosted static', minWidthIn: 9, widthIn: 59.84, minLengthFt: 10, lengthFt: 164.04, lengthIn: 1968.5, thickness: null, texture: "Frosted static", rollCost: 333.98, sqftPerRoll: 818.02, costPerSqft: 0.41, costPerSqm: 4.39, lamination: "Gloss/Matte", printMode: "cmyk" },

  // ── Banner (Roll) ──
  { sortOrder: 20, type: "Banner", name: '13oz Frontlit Vinyl Banner', family: "Frontlit", rollSpec: '54"×164\'', minWidthIn: 9, widthIn: 54, minLengthFt: 10, lengthFt: 164, lengthIn: 1968, thickness: null, texture: null, rollCost: 738.00, sqftPerRoll: 109 * 6.4516, costPerSqft: 0.15, costPerSqm: 1.59, lamination: null, printMode: "cmyk" },
  { sortOrder: 21, type: "Banner", name: '13oz Frontlit Vinyl Banner', family: "Frontlit", rollSpec: '63"×164\'', minWidthIn: 9, widthIn: 63, minLengthFt: 10, lengthFt: 164, lengthIn: 1968, thickness: null, texture: null, rollCost: 861.00, sqftPerRoll: 148.98 * 6.4516, costPerSqft: 0.17, costPerSqm: 1.86, lamination: null, printMode: "cmyk" },
  { sortOrder: 22, type: "Banner", name: '13oz Frontlit Vinyl Banner', family: "Frontlit", rollSpec: '98"×164\'', minWidthIn: 9, widthIn: 98, minLengthFt: 10, lengthFt: 164, lengthIn: 1968, thickness: null, texture: null, rollCost: 1339.33, sqftPerRoll: 231.85 * 6.4516, costPerSqft: 0.17, costPerSqm: 1.86, lamination: null, printMode: "cmyk" },
  { sortOrder: 23, type: "Banner", name: '13oz Frontlit Vinyl Banner', family: "Frontlit", rollSpec: '126"×164\'', minWidthIn: null, widthIn: 126, minLengthFt: null, lengthFt: 164, lengthIn: 1968, thickness: null, texture: null, rollCost: 1722.00, sqftPerRoll: 297.96 * 6.4516, costPerSqft: 0.17, costPerSqm: 1.86, lamination: null, printMode: "cmyk" },
  { sortOrder: 24, type: "Banner", name: '8oz Mesh Vinyl Banner', family: "Mesh", rollSpec: '54"×164\'', minWidthIn: null, widthIn: 54, minLengthFt: null, lengthFt: 164, lengthIn: 1968, thickness: null, texture: null, rollCost: 738.00, sqftPerRoll: 165.85 * 6.4516, costPerSqft: 0.22, costPerSqm: 2.42, lamination: null, printMode: "cmyk" },
  { sortOrder: 25, type: "Banner", name: '8oz Mesh Vinyl Banner', family: "Mesh", rollSpec: '126"×164\'', minWidthIn: null, widthIn: 126, minLengthFt: null, lengthFt: 164, lengthIn: 1968, thickness: null, texture: null, rollCost: 1722.00, sqftPerRoll: 387.83 * 6.4516, costPerSqft: 0.23, costPerSqm: 2.42, lamination: null, printMode: "cmyk" },
  { sortOrder: 26, type: "Banner", name: 'PET Grey Back (Roll-up) 10oz FR', family: "Frontlit", rollSpec: '36"×164\'', minWidthIn: null, widthIn: 36, minLengthFt: null, lengthFt: 164, lengthIn: 1968, thickness: null, texture: null, rollCost: 492.00, sqftPerRoll: 125 * 6.4516, costPerSqft: 0.25, costPerSqm: 2.73, lamination: null, printMode: "cmyk" },
  { sortOrder: 27, type: "Banner", name: 'PET Grey Back (Roll-up) 10oz FR', family: "Frontlit", rollSpec: '54"×164\'', minWidthIn: null, widthIn: 54, minLengthFt: null, lengthFt: 164, lengthIn: 1968, thickness: null, texture: null, rollCost: 738.00, sqftPerRoll: 205.67 * 6.4516, costPerSqft: 0.28, costPerSqm: 3.00, lamination: null, printMode: "cmyk" },
  { sortOrder: 28, type: "Banner", name: 'PET 15oz Double-Sided FR', family: "Double-Sided", rollSpec: '36"×164\'', minWidthIn: null, widthIn: 36, minLengthFt: null, lengthFt: 164, lengthIn: 1968, thickness: null, texture: null, rollCost: 492.00, sqftPerRoll: 191.3 * 6.4516, costPerSqft: 0.39, costPerSqm: 4.19, lamination: null, printMode: "cmyk" },
  { sortOrder: 29, type: "Banner", name: 'PET 15oz Double-Sided FR', family: "Double-Sided", rollSpec: '54"×164\'', minWidthIn: null, widthIn: 54, minLengthFt: null, lengthFt: 164, lengthIn: 1968, thickness: null, texture: null, rollCost: 738.00, sqftPerRoll: 287.89 * 6.4516, costPerSqft: 0.39, costPerSqm: 4.20, lamination: null, printMode: "cmyk" },
  { sortOrder: 30, type: "Banner", name: 'PET 18oz Double-Sided', family: "Double-Sided", rollSpec: '38"×164\'', minWidthIn: null, widthIn: 38, minLengthFt: null, lengthFt: 164, lengthIn: 1968, thickness: null, texture: null, rollCost: 519.33, sqftPerRoll: 203.84 * 6.4516, costPerSqft: 0.39, costPerSqm: 4.22, lamination: null, printMode: "cmyk" },
  { sortOrder: 31, type: "Banner", name: 'PET 18oz Double-Sided', family: "Double-Sided", rollSpec: '54"×164\'', minWidthIn: null, widthIn: 54, minLengthFt: null, lengthFt: 164, lengthIn: 1968, thickness: null, texture: null, rollCost: 738.00, sqftPerRoll: 287.89 * 6.4516, costPerSqft: 0.39, costPerSqm: 4.20, lamination: null, printMode: "cmyk" },
  { sortOrder: 32, type: "Banner", name: 'PET 18oz Double-Sided', family: "Double-Sided", rollSpec: '126"×164\'', minWidthIn: null, widthIn: 126, minLengthFt: null, lengthFt: 164, lengthIn: 1968, thickness: null, texture: null, rollCost: 1722.00, sqftPerRoll: 672.44 * 6.4516, costPerSqft: 0.39, costPerSqm: 4.20, lamination: null, printMode: "cmyk" },
];

async function main() {
  console.log("Seeding 32 materials...\n");

  // Clear existing materials
  await prisma.material.deleteMany({});

  for (const m of MATERIALS) {
    await prisma.material.create({ data: m });
    console.log(`  #${String(m.sortOrder).padStart(2)}  ${m.name.padEnd(48)} $${m.costPerSqft.toFixed(2)}/sqft`);
  }

  // Store ink cost settings
  await prisma.setting.upsert({
    where: { key: "ink_cost_per_liter" },
    create: { key: "ink_cost_per_liter", value: "234" },
    update: { value: "234" },
  });
  await prisma.setting.upsert({
    where: { key: "ink_ml_per_sqft" },
    create: { key: "ink_ml_per_sqft", value: "1" },
    update: { value: "1" },
  });

  console.log("\n  Ink settings: $234/L × 1ml/sqft = $0.234/sqft");

  // Update COST_PLUS preset with real material costs
  const preset = await prisma.pricingPreset.findUnique({
    where: { key: "window_film_costplus" },
  });

  if (preset) {
    const config = preset.config;
    // Update material costs from real data
    config.materials = {
      "white-vinyl":          { costPerSqft: 0.32, label: "Regular White Vinyl" },
      "blockout-vinyl":       { costPerSqft: 0.19, label: "Blockout Vinyl (Perm)" },
      "blockout-vinyl-rem":   { costPerSqft: 0.23, label: "Blockout Vinyl (Rem)" },
      "perforated-vinyl":     { costPerSqft: 0.42, label: "Perforated Vinyl" },
      "removable-white":      { costPerSqft: 0.30, label: "Removable White Vinyl" },
      "reflective-vinyl":     { costPerSqft: 0.40, label: "Reflective Vinyl" },
      "clear-vinyl":          { costPerSqft: 0.43, label: "Clear Vinyl" },
      "translucent-vinyl":    { costPerSqft: 0.57, label: "Translucent Vinyl" },
      "frosted-film":         { costPerSqft: 0.69, label: "Frosted Vinyl (Etch)" },
      "static-cling-clear":   { costPerSqft: 0.42, label: "Clear Static Cling" },
      "static-cling-frosted": { costPerSqft: 0.41, label: "Frosted Static Cling" },
      "clear-film":           { costPerSqft: 0.91, label: "Clear Film" },
      "transparent-film":     { costPerSqft: 0.57, label: "Translucent Film" },
    };
    // Update ink costs with real data: $234/L × 1ml/sqft = $0.234/sqft
    config.inkCosts = {
      "cmyk":        { inkPerSqft: 0.234, sqmPerHour: 20, label: "CMYK" },
      "cmyk-w":      { inkPerSqft: 0.468, sqmPerHour: 10, label: "CMYK + White (2 pass)" },
      "cmyk-w-cmyk": { inkPerSqft: 0.702, sqmPerHour: 5,  label: "CMYK + White + CMYK (3 pass)" },
      "none":        { inkPerSqft: 0,     sqmPerHour: 0,  label: "No Print" },
    };

    await prisma.pricingPreset.update({
      where: { key: "window_film_costplus" },
      data: { config },
    });
    console.log("\n  Updated COST_PLUS preset with real material/ink costs.");
  }

  console.log("\nDone!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
