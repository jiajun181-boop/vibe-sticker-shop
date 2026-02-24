/**
 * One-time: strip brand suffixes from product metaTitle values.
 * Removes " | La Lunar Printing Inc." and " | La Lunar Printing" from metaTitle.
 * Does NOT touch metaDescription.
 */
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// Order matters — check the longer suffix first so we don't leave trailing "Inc."
const SUFFIXES = [" | La Lunar Printing Inc.", " | La Lunar Printing"];

async function main() {
  // Find all products whose metaTitle contains either brand suffix
  const products = await prisma.product.findMany({
    where: {
      OR: SUFFIXES.map((s) => ({ metaTitle: { contains: s } })),
    },
    select: { id: true, slug: true, metaTitle: true },
  });

  console.log(`Found ${products.length} product(s) with brand suffix in metaTitle.\n`);

  if (products.length === 0) return;

  let updated = 0;

  for (const p of products) {
    let cleaned = p.metaTitle;
    for (const suffix of SUFFIXES) {
      cleaned = cleaned.replace(suffix, "");
    }
    cleaned = cleaned.trim();

    if (cleaned !== p.metaTitle) {
      await prisma.product.update({
        where: { id: p.id },
        data: { metaTitle: cleaned },
      });
      console.log(`  updated: ${p.slug}`);
      console.log(`    before: ${p.metaTitle}`);
      console.log(`    after:  ${cleaned}`);
      updated++;
    }
  }

  console.log(`\nDone. Updated ${updated} product(s).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
