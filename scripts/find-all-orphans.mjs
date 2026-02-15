import { PrismaClient } from "@prisma/client";
import { SUB_PRODUCT_CONFIG } from "../lib/subProductConfig.js";

const prisma = new PrismaClient();

// Hardcode the categories that have subGroups (from catalogConfig DEFAULTS)
const CATEGORIES_WITH_SUBGROUPS = {
  "marketing-prints": ["business-cards","flyers","postcards","brochures-booklets","posters","menus","ncr-forms","order-forms","waivers-releases","envelopes","letterhead-stationery","presentation-folders","greeting-cards"],
  "packaging": ["tags","inserts-packaging"],
  "retail-promo": ["shelf-displays","table-tents","tickets-coupons","retail-tags"],
  "banners-displays": ["vinyl-banners","mesh-banners","pole-banners","canvas-prints"],
  "rigid-signs": ["yard-signs","real-estate-signs","foam-board-signs","a-frame-signs","election-signs","display-signs"],
  "window-glass-films": ["static-clings","adhesive-films","one-way-vision","privacy-films","window-lettering"],
  "display-stands": ["retractable-stands","x-banner-stands","tabletop-displays","backdrops-popups","flags-hardware","a-frames-signs","lawn-yard-signs","tents-outdoor"],
  "large-format-graphics": ["wall-graphics","floor-graphics","window-graphics","vehicle-graphics"],
  "vehicle-branding-advertising": ["vehicle-wraps","door-panel-graphics","vehicle-decals","magnetic-signs","fleet-packages"],
  "fleet-compliance-id": ["dot-mc-numbers","unit-weight-ids","spec-labels","inspection-compliance"],
  "stickers-labels": ["die-cut-stickers","kiss-cut-singles","sticker-pages","sticker-rolls","vinyl-lettering","decals","specialty"],
  "safety-warning-decals": ["reflective-visibility","fire-emergency","hazard-warning","ppe-equipment","electrical-chemical"],
  "facility-asset-labels": ["asset-equipment-tags","pipe-valve-labels","warehouse-labels","electrical-cable-labels"],
};

for (const [cat, sgSlugs] of Object.entries(CATEGORIES_WITH_SUBGROUPS)) {
  const covered = new Set();
  for (const sg of sgSlugs) {
    const cfg = SUB_PRODUCT_CONFIG[sg];
    if (cfg) for (const s of cfg.dbSlugs) covered.add(s);
  }

  const products = await prisma.product.findMany({
    where: { category: cat, isActive: true },
    select: { slug: true, name: true },
    orderBy: { name: "asc" },
  });

  const orphans = products.filter((p) => !covered.has(p.slug));
  if (orphans.length > 0) {
    console.log(`\n=== ${cat} — ${orphans.length} orphan(s) out of ${products.length} ===`);
    orphans.forEach((p) => console.log(`  ${p.slug} — ${p.name}`));
  } else {
    console.log(`${cat}: OK (${products.length} products, 0 orphans)`);
  }
}

console.log("\nDone.");
await prisma.$disconnect();
