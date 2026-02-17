#!/usr/bin/env node
/**
 * Bulk-apply optionsConfig for banners-displays products.
 *
 * Run:  node scripts/seed-options-banners.mjs           (dry-run)
 * Run:  node scripts/seed-options-banners.mjs --apply   (write to DB)
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const apply = process.argv.includes("--apply");

// ─── Templates ───────────────────────────────────────────────────

const VINYL_BANNER = {
  materials: [
    { id: "13oz-vinyl", name: '13oz Vinyl (standard)', multiplier: 1.0 },
    { id: "18oz-vinyl", name: '18oz Vinyl (heavy-duty)', multiplier: 1.25 },
  ],
  addons: [
    { id: "grommets", name: "Grommets (every 2ft)", pricePer: 0, type: "included" },
    { id: "hems", name: "Hems (reinforced edges)", pricePer: 0, type: "included" },
    { id: "pole-pockets", name: "Pole Pockets", pricePer: 500, type: "flat" },
    { id: "wind-slits", name: "Wind Slits", pricePer: 0, type: "included" },
  ],
};

const MESH_BANNER = {
  materials: [
    { id: "mesh-9oz", name: "9oz Mesh (standard)", multiplier: 1.0 },
    { id: "mesh-12oz", name: "12oz Mesh (heavy-duty)", multiplier: 1.2 },
  ],
  addons: [
    { id: "grommets", name: "Grommets (every 2ft)", pricePer: 0, type: "included" },
    { id: "hems", name: "Hems", pricePer: 0, type: "included" },
  ],
};

const FABRIC_BANNER = {
  materials: [
    { id: "polyester-fabric", name: "Polyester Fabric (dye-sub)", multiplier: 1.0 },
    { id: "satin-fabric", name: "Satin Fabric", multiplier: 1.15 },
  ],
};

const BLOCKOUT_BANNER = {
  materials: [
    { id: "blockout-vinyl", name: "Blockout Vinyl (opaque)", multiplier: 1.0 },
  ],
};

const DOUBLE_SIDED_BANNER = {
  materials: [
    { id: "13oz-vinyl", name: "13oz Vinyl (double-sided print)", multiplier: 1.0 },
  ],
};

const POLE_BANNER = {
  materials: [
    { id: "18oz-vinyl", name: "18oz Vinyl", multiplier: 1.0 },
    { id: "fabric", name: "Polyester Fabric", multiplier: 1.2 },
  ],
};

// Hardware — just quantity choices
const HARDWARE_SINGLE = {
  quantityChoices: [1, 2, 3, 5, 10],
};

const HARDWARE_MULTI = {
  quantityChoices: [1, 2, 5, 10, 25],
};

// Stand + print combos
const ROLLUP_COMBO = {
  quantityChoices: [1, 2, 3, 5, 10],
};

// Tabletop items
const TABLETOP = {
  quantityChoices: [1, 2, 5, 10],
};

// Flags
const FLAG_COMBO = {
  quantityChoices: [1, 2, 5, 10, 25],
};

// Tents
const TENT = {
  quantityChoices: [1, 2, 3],
};

const TENT_ACCESSORY = {
  quantityChoices: [1, 2, 4],
};

// Backdrops
const BACKDROP = {
  quantityChoices: [1, 2, 3, 5],
};

// Accessories / services
const ACCESSORY = {
  quantityChoices: [1, 2, 5, 10, 25, 50],
};

const TABLE_COVER = {
  quantityChoices: [1, 2, 5, 10],
  materials: [
    { id: "polyester", name: "Polyester (wrinkle-free)", multiplier: 1.0 },
    { id: "stretch-fabric", name: "Stretch Fabric", multiplier: 1.2 },
  ],
};

// ─── Slug → template mapping ─────────────────────────────────────

const SLUG_MAP = {
  // === Banners (AREA_TIERED — page auto-shows width/height) ===
  "vinyl-banners": VINYL_BANNER,
  "blockout-banners": BLOCKOUT_BANNER,
  "double-sided-banners": DOUBLE_SIDED_BANNER,
  "mesh-banners": MESH_BANNER,
  "mesh-banner-heavy-duty": MESH_BANNER,
  "fabric-banner": FABRIC_BANNER,
  "fabric-banner-double-sided": FABRIC_BANNER,
  "fabric-banner-hanging": FABRIC_BANNER,
  "pole-banners": POLE_BANNER,
  "pole-banner-single-sided": POLE_BANNER,
  "pole-banner-double-sided": POLE_BANNER,
  "pole-banner-hardware-kit": POLE_BANNER,

  // === Roll-up / Retractable banner stands ===
  "banner-stand-rollup": ROLLUP_COMBO,
  "retractable-banner-stand-premium": ROLLUP_COMBO,
  "deluxe-rollup-banner": ROLLUP_COMBO,
  "roll-up-banners": ROLLUP_COMBO,
  "roll-up-stand-hardware": HARDWARE_SINGLE,
  "pull-up-banner": ROLLUP_COMBO,
  "banner-stand-l-base": ROLLUP_COMBO,
  "l-base-banner-stand": ROLLUP_COMBO,

  // === X-Banner stands ===
  "banner-stand-x": HARDWARE_MULTI,
  "x-banner-stand-standard": HARDWARE_MULTI,
  "x-banner-stand-large": HARDWARE_MULTI,
  "x-stand-hardware": HARDWARE_SINGLE,
  "x-banner-prints": HARDWARE_MULTI,
  "x-banner-frame-print": HARDWARE_MULTI,

  // === Tabletop ===
  "tabletop-banner-a3": TABLETOP,
  "tabletop-banner-a4": TABLETOP,
  "tabletop-x-banner": TABLETOP,
  "deluxe-tabletop-retractable-a3": TABLETOP,

  // === Flags ===
  "feather-flag": FLAG_COMBO,
  "feather-flags": FLAG_COMBO,
  "feather-flag-medium": FLAG_COMBO,
  "feather-flag-large": FLAG_COMBO,
  "feather-flag-pole-set": FLAG_COMBO,
  "teardrop-flag": FLAG_COMBO,
  "teardrop-flags": FLAG_COMBO,
  "teardrop-flag-medium": FLAG_COMBO,
  "teardrop-flag-pole-set": FLAG_COMBO,
  "flag-base-ground-stake": ACCESSORY,
  "flag-base-water-bag": ACCESSORY,
  "flag-bases-cross": ACCESSORY,

  // === Backdrops & step-repeat ===
  "backdrop-stand-hardware": HARDWARE_SINGLE,
  "step-and-repeat-stand-kit": HARDWARE_SINGLE,
  "step-repeat-backdrop-8x8": BACKDROP,
  "step-repeat-backdrops": BACKDROP,
  "telescopic-backdrop": BACKDROP,
  "media-wall-pop-up": BACKDROP,
  "pillowcase-display-frame": BACKDROP,

  // === Popup / tension fabric displays ===
  "popup-display-curved-8ft": HARDWARE_SINGLE,
  "popup-display-straight-8ft": HARDWARE_SINGLE,
  "tension-fabric-display-3x3": HARDWARE_SINGLE,
  "tension-fabric-display-8ft": HARDWARE_SINGLE,
  "tension-fabric-display-10ft": HARDWARE_SINGLE,

  // === Tents ===
  "outdoor-canopy-tent-10x10": TENT,
  "tent-frame-10x10": TENT,
  "tent-custom-print": TENT_ACCESSORY,
  "tent-half-walls": TENT_ACCESSORY,
  "tent-walls-set": TENT_ACCESSORY,

  // === Table covers ===
  "branded-table-cover-6ft": TABLE_COVER,
  "branded-table-runner": TABLE_COVER,
  "table-cloth": TABLE_COVER,

  // === Accessories & services ===
  "grommets-service": ACCESSORY,
  "drilled-holes-service": ACCESSORY,
  "banner-hems": ACCESSORY,
  "pole-pockets": ACCESSORY,
  "double-sided-tape": ACCESSORY,
  "velcro-strips": ACCESSORY,
  "standoff-hardware-set": ACCESSORY,
  "installation-service": { quantityChoices: [1] },
};

// ─── Main ────────────────────────────────────────────────────────

async function main() {
  const products = await prisma.product.findMany({
    where: { isActive: true, category: "banners-displays" },
    select: { id: true, slug: true, optionsConfig: true },
    orderBy: { slug: "asc" },
  });

  console.log(`${apply ? "APPLY" : "DRY-RUN"} — ${products.length} products in banners-displays\n`);

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
