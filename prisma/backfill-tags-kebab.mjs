// prisma/backfill-tags-kebab.mjs
// One-time migration: convert PascalCase tags to kebab-case.
// Safe — only rewrites tags in place, dedupes.

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const PASCAL_TO_KEBAB = {
  Restaurant:   "restaurants",
  RealEstate:   "real-estate",
  Construction: "construction",
  Retail:       "retail",
  Event:        "event",
  Fleet:        "fleet",
  Safety:       "safety",
  Facility:     "facility",
  Automotive:   "automotive",
  Finance:      "finance",
  Medical:      "medical",
  Education:    "education",
  Fitness:      "fitness",
  Beauty:       "beauty",
};

async function main() {
  const products = await prisma.product.findMany({
    where: { tags: { isEmpty: false } },
    select: { id: true, slug: true, tags: true },
  });

  console.log(`Found ${products.length} products with tags`);

  let updated = 0;
  let skipped = 0;

  for (const p of products) {
    const oldTags = p.tags;
    const newTags = [...new Set(
      oldTags.map((t) => PASCAL_TO_KEBAB[t] || t.toLowerCase())
    )];

    // Check if anything actually changed
    const changed =
      oldTags.length !== newTags.length ||
      oldTags.some((t, i) => t !== newTags[i]);

    if (!changed) {
      skipped++;
      continue;
    }

    await prisma.product.update({
      where: { id: p.id },
      data: { tags: newTags },
    });
    updated++;
  }

  console.log(`Updated: ${updated}`);
  console.log(`Skipped (already kebab): ${skipped}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
