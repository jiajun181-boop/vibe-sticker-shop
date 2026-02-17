#!/usr/bin/env node
/**
 * Bulk-apply optionsConfig for windows-walls-floors products.
 *
 * Run:  node scripts/seed-options-windows.mjs           (dry-run)
 * Run:  node scripts/seed-options-windows.mjs --apply   (write to DB)
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const apply = process.argv.includes("--apply");

// ─── Templates ───────────────────────────────────────────────────

// Window films — AREA_TIERED (page auto-shows width/height)
const FROSTED_FILM = {
  materials: [
    { id: "frosted-vinyl", name: "Frosted Vinyl (adhesive)", multiplier: 1.0 },
    { id: "frosted-static-cling", name: "Frosted Static Cling (removable)", multiplier: 1.1 },
  ],
};

const PRIVACY_FILM = {
  materials: [
    { id: "frosted-vinyl", name: "Frosted Vinyl", multiplier: 1.0 },
    { id: "etched-glass-vinyl", name: "Etched Glass Vinyl", multiplier: 1.15 },
    { id: "frosted-static-cling", name: "Frosted Static Cling (removable)", multiplier: 1.1 },
  ],
};

const CLEAR_STATIC = {
  materials: [
    { id: "clear-static-cling", name: "Clear Static Cling (removable)", multiplier: 1.0 },
    { id: "clear-vinyl", name: "Clear Adhesive Vinyl", multiplier: 0.95 },
  ],
};

const PERFORATED_FILM = {
  materials: [
    { id: "perforated-vinyl", name: "Perforated Vinyl (one-way vision)", multiplier: 1.0 },
    { id: "perforated-vinyl-hd", name: "Perforated Vinyl HD (micro-perf)", multiplier: 1.2 },
  ],
};

const ONE_WAY_VISION = {
  materials: [
    { id: "perforated-vinyl", name: "Perforated Vinyl", multiplier: 1.0 },
    { id: "perforated-vinyl-hd", name: "HD Micro-Perf Vinyl", multiplier: 1.2 },
  ],
};

const FULL_WINDOW = {
  materials: [
    { id: "clear-vinyl", name: "Clear Vinyl", multiplier: 1.0 },
    { id: "perforated-vinyl", name: "Perforated Vinyl (one-way vision)", multiplier: 1.1 },
    { id: "static-cling", name: "Static Cling (removable)", multiplier: 1.15 },
  ],
};

const HOLOGRAPHIC_FILM = {
  materials: [
    { id: "holographic-film", name: "Holographic Film", multiplier: 1.0 },
    { id: "iridescent-film", name: "Iridescent Film", multiplier: 1.1 },
  ],
};

const COLOR_ON_CLEAR = {
  materials: [
    { id: "clear-vinyl", name: "Clear Vinyl (adhesive)", multiplier: 1.0 },
    { id: "clear-static-cling", name: "Clear Static Cling (removable)", multiplier: 1.1 },
  ],
};

const WHITE_ON_CLEAR = {
  materials: [
    { id: "white-on-clear-vinyl", name: "White on Clear Vinyl", multiplier: 1.0 },
  ],
};

const VEHICLE_WINDOW_TINT = {
  materials: [
    { id: "perforated-vinyl", name: "Perforated Vinyl", multiplier: 1.0 },
    { id: "tint-film", name: "Tint Film", multiplier: 0.9 },
  ],
};

// Window decals — QTY_TIERED (small items sold per piece)
const WINDOW_DECALS = {
  quantityChoices: [5, 10, 25, 50, 100, 250],
  materials: [
    { id: "clear-vinyl", name: "Clear Vinyl", multiplier: 1.0 },
    { id: "white-vinyl", name: "White Vinyl", multiplier: 0.95 },
    { id: "static-cling", name: "Static Cling (removable)", multiplier: 1.1 },
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

// Floor sets (arrows, numbers) — smaller fixed-size items
const FLOOR_SET = {
  quantityChoices: [1, 2, 5, 10, 25],
  materials: [
    { id: "anti-slip-vinyl", name: "Anti-Slip Vinyl", multiplier: 1.0 },
    { id: "reflective-anti-slip", name: "Reflective Anti-Slip Vinyl", multiplier: 1.3 },
  ],
};

// ─── Slug → template mapping ─────────────────────────────────────

const SLUG_MAP = {
  // === Window films (AREA_TIERED) ===
  "frosted-matte-window-film": FROSTED_FILM,
  "frosted-privacy-film": PRIVACY_FILM,
  "frosted-privacy-window-film": PRIVACY_FILM,
  "frosted-static-cling": CLEAR_STATIC,
  "clear-static-cling": CLEAR_STATIC,
  "perforated-window-film": PERFORATED_FILM,
  "window-perforated": PERFORATED_FILM,
  "window-graphics-perforated": PERFORATED_FILM,
  "one-way-vision-graphics": ONE_WAY_VISION,
  "full-window-graphics": FULL_WINDOW,
  "window-frosted": PRIVACY_FILM,
  "window-graphics": FULL_WINDOW,
  "holographic-iridescent-film": HOLOGRAPHIC_FILM,
  "color-white-color-clear-vinyl": COLOR_ON_CLEAR,
  "color-white-on-clear-vinyl": WHITE_ON_CLEAR,
  "vehicle-window-tint-graphic": VEHICLE_WINDOW_TINT,

  // === Window decals (QTY_TIERED) ===
  "window-decals": WINDOW_DECALS,

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

  // === Floor sets (AREA_TIERED but sold in sets) ===
  "floor-direction-arrows-set": FLOOR_SET,
  "floor-number-markers-set": FLOOR_SET,
};

// ─── Main ────────────────────────────────────────────────────────

async function main() {
  const products = await prisma.product.findMany({
    where: { isActive: true, category: "windows-walls-floors" },
    select: { id: true, slug: true, optionsConfig: true },
    orderBy: { slug: "asc" },
  });

  console.log(`${apply ? "APPLY" : "DRY-RUN"} — ${products.length} products in windows-walls-floors\n`);

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
