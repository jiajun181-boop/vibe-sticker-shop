/**
 * apply-pricing-all-categories.mjs
 * Creates category-level pricing presets and assigns all products to appropriate presets.
 * Replaces generic stickers_default / business_cards_default / largeformat_roll_default
 * with category-tuned presets based on benchmark research.
 *
 * Usage:
 *   node scripts/apply-pricing-all-categories.mjs          # dry-run
 *   node scripts/apply-pricing-all-categories.mjs --apply   # write to DB
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const APPLY = process.argv.includes("--apply");

// ─── Category Presets ──────────────────────────────────────────────────
const CATEGORY_PRESETS = [
  // ── Display Hardware & Stands ──
  {
    key: "cat_display_hardware",
    name: "Display Hardware & Stands",
    model: "QTY_TIERED",
    config: {
      tiers: [
        { minQty: 1, unitPrice: 1.0 },   // multiplied by basePrice
        { minQty: 3, unitPrice: 0.92 },
        { minQty: 5, unitPrice: 0.85 },
        { minQty: 10, unitPrice: 0.78 },
        { minQty: 25, unitPrice: 0.72 },
      ],
      minimumPrice: 25,
      fileFee: 0,
    },
    // Note: these products use basePrice as the unit price; tiers are % multipliers
    // The quote engine uses unitPrice from tier directly, so we use special handling below
  },

  // ── Stickers & Labels (vinyl, die-cut, sheets) ──
  {
    key: "cat_stickers_labels",
    name: "Stickers & Labels (General)",
    model: "QTY_TIERED",
    config: {
      tiers: [
        { minQty: 25, unitPrice: 1.35 },
        { minQty: 50, unitPrice: 1.10 },
        { minQty: 100, unitPrice: 0.82 },
        { minQty: 250, unitPrice: 0.55 },
        { minQty: 500, unitPrice: 0.40 },
        { minQty: 1000, unitPrice: 0.28 },
        { minQty: 2500, unitPrice: 0.20 },
      ],
      minimumPrice: 25,
      fileFee: 0,
      finishings: [
        { id: "laminate", name: "Laminate", type: "per_unit", price: 0.05 },
        { id: "holographic", name: "Holographic", type: "per_unit", price: 0.12 },
      ],
    },
  },

  // ── Safety & Facility Labels ──
  {
    key: "cat_safety_facility",
    name: "Safety & Facility Labels",
    model: "QTY_TIERED",
    config: {
      tiers: [
        { minQty: 1, unitPrice: 22.00 },
        { minQty: 5, unitPrice: 18.00 },
        { minQty: 10, unitPrice: 15.00 },
        { minQty: 25, unitPrice: 12.00 },
        { minQty: 50, unitPrice: 9.50 },
        { minQty: 100, unitPrice: 7.50 },
      ],
      minimumPrice: 22,
      fileFee: 0,
      finishings: [
        { id: "reflective", name: "Reflective", type: "per_unit", price: 3.00 },
        { id: "laminate_outdoor", name: "Outdoor Laminate", type: "per_unit", price: 1.50 },
      ],
    },
  },

  // ── Fleet Compliance & ID ──
  {
    key: "cat_fleet_compliance",
    name: "Fleet Compliance & ID",
    model: "QTY_TIERED",
    config: {
      tiers: [
        { minQty: 1, unitPrice: 35.00 },
        { minQty: 3, unitPrice: 30.00 },
        { minQty: 5, unitPrice: 26.00 },
        { minQty: 10, unitPrice: 22.00 },
        { minQty: 25, unitPrice: 18.00 },
      ],
      minimumPrice: 35,
      fileFee: 0,
    },
  },

  // ── Vehicle Decals (per piece) ──
  {
    key: "cat_vehicle_decals_piece",
    name: "Vehicle Decals (Per Piece)",
    model: "QTY_TIERED",
    config: {
      tiers: [
        { minQty: 1, unitPrice: 35.00 },
        { minQty: 2, unitPrice: 30.00 },
        { minQty: 5, unitPrice: 25.00 },
        { minQty: 10, unitPrice: 20.00 },
        { minQty: 25, unitPrice: 16.00 },
      ],
      minimumPrice: 35,
      fileFee: 5,
      finishings: [
        { id: "laminate_3yr", name: "3-Year Outdoor Laminate", type: "per_unit", price: 5.00 },
        { id: "reflective", name: "Reflective", type: "per_unit", price: 8.00 },
      ],
    },
  },

  // ── Vehicle Graphics (per sqft) ──
  {
    key: "cat_vehicle_graphics_sqft",
    name: "Vehicle Graphics (Per Sqft)",
    model: "AREA_TIERED",
    config: {
      tiers: [
        { upToSqft: 4, rate: 22.00 },
        { upToSqft: 12, rate: 18.00 },
        { upToSqft: 32, rate: 14.00 },
        { upToSqft: 72, rate: 11.00 },
        { upToSqft: 200, rate: 9.00 },
        { upToSqft: 9999, rate: 7.50 },
      ],
      minimumPrice: 50,
      fileFee: 10,
      finishings: [
        { id: "laminate_vehicle", name: "Vehicle-Grade Laminate", type: "per_sqft", price: 2.50 },
        { id: "contour_cut", name: "Contour Cut", type: "flat", price: 25 },
      ],
    },
  },

  // ── Small Format Marketing Prints (postcards, rack cards, greeting cards, door hangers, etc) ──
  {
    key: "cat_marketing_small",
    name: "Small Format Marketing Prints",
    model: "QTY_TIERED",
    config: {
      tiers: [
        { minQty: 50, unitPrice: 0.65 },
        { minQty: 100, unitPrice: 0.48 },
        { minQty: 250, unitPrice: 0.32 },
        { minQty: 500, unitPrice: 0.22 },
        { minQty: 1000, unitPrice: 0.15 },
        { minQty: 2500, unitPrice: 0.10 },
        { minQty: 5000, unitPrice: 0.07 },
      ],
      minimumPrice: 25,
      fileFee: 0,
      finishings: [
        { id: "uv_gloss", name: "UV Gloss Coating", type: "per_unit", price: 0.03 },
        { id: "lam_matte", name: "Matte Lamination", type: "per_unit", price: 0.04 },
        { id: "rounded", name: "Rounded Corners", type: "per_unit", price: 0.01 },
        { id: "scoring", name: "Score/Fold", type: "per_unit", price: 0.03 },
      ],
    },
  },

  // ── Stationery (letterhead, envelopes, notepads) ──
  {
    key: "cat_stationery",
    name: "Stationery (Letterhead, Envelopes, Notepads)",
    model: "QTY_TIERED",
    config: {
      tiers: [
        { minQty: 50, unitPrice: 0.85 },
        { minQty: 100, unitPrice: 0.62 },
        { minQty: 250, unitPrice: 0.42 },
        { minQty: 500, unitPrice: 0.30 },
        { minQty: 1000, unitPrice: 0.22 },
        { minQty: 2500, unitPrice: 0.15 },
      ],
      minimumPrice: 30,
      fileFee: 5,
    },
  },

  // ── Booklets & Multi-page (booklets, brochures, presentation folders) ──
  {
    key: "cat_booklets_multipage",
    name: "Booklets & Multi-page Products",
    model: "QTY_TIERED",
    config: {
      tiers: [
        { minQty: 25, unitPrice: 8.50 },
        { minQty: 50, unitPrice: 6.00 },
        { minQty: 100, unitPrice: 4.20 },
        { minQty: 250, unitPrice: 3.00 },
        { minQty: 500, unitPrice: 2.20 },
        { minQty: 1000, unitPrice: 1.60 },
      ],
      minimumPrice: 50,
      fileFee: 10,
      finishings: [
        { id: "saddle_stitch", name: "Saddle Stitch", type: "per_unit", price: 0.15 },
        { id: "perfect_binding", name: "Perfect Binding", type: "per_unit", price: 0.50 },
        { id: "wire_o", name: "Wire-O Binding", type: "per_unit", price: 0.35 },
        { id: "lam_cover", name: "Laminated Cover", type: "per_unit", price: 0.20 },
      ],
    },
  },

  // ── Stamps (all sizes) ──
  {
    key: "cat_stamps",
    name: "Self-Inking Stamps (All Sizes)",
    model: "QTY_TIERED",
    config: {
      tiers: [
        { minQty: 1, unitPrice: 28.00 },
        { minQty: 5, unitPrice: 24.00 },
        { minQty: 10, unitPrice: 20.00 },
        { minQty: 25, unitPrice: 17.00 },
      ],
      minimumPrice: 20,
      fileFee: 0,
      finishings: [
        { id: "logo_upload", name: "Logo Upload", type: "per_unit", price: 5.00 },
        { id: "rush_2day", name: "Rush 2-Day", type: "per_unit", price: 8.00 },
        { id: "extra_ink", name: "Extra Ink Pad", type: "per_unit", price: 6.00 },
      ],
    },
  },

  // ── Packaging (inserts, tags, thank you cards, sticker seals) ──
  {
    key: "cat_packaging",
    name: "Packaging & Inserts",
    model: "QTY_TIERED",
    config: {
      tiers: [
        { minQty: 50, unitPrice: 0.45 },
        { minQty: 100, unitPrice: 0.32 },
        { minQty: 250, unitPrice: 0.22 },
        { minQty: 500, unitPrice: 0.15 },
        { minQty: 1000, unitPrice: 0.10 },
        { minQty: 2500, unitPrice: 0.07 },
        { minQty: 5000, unitPrice: 0.05 },
      ],
      minimumPrice: 20,
      fileFee: 0,
    },
  },

  // ── Rigid Signs (per piece) ──
  {
    key: "cat_rigid_signs_piece",
    name: "Rigid Signs (Per Piece)",
    model: "QTY_TIERED",
    config: {
      tiers: [
        { minQty: 1, unitPrice: 45.00 },
        { minQty: 5, unitPrice: 35.00 },
        { minQty: 10, unitPrice: 28.00 },
        { minQty: 25, unitPrice: 22.00 },
        { minQty: 50, unitPrice: 18.00 },
        { minQty: 100, unitPrice: 15.00 },
      ],
      minimumPrice: 45,
      fileFee: 0,
      finishings: [
        { id: "double_sided", name: "Double Sided", type: "per_unit", price: 8.00 },
        { id: "grommets", name: "Grommets (4)", type: "per_unit", price: 2.00 },
        { id: "drill_holes", name: "Drill Holes", type: "per_unit", price: 2.00 },
        { id: "h_stake", name: "H-Stake", type: "per_unit", price: 3.50 },
      ],
    },
  },

  // ── Safety Warning Decals ──
  {
    key: "cat_safety_decals",
    name: "Safety Warning Decals",
    model: "QTY_TIERED",
    config: {
      tiers: [
        { minQty: 1, unitPrice: 25.00 },
        { minQty: 5, unitPrice: 20.00 },
        { minQty: 10, unitPrice: 16.00 },
        { minQty: 25, unitPrice: 12.00 },
        { minQty: 50, unitPrice: 9.00 },
        { minQty: 100, unitPrice: 7.00 },
      ],
      minimumPrice: 25,
      fileFee: 0,
      finishings: [
        { id: "laminate_outdoor", name: "Outdoor Laminate", type: "per_unit", price: 2.00 },
        { id: "reflective", name: "Reflective Vinyl", type: "per_unit", price: 5.00 },
      ],
    },
  },

  // ── Banners & Large Displays (per sqft for banners, backdrops, flags) ──
  {
    key: "cat_banners_sqft",
    name: "Banners & Displays (Sqft)",
    model: "AREA_TIERED",
    config: {
      tiers: [
        { upToSqft: 6, rate: 5.50 },
        { upToSqft: 18, rate: 4.50 },
        { upToSqft: 32, rate: 3.80 },
        { upToSqft: 72, rate: 3.20 },
        { upToSqft: 200, rate: 2.60 },
        { upToSqft: 9999, rate: 2.20 },
      ],
      minimumPrice: 35,
      fileFee: 5,
      finishings: [
        { id: "hems_grommets", name: "Hems & Grommets", type: "flat", price: 0 },
        { id: "double_sided", name: "Double Sided", type: "per_sqft", price: 1.50 },
        { id: "pole_pockets", name: "Pole Pockets", type: "flat", price: 3 },
        { id: "wind_slits", name: "Wind Slits", type: "flat", price: 0.50 },
      ],
    },
  },

  // ── Large Format Graphics (floor, wall, general) ──
  {
    key: "cat_large_format",
    name: "Large Format Graphics",
    model: "AREA_TIERED",
    config: {
      tiers: [
        { upToSqft: 4, rate: 14.00 },
        { upToSqft: 12, rate: 11.00 },
        { upToSqft: 32, rate: 8.50 },
        { upToSqft: 72, rate: 6.50 },
        { upToSqft: 200, rate: 5.00 },
        { upToSqft: 9999, rate: 4.00 },
      ],
      minimumPrice: 35,
      fileFee: 5,
      finishings: [
        { id: "laminate_floor", name: "Floor-Grade Laminate", type: "per_sqft", price: 3.00 },
        { id: "laminate_uv", name: "UV Laminate", type: "per_sqft", price: 2.00 },
        { id: "contour_cut", name: "Contour Cut", type: "flat", price: 25 },
      ],
    },
  },

  // ── Window & Glass Films ──
  {
    key: "cat_window_films",
    name: "Window & Glass Films",
    model: "AREA_TIERED",
    config: {
      tiers: [
        { upToSqft: 4, rate: 16.00 },
        { upToSqft: 12, rate: 12.00 },
        { upToSqft: 32, rate: 9.00 },
        { upToSqft: 72, rate: 7.00 },
        { upToSqft: 200, rate: 5.50 },
        { upToSqft: 9999, rate: 4.50 },
      ],
      minimumPrice: 35,
      fileFee: 5,
      finishings: [
        { id: "laminate", name: "Lamination", type: "per_sqft", price: 2.00 },
        { id: "contour_cut", name: "Contour Cut", type: "flat", price: 25 },
      ],
    },
  },

  // ── Retail Promo (danglers, shelf talkers, wobblers) ──
  {
    key: "cat_retail_promo",
    name: "Retail Promo Materials",
    model: "QTY_TIERED",
    config: {
      tiers: [
        { minQty: 25, unitPrice: 1.80 },
        { minQty: 50, unitPrice: 1.30 },
        { minQty: 100, unitPrice: 0.95 },
        { minQty: 250, unitPrice: 0.65 },
        { minQty: 500, unitPrice: 0.45 },
        { minQty: 1000, unitPrice: 0.32 },
      ],
      minimumPrice: 30,
      fileFee: 5,
      finishings: [
        { id: "lam_gloss", name: "Gloss Lamination", type: "per_unit", price: 0.04 },
        { id: "die_cut", name: "Custom Die Cut", type: "flat", price: 35 },
        { id: "scoring", name: "Score/Fold", type: "per_unit", price: 0.03 },
      ],
    },
  },
];

// ─── Slug → Preset Mapping Rules ───────────────────────────────────────

// Stamps always go to cat_stamps
const STAMP_SLUGS = [
  "stamps-r512", "stamps-r524", "stamps-r532", "stamps-r552",
  "stamps-s510", "stamps-s542", "stamps-s827",
];

// Booklets/brochures/folders
const BOOKLET_SLUGS = [
  "booklets", "booklets-perfect-bound", "booklets-saddle-stitch", "booklets-wire-o",
  "brochures", "brochures-bi-fold", "brochures-tri-fold", "brochures-z-fold",
  "calendars", "calendars-wall", "calendars-wall-desk",
  "presentation-folders", "presentation-folders-die-cut", "presentation-folders-legal",
  "presentation-folders-reinforced", "presentation-folders-standard",
  "ncr-invoice-books", "ncr-invoices", "ncr-forms-duplicate", "ncr-forms-triplicate",
];

// Stationery
const STATIONERY_SLUGS = [
  "letterhead", "letterhead-standard", "envelopes", "envelopes-10-business",
  "envelopes-6x9-catalog", "envelopes-9x12-catalog", "envelopes-a7-invitation",
  "notepads", "notepads-custom", "bf-notepads", "bf-letterhead", "bf-certificates",
  "order-form-pads", "order-forms-single", "release-forms", "release-waiver-forms",
  "packing-slips",
];

// Packaging
const PACKAGING_SLUGS = [
  "hang-tags", "label-sets", "packaging-inserts", "sticker-seals",
  "thank-you-cards", "box-sleeves", "product-inserts", "hang-tags-custom",
  "tags-hang-tags",
];

// Vehicle per-sqft slugs
const VEHICLE_SQFT_SLUGS = [
  "custom-printed-vehicle-logo-decals", "long-term-outdoor-vehicle-decals",
  "partial-wrap-spot-graphics", "printed-truck-door-decals-full-color",
  "removable-promo-vehicle-decals", "tailgate-rear-door-printed-decal",
  "trailer-box-truck-large-graphics", "truck-side-panel-printed-decal",
  "vehicle-wrap-print-only-quote",
];

// Display hardware (per-piece, non-print items)
const DISPLAY_HARDWARE_SLUGS = [
  "a-frame-sign-stand", "a-frame-stand", "backdrop-stand-hardware",
  "banner-hems", "banner-stand-l-base", "banner-stand-rollup", "banner-stand-x",
  "branded-table-cover-6ft", "branded-table-runner",
  "deluxe-rollup-banner", "deluxe-tabletop-retractable-a3",
  "double-sided-tape", "drilled-holes-service",
  "feather-flag-large", "feather-flag-medium", "feather-flag-pole-set",
  "flag-base-ground-stake", "flag-base-water-bag", "flag-bases-cross",
  "grommets-service", "h-stake-wire", "h-stakes", "installation-service",
  "l-base-banner-stand",
  "outdoor-canopy-tent-10x10", "pole-pockets",
  "popup-display-curved-8ft", "popup-display-straight-8ft",
  "real-estate-frame", "roll-up-stand-hardware",
  "standoff-hardware-set", "step-and-repeat-stand-kit",
  "step-repeat-backdrop-8x8", "tabletop-banner-a3",
  "tabletop-x-banner", "teardrop-flag-medium", "teardrop-flag-pole-set",
  "tension-fabric-display-3x3", "tent-frame-10x10", "tent-walls-set",
  "velcro-strips", "x-banner-stand-large", "x-stand-hardware",
];

function resolvePresetKey(product) {
  const slug = product.slug;
  const cat = product.category;
  const unit = product.pricingUnit;

  // Already has a batch1 or premium preset — skip
  const currentKey = product.pricingPreset?.key || "";
  if (currentKey.startsWith("batch1_") || currentKey === "business_cards_premium" || currentKey === "cardstock_14pt_custom_size") {
    return null; // keep current
  }

  // Stamps
  if (STAMP_SLUGS.includes(slug)) return "cat_stamps";

  // Booklets / multi-page
  if (BOOKLET_SLUGS.includes(slug)) return "cat_booklets_multipage";

  // Stationery
  if (STATIONERY_SLUGS.includes(slug)) return "cat_stationery";

  // Packaging
  if (PACKAGING_SLUGS.includes(slug)) return "cat_packaging";

  // Display hardware
  if (DISPLAY_HARDWARE_SLUGS.includes(slug)) return "cat_display_hardware";

  // Vehicle per-sqft
  if (VEHICLE_SQFT_SLUGS.includes(slug)) return "cat_vehicle_graphics_sqft";

  // Category-based rules
  if (cat === "safety-warning-decals") return "cat_safety_decals";
  if (cat === "fleet-compliance-id") return "cat_fleet_compliance";
  if (cat === "window-glass-films") return "cat_window_films";

  if (cat === "vehicle-branding-advertising") {
    return unit === "per_sqft" ? "cat_vehicle_graphics_sqft" : "cat_vehicle_decals_piece";
  }

  if (cat === "facility-asset-labels") {
    return unit === "per_sqft" ? "cat_large_format" : "cat_safety_facility";
  }

  if (cat === "large-format-graphics") {
    return unit === "per_sqft" ? "cat_large_format" : "cat_large_format";
  }

  if (cat === "banners-displays") {
    return "cat_banners_sqft";
  }

  if (cat === "rigid-signs") {
    return unit === "per_sqft" ? null : "cat_rigid_signs_piece"; // keep rigid_sheets_default for sqft
  }

  if (cat === "stickers-labels") {
    return "cat_stickers_labels";
  }

  if (cat === "retail-promo") return "cat_retail_promo";

  if (cat === "packaging") return "cat_packaging";

  // Marketing prints - remaining items are small format
  if (cat === "marketing-prints") {
    // Items with sub-product naming that suggest stickers/labels
    if (slug.includes("sticker") || slug.includes("label")) return "cat_stickers_labels";
    if (slug === "yard-signs-coroplast") return "cat_rigid_signs_piece";
    if (slug === "magnets-business-card") return "cat_marketing_small";
    return "cat_marketing_small";
  }

  return null; // keep current
}

// ─── Main ──────────────────────────────────────────────────────────────

async function main() {
  // Load all active products with their current preset
  const products = await prisma.product.findMany({
    where: { isActive: true },
    select: {
      id: true,
      slug: true,
      category: true,
      pricingUnit: true,
      basePrice: true,
      pricingPreset: { select: { key: true } },
    },
    orderBy: [{ category: "asc" }, { slug: "asc" }],
  });

  // Build assignment plan
  const plan = [];
  for (const p of products) {
    const newKey = resolvePresetKey(p);
    if (newKey && newKey !== p.pricingPreset?.key) {
      plan.push({ id: p.id, slug: p.slug, from: p.pricingPreset?.key, to: newKey });
    }
  }

  // Count by target preset
  const byKey = {};
  for (const row of plan) byKey[row.to] = (byKey[row.to] || 0) + 1;

  console.log(`[all-cat] total active products: ${products.length}`);
  console.log(`[all-cat] products to reassign: ${plan.length}`);
  console.log("[all-cat] by preset:", JSON.stringify(byKey, null, 2));

  if (!APPLY) {
    console.log("\n[all-cat] dry-run preview (first 50):");
    for (const row of plan.slice(0, 50)) {
      console.log(`  ${row.slug}: ${row.from} -> ${row.to}`);
    }
    if (plan.length > 50) console.log(`  ... and ${plan.length - 50} more`);
    console.log("\n[all-cat] pass --apply to write changes.");
    return;
  }

  // 1. Upsert all category presets
  const presetIdByKey = new Map();
  for (const preset of CATEGORY_PRESETS) {
    const row = await prisma.pricingPreset.upsert({
      where: { key: preset.key },
      create: { key: preset.key, name: preset.name, model: preset.model, config: preset.config, isActive: true },
      update: { name: preset.name, model: preset.model, config: preset.config, isActive: true },
    });
    presetIdByKey.set(preset.key, row.id);
    console.log(`  upserted ${preset.key} -> ${row.id}`);
  }

  // 2. Assign products
  let updated = 0;
  for (const row of plan) {
    const presetId = presetIdByKey.get(row.to);
    if (!presetId) {
      console.warn(`  SKIP ${row.slug}: no preset ID for ${row.to}`);
      continue;
    }
    await prisma.product.update({
      where: { id: row.id },
      data: { pricingPresetId: presetId },
    });
    updated++;
  }

  // 3. Summary
  const remaining = await prisma.product.count({
    where: { isActive: true, pricingPreset: { key: { in: ["stickers_default", "business_cards_default"] } } },
  });

  console.log(`\n[all-cat] updated: ${updated}`);
  console.log(`[all-cat] remaining on generic presets: ${remaining}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
