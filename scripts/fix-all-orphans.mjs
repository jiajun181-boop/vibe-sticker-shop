/**
 * Fix all orphan products across all categories:
 * 1. Move products to their correct category
 * 2. After this, update subProductConfig dbSlugs in code
 */
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const MOVES = [
  // packaging
  { slug: "packing-slips", to: "packaging" }, // → inserts-packaging

  // banners-displays orphans → move to display-stands
  { slug: "feather-flag", to: "display-stands" },
  { slug: "feather-flags", to: "display-stands" },
  { slug: "teardrop-flag", to: "display-stands" },
  { slug: "teardrop-flags", to: "display-stands" },
  { slug: "media-wall-pop-up", to: "display-stands" },
  { slug: "pillowcase-display-frame", to: "display-stands" },
  { slug: "pull-up-banner", to: "display-stands" },
  { slug: "roll-up-banners", to: "display-stands" },
  { slug: "step-repeat-backdrops", to: "display-stands" },
  { slug: "table-cloth", to: "display-stands" },
  { slug: "telescopic-backdrop", to: "display-stands" },
  { slug: "x-banner-frame-print", to: "display-stands" },
  { slug: "x-banner-prints", to: "display-stands" },

  // rigid-signs orphans → move misplaced ones
  { slug: "vinyl-banner-13oz", to: "banners-displays" },
  { slug: "mesh-banner", to: "banners-displays" },
  { slug: "calendars-wall-desk", to: "marketing-prints" },
  { slug: "magnetic-car-signs", to: "vehicle-branding-advertising" },

  // vehicle-branding-advertising orphans → move to fleet-compliance-id
  { slug: "asset-tags-qr-barcode", to: "facility-asset-labels" },
  { slug: "cvor-number-decals", to: "fleet-compliance-id" },
  { slug: "equipment-id-decals-cut-vinyl", to: "fleet-compliance-id" },
  { slug: "fleet-unit-number-stickers", to: "fleet-compliance-id" },
  { slug: "fuel-type-labels-diesel-gas", to: "fleet-compliance-id" },
  { slug: "gvw-tare-weight-lettering", to: "fleet-compliance-id" },
  { slug: "tssa-truck-number-lettering-cut-vinyl", to: "fleet-compliance-id" },
  { slug: "tire-pressure-load-labels", to: "fleet-compliance-id" },
  { slug: "usdot-number-decals", to: "fleet-compliance-id" },
  { slug: "vehicle-inspection-maintenance-stickers", to: "fleet-compliance-id" },

  // facility-asset-labels orphans → move to safety-warning-decals
  { slug: "emergency-exit-egress-signs-set", to: "safety-warning-decals" },
  { slug: "fire-extinguisher-location-stickers", to: "safety-warning-decals" },
  { slug: "first-aid-location-stickers", to: "safety-warning-decals" },
  { slug: "ppe-hard-hat-stickers", to: "safety-warning-decals" },
  { slug: "hazard-ghs-labels", to: "safety-warning-decals" },
  { slug: "no-smoking-decals-set", to: "safety-warning-decals" },
  { slug: "parking-lot-stencils", to: "safety-warning-decals" },
  { slug: "high-visibility-rear-chevron-kit", to: "safety-warning-decals" },
  { slug: "reflective-conspicuity-tape-kit", to: "safety-warning-decals" },
  { slug: "reflective-safety-stripes-kit", to: "safety-warning-decals" },
  { slug: "safety-notice-decal-pack", to: "safety-warning-decals" },
  { slug: "stay-back-warning-decals", to: "safety-warning-decals" },
];

let moved = 0;
for (const { slug, to } of MOVES) {
  const result = await prisma.product.updateMany({
    where: { slug },
    data: { category: to },
  });
  if (result.count > 0) {
    console.log(`  ${slug} → ${to}`);
    moved += result.count;
  } else {
    console.log(`  ${slug} → ${to} (not found)`);
  }
}

console.log(`\nMoved ${moved} products.`);
await prisma.$disconnect();
