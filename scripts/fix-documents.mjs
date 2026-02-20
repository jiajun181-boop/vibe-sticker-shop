import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  // Deactivate order-forms and waivers products
  const deactivateSlugs = [
    "order-form-pads", "order-forms-single",
    "release-waiver-forms", "release-forms",
    "order-forms", "waivers-releases",
  ];
  const r1 = await prisma.product.updateMany({
    where: { slug: { in: deactivateSlugs } },
    data: { isActive: false },
  });
  console.log(`Deactivated ${r1.count} old order-form/waiver products`);

  // Check if document-printing exists
  let dp = await prisma.product.findUnique({ where: { slug: "document-printing" } });
  if (!dp) {
    // Find the category from an existing marketing product
    const ref = await prisma.product.findFirst({
      where: { slug: "order-forms" },
      select: { category: true },
    });

    dp = await prisma.product.create({
      data: {
        slug: "document-printing",
        name: "Document Printing",
        description: "Custom document printing — order forms, waivers, release forms, contracts & general documents on 20lb bond paper.",
        isActive: true,
        sortOrder: 50,
        basePrice: 0,
        pricingUnit: "per_piece",
        type: "other",
        category: ref?.category || "marketing-business-print",
      },
    });
    console.log(`Created document-printing product: ${dp.id}`);
  } else {
    await prisma.product.update({
      where: { slug: "document-printing" },
      data: {
        name: "Document Printing",
        description: "Custom document printing — order forms, waivers, release forms, contracts & general documents on 20lb bond paper.",
        isActive: true,
        sortOrder: 50,
      },
    });
    console.log(`Updated document-printing product`);
  }

  // Verify
  const all = await prisma.product.findMany({
    where: { slug: { in: [...deactivateSlugs, "document-printing"] } },
    select: { slug: true, name: true, isActive: true, sortOrder: true },
    orderBy: { sortOrder: "asc" },
  });
  console.log("\nFinal state:");
  all.forEach(p => console.log(`  ${p.isActive ? "ACTIVE" : "------"} ${p.slug} | ${p.name} | sort: ${p.sortOrder}`));
}

main().catch(console.error).finally(() => prisma.$disconnect());
