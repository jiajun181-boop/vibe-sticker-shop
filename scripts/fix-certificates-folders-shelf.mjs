import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  // 1. Certificates — activate main, deactivate gift variant
  const certActivate = await prisma.product.updateMany({
    where: { slug: "certificates" },
    data: { isActive: true },
  });
  console.log(`Activated certificates: ${certActivate.count}`);

  const certDeactivate = await prisma.product.updateMany({
    where: { slug: { in: ["gift-certificates", "certificates-gift", "certificates-award", "certificates-diploma"] } },
    data: { isActive: false },
  });
  console.log(`Deactivated certificate variants: ${certDeactivate.count}`);

  // 2. Presentation folders — deactivate all
  const folderDeactivate = await prisma.product.updateMany({
    where: { slug: { startsWith: "presentation-folders" } },
    data: { isActive: false },
  });
  console.log(`Deactivated presentation-folders: ${folderDeactivate.count}`);

  // 3. Shelf displays — deactivate old, create/update 3 new products
  const oldShelfDeactivate = await prisma.product.updateMany({
    where: { slug: { in: ["shelf-displays", "wobblers", "danglers"] } },
    data: { isActive: false },
  });
  console.log(`Deactivated old shelf products: ${oldShelfDeactivate.count}`);

  // Get category from existing shelf product or fallback
  const ref = await prisma.product.findFirst({
    where: { slug: { in: ["shelf-displays", "shelf-talkers", "table-tents"] } },
    select: { category: true },
  });
  const cat = ref?.category || "marketing-business-print";

  const shelfProducts = [
    { slug: "shelf-talkers", name: "Shelf Talkers", sortOrder: 80, description: "Rectangular shelf talkers with fold & adhesive — insert directly onto shelf rails. 14pt cardstock with gloss or matte lamination." },
    { slug: "shelf-danglers", name: "Shelf Danglers", sortOrder: 81, description: "Die-cut hanging shelf signs with large display area and drill hole for hooks. 14pt cardstock with gloss or matte lamination." },
    { slug: "shelf-wobblers", name: "Shelf Wobblers", sortOrder: 82, description: "Attention-grabbing spring-mounted shelf cards. PVC wobbler arm assembly included. 14pt cardstock with gloss or matte lamination." },
  ];

  for (const sp of shelfProducts) {
    const existing = await prisma.product.findUnique({ where: { slug: sp.slug } });
    if (existing) {
      await prisma.product.update({
        where: { slug: sp.slug },
        data: { name: sp.name, description: sp.description, isActive: true, sortOrder: sp.sortOrder },
      });
      console.log(`Updated ${sp.slug}`);
    } else {
      await prisma.product.create({
        data: {
          slug: sp.slug,
          name: sp.name,
          description: sp.description,
          isActive: true,
          sortOrder: sp.sortOrder,
          basePrice: 0,
          pricingUnit: "per_piece",
          type: "other",
          category: cat,
        },
      });
      console.log(`Created ${sp.slug}`);
    }
  }

  // Verify
  const allSlugs = [
    "certificates", "gift-certificates",
    "presentation-folders", "presentation-folders-standard",
    "shelf-displays", "shelf-talkers", "shelf-danglers", "shelf-wobblers",
  ];
  const all = await prisma.product.findMany({
    where: { slug: { in: allSlugs } },
    select: { slug: true, name: true, isActive: true, sortOrder: true },
    orderBy: { sortOrder: "asc" },
  });
  console.log("\nFinal state:");
  all.forEach(p => console.log(`  ${p.isActive ? "ACTIVE" : "------"} ${p.slug} | ${p.name} | sort: ${p.sortOrder}`));
}

main().catch(console.error).finally(() => prisma.$disconnect());
