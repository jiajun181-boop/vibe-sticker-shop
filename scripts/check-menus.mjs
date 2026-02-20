import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  const products = await prisma.product.findMany({
    where: { slug: { contains: "menu" } },
    select: { id: true, slug: true, name: true, isActive: true, sortOrder: true },
    orderBy: { sortOrder: "asc" },
  });
  console.log("Menu products:");
  products.forEach(p => console.log(`  ${p.isActive ? "ACTIVE" : "------"} ${p.slug} | ${p.name} | sort: ${p.sortOrder}`));

  const tableMat = await prisma.product.findUnique({
    where: { slug: "table-mat" },
    select: { id: true, slug: true, name: true, isActive: true, sortOrder: true },
  });
  console.log("\nTable mat:");
  console.log(tableMat ? `  ${tableMat.isActive ? "ACTIVE" : "------"} ${tableMat.slug} | ${tableMat.name} | sort: ${tableMat.sortOrder}` : "  NOT FOUND");
}
main().catch(console.error).finally(() => prisma.$disconnect());
