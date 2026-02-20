/**
 * Diagnose signs-rigid-boards subgroup matching
 * Run: node scripts/diagnose-rigid-subgroups.mjs
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Same subgroup config as in subProductConfig.js
const SUBGROUPS = {
  "yard-lawn-signs": [
    "yard-sign", "yard-sign-h-frame", "yard-signs-coroplast", "yard-sign-panel-only",
    "coroplast-signs", "coroplast-yard-signs", "lawn-signs-h-stake", "double-sided-lawn-signs",
    "directional-arrow-sign", "directional-arrow-signs", "election-campaign-sign",
    "coroplast-sheet-4mm", "coroplast-sheet-6mm", "coroplast-sheet-10mm", "h-stakes", "h-stake-wire",
  ],
  "real-estate-signs": [
    "real-estate-sign", "real-estate-agent-sign", "real-estate-riders",
    "open-house-sign-kit", "real-estate-frame",
  ],
  "a-frames-signs": [
    "a-frame-stand", "a-frame-sign-stand", "a-frame-sandwich-board", "a-frame-insert-prints",
    "a-frame-double-sided", "handheld-sign", "handheld-signs",
  ],
  "event-photo-boards": [
    "selfie-frame-board", "life-size-cutout", "giant-presentation-check", "welcome-sign-board",
    "seating-chart-board", "event-celebration-board", "memorial-tribute-board", "photo-collage-board",
    "event-photo-backdrop", "handheld-prop-board", "face-in-hole-board", "photo-board",
  ],
  "business-property": [
    "business-hours-sign", "construction-site-signs", "safety-signs", "wayfinding-signs",
    "parking-property-signs", "qr-code-signs", "address-house-number-signs", "ada-braille-signs",
  ],
  "display-tabletop": [
    "a-frame-sandwich-board", "a-frame-insert-prints", "handheld-sign", "handheld-signs",
    "rigid-tabletop-signs", "tabletop-signs", "standoff-mounted-signs", "menu-boards",
    "tags-tickets-rigid", "floor-standup-display", "dry-erase-rigid-board", "tri-fold-presentation-board",
  ],
  "by-material": [
    "foam-board", "custom-foam-board", "foam-board-easel", "foam-board-prints",
    "rigid-foam-board-prints", "foamboard-sheet-3-16", "foamboard-sheet-1-2",
    "acrylic-signs", "clear-acrylic-signs", "frosted-acrylic-signs",
    "aluminum-signs", "aluminum-composite", "acm-dibond-signs",
    "pvc-sintra-signs", "pvc-sheet-3mm", "gatorboard-signs",
  ],
};

async function main() {
  // 1. Fetch all products in signs-rigid-boards or rigid-signs
  const products = await prisma.product.findMany({
    where: {
      category: { in: ["signs-rigid-boards", "rigid-signs"] },
      isActive: true,
    },
    select: { id: true, slug: true, name: true, category: true, tags: true, isActive: true },
    orderBy: { slug: "asc" },
  });

  console.log(`\n=== TOTAL ACTIVE PRODUCTS (signs-rigid-boards + rigid-signs): ${products.length} ===\n`);

  // Show category breakdown
  const byCat = {};
  for (const p of products) {
    byCat[p.category] = (byCat[p.category] || 0) + 1;
  }
  console.log("Category breakdown:", byCat);

  const dbSlugs = new Set(products.map((p) => p.slug));
  const allConfigSlugs = new Set();

  // 2. For each subgroup, count matches
  console.log("\n=== SUBGROUP MATCH COUNTS ===\n");
  for (const [sgSlug, expectedSlugs] of Object.entries(SUBGROUPS)) {
    // Check placement tag matching
    const placementTag = `placement:signs-rigid-boards:${sgSlug}`;
    const placementMatches = products.filter(
      (p) => p.tags.includes(placementTag) && expectedSlugs.includes(p.slug)
    );

    // Fallback: just dbSlugs matching
    const fallbackMatches = products.filter((p) => expectedSlugs.includes(p.slug));

    const effectiveMatches = placementMatches.length > 0 ? placementMatches : fallbackMatches;

    console.log(`[${sgSlug}]`);
    console.log(`  placement matches: ${placementMatches.length} (tag: ${placementTag})`);
    console.log(`  fallback (dbSlugs) matches: ${fallbackMatches.length}`);
    console.log(`  effective: ${effectiveMatches.length}`);

    if (fallbackMatches.length > 0) {
      console.log(`  matched slugs: ${fallbackMatches.map(p => p.slug).join(", ")}`);
    }

    // Missing from DB
    const missingSlugs = expectedSlugs.filter((s) => !dbSlugs.has(s));
    if (missingSlugs.length > 0) {
      console.log(`  MISSING from DB (${missingSlugs.length}): ${missingSlugs.join(", ")}`);
    }

    for (const s of expectedSlugs) allConfigSlugs.add(s);
    console.log();
  }

  // 3. Products not in any subgroup
  const orphanProducts = products.filter((p) => !allConfigSlugs.has(p.slug));
  console.log(`=== ORPHAN PRODUCTS (in DB but not in ANY subgroup dbSlugs): ${orphanProducts.length} ===\n`);
  for (const p of orphanProducts) {
    console.log(`  ${p.slug} (category: ${p.category}, name: ${p.name})`);
  }

  // 4. Products with placement tags
  console.log(`\n=== PRODUCTS WITH PLACEMENT TAGS ===\n`);
  const withPlacement = products.filter((p) => p.tags.some((t) => t.startsWith("placement:")));
  if (withPlacement.length === 0) {
    console.log("  NONE — no products have placement tags!");
  } else {
    for (const p of withPlacement) {
      const placementTags = p.tags.filter((t) => t.startsWith("placement:"));
      console.log(`  ${p.slug}: ${placementTags.join(", ")}`);
    }
  }

  // 5. Check for inactive products that might be relevant
  const inactiveProducts = await prisma.product.findMany({
    where: {
      category: { in: ["signs-rigid-boards", "rigid-signs"] },
      isActive: false,
    },
    select: { slug: true, name: true, category: true },
  });
  if (inactiveProducts.length > 0) {
    console.log(`\n=== INACTIVE PRODUCTS (${inactiveProducts.length}) ===\n`);
    for (const p of inactiveProducts) {
      console.log(`  ${p.slug} (${p.category})`);
    }
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
