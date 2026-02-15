import { PrismaClient } from "@prisma/client";
import { SUB_PRODUCT_CONFIG } from "../lib/subProductConfig.js";

const prisma = new PrismaClient();

const covered = new Set();
for (const [, cfg] of Object.entries(SUB_PRODUCT_CONFIG)) {
  if (cfg.category === "marketing-prints") {
    for (const s of cfg.dbSlugs) covered.add(s);
  }
}

const products = await prisma.product.findMany({
  where: { category: "marketing-prints", isActive: true },
  select: { slug: true, name: true },
  orderBy: { name: "asc" },
});

const orphans = products.filter((p) => !covered.has(p.slug));
console.log("Total marketing-prints products:", products.length);
console.log("Orphans (" + orphans.length + "):");
orphans.forEach((p) => console.log(" ", p.slug, "—", p.name));

await prisma.$disconnect();
