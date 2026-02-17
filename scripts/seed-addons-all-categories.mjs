#!/usr/bin/env node
/**
 * Seed addons into optionsConfig for 3 categories.
 * Merges addons into existing optionsConfig without overwriting sizes/materials/etc.
 *
 * Run:  node scripts/seed-addons-all-categories.mjs          (dry-run)
 *       node scripts/seed-addons-all-categories.mjs --apply  (write to DB)
 */
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
const APPLY = process.argv.includes("--apply");

// ── Addon libraries ─────────────────────────────────────────

const ADDON_GROMMETS = { id: "grommets", name: "Grommets (every 2ft)", price: 0, type: "flat", description: "Metal grommets installed every 2 feet" };
const ADDON_HEMS = { id: "hems", name: "Reinforced Hems", price: 0, type: "flat", description: "Heat-welded reinforced edges" };
const ADDON_H_STAKE = { id: "h-stake", name: "H-Stake Wire Frame", price: 3.50, type: "flat", description: "Wire H-stake for ground mounting" };
const ADDON_EASEL = { id: "easel-back", name: "Easel Back Stand", price: 4.00, type: "flat", description: "Self-standing cardboard easel" };
const ADDON_MOUNTING = { id: "mounting-hardware", name: "Mounting Hardware Kit", price: 8.00, type: "flat", description: "Screws, anchors, and spacers" };
const ADDON_STANDOFFS = { id: "standoffs", name: "Stainless Standoff Mounts", price: 15.00, type: "flat", description: "Set of 4 standoff mounts" };
const ADDON_DOUBLE_SIDED = { id: "double-sided", name: "Double-Sided Print", price: 0.80, type: "per_sqft", description: "Print on both sides" };
const ADDON_ROUNDED_CORNERS = { id: "rounded-corners", name: "Rounded Corners", price: 2.00, type: "flat", description: "Smooth rounded corner finish" };
const ADDON_DRILL_HOLES = { id: "drill-holes", name: "Pre-Drilled Holes", price: 1.50, type: "flat", description: "Mounting holes drilled to spec" };

const ADDON_INSTALL = { id: "installation", name: "Professional Install", price: 5.00, type: "per_sqft", description: "On-site professional installation" };
const ADDON_DESIGN = { id: "design", name: "Design Service", price: 75.00, type: "flat", description: "Custom graphic design" };
const ADDON_DESIGN_WRAP = { id: "design", name: "Wrap Design Service", price: 350.00, type: "flat", description: "Full vehicle wrap design" };
const ADDON_PROOF = { id: "design-proof", name: "Design Proof", price: 25.00, type: "flat", description: "Digital proof before production" };
const ADDON_APP_TAPE = { id: "transfer-tape", name: "Application Tape Included", price: 0, type: "flat", description: "Pre-masked for easy install" };
const ADDON_MIRROR_PAIR = { id: "mirror-pair", name: "Mirror Pair (L+R)", price: 0, type: "flat", description: "Left and right mirrored set" };
const ADDON_CONTOUR = { id: "contour-cut", name: "Contour / Die Cut", price: 2.00, type: "per_sqft", description: "Custom shape cut around artwork" };

const ADDON_LAM_FRONT = { id: "lam-front", name: "Lamination (Front)", price: 0.015, type: "per_unit", description: "Gloss or matte lamination on front" };
const ADDON_LAM_BOTH = { id: "lam-both", name: "Lamination (Both Sides)", price: 0.025, type: "per_unit", description: "Lamination on front and back" };
const ADDON_ROUNDED_CARD = { id: "rounded-corners", name: "Rounded Corners", price: 0.01, type: "per_unit", description: "Smooth rounded corners" };
const ADDON_FOIL_FRONT = { id: "foil-front", name: "Foil Stamping (Front)", price: 0.04, type: "per_unit", description: "Metallic foil accent on front" };
const ADDON_SCORING = { id: "scoring", name: "Scoring / Folding", price: 0.005, type: "per_unit", description: "Machine-scored fold lines" };
const ADDON_HOLE_DRILL = { id: "hole-drill", name: "Hole Drilling", price: 0.005, type: "per_unit", description: "Single hole punch for hanging" };
const ADDON_NUMBERING = { id: "numbering", name: "Sequential Numbering", price: 0.02, type: "per_unit", description: "Consecutive numbers printed" };
const ADDON_PERF = { id: "perforation", name: "Perforation", price: 0.008, type: "per_unit", description: "Tear-off perforation line" };

// ── signs-rigid-boards ──────────────────────────────────────

const SIGNS_ADDONS = {
  // A-frames
  "a-frame-double-sided":    [ADDON_DOUBLE_SIDED],
  "a-frame-insert-prints":   [ADDON_DOUBLE_SIDED],
  "a-frame-sign-stand":      [ADDON_DOUBLE_SIDED],
  "a-frame-stand":           [ADDON_DOUBLE_SIDED],

  // Acrylic
  "acrylic-signs":           [ADDON_STANDOFFS, ADDON_DRILL_HOLES, ADDON_DESIGN],
  "clear-acrylic-signs":     [ADDON_STANDOFFS, ADDON_DRILL_HOLES, ADDON_DESIGN],
  "frosted-acrylic-signs":   [ADDON_STANDOFFS, ADDON_DRILL_HOLES, ADDON_DESIGN],
  "standoff-mounted-signs":  [ADDON_STANDOFFS, ADDON_DESIGN],

  // Aluminum / ACM
  "aluminum-signs":          [ADDON_MOUNTING, ADDON_DRILL_HOLES, ADDON_ROUNDED_CORNERS, ADDON_DESIGN],
  "acm-dibond-signs":        [ADDON_MOUNTING, ADDON_DRILL_HOLES, ADDON_ROUNDED_CORNERS, ADDON_DESIGN],
  "aluminum-composite":      [ADDON_MOUNTING, ADDON_DRILL_HOLES, ADDON_DESIGN],

  // Coroplast / Yard signs
  "coroplast-signs":         [ADDON_H_STAKE, ADDON_GROMMETS, ADDON_DOUBLE_SIDED],
  "coroplast-yard-signs":    [ADDON_H_STAKE, ADDON_GROMMETS, ADDON_DOUBLE_SIDED],
  "yard-sign-h-frame":       [ADDON_DOUBLE_SIDED],
  "yard-sign-panel-only":    [ADDON_H_STAKE, ADDON_GROMMETS, ADDON_DOUBLE_SIDED],
  "yard-signs-coroplast":    [ADDON_H_STAKE, ADDON_GROMMETS, ADDON_DOUBLE_SIDED],
  "double-sided-lawn-signs": [ADDON_H_STAKE, ADDON_GROMMETS],
  "lawn-signs-h-stake":      [ADDON_DOUBLE_SIDED],

  // Foam board
  "foam-board":              [ADDON_EASEL, ADDON_MOUNTING, ADDON_DESIGN],
  "foam-board-easel":        [ADDON_DESIGN],
  "foam-board-prints":       [ADDON_EASEL, ADDON_MOUNTING, ADDON_DESIGN],
  "rigid-foam-board-prints": [ADDON_EASEL, ADDON_MOUNTING, ADDON_DESIGN],
  "backdrop-board":          [ADDON_EASEL, ADDON_DESIGN],

  // General signs
  "construction-site-signs": [ADDON_MOUNTING, ADDON_GROMMETS, ADDON_DRILL_HOLES, ADDON_DESIGN],
  "directional-arrow-signs": [ADDON_MOUNTING, ADDON_DRILL_HOLES, ADDON_DESIGN],
  "parking-property-signs":  [ADDON_MOUNTING, ADDON_DRILL_HOLES, ADDON_DESIGN],
  "safety-signs":            [ADDON_MOUNTING, ADDON_DRILL_HOLES, ADDON_DESIGN],
  "wayfinding-signs":        [ADDON_MOUNTING, ADDON_DRILL_HOLES, ADDON_DESIGN],
  "handheld-signs":          [ADDON_DESIGN],

  // Real estate
  "real-estate-agent-sign":  [ADDON_H_STAKE, ADDON_DOUBLE_SIDED, ADDON_DESIGN],
  "real-estate-frame":       [ADDON_DOUBLE_SIDED],

  // Menu / Tabletop
  "menu-boards":             [ADDON_EASEL, ADDON_ROUNDED_CORNERS, ADDON_DESIGN],
  "rigid-tabletop-signs":    [ADDON_DESIGN],
  "tabletop-signs":          [ADDON_DESIGN],

  // PVC / Gator
  "pvc-sintra-signs":        [ADDON_MOUNTING, ADDON_DRILL_HOLES, ADDON_ROUNDED_CORNERS, ADDON_DESIGN],
  "gatorboard-signs":        [ADDON_MOUNTING, ADDON_EASEL, ADDON_DESIGN],

  // Hardware (no addons)
  "h-stake-wire":            [],
  "h-stakes":                [],
};

// ── vehicle-graphics-fleet ──────────────────────────────────

const VEHICLE_ADDONS = {
  // Full wraps
  "full-vehicle-wrap-design-print":   [ADDON_DESIGN_WRAP, ADDON_PROOF, ADDON_INSTALL],
  "vehicle-roof-wrap":                [ADDON_PROOF, ADDON_INSTALL],
  "trailer-full-wrap":                [ADDON_DESIGN_WRAP, ADDON_PROOF, ADDON_INSTALL],
  "vehicle-wrap-print-only-quote":    [ADDON_PROOF],
  "fleet-graphic-package":            [ADDON_DESIGN_WRAP, ADDON_PROOF, ADDON_INSTALL],
  "partial-wrap-spot-graphics":       [ADDON_PROOF, ADDON_INSTALL, ADDON_CONTOUR],
  "car-graphics":                     [ADDON_DESIGN_WRAP, ADDON_PROOF, ADDON_INSTALL],
  "trailer-box-truck-large-graphics": [ADDON_PROOF, ADDON_INSTALL, ADDON_CONTOUR],

  // Door / panel decals
  "custom-truck-door-lettering-kit":      [ADDON_APP_TAPE, ADDON_PROOF, ADDON_MIRROR_PAIR],
  "printed-truck-door-decals-full-color": [ADDON_APP_TAPE, ADDON_PROOF, ADDON_MIRROR_PAIR, ADDON_CONTOUR],
  "truck-side-panel-printed-decal":       [ADDON_APP_TAPE, ADDON_PROOF, ADDON_CONTOUR],
  "tailgate-rear-door-printed-decal":     [ADDON_APP_TAPE, ADDON_PROOF, ADDON_CONTOUR],

  // Vehicle decals
  "car-hood-decal":                     [ADDON_APP_TAPE, ADDON_PROOF, ADDON_CONTOUR],
  "custom-cut-vinyl-lettering-any-text":[ADDON_APP_TAPE, ADDON_PROOF],
  "custom-printed-vehicle-logo-decals": [ADDON_APP_TAPE, ADDON_PROOF, ADDON_CONTOUR],
  "long-term-outdoor-vehicle-decals":   [ADDON_APP_TAPE, ADDON_PROOF, ADDON_CONTOUR],
  "removable-promo-vehicle-decals":     [ADDON_APP_TAPE, ADDON_PROOF, ADDON_CONTOUR],
  "social-qr-vehicle-decals":          [ADDON_APP_TAPE, ADDON_PROOF],
  "stay-back-warning-decals":          [ADDON_APP_TAPE],
  "boat-lettering-registration":       [ADDON_APP_TAPE, ADDON_PROOF],
  "bumper-sticker-custom":             [ADDON_APP_TAPE, ADDON_PROOF, ADDON_CONTOUR],

  // Reflective / Safety
  "high-visibility-rear-chevron-kit":  [ADDON_PROOF],
  "reflective-conspicuity-tape-kit":   [],
  "reflective-safety-stripes-kit":     [ADDON_PROOF],

  // Magnetic
  "magnetic-car-signs":        [ADDON_ROUNDED_CORNERS, ADDON_PROOF, ADDON_DESIGN],
  "magnetic-rooftop-sign":     [ADDON_PROOF, ADDON_DESIGN],
  "magnetic-truck-door-signs": [ADDON_ROUNDED_CORNERS, ADDON_PROOF, ADDON_DESIGN, ADDON_MIRROR_PAIR],
  "car-door-magnets-pair":     [ADDON_ROUNDED_CORNERS, ADDON_PROOF, ADDON_DESIGN],

  // Compliance (minimal addons)
  "cvor-number-decals":                       [ADDON_APP_TAPE],
  "mc-number-decals":                         [ADDON_APP_TAPE],
  "nsc-number-decals":                        [ADDON_APP_TAPE],
  "usdot-number-decals":                      [ADDON_APP_TAPE],
  "tssa-truck-number-lettering-cut-vinyl":    [ADDON_APP_TAPE],
  "dangerous-goods-placards":                 [],
  "gvw-tare-weight-lettering":               [ADDON_APP_TAPE],
  "truck-door-compliance-kit":               [ADDON_APP_TAPE, ADDON_MIRROR_PAIR],

  // Fleet labels
  "fleet-unit-number-stickers":              [ADDON_APP_TAPE],
  "equipment-id-decals-cut-vinyl":           [ADDON_APP_TAPE],
  "trailer-id-number-decals":               [ADDON_APP_TAPE],
  "fuel-type-labels-diesel-gas":             [],
  "tire-pressure-load-labels":               [],
  "vehicle-inspection-maintenance-stickers": [],

  // Office / supplies (no addons)
  "fleet-vehicle-inspection-book":  [],
  "hours-of-service-log-holder":    [],
  "ifta-cab-card-holder":           [],
  "magnets-flexible":               [ADDON_ROUNDED_CORNERS],
};

// ── marketing-business-print ────────────────────────────────

const MARKETING_ADDONS = {
  // mp- packages
  "mp-brochures":            [ADDON_LAM_FRONT, ADDON_LAM_BOTH, ADDON_SCORING],
  "mp-certificates":         [ADDON_FOIL_FRONT, ADDON_ROUNDED_CARD],
  "mp-coupons":              [ADDON_ROUNDED_CARD, ADDON_PERF, ADDON_NUMBERING],
  "mp-door-hangers":         [ADDON_LAM_FRONT, ADDON_ROUNDED_CARD],
  "mp-letterhead":           [],
  "mp-menus":                [ADDON_LAM_FRONT, ADDON_LAM_BOTH, ADDON_SCORING],
  "mp-notepads":             [ADDON_NUMBERING],
  "mp-postcards":            [ADDON_LAM_FRONT, ADDON_LAM_BOTH, ADDON_ROUNDED_CARD],
  "mp-presentation-folders": [ADDON_LAM_FRONT, ADDON_FOIL_FRONT],
  "mp-tickets":              [ADDON_PERF, ADDON_NUMBERING],

  // Stamps (no addons)
  "stamps-s827": [],
  "stamps-s510": [],
  "stamps-s520": [],
  "stamps-s542": [],
  "stamps-r512": [],
  "stamps-r524": [],
  "stamps-r532": [],
  "stamps-r552": [],

  // Cardstock / table mat
  "cardstock-prints": [ADDON_LAM_FRONT, ADDON_LAM_BOTH, ADDON_ROUNDED_CARD],
  "table-mat":        [ADDON_LAM_FRONT, ADDON_LAM_BOTH],
};

// ── Merge all ───────────────────────────────────────────────

const ALL_ADDONS = {
  ...SIGNS_ADDONS,
  ...VEHICLE_ADDONS,
  ...MARKETING_ADDONS,
};

// ── Main ────────────────────────────────────────────────────

async function main() {
  const slugs = Object.keys(ALL_ADDONS);
  const products = await prisma.product.findMany({
    where: { slug: { in: slugs }, isActive: true },
    select: { id: true, slug: true, name: true, optionsConfig: true },
  });

  const bySlug = Object.fromEntries(products.map((p) => [p.slug, p]));
  let updated = 0;
  let skipped = 0;
  let noAddons = 0;

  for (const [slug, addonList] of Object.entries(ALL_ADDONS)) {
    const product = bySlug[slug];
    if (!product) {
      console.log(`  SKIP  ${slug} -- not found`);
      skipped++;
      continue;
    }

    if (!addonList || addonList.length === 0) {
      noAddons++;
      continue;
    }

    const existing = product.optionsConfig && typeof product.optionsConfig === "object" ? product.optionsConfig : {};

    // Skip if addons already exist
    if (Array.isArray(existing.addons) && existing.addons.length > 0) {
      console.log(`  KEEP  ${slug.padEnd(50)} already has ${existing.addons.length} addons`);
      continue;
    }

    const merged = { ...existing, addons: addonList };
    const label = APPLY ? "WRITE" : "DRY  ";
    const names = addonList.map((a) => a.id).join(", ");
    console.log(`  ${label} ${slug.padEnd(50)} +${addonList.length} addons: ${names}`);

    if (APPLY) {
      await prisma.product.update({
        where: { id: product.id },
        data: { optionsConfig: merged },
      });
      updated++;
    }
  }

  console.log(`\n${APPLY ? "Applied" : "Dry run"}: ${updated} updated, ${skipped} not found, ${noAddons} have no addons configured.`);
  if (!APPLY) console.log("Run with --apply to write to database.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
