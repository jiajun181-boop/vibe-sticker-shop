#!/usr/bin/env node
/**
 * Bulk-apply optionsConfig for window-glass-films products (10 new products).
 *
 * Run:  node scripts/seed-options-windows.mjs           (dry-run)
 * Run:  node scripts/seed-options-windows.mjs --apply   (write to DB)
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const apply = process.argv.includes("--apply");

// ─── Templates ───────────────────────────────────────────────────

// Series 1: Light Effect
const TRANSPARENT_COLOR = {
  materials: [
    { id: "transparent-cmyk", name: "Transparent Film (CMYK, no white ink)", multiplier: 1.0 },
  ],
};

const DICHROIC = {
  materials: [
    { id: "dichroic-standard", name: "Standard Dichroic Film", multiplier: 1.0 },
    { id: "dichroic-premium", name: "Premium Multi-Shift Dichroic", multiplier: 1.25 },
  ],
};

const GRADIENT = {
  materials: [
    { id: "gradient-clear-to-color", name: "Clear to Color Gradient", multiplier: 1.0 },
    { id: "gradient-clear-to-frost", name: "Clear to Frosted Gradient", multiplier: 1.1 },
  ],
};

// Series 2: Vision Control
const ONE_WAY_VISION = {
  materials: [
    { id: "perforated-50", name: "50/50 Perforation (standard)", multiplier: 1.0 },
    { id: "perforated-65", name: "65/35 Perforation (more see-through)", multiplier: 1.1 },
  ],
};

const BLOCKOUT = {
  materials: [
    { id: "blockout-black", name: "Black-Back Blockout Vinyl", multiplier: 1.0 },
    { id: "blockout-grey", name: "Grey-Back Blockout Vinyl", multiplier: 1.0 },
  ],
};

// Series 3: Frosted & Specialty
const FROSTED_PRINTED = {
  materials: [
    { id: "frosted-white-ink", name: "Frosted Film + White Ink Print", multiplier: 1.0 },
  ],
};

const FROSTED_STATIC_CLING = {
  materials: [
    { id: "frosted-cling", name: "Frosted Static Cling (no adhesive)", multiplier: 1.0 },
  ],
};

// Series 4: Standard Opaque
const STANDARD_WHITE = {
  materials: [
    { id: "white-vinyl", name: "White Vinyl (full opaque)", multiplier: 1.0 },
  ],
};

const DOUBLE_SIDED = {
  materials: [
    { id: "cwc-clear-vinyl", name: "Color+White+Color on Clear Vinyl", multiplier: 1.0 },
  ],
};

const STATIC_CLING_STD = {
  materials: [
    { id: "clear-cling", name: "Clear Static Cling", multiplier: 1.0 },
    { id: "white-cling", name: "White Static Cling", multiplier: 1.0 },
  ],
};

// Wall graphics — AREA_TIERED
const WALL_GRAPHICS = {
  materials: [
    { id: "adhesive-vinyl", name: "Adhesive Vinyl", multiplier: 1.0 },
    { id: "fabric-peel-stick", name: "Fabric Peel & Stick (removable)", multiplier: 1.2 },
    { id: "canvas-texture", name: "Canvas Texture Vinyl", multiplier: 1.15 },
  ],
};

const WALL_MURAL = {
  materials: [
    { id: "adhesive-vinyl", name: "Adhesive Vinyl", multiplier: 1.0 },
    { id: "fabric-peel-stick", name: "Fabric Peel & Stick (removable)", multiplier: 1.2 },
    { id: "wallpaper-prepasted", name: "Pre-Pasted Wallpaper", multiplier: 1.1 },
  ],
};

const WALL_DECAL = {
  materials: [
    { id: "vinyl-decal", name: "Vinyl Decal", multiplier: 1.0 },
    { id: "fabric-decal", name: "Fabric Decal (removable)", multiplier: 1.15 },
  ],
};

// Floor graphics — AREA_TIERED
const FLOOR_GRAPHIC = {
  materials: [
    { id: "anti-slip-vinyl", name: "Anti-Slip Vinyl", multiplier: 1.0 },
    { id: "anti-slip-laminate", name: "Anti-Slip Laminated Vinyl", multiplier: 1.15 },
  ],
};

const FLOOR_DECAL = {
  materials: [
    { id: "anti-slip-vinyl", name: "Anti-Slip Vinyl", multiplier: 1.0 },
    { id: "removable-anti-slip", name: "Removable Anti-Slip Vinyl", multiplier: 1.1 },
  ],
};

const FLOOR_SAFETY = {
  materials: [
    { id: "anti-slip-vinyl", name: "Anti-Slip Vinyl", multiplier: 1.0 },
    { id: "reflective-anti-slip", name: "Reflective Anti-Slip Vinyl", multiplier: 1.3 },
  ],
};

const FLOOR_SET = {
  quantityChoices: [1, 2, 5, 10, 25],
  materials: [
    { id: "anti-slip-vinyl", name: "Anti-Slip Vinyl", multiplier: 1.0 },
    { id: "reflective-anti-slip", name: "Reflective Anti-Slip Vinyl", multiplier: 1.3 },
  ],
};

// ─── Slug → template mapping ─────────────────────────────────────

const SLUG_MAP = {
  // === Window films (10 new products) ===
  "window-graphics-transparent-color": TRANSPARENT_COLOR,
  "dichroic-window-film": DICHROIC,
  "gradient-window-film": GRADIENT,
  "one-way-vision": ONE_WAY_VISION,
  "window-graphics-blockout": BLOCKOUT,
  "frosted-window-graphics": FROSTED_PRINTED,
  "static-cling-frosted": FROSTED_STATIC_CLING,
  "window-graphics-standard": STANDARD_WHITE,
  "window-graphics-double-sided": DOUBLE_SIDED,
  "static-cling-standard": STATIC_CLING_STD,

  // === Wall graphics (AREA_TIERED) ===
  "wall-graphics": WALL_GRAPHICS,
  "wall-murals": WALL_MURAL,
  "wall-mural-graphic": WALL_MURAL,
  "wall-decals": WALL_DECAL,

  // === Floor graphics (AREA_TIERED) ===
  "floor-graphics": FLOOR_GRAPHIC,
  "floor-decals": FLOOR_DECAL,
  "floor-logo-graphic": FLOOR_GRAPHIC,
  "lf-floor-graphics": FLOOR_GRAPHIC,
  "warehouse-floor-safety-graphics": FLOOR_SAFETY,

  // === Floor sets ===
  "floor-direction-arrows-set": FLOOR_SET,
  "floor-number-markers-set": FLOOR_SET,
};

// ─── Main ────────────────────────────────────────────────────────

async function main() {
  // Query both categories
  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      category: { in: ["window-glass-films", "windows-walls-floors"] },
    },
    select: { id: true, slug: true, optionsConfig: true },
    orderBy: { slug: "asc" },
  });

  console.log(`${apply ? "APPLY" : "DRY-RUN"} — ${products.length} products found\n`);

  let updated = 0;
  let skipped = 0;
  let alreadyHas = 0;

  for (const p of products) {
    const opts = p.optionsConfig && typeof p.optionsConfig === "object" ? p.optionsConfig : {};
    const hasSizes = Array.isArray(opts.sizes) && opts.sizes.length > 0;
    const hasMaterials = Array.isArray(opts.materials) && opts.materials.length > 0;
    const hasEditor = !!opts.editor;
    if (hasSizes || hasEditor || hasMaterials) {
      alreadyHas++;
      continue;
    }

    const template = SLUG_MAP[p.slug];
    if (!template) {
      console.log(`  SKIP  ${p.slug.padEnd(48)} — no template`);
      skipped++;
      continue;
    }

    const merged = { ...opts, ...template };
    const matCount = (template.materials || []).length;
    const qtyLabel = template.quantityChoices ? template.quantityChoices.join(",") : "area";

    console.log(`  SET   ${p.slug.padEnd(48)} — qty:${qtyLabel} mat:${matCount}`);

    if (apply) {
      await prisma.product.update({
        where: { id: p.id },
        data: { optionsConfig: merged },
      });
    }
    updated++;
  }

  console.log(`\nDone: ${updated} ${apply ? "updated" : "would update"}, ${alreadyHas} already configured, ${skipped} skipped`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
