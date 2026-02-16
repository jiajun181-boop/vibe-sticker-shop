#!/usr/bin/env node
/**
 * Final fixes:
 *  1. Signs: fix 8 more pricingUnit to per_sqft
 *  2. Signs: pole-banner-hardware-kit pricingUnit fix
 *  3. Content: table-mat image, coroplast-yard-signs description
 *
 * Run:  node scripts/fix-signs-stickers-final.mjs
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("── Final fixes ──\n");

  // 1. Signs: fix pricingUnit
  const signsSlugs = [
    "ada-braille-signs",
    "address-house-number-signs",
    "business-hours-sign",
    "face-in-hole-board",
    "open-house-sign-kit",
    "qr-code-signs",
    "real-estate-riders",
    "tri-fold-presentation-board",
  ];

  // Also fix pole-banner-hardware-kit in banners
  const allFixUnit = [...signsSlugs, "pole-banner-hardware-kit"];

  console.log("── pricingUnit → per_sqft ──");
  let unitFixed = 0;
  for (const slug of allFixUnit) {
    const product = await prisma.product.findUnique({ where: { slug } });
    if (!product) { console.log(`  ${slug} — not found`); continue; }
    if (product.pricingUnit === "per_sqft") { console.log(`  ${slug} — already per_sqft`); continue; }
    await prisma.product.update({ where: { slug }, data: { pricingUnit: "per_sqft" } });
    console.log(`  ${slug} → per_sqft`);
    unitFixed++;
  }

  // 2. table-mat: add placeholder image
  console.log("\n── Content fixes ──");
  const tableMat = await prisma.product.findUnique({
    where: { slug: "table-mat" },
    include: { images: { take: 1 } },
  });
  if (tableMat && (!tableMat.images || tableMat.images.length === 0)) {
    await prisma.productImage.create({
      data: {
        productId: tableMat.id,
        url: "https://placehold.co/600x400/png?text=Table+Mat",
        alt: "Table Mat",
        sortOrder: 0,
      },
    });
    console.log("  table-mat → added placeholder image");
  } else {
    console.log("  table-mat — image already exists");
  }

  // 3. coroplast-yard-signs: add description
  const coroplast = await prisma.product.findUnique({ where: { slug: "coroplast-yard-signs" } });
  if (coroplast && !coroplast.description) {
    await prisma.product.update({
      where: { slug: "coroplast-yard-signs" },
      data: {
        description: "Durable corrugated plastic yard signs with full-colour digital printing. Lightweight, weatherproof, and perfect for real estate, elections, events, and business promotions. Available with H-stakes.",
      },
    });
    console.log("  coroplast-yard-signs → added description");
  } else {
    console.log("  coroplast-yard-signs — description already exists");
  }

  console.log(`\nDone: ${unitFixed} pricingUnit fixed`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
