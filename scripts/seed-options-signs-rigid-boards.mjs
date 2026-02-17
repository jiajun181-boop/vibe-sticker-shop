#!/usr/bin/env node
/**
 * Seed optionsConfig for signs-rigid-boards products.
 *
 * Run:  node scripts/seed-options-signs-rigid-boards.mjs          (dry-run)
 *       node scripts/seed-options-signs-rigid-boards.mjs --apply  (write to DB)
 */
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
const APPLY = process.argv.includes("--apply");

// ─── Material palettes ────────────────────────────────────────
const MAT_COROPLAST = [
  { id: "coroplast-4mm", name: "Coroplast 4mm", multiplier: 1.0 },
  { id: "coroplast-6mm", name: "Coroplast 6mm", multiplier: 1.2 },
];
const MAT_FOAM = [
  { id: "foam-3mm", name: "Foam Board 3mm", multiplier: 1.0 },
  { id: "foam-5mm", name: "Foam Board 5mm", multiplier: 1.15 },
  { id: "foam-10mm", name: "Foam Board 10mm", multiplier: 1.4 },
];
const MAT_ACRYLIC = [
  { id: "acrylic-3mm", name: "Clear Acrylic 3mm", multiplier: 1.0 },
  { id: "acrylic-5mm", name: "Clear Acrylic 5mm", multiplier: 1.3 },
  { id: "frosted-acrylic", name: "Frosted Acrylic 3mm", multiplier: 1.15 },
];
const MAT_ALUMINUM = [
  { id: "aluminum-040", name: 'Aluminum .040"', multiplier: 1.0 },
  { id: "aluminum-063", name: 'Aluminum .063"', multiplier: 1.3 },
  { id: "dibond-3mm", name: "ACM / Dibond 3mm", multiplier: 1.2 },
];
const MAT_PVC = [
  { id: "sintra-3mm", name: "PVC / Sintra 3mm", multiplier: 1.0 },
  { id: "sintra-6mm", name: "PVC / Sintra 6mm", multiplier: 1.25 },
];
const MAT_GATOR = [
  { id: "gatorboard-3-16", name: 'Gatorboard 3/16"', multiplier: 1.0 },
  { id: "gatorboard-1-2", name: 'Gatorboard 1/2"', multiplier: 1.35 },
];
const MAT_RIGID_GENERAL = [
  { id: "coroplast-4mm", name: "Coroplast 4mm", multiplier: 1.0 },
  { id: "aluminum-040", name: 'Aluminum .040"', multiplier: 1.8 },
  { id: "foam-5mm", name: "Foam Board 5mm", multiplier: 0.85 },
  { id: "pvc-3mm", name: "PVC 3mm", multiplier: 1.1 },
];

// ─── Size templates ───────────────────────────────────────────
const SIZES_YARD = [
  { label: '12" x 18"', widthIn: 12, heightIn: 18, quantityChoices: [1, 2, 5, 10, 25, 50] },
  { label: '18" x 24"', widthIn: 18, heightIn: 24, quantityChoices: [1, 2, 5, 10, 25, 50] },
  { label: '24" x 36"', widthIn: 24, heightIn: 36, quantityChoices: [1, 2, 5, 10, 25, 50] },
  { label: '36" x 48"', widthIn: 36, heightIn: 48, quantityChoices: [1, 2, 5, 10, 25] },
];
const SIZES_SMALL_SIGN = [
  { label: '6" x 12"', widthIn: 6, heightIn: 12, quantityChoices: [1, 2, 5, 10, 25, 50] },
  { label: '12" x 18"', widthIn: 12, heightIn: 18, quantityChoices: [1, 2, 5, 10, 25, 50] },
  { label: '18" x 24"', widthIn: 18, heightIn: 24, quantityChoices: [1, 2, 5, 10, 25, 50] },
  { label: '24" x 36"', widthIn: 24, heightIn: 36, quantityChoices: [1, 2, 5, 10, 25] },
];
const SIZES_AFRAME_INSERT = [
  { label: '18" x 24"', widthIn: 18, heightIn: 24, quantityChoices: [1, 2, 5, 10] },
  { label: '24" x 36"', widthIn: 24, heightIn: 36, quantityChoices: [1, 2, 5, 10] },
];
const SIZES_RE = [
  { label: '12" x 18"', widthIn: 12, heightIn: 18, quantityChoices: [1, 2, 5, 10, 25] },
  { label: '18" x 24"', widthIn: 18, heightIn: 24, quantityChoices: [1, 2, 5, 10, 25] },
  { label: '24" x 36"', widthIn: 24, heightIn: 36, quantityChoices: [1, 2, 5, 10, 25] },
];
const SIZES_TABLETOP = [
  { label: '4" x 6"', widthIn: 4, heightIn: 6, quantityChoices: [1, 2, 5, 10, 25, 50] },
  { label: '5" x 7"', widthIn: 5, heightIn: 7, quantityChoices: [1, 2, 5, 10, 25, 50] },
  { label: '8.5" x 11"', widthIn: 8.5, heightIn: 11, quantityChoices: [1, 2, 5, 10, 25] },
];
const SIZES_MENU = [
  { label: '8.5" x 11"', widthIn: 8.5, heightIn: 11, quantityChoices: [1, 2, 5, 10, 25] },
  { label: '11" x 17"', widthIn: 11, heightIn: 17, quantityChoices: [1, 2, 5, 10, 25] },
  { label: '18" x 24"', widthIn: 18, heightIn: 24, quantityChoices: [1, 2, 5, 10] },
  { label: '24" x 36"', widthIn: 24, heightIn: 36, quantityChoices: [1, 2, 5, 10] },
];
const SIZES_ACRYLIC = [
  { label: '8" x 10"', widthIn: 8, heightIn: 10, quantityChoices: [1, 2, 5, 10] },
  { label: '12" x 18"', widthIn: 12, heightIn: 18, quantityChoices: [1, 2, 5, 10] },
  { label: '18" x 24"', widthIn: 18, heightIn: 24, quantityChoices: [1, 2, 5] },
  { label: '24" x 36"', widthIn: 24, heightIn: 36, quantityChoices: [1, 2, 5] },
];

// ─── Product → optionsConfig mapping ──────────────────────────
const CONFIG = {
  // A-frames
  "a-frame-double-sided":    { sizes: SIZES_AFRAME_INSERT, materials: MAT_COROPLAST },
  "a-frame-insert-prints":   { sizes: SIZES_AFRAME_INSERT, materials: MAT_COROPLAST },
  "a-frame-sign-stand":      { sizes: SIZES_AFRAME_INSERT, materials: MAT_RIGID_GENERAL },
  "a-frame-stand":           { sizes: SIZES_AFRAME_INSERT, materials: MAT_RIGID_GENERAL },

  // Acrylic
  "acrylic-signs":           { sizes: SIZES_ACRYLIC, materials: MAT_ACRYLIC },
  "clear-acrylic-signs":     { sizes: SIZES_ACRYLIC, materials: MAT_ACRYLIC },
  "frosted-acrylic-signs":   { sizes: SIZES_ACRYLIC, materials: MAT_ACRYLIC },
  "standoff-mounted-signs":  { sizes: SIZES_ACRYLIC, materials: MAT_ACRYLIC },

  // Aluminum / ACM
  "aluminum-signs":          { sizes: SIZES_YARD, materials: MAT_ALUMINUM },
  "acm-dibond-signs":        { sizes: SIZES_YARD, materials: MAT_ALUMINUM },
  "aluminum-composite":      { materials: MAT_ALUMINUM }, // AREA_TIERED, no sizes needed

  // Coroplast / Yard signs
  "coroplast-signs":         { sizes: SIZES_YARD, materials: MAT_COROPLAST },
  "coroplast-yard-signs":    { sizes: SIZES_YARD, materials: MAT_COROPLAST },
  "yard-sign-h-frame":       { sizes: SIZES_YARD, materials: MAT_COROPLAST },
  "yard-sign-panel-only":    { sizes: SIZES_YARD, materials: MAT_COROPLAST },
  "yard-signs-coroplast":    { sizes: SIZES_YARD, materials: MAT_COROPLAST },
  "double-sided-lawn-signs": { sizes: SIZES_YARD, materials: MAT_COROPLAST },
  "lawn-signs-h-stake":      { sizes: SIZES_YARD, materials: MAT_COROPLAST },

  // Foam board
  "foam-board":              { materials: MAT_FOAM }, // AREA_TIERED
  "foam-board-easel":        { sizes: SIZES_AFRAME_INSERT, materials: MAT_FOAM },
  "foam-board-prints":       { sizes: SIZES_YARD, materials: MAT_FOAM },
  "rigid-foam-board-prints": { sizes: SIZES_YARD, materials: MAT_FOAM },
  "backdrop-board":          { sizes: SIZES_AFRAME_INSERT, materials: MAT_FOAM },

  // General signs
  "construction-site-signs": { sizes: SIZES_YARD, materials: MAT_RIGID_GENERAL },
  "directional-arrow-signs": { sizes: SIZES_SMALL_SIGN, materials: MAT_RIGID_GENERAL },
  "parking-property-signs":  { sizes: SIZES_YARD, materials: MAT_ALUMINUM },
  "safety-signs":            { sizes: SIZES_YARD, materials: MAT_RIGID_GENERAL },
  "wayfinding-signs":        { sizes: SIZES_SMALL_SIGN, materials: MAT_RIGID_GENERAL },
  "handheld-signs":          { sizes: SIZES_SMALL_SIGN, materials: MAT_COROPLAST },

  // Real estate
  "real-estate-agent-sign":  { sizes: SIZES_RE, materials: MAT_COROPLAST },
  "real-estate-frame":       { sizes: [{ label: '18" x 24"', widthIn: 18, heightIn: 24, quantityChoices: [1, 2, 5, 10] }], materials: MAT_RIGID_GENERAL },

  // Menu / Tabletop
  "menu-boards":             { sizes: SIZES_MENU, materials: MAT_FOAM },
  "rigid-tabletop-signs":    { sizes: SIZES_TABLETOP, materials: MAT_ACRYLIC },
  "tabletop-signs":          { sizes: SIZES_TABLETOP, materials: MAT_ACRYLIC },

  // PVC / Gator
  "pvc-sintra-signs":        { sizes: SIZES_YARD, materials: MAT_PVC },
  "gatorboard-signs":        { sizes: SIZES_YARD, materials: MAT_GATOR },

  // Hardware (no materials — they're physical items)
  "h-stake-wire":            { quantityChoices: [1, 2, 5, 10, 25, 50, 100] },
  "h-stakes":                { quantityChoices: [1, 2, 5, 10, 25, 50, 100] },
};

// ─── Main ─────────────────────────────────────────────────────
async function main() {
  const slugs = Object.keys(CONFIG);
  const products = await prisma.product.findMany({
    where: { slug: { in: slugs }, isActive: true },
    select: { id: true, slug: true, name: true, optionsConfig: true, pricingPreset: { select: { model: true } } },
  });

  const bySlug = Object.fromEntries(products.map((p) => [p.slug, p]));
  let updated = 0;
  let skipped = 0;

  for (const [slug, newConfig] of Object.entries(CONFIG)) {
    const product = bySlug[slug];
    if (!product) {
      console.log(`  SKIP  ${slug} — not found in DB`);
      skipped++;
      continue;
    }

    // Merge: preserve existing fields, only add missing top-level keys
    const existing = product.optionsConfig && typeof product.optionsConfig === "object" ? product.optionsConfig : {};
    const merged = { ...existing };

    if (newConfig.sizes && !Array.isArray(existing.sizes)) {
      merged.sizes = newConfig.sizes;
    }
    if (newConfig.materials && !Array.isArray(existing.materials)) {
      merged.materials = newConfig.materials;
    }
    if (newConfig.quantityChoices && !Array.isArray(existing.quantityChoices)) {
      merged.quantityChoices = newConfig.quantityChoices;
    }

    const sizeCount = merged.sizes?.length || 0;
    const matCount = merged.materials?.length || 0;
    const qtyCount = merged.quantityChoices?.length || 0;
    const model = product.pricingPreset?.model || "?";
    const label = APPLY ? "WRITE" : "DRY  ";

    console.log(
      `  ${label} ${slug.padEnd(45)} ${model.padEnd(14)} sizes=${sizeCount} mats=${matCount} qty=${qtyCount}`
    );

    if (APPLY) {
      await prisma.product.update({
        where: { id: product.id },
        data: { optionsConfig: merged },
      });
      updated++;
    }
  }

  console.log(`\n${APPLY ? "Applied" : "Dry run"}: ${updated} updated, ${skipped} skipped of ${slugs.length} configured.`);
  if (!APPLY) console.log("Run with --apply to write to database.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
