/**
 * Move orphan products from marketing-prints to their correct categories.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const MOVES = [
  // packaging
  { slug: "box-sleeves", to: "packaging" },
  { slug: "hang-tags-custom", to: "packaging" },
  { slug: "product-inserts", to: "packaging" },
  { slug: "tags-hang-tags", to: "packaging" },

  // retail-promo
  { slug: "coupons", to: "retail-promo" },
  { slug: "tickets", to: "retail-promo" },
  { slug: "cardstock-prints", to: "retail-promo" },
  { slug: "table-display-cards", to: "retail-promo" },
  { slug: "table-tents-4x6", to: "retail-promo" },

  // rigid-signs
  { slug: "yard-signs-coroplast", to: "rigid-signs" },

  // stickers-labels
  { slug: "stickers-die-cut-custom", to: "stickers-labels" },
  { slug: "stickers-roll-labels", to: "stickers-labels" },
];

for (const { slug, to } of MOVES) {
  const result = await prisma.product.updateMany({
    where: { slug },
    data: { category: to },
  });
  console.log(`${slug} → ${to} (${result.count} updated)`);
}

console.log("\nDone. magnets-business-card stays in marketing-prints (added to business-cards dbSlugs in code).");
await prisma.$disconnect();
