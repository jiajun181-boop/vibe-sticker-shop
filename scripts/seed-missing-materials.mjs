#!/usr/bin/env node
/**
 * Seed 18 missing materials that are referenced in MATERIAL_ALIASES
 * but not yet in the database.
 *
 * ⚠️ IMPORTANT: Cost values marked with TODO need real supplier quotes.
 *    The costPerSqft values below are ESTIMATES based on industry averages.
 *    Jay MUST review and update costs before running in production.
 *
 * Run:  node scripts/seed-missing-materials.mjs
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const MISSING_MATERIALS = [
  // ── Board Substrates (for signs-rigid-boards category) ──
  { sortOrder: 40, type: "Board", name: "Coroplast 4mm",      rollSpec: "4mm corrugated plastic", costPerSqft: 0.35, costPerSqm: 3.77 },  // TODO: confirm cost with supplier
  { sortOrder: 41, type: "Board", name: "Coroplast 6mm",      rollSpec: "6mm corrugated plastic", costPerSqft: 0.45, costPerSqm: 4.84 },  // TODO: confirm cost
  { sortOrder: 42, type: "Board", name: "Coroplast 10mm",     rollSpec: "10mm corrugated plastic", costPerSqft: 0.65, costPerSqm: 7.00 }, // TODO: confirm cost
  { sortOrder: 43, type: "Board", name: "Foam Board 5mm",     rollSpec: "5mm foam core board",     costPerSqft: 0.50, costPerSqm: 5.38 }, // TODO: confirm cost
  { sortOrder: 44, type: "Board", name: "Foam Board 10mm",    rollSpec: "10mm foam core board",    costPerSqft: 0.75, costPerSqm: 8.07 }, // TODO: confirm cost
  { sortOrder: 45, type: "Board", name: "PVC Board 3mm",      rollSpec: "3mm sintra PVC",          costPerSqft: 0.80, costPerSqm: 8.61 }, // TODO: confirm cost

  // ── Paper Stocks (for marketing-business-print / paper_print template) ──
  { sortOrder: 50, type: "Paper", name: "14pt Card Stock",       rollSpec: "14pt coated 2 sides (C2S)", costPerSqft: 0.08, costPerSqm: 0.86 },  // TODO: confirm cost
  { sortOrder: 51, type: "Paper", name: "100lb Coated Paper",    rollSpec: "100lb gloss/matte text",    costPerSqft: 0.06, costPerSqm: 0.65 },  // TODO: confirm cost
  { sortOrder: 52, type: "Paper", name: "20lb Bond Paper",       rollSpec: "20lb uncoated bond",        costPerSqft: 0.03, costPerSqm: 0.32 },  // TODO: confirm cost
  { sortOrder: 53, type: "Paper", name: "Paper Label Stock",     rollSpec: "Gloss/matte label stock",   costPerSqft: 0.10, costPerSqm: 1.08 },  // TODO: confirm cost
  { sortOrder: 54, type: "Paper", name: "NCR 2-Part",            rollSpec: "Carbonless 2-part",         costPerSqft: 0.12, costPerSqm: 1.29 },  // TODO: confirm cost
  { sortOrder: 55, type: "Paper", name: "NCR 3-Part",            rollSpec: "Carbonless 3-part",         costPerSqft: 0.18, costPerSqm: 1.94 },  // TODO: confirm cost
  { sortOrder: 56, type: "Paper", name: "NCR 4-Part",            rollSpec: "Carbonless 4-part",         costPerSqft: 0.24, costPerSqm: 2.58 },  // TODO: confirm cost
  { sortOrder: 57, type: "Paper", name: "Envelope #10 Regular",  rollSpec: "#10 white wove envelope",   costPerSqft: 0.05, costPerSqm: 0.54 },  // TODO: confirm cost
  { sortOrder: 58, type: "Paper", name: "Envelope #10 Window",   rollSpec: "#10 window envelope",       costPerSqft: 0.07, costPerSqm: 0.75 },  // TODO: confirm cost

  // ── Specialty ──
  { sortOrder: 60, type: "Adhesive Vinyl", name: "GF 765 Holographic Film", rollSpec: "Holographic effect vinyl", costPerSqft: 1.20, costPerSqm: 12.92 }, // TODO: confirm cost
  { sortOrder: 61, type: "Lamination",     name: "OPP Gloss Lamination",    rollSpec: "Gloss overlaminate",       costPerSqft: 0.05, costPerSqm: 0.54 },  // TODO: confirm cost
  { sortOrder: 62, type: "Lamination",     name: "OPP Matte Lamination",    rollSpec: "Matte overlaminate",       costPerSqft: 0.06, costPerSqm: 0.65 },  // TODO: confirm cost
];

async function main() {
  console.log(`Seeding ${MISSING_MATERIALS.length} missing materials...`);

  let created = 0;
  let skipped = 0;

  for (const mat of MISSING_MATERIALS) {
    const existing = await prisma.material.findFirst({
      where: { name: mat.name },
    });

    if (existing) {
      console.log(`  SKIP: "${mat.name}" already exists`);
      skipped++;
      continue;
    }

    await prisma.material.create({
      data: {
        sortOrder: mat.sortOrder,
        type: mat.type,
        name: mat.name,
        family: null,
        rollSpec: mat.rollSpec,
        minWidthIn: null,
        widthIn: null,
        minLengthFt: null,
        lengthFt: null,
        lengthIn: 0,
        thickness: null,
        texture: null,
        rollCost: 0,
        sqftPerRoll: 0,
        costPerSqft: mat.costPerSqft,
        costPerSqm: mat.costPerSqm,
        lamination: null,
        printMode: "cmyk",
      },
    });
    console.log(`  ✓ Created: "${mat.name}" ($${mat.costPerSqft}/sqft)`);
    created++;
  }

  console.log(`\nDone: ${created} created, ${skipped} skipped`);
  console.log("\n⚠️  REMINDER: Review all TODO costs with actual supplier quotes!");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
