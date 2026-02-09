// prisma/merge-categories.mjs
// One-time: merge duplicate category slugs into canonical ones.
// stickers → stickers-labels, signs → rigid-signs,
// banners → banners-displays, marketing → marketing-prints

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const MERGES = [
  { from: "stickers", to: "stickers-labels" },
  { from: "signs", to: "rigid-signs" },
  { from: "banners", to: "banners-displays" },
  { from: "marketing", to: "marketing-prints" },
];

async function main() {
  for (const { from, to } of MERGES) {
    const result = await prisma.product.updateMany({
      where: { category: from },
      data: { category: to },
    });
    console.log(`${from} → ${to}: ${result.count} products moved`);
  }

  // Final count
  const counts = await prisma.product.groupBy({
    by: ["category"],
    _count: true,
    where: { isActive: true },
    orderBy: { _count: { category: "desc" } },
  });
  console.log("\n── Final categories ──");
  counts.forEach((x) => console.log(`  ${x.category.padEnd(35)} ${x._count}`));
  console.log(`  Total: ${counts.length} categories, ${counts.reduce((s, x) => s + x._count, 0)} products`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
