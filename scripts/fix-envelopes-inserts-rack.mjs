import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  // Deactivate ALL envelope products
  const envSlugs = ["envelopes", "envelopes-10-business", "envelopes-a7-invitation", "envelopes-6x9-catalog", "envelopes-9x12-catalog"];
  const r1 = await prisma.product.updateMany({
    where: { slug: { in: envSlugs } },
    data: { isActive: false },
  });
  console.log(`Deactivated ${r1.count} envelope products`);

  // Deactivate ALL inserts-packaging products
  const insSlugs = ["inserts-packaging", "packaging-inserts", "product-inserts", "packing-slips", "sticker-seals", "thank-you-cards", "box-sleeves"];
  const r2 = await prisma.product.updateMany({
    where: { slug: { in: insSlugs } },
    data: { isActive: false },
  });
  console.log(`Deactivated ${r2.count} inserts-packaging products`);

  // Activate rack-cards parent, deactivate variants
  const r3a = await prisma.product.updateMany({
    where: { slug: "rack-cards" },
    data: { isActive: true },
  });
  console.log(`Activated rack-cards: ${r3a.count}`);

  const rackVariants = ["rack-cards-standard", "rack-cards-tear-off", "rack-cards-folded"];
  const r3b = await prisma.product.updateMany({
    where: { slug: { in: rackVariants } },
    data: { isActive: false },
  });
  console.log(`Deactivated ${r3b.count} rack-card variants`);

  // Verify
  for (const group of [envSlugs, insSlugs, ["rack-cards", ...rackVariants]]) {
    const products = await prisma.product.findMany({
      where: { slug: { in: group } },
      select: { slug: true, name: true, isActive: true },
      orderBy: { slug: "asc" },
    });
    products.forEach(p => console.log(`  ${p.isActive ? "ACTIVE" : "------"} ${p.slug} | ${p.name}`));
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
