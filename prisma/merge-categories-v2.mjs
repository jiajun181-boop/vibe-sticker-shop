// prisma/merge-categories-v2.mjs
// Merge legacy category slugs into canonical ones (idempotent).

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const MERGES = [
  { from: "window-graphics", to: "large-format-graphics" },
  { from: "fleet-compliance-id", to: "vehicle-branding-advertising" },
  { from: "safety-warning-decals", to: "facility-asset-labels" },
];

async function main() {
  for (const { from, to } of MERGES) {
    const result = await prisma.product.updateMany({
      where: { category: from },
      data: { category: to },
    });
    if (result.count > 0) {
      console.log(`${from} -> ${to}: ${result.count} products moved`);
    } else {
      console.log(`${from} -> ${to}: 0 products (skip)`);
    }
  }

  const counts = await prisma.product.groupBy({
    by: ["category"],
    _count: true,
    orderBy: { _count: { category: "desc" } },
  });

  console.log("\n== Final categories ==");
  counts.forEach((x) => console.log(`  ${x.category.padEnd(35)} ${x._count}`));
  const totalProducts = counts.reduce((sum, x) => sum + x._count, 0);
  console.log(`  Total: ${counts.length} categories, ${totalProducts} products`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
