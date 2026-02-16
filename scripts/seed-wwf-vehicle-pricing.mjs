#!/usr/bin/env node
/**
 * Seed pricing presets + text-editor config for:
 *  - windows-walls-floors  (window films, wall/floor graphics, lettering)
 *  - vehicle-graphics-fleet (wraps, decals, compliance, lettering)
 *
 * Run:  node scripts/seed-wwf-vehicle-pricing.mjs
 * Safe to re-run — uses upsert on key, force-overwrites preset assignments.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ─── Pricing Presets ─────────────────────────────────────

const PRESETS = [
  // ── Window Films (static cling, adhesive, one-way, privacy) ──
  {
    key: "window_films_default",
    name: "Window Films — Default",
    model: "AREA_TIERED",
    config: {
      tiers: [
        { upToSqft: 4,    rate: 18.00 },
        { upToSqft: 12,   rate: 14.00 },
        { upToSqft: 32,   rate: 11.00 },
        { upToSqft: 80,   rate: 9.00  },
        { upToSqft: 9999, rate: 7.50  },
      ],
      materials: [
        { id: "clear",           name: "Clear Static Cling",       multiplier: 1.0  },
        { id: "frosted",         name: "Frosted Film",             multiplier: 1.15 },
        { id: "perforated",      name: "Perforated (One-Way)",     multiplier: 1.25 },
        { id: "holographic",     name: "Holographic / Iridescent", multiplier: 1.6  },
        { id: "white-on-clear",  name: "White Ink on Clear",       multiplier: 1.3  },
      ],
      finishings: [
        { id: "contour-cut",  name: "Contour Cut",   type: "per_sqft", price: 2.00 },
        { id: "laminate",     name: "Overlaminate",   type: "per_sqft", price: 1.50 },
        { id: "hem-grommets", name: "Hem & Grommets", type: "flat",     price: 15.00 },
      ],
      addons: [
        { id: "design-proof", name: "Design Proof",        price: 25.00, type: "flat" },
        { id: "installation", name: "Professional Install", price: 5.00,  type: "per_sqft" },
      ],
      fileFee: 5.0,
      minimumPrice: 35.0,
    },
  },

  // ── Wall & Floor Graphics ──
  {
    key: "wall_floor_graphics_default",
    name: "Wall & Floor Graphics — Default",
    model: "AREA_TIERED",
    config: {
      tiers: [
        { upToSqft: 4,    rate: 20.00 },
        { upToSqft: 12,   rate: 16.00 },
        { upToSqft: 32,   rate: 13.00 },
        { upToSqft: 80,   rate: 10.50 },
        { upToSqft: 200,  rate: 8.50  },
        { upToSqft: 9999, rate: 7.00  },
      ],
      materials: [
        { id: "wall-vinyl",      name: "Wall Vinyl (Removable)",        multiplier: 1.0  },
        { id: "wall-fabric",     name: "Wall Fabric",                   multiplier: 1.35 },
        { id: "floor-vinyl",     name: "Floor Vinyl (Anti-Slip)",       multiplier: 1.2  },
        { id: "floor-laminated", name: "Floor Laminated (Heavy Duty)",  multiplier: 1.5  },
      ],
      finishings: [
        { id: "anti-slip-lam", name: "Anti-Slip Lamination", type: "per_sqft", price: 3.00 },
        { id: "contour-cut",   name: "Contour / Die Cut",    type: "per_sqft", price: 2.50 },
        { id: "matte-lam",     name: "Matte Lamination",     type: "per_sqft", price: 1.50 },
      ],
      addons: [
        { id: "design-proof", name: "Design Proof",        price: 25.00, type: "flat" },
        { id: "installation", name: "Professional Install", price: 6.00,  type: "per_sqft" },
      ],
      fileFee: 5.0,
      minimumPrice: 40.0,
    },
  },

  // ── Window / Vehicle Lettering (cut vinyl — text editor enabled) ──
  {
    key: "window_lettering_default",
    name: "Window / Cut Vinyl Lettering — Default",
    model: "AREA_TIERED",
    config: {
      tiers: [
        { upToSqft: 2,    rate: 25.00 },
        { upToSqft: 6,    rate: 20.00 },
        { upToSqft: 16,   rate: 16.00 },
        { upToSqft: 9999, rate: 12.00 },
      ],
      materials: [
        { id: "standard-vinyl",  name: "Standard Vinyl",  multiplier: 1.0 },
        { id: "metallic-gold",   name: "Metallic Gold",   multiplier: 1.4 },
        { id: "metallic-silver", name: "Metallic Silver",  multiplier: 1.4 },
        { id: "reflective",      name: "Reflective",      multiplier: 1.6 },
      ],
      finishings: [],
      addons: [
        { id: "transfer-tape", name: "Application Tape Included", price: 0,     type: "flat" },
        { id: "design-proof",  name: "Design Proof",              price: 25.00, type: "flat" },
      ],
      fileFee: 5.0,
      minimumPrice: 30.0,
    },
  },

  // ── Vehicle Wraps & Large Vehicle Graphics ──
  {
    key: "vehicle_wraps_default",
    name: "Vehicle Wraps & Graphics — Default",
    model: "AREA_TIERED",
    config: {
      tiers: [
        { upToSqft: 10,   rate: 22.00 },
        { upToSqft: 30,   rate: 18.00 },
        { upToSqft: 80,   rate: 14.00 },
        { upToSqft: 200,  rate: 11.00 },
        { upToSqft: 9999, rate: 9.00  },
      ],
      materials: [
        { id: "cast-vinyl",       name: "Cast Vinyl (3M / Avery)", multiplier: 1.0  },
        { id: "calendered-vinyl", name: "Calendered Vinyl",        multiplier: 0.75 },
        { id: "reflective",       name: "Reflective Vinyl",        multiplier: 1.5  },
        { id: "chrome-metallic",  name: "Chrome / Metallic",       multiplier: 1.8  },
      ],
      finishings: [
        { id: "matte-lam",   name: "Matte Overlaminate", type: "per_sqft", price: 1.50 },
        { id: "gloss-lam",   name: "Gloss Overlaminate", type: "per_sqft", price: 1.50 },
        { id: "contour-cut",  name: "Contour Cut",       type: "per_sqft", price: 2.00 },
      ],
      addons: [
        { id: "design",       name: "Wrap Design Service",  price: 350.00, type: "flat" },
        { id: "design-proof", name: "Print Proof",          price: 25.00,  type: "flat" },
        { id: "installation", name: "Professional Install", price: 8.00,   type: "per_sqft" },
      ],
      fileFee: 10.0,
      minimumPrice: 80.0,
    },
  },

  // ── Vehicle Decals & Door Graphics (smaller pieces) ──
  {
    key: "vehicle_decals_default",
    name: "Vehicle Decals & Door Graphics — Default",
    model: "AREA_TIERED",
    config: {
      tiers: [
        { upToSqft: 2,    rate: 28.00 },
        { upToSqft: 6,    rate: 22.00 },
        { upToSqft: 16,   rate: 17.00 },
        { upToSqft: 40,   rate: 13.00 },
        { upToSqft: 9999, rate: 10.00 },
      ],
      materials: [
        { id: "outdoor-vinyl", name: "Outdoor Vinyl",   multiplier: 1.0 },
        { id: "removable",     name: "Removable Vinyl", multiplier: 1.1 },
        { id: "reflective",    name: "Reflective",      multiplier: 1.5 },
        { id: "magnetic",      name: "Magnetic Sheet",  multiplier: 1.6 },
      ],
      finishings: [
        { id: "matte-lam",   name: "Matte Lamination",  type: "per_sqft", price: 1.50 },
        { id: "contour-cut",  name: "Contour / Die Cut", type: "per_sqft", price: 2.50 },
      ],
      addons: [
        { id: "design-proof", name: "Design Proof",      price: 25.00, type: "flat" },
        { id: "pairs",        name: "Mirror Pair (L+R)", price: 0,     type: "flat" },
      ],
      fileFee: 5.0,
      minimumPrice: 35.0,
    },
  },

  // ── Fleet Compliance (DOT/MC numbers, spec labels, inspection) ──
  {
    key: "fleet_compliance_default",
    name: "Fleet Compliance & ID — Default",
    model: "QTY_TIERED",
    config: {
      tiers: [
        { minQty: 1,  unitPrice: 18.00 },
        { minQty: 2,  unitPrice: 15.00 },
        { minQty: 5,  unitPrice: 12.00 },
        { minQty: 10, unitPrice: 10.00 },
        { minQty: 25, unitPrice: 8.00  },
        { minQty: 50, unitPrice: 6.50  },
      ],
      materials: [
        { id: "cut-vinyl",  name: "Cut Vinyl",     multiplier: 1.0 },
        { id: "reflective", name: "Reflective",    multiplier: 1.5 },
        { id: "printed",    name: "Printed Decal", multiplier: 1.2 },
      ],
      fileFee: 0,
      minimumPrice: 15.0,
    },
  },
];

// ─── Slug → Preset key  (force-overwrite) ────────────────

const SLUG_TO_PRESET = {};

// Windows, Walls & Floors
const WINDOW_FILM_SLUGS = [
  "clear-static-cling", "frosted-static-cling",
  "frosted-matte-window-film", "holographic-iridescent-film",
  "color-white-on-clear-vinyl", "color-white-color-clear-vinyl",
  "window-graphics-perforated", "one-way-vision-graphics",
  "perforated-window-film", "vehicle-window-tint-graphic",
  "frosted-privacy-window-film", "frosted-privacy-film",
  "window-graphics", "full-window-graphics", "window-perforated",
  "window-frosted",
];
const WINDOW_LETTERING_SLUGS = [
  "window-cut-vinyl-lettering", "window-lettering-business",
  "window-lettering-cut-vinyl", "storefront-hours-door-decal-cut-vinyl",
];
const WALL_FLOOR_SLUGS = [
  "wall-mural-graphic", "wall-murals", "wall-graphics", "wall-decals",
  "floor-graphics", "lf-floor-graphics", "warehouse-floor-graphics",
  "warehouse-floor-safety-graphics", "floor-arrows", "floor-number-markers",
  "floor-decals", "floor-direction-arrows-set", "floor-logo-graphic",
  "floor-number-markers-set",
];

// Vehicle Graphics & Fleet
const VEHICLE_WRAP_SLUGS = [
  "full-vehicle-wrap-design-print", "vehicle-wrap-print-only-quote",
  "partial-wrap-spot-graphics", "vehicle-roof-wrap",
  "trailer-full-wrap", "trailer-box-truck-large-graphics",
  "car-graphics",
];
const VEHICLE_DECAL_SLUGS = [
  "custom-truck-door-lettering-kit", "printed-truck-door-decals-full-color",
  "truck-side-panel-printed-decal", "car-hood-decal",
  "tailgate-rear-door-printed-decal",
  "custom-printed-vehicle-logo-decals", "custom-cut-vinyl-lettering-any-text",
  "removable-promo-vehicle-decals", "long-term-outdoor-vehicle-decals",
  "social-qr-vehicle-decals", "bumper-sticker-custom", "boat-lettering-registration",
  "magnetic-truck-door-signs", "magnetic-car-signs",
  "car-door-magnets-pair", "magnetic-rooftop-sign",
  "fleet-graphic-package", "high-visibility-rear-chevron-kit",
  "reflective-conspicuity-tape-kit", "reflective-safety-stripes-kit",
  "stay-back-warning-decals",
];
const FLEET_COMPLIANCE_SLUGS = [
  "usdot-number-decals", "mc-number-decals",
  "tssa-truck-number-lettering-cut-vinyl", "cvor-number-decals",
  "nsc-number-decals", "trailer-id-number-decals",
  "fleet-unit-number-stickers", "gvw-tare-weight-lettering",
  "equipment-id-decals-cut-vinyl",
  "fuel-type-labels-diesel-gas", "tire-pressure-load-labels",
  "dangerous-goods-placards",
  "vehicle-inspection-maintenance-stickers", "truck-door-compliance-kit",
  "fleet-vehicle-inspection-book", "ifta-cab-card-holder",
  "hours-of-service-log-holder",
];

for (const s of WINDOW_FILM_SLUGS)      SLUG_TO_PRESET[s] = "window_films_default";
for (const s of WINDOW_LETTERING_SLUGS)  SLUG_TO_PRESET[s] = "window_lettering_default";
for (const s of WALL_FLOOR_SLUGS)       SLUG_TO_PRESET[s] = "wall_floor_graphics_default";
for (const s of VEHICLE_WRAP_SLUGS)     SLUG_TO_PRESET[s] = "vehicle_wraps_default";
for (const s of VEHICLE_DECAL_SLUGS)    SLUG_TO_PRESET[s] = "vehicle_decals_default";
for (const s of FLEET_COMPLIANCE_SLUGS)  SLUG_TO_PRESET[s] = "fleet_compliance_default";

// ─── pricingUnit overrides (switch to per_sqft for area products) ────

const AREA_SLUGS = new Set([
  ...WINDOW_FILM_SLUGS,
  ...WINDOW_LETTERING_SLUGS,
  ...WALL_FLOOR_SLUGS,
  ...VEHICLE_WRAP_SLUGS,
  ...VEHICLE_DECAL_SLUGS,
]);

// ─── Lettering / Customize products → text editor config ─────

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

const LETTERING_SLUGS = new Set([
  // window lettering
  "window-cut-vinyl-lettering",
  "window-lettering-business",
  "window-lettering-cut-vinyl",
  "storefront-hours-door-decal-cut-vinyl",
  // vehicle lettering
  "custom-cut-vinyl-lettering-any-text",
  "custom-truck-door-lettering-kit",
  "boat-lettering-registration",
  // fleet compliance text
  "usdot-number-decals",
  "mc-number-decals",
  "tssa-truck-number-lettering-cut-vinyl",
  "cvor-number-decals",
  "nsc-number-decals",
  "trailer-id-number-decals",
  "fleet-unit-number-stickers",
  "gvw-tare-weight-lettering",
]);

const CATEGORY_FALLBACK = {
  "windows-walls-floors": "window_films_default",
  "vehicle-graphics-fleet": "vehicle_decals_default",
};

// ─── Main ────────────────────────────────────────────────

async function main() {
  console.log("── Seeding pricing presets for WWF & Vehicle ──\n");

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

  // 2. Force-assign presets by slug + fix pricingUnit + add editor config
  let assigned = 0;
  let unitFixed = 0;
  let editorAdded = 0;
  let notFound = 0;

  for (const [slug, presetKey] of Object.entries(SLUG_TO_PRESET)) {
    const presetId = presetMap[presetKey];
    if (!presetId) continue;

    const product = await prisma.product.findUnique({ where: { slug } });
    if (!product) {
      notFound++;
      continue;
    }

    const updates = { pricingPresetId: presetId };

    // Fix pricingUnit to per_sqft for area-based products
    if (AREA_SLUGS.has(slug) && product.pricingUnit !== "per_sqft") {
      updates.pricingUnit = "per_sqft";
      unitFixed++;
    }

    // Add text editor config for lettering products
    if (LETTERING_SLUGS.has(slug)) {
      const existing = product.optionsConfig && typeof product.optionsConfig === "object"
        ? product.optionsConfig
        : {};
      if (!existing.editor) {
        updates.optionsConfig = { ...existing, editor: LETTERING_EDITOR };
        editorAdded++;
      }
    }

    await prisma.product.update({ where: { slug }, data: updates });
    console.log(`  ${slug} → ${presetKey}${updates.pricingUnit ? " [unit→per_sqft]" : ""}${updates.optionsConfig ? " [+editor]" : ""}`);
    assigned++;
  }

  // 3. Category fallback
  for (const [category, presetKey] of Object.entries(CATEGORY_FALLBACK)) {
    const presetId = presetMap[presetKey];
    if (!presetId) continue;

    // Find unmatched products (not in SLUG_TO_PRESET) with wrong preset
    const unmapped = await prisma.product.findMany({
      where: {
        category,
        slug: { notIn: Object.keys(SLUG_TO_PRESET) },
      },
      select: { slug: true, pricingPresetId: true },
    });

    for (const p of unmapped) {
      if (p.pricingPresetId === presetId) continue;
      await prisma.product.update({
        where: { slug: p.slug },
        data: { pricingPresetId: presetId },
      });
      console.log(`  ${p.slug} → ${presetKey} (fallback)`);
      assigned++;
    }
  }

  console.log(`\n── Summary ──`);
  console.log(`  Presets created/updated: ${PRESETS.length}`);
  console.log(`  Products assigned: ${assigned}`);
  console.log(`  pricingUnit fixed to per_sqft: ${unitFixed}`);
  console.log(`  Text editor added: ${editorAdded}`);
  console.log(`  Slugs not in DB: ${notFound}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
