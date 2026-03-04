/**
 * sync-assets-to-productimage.mjs
 *
 * Two tasks:
 * 1. Link identifiable orphan assets to products
 * 2. Sync all Asset links → ProductImage records (so frontend can display them)
 *
 * Usage:
 *   node scripts/sync-assets-to-productimage.mjs          # dry-run
 *   node scripts/sync-assets-to-productimage.mjs --apply   # actually apply
 */

import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const APPLY = process.argv.includes("--apply");

// ── Task 1: Match orphan assets to products by filename ──
const ORPHAN_MATCHES = [
  { namePattern: "D41_i12187_0", slug: "door-hangers-standard" },
  { namePattern: "ClothLoose2", slug: "table-cloth" },
  { namePattern: "CLothLoose3", slug: "table-cloth" },
  { namePattern: "FittedCloth", slug: "table-cloth" },
  { namePattern: "Sandwich_", slug: "a-frame-sign-stand" },
  { namePattern: "IMG_1433", slug: "yard-sign" },
  { namePattern: "A3_画板", slug: "deluxe-tabletop-retractable-a3" },
];

async function linkOrphans() {
  console.log("\n── Task 1: Link identifiable orphan assets ──\n");

  const orphans = await prisma.asset.findMany({
    where: { links: { none: {} } },
    select: { id: true, originalName: true, altText: true },
  });

  let linked = 0;
  for (const match of ORPHAN_MATCHES) {
    const asset = orphans.find((a) => a.originalName.includes(match.namePattern));
    if (!asset) {
      console.log(`  ⚠️  No orphan asset matching "${match.namePattern}" found`);
      continue;
    }

    const product = await prisma.product.findFirst({
      where: { slug: match.slug, isActive: true },
      select: { id: true, name: true, slug: true },
    });

    if (!product) {
      console.log(`  ⚠️  No product with slug "${match.slug}" found`);
      continue;
    }

    // Check if already linked
    const existing = await prisma.assetLink.findFirst({
      where: { assetId: asset.id, entityType: "product", entityId: product.id },
    });

    if (existing) {
      console.log(`  ✓  Already linked: ${asset.originalName} → ${product.name}`);
      continue;
    }

    console.log(`  🔗 ${asset.originalName} → ${product.name} (${product.slug})`);
    if (APPLY) {
      await prisma.assetLink.create({
        data: {
          assetId: asset.id,
          entityType: "product",
          entityId: product.id,
          purpose: "gallery",
          sortOrder: 10, // after existing images
        },
      });
    }
    linked++;
  }

  console.log(`\n  ${APPLY ? "Linked" : "Would link"}: ${linked} assets`);
}

// ── Task 2: Sync Asset links → ProductImage records ──
async function syncToProductImage() {
  console.log("\n── Task 2: Sync Asset → ProductImage ──\n");

  // Get all product asset links with their asset URLs
  const assetLinks = await prisma.assetLink.findMany({
    where: { entityType: "product" },
    select: {
      entityId: true,
      sortOrder: true,
      altOverride: true,
      asset: { select: { originalUrl: true, altText: true } },
    },
    orderBy: [{ entityId: "asc" }, { sortOrder: "asc" }],
  });

  // Group by product
  const byProduct = {};
  for (const link of assetLinks) {
    if (!byProduct[link.entityId]) byProduct[link.entityId] = [];
    byProduct[link.entityId].push(link);
  }

  // Get existing ProductImage URLs to avoid duplicates
  const existingImages = await prisma.productImage.findMany({
    select: { productId: true, url: true },
  });
  const existingSet = new Set(existingImages.map((i) => `${i.productId}::${i.url}`));

  // Get product names for logging
  const productIds = Object.keys(byProduct);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, name: true, slug: true },
  });
  const productMap = Object.fromEntries(products.map((p) => [p.id, p]));

  let created = 0;
  let skipped = 0;
  const toCreate = [];

  for (const [productId, links] of Object.entries(byProduct)) {
    const product = productMap[productId];
    if (!product) continue;

    for (let i = 0; i < links.length; i++) {
      const link = links[i];
      const url = link.asset.originalUrl;
      if (!url) continue;

      const key = `${productId}::${url}`;
      if (existingSet.has(key)) {
        skipped++;
        continue;
      }

      const alt = link.altOverride || link.asset.altText || product.name;

      toCreate.push({
        productId,
        url,
        alt,
        sortOrder: i,
      });

      console.log(`  📸 ${product.name} ← ${url.slice(0, 60)}...`);
      existingSet.add(key); // prevent duplicates within same run
      created++;
    }
  }

  if (APPLY && toCreate.length > 0) {
    // Batch create in chunks of 50
    for (let i = 0; i < toCreate.length; i += 50) {
      const batch = toCreate.slice(i, i + 50);
      await prisma.productImage.createMany({ data: batch });
      console.log(`  ✅ Created batch: ${batch.length} ProductImage records`);
    }
  }

  console.log(`\n  ${APPLY ? "Created" : "Would create"}: ${created} ProductImage records`);
  console.log(`  Skipped (already exist): ${skipped}`);
}

async function main() {
  console.log(APPLY ? "🚀 APPLY mode — changes will be written" : "👀 DRY-RUN mode — no changes");

  await linkOrphans();
  await syncToProductImage();

  if (!APPLY) {
    console.log("\n⚠️  Dry-run complete. Run with --apply to make changes:");
    console.log("   node scripts/sync-assets-to-productimage.mjs --apply\n");
  } else {
    console.log("\n✅ All done!\n");
  }

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("Fatal:", err);
  prisma.$disconnect();
  process.exit(1);
});
