import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  // Make sure postcards parent is active
  const activate = await prisma.product.updateMany({
    where: { slug: "postcards" },
    data: { isActive: true },
  });
  console.log(`Activated postcards: ${activate.count}`);

  // Deactivate variants
  const deactivate = await prisma.product.updateMany({
    where: { slug: { in: ["postcards-standard", "postcards-medium", "postcards-large", "postcards-eddm"] } },
    data: { isActive: false },
  });
  console.log(`Deactivated ${deactivate.count} postcard variants`);

  // Verify
  const all = await prisma.product.findMany({
    where: { slug: { startsWith: "postcards" } },
    select: { slug: true, name: true, isActive: true, sortOrder: true },
    orderBy: { sortOrder: "asc" },
  });
  console.log("\nFinal state:");
  all.forEach(p => console.log(`  ${p.isActive ? "ACTIVE" : "------"} ${p.slug} | ${p.name} | sort: ${p.sortOrder}`));
}

main().catch(console.error).finally(() => prisma.$disconnect());
