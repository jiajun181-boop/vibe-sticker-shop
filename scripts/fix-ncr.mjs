import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  // Rename ncr-invoices to 4-Copy NCR Form
  const r1 = await prisma.product.updateMany({
    where: { slug: "ncr-invoices" },
    data: { name: "4-Copy NCR Form", sortOrder: 42 },
  });
  console.log(`Renamed ncr-invoices: ${r1.count}`);

  // Rename ncr-forms-duplicate
  const r2 = await prisma.product.updateMany({
    where: { slug: "ncr-forms-duplicate" },
    data: { name: "2-Copy NCR Form", sortOrder: 40 },
  });
  console.log(`Renamed ncr-forms-duplicate: ${r2.count}`);

  // Rename ncr-forms-triplicate
  const r3 = await prisma.product.updateMany({
    where: { slug: "ncr-forms-triplicate" },
    data: { name: "3-Copy NCR Form", sortOrder: 41 },
  });
  console.log(`Renamed ncr-forms-triplicate: ${r3.count}`);

  // Deactivate ncr-invoice-books
  const r4 = await prisma.product.updateMany({
    where: { slug: "ncr-invoice-books" },
    data: { isActive: false },
  });
  console.log(`Deactivated ncr-invoice-books: ${r4.count}`);

  // Verify
  const all = await prisma.product.findMany({
    where: { slug: { startsWith: "ncr-" } },
    select: { slug: true, name: true, isActive: true, sortOrder: true },
    orderBy: { sortOrder: "asc" },
  });
  console.log("\nFinal state:");
  all.forEach(p => console.log(`  ${p.isActive ? "ACTIVE" : "------"} ${p.slug} | ${p.name} | sort: ${p.sortOrder}`));
}

main().catch(console.error).finally(() => prisma.$disconnect());
