// scripts/seed-wwf-v2.mjs — Seed Windows, Walls & Floors v2 (9 products)
// Usage: node scripts/seed-wwf-v2.mjs

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const CATEGORY = "windows-walls-floors";

const WWF_PRODUCTS = [
  {
    slug: "one-way-vision",
    name: "One-Way Vision Film",
    description: "See-through perforated vinyl for storefronts. Full graphics on outside, clear view from inside.",
    basePrice: 4999,
    sortOrder: 1,
  },
  {
    slug: "frosted-window-film",
    name: "Frosted Window Film",
    description: "Elegant etched-glass look for privacy and branding. Printed or solid frosted vinyl.",
    basePrice: 3999,
    sortOrder: 2,
  },
  {
    slug: "static-cling",
    name: "Static Cling Film",
    description: "Adhesive-free window film that clings with static. Easy to apply, remove, and reuse.",
    basePrice: 2999,
    sortOrder: 3,
  },
  {
    slug: "transparent-color-film",
    name: "Transparent Color Film",
    description: "Translucent printed vinyl that lets light through. Ideal for coloured window displays.",
    basePrice: 3999,
    sortOrder: 4,
  },
  {
    slug: "blockout-vinyl",
    name: "Blockout Vinyl",
    description: "Opaque vinyl that fully blocks light and view. Perfect for full-coverage window graphics.",
    basePrice: 3499,
    sortOrder: 5,
  },
  {
    slug: "opaque-window-graphics",
    name: "Opaque Window Graphics",
    description: "Standard white vinyl applied to glass for bold, full-colour window signage and lettering.",
    basePrice: 2999,
    sortOrder: 6,
  },
  {
    slug: "glass-waistline",
    name: "Glass Waistline Strips",
    description: "Decorative safety strip for glass doors and partitions. Required by building codes for visibility.",
    basePrice: 1999,
    sortOrder: 7,
  },
  {
    slug: "wall-graphics",
    name: "Wall Graphics",
    description: "Repositionable printed vinyl for interior walls. Damage-free application for offices and retail.",
    basePrice: 3999,
    sortOrder: 8,
  },
  {
    slug: "floor-graphics",
    name: "Floor Graphics",
    description: "Non-slip laminated vinyl for indoor floors. Wayfinding, branding, and safety messaging.",
    basePrice: 4499,
    sortOrder: 9,
  },
];

const VALID_SLUGS = new Set(WWF_PRODUCTS.map((p) => p.slug));

async function main() {
  console.log("=== WWF v2 Seed ===\n");

  // 1. Deactivate products NOT in the 9-product list
  const allWwf = await prisma.product.findMany({
    where: { category: CATEGORY },
    select: { id: true, slug: true, isActive: true },
  });

  const toDeactivate = allWwf.filter((p) => !VALID_SLUGS.has(p.slug) && p.isActive);
  if (toDeactivate.length > 0) {
    console.log(`Deactivating ${toDeactivate.length} old products:`);
    for (const p of toDeactivate) {
      console.log(`  - ${p.slug}`);
      await prisma.product.update({
        where: { id: p.id },
        data: { isActive: false },
      });
    }
  } else {
    console.log("No old products to deactivate.");
  }

  // 2. Delete dichroic-window-film if it exists
  const dichroic = await prisma.product.findUnique({
    where: { slug: "dichroic-window-film" },
  });
  if (dichroic) {
    console.log("\nDeleting dichroic-window-film...");
    // Delete related records first
    await prisma.productImage.deleteMany({ where: { productId: dichroic.id } });
    await prisma.product.delete({ where: { id: dichroic.id } });
    console.log("  Deleted.");
  }

  // 3. Upsert 9 core products
  console.log("\nUpserting 9 WWF products:");
  for (const p of WWF_PRODUCTS) {
    const result = await prisma.product.upsert({
      where: { slug: p.slug },
      create: {
        slug: p.slug,
        name: p.name,
        description: p.description,
        category: CATEGORY,
        basePrice: p.basePrice,
        pricingUnit: "per_sqft",
        isActive: true,
        sortOrder: p.sortOrder,
      },
      update: {
        name: p.name,
        description: p.description,
        category: CATEGORY,
        isActive: true,
        sortOrder: p.sortOrder,
      },
    });
    console.log(`  ${result.slug} — ${result.id}`);
  }

  console.log("\n=== Done ===");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
