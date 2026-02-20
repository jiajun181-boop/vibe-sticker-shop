import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  const p = await prisma.product.findFirst({
    where: { slug: "flyers" },
    select: { pricingUnit: true, type: true, category: true },
  });
  console.log(JSON.stringify(p, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
