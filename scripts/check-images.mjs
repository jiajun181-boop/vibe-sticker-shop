import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();

const total = await p.product.count({ where: { isActive: true } });
const imgCount = await p.productImage.count();
const products = await p.product.findMany({
  where: { isActive: true },
  select: { id: true, slug: true, category: true, images: { select: { id: true } } },
  orderBy: { category: "asc" },
});

const withImg = products.filter((x) => x.images.length > 0);
const noImg = products.filter((x) => x.images.length === 0);

console.log("Total active:", total);
console.log("With images:", withImg.length);
console.log("Without images:", noImg.length);
console.log("Total image records:", imgCount);
console.log("");

const byCat = {};
noImg.forEach((x) => {
  byCat[x.category] = (byCat[x.category] || 0) + 1;
});
console.log("--- No-image by category ---");
for (const [cat, count] of Object.entries(byCat).sort((a, b) => b[1] - a[1])) {
  console.log("  " + cat + ": " + count);
}

// sample of products WITH images
console.log("\n--- Sample products with images ---");
withImg.slice(0, 5).forEach((x) => {
  console.log("  " + x.slug + " — " + x.images.length + " images");
});

await p.$disconnect();
