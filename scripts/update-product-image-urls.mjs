#!/usr/bin/env node
/**
 * Update ProductImage URLs to point to local SVG files.
 * Run: node scripts/update-product-image-urls.mjs
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Updating product image URLs to local SVGs...\n");

  const products = await prisma.product.findMany({
    where: { isActive: true },
    include: { images: true },
    orderBy: { slug: "asc" },
  });

  let updated = 0;
  let created = 0;

  for (const product of products) {
    const newUrl = `/products/${product.slug}.svg`;

    if (product.images.length === 0) {
      await prisma.productImage.create({
        data: {
          productId: product.id,
          url: newUrl,
          alt: product.name,
          sortOrder: 0,
        },
      });
      created++;
      console.log(`  + Created: ${product.slug}`);
    } else {
      const current = product.images[0];
      if (current.url !== newUrl) {
        await prisma.productImage.update({
          where: { id: current.id },
          data: { url: newUrl, alt: product.name },
        });
        updated++;
        console.log(`  ~ Updated: ${product.slug}`);
      }
    }
  }

  console.log(`\nDone! Updated: ${updated}, Created: ${created}`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
