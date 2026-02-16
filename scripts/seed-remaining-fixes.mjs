#!/usr/bin/env node
/**
 * Fix remaining categories:
 *  1. banners-displays     — assign presets to 12 products with no pricing
 *  2. signs-rigid-boards   — fix pricingUnit to per_sqft for 12 AREA_TIERED products
 *  3. stickers-labels-decals — add text editor for vinyl-lettering products
 *
 * Run:  node scripts/seed-remaining-fixes.mjs
 * Safe to re-run.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ─── New presets for Banners ─────────────────────────────

const PRESETS = [
  // Fabric / Dye-Sub banners (per sqft)
  {
    key: "fabric_banner_default",
    name: "Fabric Banners — Default",
    model: "AREA_TIERED",
    config: {
      tiers: [
        { upToSqft: 6,    rate: 16.00 },
        { upToSqft: 20,   rate: 13.00 },
        { upToSqft: 50,   rate: 10.00 },
        { upToSqft: 100,  rate: 8.50  },
        { upToSqft: 9999, rate: 7.00  },
      ],
      materials: [
        { id: "polyester",      name: "Polyester Fabric",       multiplier: 1.0  },
        { id: "stretch-fabric", name: "Stretch Fabric (Tube)",  multiplier: 1.2  },
        { id: "backlit-fabric", name: "Backlit Fabric",         multiplier: 1.35 },
      ],
      finishings: [
        { id: "pole-pocket", name: "Pole Pockets",    type: "flat", price: 10.00 },
        { id: "hem-grommets", name: "Hem & Grommets", type: "flat", price: 12.00 },
        { id: "velcro-edge", name: "Velcro Edge",     type: "flat", price: 15.00 },
      ],
      addons: [
        { id: "design-proof", name: "Design Proof", price: 25.00, type: "flat" },
      ],
      fileFee: 5.0,
      minimumPrice: 45.0,
    },
  },

  // Pole banners (per sqft)
  {
    key: "pole_banner_default",
    name: "Pole Banners — Default",
    model: "AREA_TIERED",
    config: {
      tiers: [
        { upToSqft: 4,    rate: 20.00 },
        { upToSqft: 10,   rate: 16.00 },
        { upToSqft: 30,   rate: 13.00 },
        { upToSqft: 9999, rate: 10.00 },
      ],
      materials: [
        { id: "vinyl-18oz",  name: "18oz Vinyl (Blockout)",  multiplier: 1.0  },
        { id: "fabric",      name: "Polyester Fabric",       multiplier: 1.15 },
      ],
      finishings: [
        { id: "pole-pocket", name: "Pole Pockets", type: "flat", price: 8.00 },
        { id: "hem-grommets", name: "Hem & Grommets", type: "flat", price: 10.00 },
      ],
      addons: [
        { id: "hardware-kit", name: "Hardware / Bracket Kit", price: 45.00, type: "flat" },
        { id: "design-proof", name: "Design Proof",           price: 25.00, type: "flat" },
      ],
      fileFee: 5.0,
      minimumPrice: 40.0,
    },
  },

  // Mesh banner heavy duty (per sqft)
  {
    key: "mesh_banner_heavy_default",
    name: "Mesh Banner Heavy Duty — Default",
    model: "AREA_TIERED",
    config: {
      tiers: [
        { upToSqft: 8,    rate: 14.00 },
        { upToSqft: 24,   rate: 11.00 },
        { upToSqft: 60,   rate: 8.50  },
        { upToSqft: 9999, rate: 7.00  },
      ],
      materials: [
        { id: "mesh-8oz",  name: "8oz Mesh",          multiplier: 1.0  },
        { id: "mesh-12oz", name: "12oz Heavy Mesh",    multiplier: 1.25 },
      ],
      finishings: [
        { id: "hem-grommets", name: "Hem & Grommets",  type: "flat", price: 12.00 },
        { id: "wind-slits",   name: "Wind Slits",      type: "flat", price: 8.00  },
      ],
      addons: [
        { id: "design-proof", name: "Design Proof", price: 25.00, type: "flat" },
      ],
      fileFee: 5.0,
      minimumPrice: 35.0,
    },
  },

  // Tension fabric displays (per piece, fixed sizes)
  {
    key: "tension_fabric_display_default",
    name: "Tension Fabric Display — Default",
    model: "QTY_TIERED",
    config: {
      tiers: [
        { minQty: 1,  unitPrice: 350.00 },
        { minQty: 2,  unitPrice: 320.00 },
        { minQty: 3,  unitPrice: 295.00 },
        { minQty: 5,  unitPrice: 275.00 },
      ],
      materials: [
        { id: "fabric-single", name: "Single-Sided Fabric", multiplier: 1.0 },
        { id: "fabric-double", name: "Double-Sided Fabric", multiplier: 1.4 },
      ],
      fileFee: 0,
      minimumPrice: 350.0,
    },
  },

  // A-frame double-sided (per piece)
  {
    key: "a_frame_double_default",
    name: "A-Frame Double-Sided — Default",
    model: "QTY_TIERED",
    config: {
      tiers: [
        { minQty: 1,  unitPrice: 65.00 },
        { minQty: 2,  unitPrice: 55.00 },
        { minQty: 5,  unitPrice: 48.00 },
        { minQty: 10, unitPrice: 42.00 },
      ],
      materials: [
        { id: "coroplast", name: "Coroplast",  multiplier: 1.0 },
        { id: "pvc",       name: "PVC Board",  multiplier: 1.3 },
      ],
      fileFee: 0,
      minimumPrice: 65.0,
    },
  },

  // Tent prints / walls (per piece)
  {
    key: "tent_prints_default",
    name: "Tent Prints & Walls — Default",
    model: "QTY_TIERED",
    config: {
      tiers: [
        { minQty: 1,  unitPrice: 180.00 },
        { minQty: 2,  unitPrice: 160.00 },
        { minQty: 3,  unitPrice: 145.00 },
        { minQty: 5,  unitPrice: 130.00 },
      ],
      materials: [
        { id: "polyester", name: "Polyester Fabric", multiplier: 1.0 },
      ],
      fileFee: 0,
      minimumPrice: 180.0,
    },
  },

  // Vinyl lettering for stickers (per sqft, text editor)
  {
    key: "vinyl_lettering_default",
    name: "Vinyl Lettering — Default",
    model: "AREA_TIERED",
    config: {
      tiers: [
        { upToSqft: 1,    rate: 30.00 },
        { upToSqft: 3,    rate: 24.00 },
        { upToSqft: 8,    rate: 18.00 },
        { upToSqft: 20,   rate: 14.00 },
        { upToSqft: 9999, rate: 10.00 },
      ],
      materials: [
        { id: "standard",       name: "Standard Vinyl",  multiplier: 1.0  },
        { id: "premium-outdoor", name: "Premium Outdoor", multiplier: 1.2  },
        { id: "metallic-gold",  name: "Metallic Gold",    multiplier: 1.4  },
        { id: "metallic-silver", name: "Metallic Silver", multiplier: 1.4  },
        { id: "reflective",     name: "Reflective",       multiplier: 1.6  },
      ],
      finishings: [],
      addons: [
        { id: "transfer-tape", name: "Application Tape",  price: 0, type: "flat" },
        { id: "design-proof",  name: "Design Proof",       price: 25.00, type: "flat" },
      ],
      fileFee: 5.0,
      minimumPrice: 25.0,
    },
  },
];

// ─── Slug → Preset key for Banners ───────────────────────

const BANNER_SLUG_MAP = {
  "fabric-banner":              "fabric_banner_default",
  "fabric-banner-double-sided": "fabric_banner_default",
  "fabric-banner-hanging":      "fabric_banner_default",
  "pole-banner-double-sided":   "pole_banner_default",
  "pole-banner-single-sided":   "pole_banner_default",
  "pole-banner-hardware-kit":   "pole_banner_default",
  "mesh-banner-heavy-duty":     "mesh_banner_heavy_default",
  "tension-fabric-display-8ft": "tension_fabric_display_default",
  "tension-fabric-display-10ft":"tension_fabric_display_default",
  "a-frame-double-sided":       "a_frame_double_default",
  "tent-custom-print":          "tent_prints_default",
  "tent-half-walls":            "tent_prints_default",
};

// Banners that should be area-priced (per sqft)
const BANNER_AREA_SLUGS = new Set([
  "fabric-banner", "fabric-banner-double-sided", "fabric-banner-hanging",
  "pole-banner-double-sided", "pole-banner-single-sided",
  "mesh-banner-heavy-duty",
]);

// ─── Signs pricingUnit fix ───────────────────────────────

const SIGNS_FIX_SLUGS = [
  "dry-erase-rigid-board", "event-celebration-board", "event-photo-backdrop",
  "floor-standup-display", "giant-presentation-check", "handheld-prop-board",
  "life-size-cutout", "memorial-tribute-board", "photo-collage-board",
  "seating-chart-board", "selfie-frame-board", "welcome-sign-board",
];

// ─── Stickers vinyl-lettering editor + preset ────────────

const LETTERING_EDITOR = {
  type: "text",
  mode: "lettering",
  defaultText: "YOUR TEXT HERE",
  defaultColor: "#000000",
  fonts: [
    "Montserrat", "Roboto", "Oswald", "Playfair Display",
    "Lato", "Bebas Neue", "Arial", "Helvetica",
  ],
};

const STICKER_LETTERING_SLUGS = [
  "vinyl-lettering",
  "transfer-vinyl-lettering",
];

// ─── Main ────────────────────────────────────────────────

async function main() {
  console.log("── Fixing remaining categories ──\n");

  // 1. Upsert presets
  const presetMap = {};
  for (const p of PRESETS) {
    const row = await prisma.pricingPreset.upsert({
      where: { key: p.key },
      create: { key: p.key, name: p.name, model: p.model, config: p.config },
      update: { name: p.name, model: p.model, config: p.config },
    });
    presetMap[p.key] = row.id;
    console.log(`  Preset: ${p.key} → ${row.id}`);
  }

  // ── 2. Banners: assign presets + fix pricingUnit ──
  console.log("\n── Banners & Displays ──");
  let bannersFixed = 0;
  for (const [slug, presetKey] of Object.entries(BANNER_SLUG_MAP)) {
    const presetId = presetMap[presetKey];
    if (!presetId) continue;

    const product = await prisma.product.findUnique({ where: { slug } });
    if (!product) {
      console.log(`  ${slug} — not found, skipping`);
      continue;
    }

    const updates = { pricingPresetId: presetId };
    if (BANNER_AREA_SLUGS.has(slug) && product.pricingUnit !== "per_sqft") {
      updates.pricingUnit = "per_sqft";
    }

    await prisma.product.update({ where: { slug }, data: updates });
    console.log(`  ${slug} → ${presetKey}${updates.pricingUnit ? " [unit→per_sqft]" : ""}`);
    bannersFixed++;
  }
  console.log(`  Total: ${bannersFixed}`);

  // ── 3. Signs: fix pricingUnit ──
  console.log("\n── Signs & Rigid Boards ──");
  let signsFixed = 0;
  for (const slug of SIGNS_FIX_SLUGS) {
    const product = await prisma.product.findUnique({ where: { slug } });
    if (!product) {
      console.log(`  ${slug} — not found`);
      continue;
    }
    if (product.pricingUnit === "per_sqft") {
      console.log(`  ${slug} — already per_sqft`);
      continue;
    }
    await prisma.product.update({
      where: { slug },
      data: { pricingUnit: "per_sqft" },
    });
    console.log(`  ${slug} → per_sqft`);
    signsFixed++;
  }
  console.log(`  Total: ${signsFixed}`);

  // ── 4. Stickers: vinyl-lettering editor + preset + pricingUnit ──
  console.log("\n── Stickers — Vinyl Lettering ──");
  let stickersFixed = 0;
  const letteringPresetId = presetMap["vinyl_lettering_default"];

  for (const slug of STICKER_LETTERING_SLUGS) {
    const product = await prisma.product.findUnique({ where: { slug } });
    if (!product) {
      console.log(`  ${slug} — not found`);
      continue;
    }

    const existing = product.optionsConfig && typeof product.optionsConfig === "object"
      ? product.optionsConfig
      : {};

    const updates = {};

    // Add text editor
    if (!existing.editor) {
      updates.optionsConfig = { ...existing, editor: LETTERING_EDITOR };
    }

    // Assign lettering preset
    if (letteringPresetId) {
      updates.pricingPresetId = letteringPresetId;
    }

    // Fix pricingUnit
    if (product.pricingUnit !== "per_sqft") {
      updates.pricingUnit = "per_sqft";
    }

    if (Object.keys(updates).length > 0) {
      await prisma.product.update({ where: { slug }, data: updates });
      const flags = [];
      if (updates.optionsConfig) flags.push("+editor");
      if (updates.pricingPresetId) flags.push("+preset");
      if (updates.pricingUnit) flags.push("unit→per_sqft");
      console.log(`  ${slug} → [${flags.join(", ")}]`);
      stickersFixed++;
    } else {
      console.log(`  ${slug} — already configured`);
    }
  }
  console.log(`  Total: ${stickersFixed}`);

  console.log("\n── Done ──");
  console.log(`  Banners fixed: ${bannersFixed}`);
  console.log(`  Signs pricingUnit fixed: ${signsFixed}`);
  console.log(`  Stickers lettering fixed: ${stickersFixed}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
