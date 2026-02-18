import { PrismaClient } from "@prisma/client";
import { SUB_PRODUCT_CONFIG } from "../lib/subProductConfig.js";

const prisma = new PrismaClient();

// Hardcode the 6 canonical categories with their subGroup slugs
const CATEGORIES_WITH_SUBGROUPS = {
  "marketing-business-print": ["business-cards","flyers","rack-cards","door-hangers","postcards","brochures","booklets","posters","menus","ncr-forms","order-forms","waivers-releases","envelopes","letterhead-stationery","stamps","presentation-folders","certificates","greeting-cards","invitation-cards","loyalty-cards","shelf-displays","table-tents","tickets-coupons","retail-tags","tags","inserts-packaging"],
  "stickers-labels-decals": ["die-cut-stickers","kiss-cut-singles","sticker-pages","sticker-rolls","vinyl-lettering","decals","specialty","fire-emergency","hazard-warning","ppe-equipment","electrical-chemical","asset-equipment-tags","pipe-valve-labels","warehouse-labels","electrical-cable-labels"],
  "signs-rigid-boards": ["yard-lawn-signs","real-estate-signs","a-frames-signs","display-tabletop","event-photo-boards","business-property","by-material"],
  "banners-displays": ["vinyl-banners","mesh-banners","pole-banners","canvas-prints","retractable-stands","x-banner-stands","tabletop-displays","backdrops-popups","flags-hardware","a-frames-signs","lawn-yard-signs","tents-outdoor"],
  "windows-walls-floors": ["static-clings","adhesive-films","one-way-vision","privacy-films","window-lettering","wall-graphics","floor-graphics","window-graphics"],
  "vehicle-graphics-fleet": ["vehicle-wraps","door-panel-graphics","vehicle-decals","magnetic-signs","fleet-packages","dot-mc-numbers","unit-weight-ids","spec-labels","inspection-compliance"],
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
