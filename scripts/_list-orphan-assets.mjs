import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  // Orphan assets (not linked to any product)
  const orphans = await prisma.asset.findMany({
    where: { links: { none: {} } },
    select: { id: true, originalName: true, altText: true, tags: true, originalUrl: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  // Products missing ProductImage (but might have Asset links)
  const productsWithAssets = await prisma.assetLink.findMany({
    where: { entityType: "product" },
    select: { entityId: true },
  });
  const linkedProductIds = new Set(productsWithAssets.map((l) => l.entityId));

  const allActive = await prisma.product.findMany({
    where: { isActive: true },
    select: { id: true, name: true, slug: true, category: true, images: { select: { id: true } } },
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });

  // Products that have NO asset link AND no ProductImage
  const needImage = allActive.filter((p) => !linkedProductIds.has(p.id) && p.images.length === 0);

  console.log("=== 未链接的孤立图片 (" + orphans.length + " 个) ===\n");
  for (const a of orphans) {
    const info = [a.originalName];
    if (a.altText) info.push("alt:" + a.altText);
    if (a.tags?.length) info.push("tags:" + a.tags.join(","));
    console.log(" ", info.join(" | "));
  }

  console.log("\n=== 完全没有图片的产品 (" + needImage.length + " 个) ===\n");
  let cat = "";
  for (const p of needImage) {
    if (p.category !== cat) {
      cat = p.category;
      console.log("\n📁", cat);
    }
    console.log("  ❌", p.name, "(" + p.slug + ")");
  }

  await prisma.$disconnect();
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
