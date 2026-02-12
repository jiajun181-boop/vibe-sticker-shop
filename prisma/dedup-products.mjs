// prisma/dedup-products.mjs
// One-time script to deactivate duplicate product slugs.
// Usage:
//   node prisma/dedup-products.mjs            # Dry run (preview only)
//   node prisma/dedup-products.mjs --apply    # Actually deactivate duplicates

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const dryRun = !process.argv.includes("--apply");

// [oldSlug, canonicalSlug]
const DEDUP_MAP = [
  ["feather-flag", "feather-flags"],
  ["teardrop-flag", "teardrop-flags"],
  ["die-cut-singles", "stickers-single-diecut"],
  ["die-cut-stickers", "stickers-single-diecut"],
  ["sticker-sheets", "stickers-sheet-kisscut"],
  ["kiss-cut-sticker-sheets", "stickers-sheet-kisscut"],
  ["clear-labels", "labels-clear"],
  ["white-bopp-labels", "labels-white-bopp"],
  ["transfer-vinyl-lettering", "vinyl-lettering"],
  ["foam-board", "rigid-foam-board-prints"],
  ["coroplast-yard-signs", "coroplast-signs"],
  ["rp-menus", "mp-menus"],
  ["rp-tickets", "mp-tickets"],
  ["hang-tags", "tags-hang-tags"],
  ["rp-hang-tags", "tags-hang-tags"],
  ["floor-decals", "floor-graphics"],
  ["lf-floor-graphics", "floor-graphics"],
  ["vinyl-banner-13oz", "vinyl-banners"],
  ["mesh-banner", "mesh-banners"],
  ["window-decals", "window-graphics"],
  ["wall-decals", "wall-graphics"],
  ["lawn-signs-h-stake", "yard-sign-h-frame"],
];

async function main() {
  console.log(dryRun ? "=== DRY RUN (add --apply to execute) ===" : "=== APPLYING CHANGES ===");
  console.log();

  let deactivated = 0;
  let skipped = 0;
  let notFound = 0;

  for (const [oldSlug, canonicalSlug] of DEDUP_MAP) {
    const product = await prisma.product.findUnique({ where: { slug: oldSlug } });
    if (!product) {
      console.log(`  SKIP  ${oldSlug} — not found in DB`);
      notFound++;
      continue;
    }
    if (!product.isActive) {
      console.log(`  SKIP  ${oldSlug} — already inactive`);
      skipped++;
      continue;
    }

    // Verify canonical exists
    const canonical = await prisma.product.findUnique({ where: { slug: canonicalSlug } });
    if (!canonical) {
      console.log(`  WARN  ${oldSlug} → ${canonicalSlug} — canonical NOT found, skipping`);
      skipped++;
      continue;
    }

    if (dryRun) {
      console.log(`  WOULD deactivate  ${oldSlug}  (→ ${canonicalSlug}, category: ${product.category})`);
    } else {
      await prisma.product.update({
        where: { slug: oldSlug },
        data: { isActive: false },
      });
      console.log(`  DONE  deactivated  ${oldSlug}  (→ ${canonicalSlug})`);
    }
    deactivated++;
  }

  console.log();
  console.log(`Summary: ${deactivated} deactivated, ${skipped} skipped, ${notFound} not found`);

  const totalActive = await prisma.product.count({ where: { isActive: true } });
  console.log(`Total active products: ${totalActive}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
