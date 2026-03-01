#!/usr/bin/env node
/**
 * sync-product-images.mjs
 *
 * Migrates ProductImage URLs from local static files (/products/*.png)
 * to UploadThing Asset URLs where available.
 *
 * For products WITHOUT Asset uploads, deletes the ProductImage record
 * so the dynamic SVG fallback kicks in.
 *
 * Usage: node scripts/sync-product-images.mjs [--dry-run]
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const DRY_RUN = process.argv.includes("--dry-run");

async function main() {
  console.log(DRY_RUN ? "=== DRY RUN ===" : "=== LIVE RUN ===");

  // 1. Find all ProductImage records with local /products/ paths
  const localImages = await prisma.productImage.findMany({
    where: { url: { startsWith: "/products/" } },
    include: { product: { select: { id: true, slug: true, name: true } } },
  });

  console.log(`\nFound ${localImages.length} ProductImage records with /products/ URLs\n`);

  let updated = 0;
  let deleted = 0;
  let skipped = 0;
  const noAsset = [];

  for (const img of localImages) {
    const productId = img.productId;
    const slug = img.product?.slug || "unknown";

    // Check if this product has Asset (UploadThing) images
    const assetLink = await prisma.assetLink.findFirst({
      where: {
        entityType: "product",
        entityId: productId,
        asset: { status: "published" },
      },
      include: { asset: true },
      orderBy: { sortOrder: "asc" },
    });

    if (assetLink) {
      const newUrl = assetLink.asset.originalUrl;
      console.log(`  UPDATE  ${slug}: ${img.url} → ${newUrl}`);
      if (!DRY_RUN) {
        await prisma.productImage.update({
          where: { id: img.id },
          data: { url: newUrl },
        });
      }
      updated++;
    } else {
      // No Asset upload — delete the old ProductImage so dynamic fallback kicks in
      console.log(`  DELETE  ${slug}: ${img.url} (no Asset found)`);
      if (!DRY_RUN) {
        await prisma.productImage.delete({ where: { id: img.id } });
      }
      deleted++;
      noAsset.push(slug);
    }
  }

  console.log(`\n--- Summary ---`);
  console.log(`Updated: ${updated} (now point to UploadThing)`);
  console.log(`Deleted: ${deleted} (no Asset upload, will use SVG fallback)`);
  console.log(`Skipped: ${skipped}`);

  if (noAsset.length > 0) {
    console.log(`\nProducts without uploaded images (will show SVG fallback):`);
    for (const slug of noAsset) {
      console.log(`  - ${slug}`);
    }
    console.log(`\nUpload images for these in the admin panel to replace the SVG fallback.`);
  }

  console.log("\nDone!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
