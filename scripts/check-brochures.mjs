import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  // Update product names to match fold types
  await prisma.product.update({
    where: { slug: "brochures-bi-fold" },
    data: { name: "Bifold Brochure" },
  });
  console.log("Updated: brochures-bi-fold → Bifold Brochure");

  await prisma.product.update({
    where: { slug: "brochures-tri-fold" },
    data: { name: "Roll Fold Brochure" },
  });
  console.log("Updated: brochures-tri-fold → Roll Fold Brochure");

  await prisma.product.update({
    where: { slug: "brochures-z-fold" },
    data: { name: "Z Fold Brochure" },
  });
  console.log("Updated: brochures-z-fold → Z Fold Brochure");

  // Deactivate generic brochures landing product (sub-product landing handles this)
  await prisma.product.update({
    where: { slug: "brochures" },
    data: { isActive: false },
  });
  console.log("Deactivated: brochures (generic)");
}
main().catch(console.error).finally(() => prisma.$disconnect());
