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
}
main().catch(console.error).finally(() => prisma.$disconnect());
