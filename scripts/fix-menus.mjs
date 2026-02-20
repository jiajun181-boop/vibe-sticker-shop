import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  // Deactivate menus parent + flat + folded
  const deactivate = await prisma.product.updateMany({
    where: { slug: { in: ["menus", "menus-flat", "menus-folded"] } },
    data: { isActive: false },
  });
  console.log(`Deactivated ${deactivate.count} menu products`);

  // Update sort orders: laminated=60, takeout=61, table-mat=62
  for (const [slug, sort] of [["menus-laminated", 60], ["menus-takeout", 61], ["table-mat", 62]]) {
    const r = await prisma.product.updateMany({
      where: { slug },
      data: { sortOrder: sort },
    });
    console.log(`  ${slug}: sortOrder=${sort} (updated ${r.count})`);
  }

  // Verify final state
  const all = await prisma.product.findMany({
    where: { slug: { in: ["menus", "menus-flat", "menus-folded", "menus-laminated", "menus-takeout", "table-mat"] } },
    select: { slug: true, name: true, isActive: true, sortOrder: true },
    orderBy: { sortOrder: "asc" },
  });
  console.log("\nFinal state:");
  all.forEach(p => console.log(`  ${p.isActive ? "ACTIVE" : "------"} ${p.slug} | ${p.name} | sort: ${p.sortOrder}`));
}

main().catch(console.error).finally(() => prisma.$disconnect());
