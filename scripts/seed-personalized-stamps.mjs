#!/usr/bin/env node
// scripts/seed-personalized-stamps.mjs
// Seeds 3 personalized stamp products into the database.
// Run:  node scripts/seed-personalized-stamps.mjs

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const PRODUCTS = [
  {
    slug: "funny-approval-stamp",
    name: "Funny Approval Stamp",
    description:
      "Hilarious self-inking approval stamps for the office comedian. Pre-loaded with funny text — customize to your taste.",
    basePrice: 4499,
    sortOrder: 60,
  },
  {
    slug: "custom-face-stamp",
    name: "Custom Face Stamp",
    description:
      "Turn any face photo into a halftone self-inking rubber stamp. Great for personalized gifts, teacher stamps, and party favours.",
    basePrice: 4499,
    sortOrder: 61,
  },
  {
    slug: "book-name-stamp",
    name: "Book Name Stamp",
    description:
      '"From the Library of" personal book stamps. Mark your books with a classic library stamp featuring your name.',
    basePrice: 3999,
    sortOrder: 62,
  },
];

async function main() {
  for (const p of PRODUCTS) {
    await prisma.product.upsert({
      where: { slug: p.slug },
      update: {
        name: p.name,
        description: p.description,
        basePrice: p.basePrice,
        category: "marketing-business-print",
        pricingUnit: "per_piece",
        isActive: true,
        sortOrder: p.sortOrder,
      },
      create: {
        slug: p.slug,
        name: p.name,
        description: p.description,
        basePrice: p.basePrice,
        category: "marketing-business-print",
        pricingUnit: "per_piece",
        isActive: true,
        sortOrder: p.sortOrder,
      },
    });

    console.log(`  + ${p.slug} — ${p.name} ($${(p.basePrice / 100).toFixed(2)})`);
  }

  console.log(`\nDone — ${PRODUCTS.length} personalized stamp products seeded.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
