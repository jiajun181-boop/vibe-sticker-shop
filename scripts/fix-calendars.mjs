import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  // Check current state
  const all = await prisma.product.findMany({
    where: { slug: { startsWith: "calendar" } },
    select: { slug: true, name: true, isActive: true, sortOrder: true },
    orderBy: { sortOrder: "asc" },
  });
  console.log("Current state:");
  all.forEach(p => console.log(`  ${p.isActive ? "ACTIVE" : "------"} ${p.slug} | ${p.name} | sort: ${p.sortOrder}`));

  // Deactivate parent "calendars"
  const r1 = await prisma.product.updateMany({
    where: { slug: "calendars" },
    data: { isActive: false },
  });
  console.log(`\nDeactivated calendars parent: ${r1.count}`);

  // Ensure calendars-wall is active with correct name
  await prisma.product.updateMany({
    where: { slug: "calendars-wall" },
    data: { isActive: true, name: "Wall Calendar", sortOrder: 90 },
  });

  // Ensure calendars-wall-desk is active with correct name
  await prisma.product.updateMany({
    where: { slug: "calendars-wall-desk" },
    data: { isActive: true, name: "Desk Calendar", sortOrder: 91 },
  });

  // Final state
  const final = await prisma.product.findMany({
    where: { slug: { startsWith: "calendar" } },
    select: { slug: true, name: true, isActive: true, sortOrder: true },
    orderBy: { sortOrder: "asc" },
  });
  console.log("\nFinal state:");
  final.forEach(p => console.log(`  ${p.isActive ? "ACTIVE" : "------"} ${p.slug} | ${p.name} | sort: ${p.sortOrder}`));
}

main().catch(console.error).finally(() => prisma.$disconnect());
