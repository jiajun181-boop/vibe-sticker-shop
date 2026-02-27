#!/usr/bin/env node
/**
 * Link existing product PNG files in /public/products/ to ProductImage DB records.
 *
 * For each active product:
 *   1. Check if /public/products/{slug}.png exists
 *   2. If yes → upsert a ProductImage record with url = "/products/{slug}.png"
 *   3. If no → skip (the dynamic SVG API handles the fallback)
 *
 * Run: node scripts/fix-product-image-links.mjs
 */
import { PrismaClient } from "@prisma/client";
import { existsSync } from "fs";
import { resolve } from "path";

const prisma = new PrismaClient();
const PUBLIC_DIR = resolve(process.cwd(), "public");

async function main() {
  console.log("Linking product PNGs to ProductImage records...\n");

  const products = await prisma.product.findMany({
    where: { isActive: true },
    include: { images: { orderBy: { sortOrder: "asc" } } },
    orderBy: { slug: "asc" },
  });

  let linked = 0;
  let updated = 0;
  let skipped = 0;
  let alreadyCorrect = 0;

  for (const product of products) {
    const pngPath = resolve(PUBLIC_DIR, "products", `${product.slug}.png`);
    const pngUrl = `/products/${product.slug}.png`;

    if (!existsSync(pngPath)) {
      skipped++;
      continue;
    }

    // Check if already has correct PNG link
    const existing = product.images[0];
    if (existing?.url === pngUrl) {
      alreadyCorrect++;
      continue;
    }

    if (existing) {
      // Update existing record to point to PNG
      await prisma.productImage.update({
        where: { id: existing.id },
        data: { url: pngUrl, alt: product.name },
      });
      updated++;
      console.log(`  ~ Updated: ${product.slug} (was: ${existing.url})`);
    } else {
      // Create new ProductImage record
      await prisma.productImage.create({
        data: {
          productId: product.id,
          url: pngUrl,
          alt: product.name,
          sortOrder: 0,
        },
      });
      linked++;
      console.log(`  + Created: ${product.slug}`);
    }
  }

  console.log(`\nDone!`);
  console.log(`  Linked (new):    ${linked}`);
  console.log(`  Updated:         ${updated}`);
  console.log(`  Already correct: ${alreadyCorrect}`);
  console.log(`  No PNG found:    ${skipped}`);
  console.log(`  Total products:  ${products.length}`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
