import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  // Activate main flyers product
  await prisma.product.update({
    where: { slug: "flyers" },
    data: { isActive: true, sortOrder: 10 },
  });
  console.log("Activated: flyers");

  // Deactivate sub-products
  for (const slug of ["flyers-small", "flyers-standard", "flyers-large"]) {
    await prisma.product.update({
      where: { slug },
      data: { isActive: false },
    });
    console.log("Deactivated:", slug);
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
