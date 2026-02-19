import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const apply = process.argv.includes("--apply");
const checkLive = process.argv.includes("--check-live");

function isUploadThingUrl(url) {
  if (!url || typeof url !== "string") return false;
  return url.includes("utfs.io") || url.includes("ufs.sh") || url.includes("uploadthing");
}

function isSuspicious(url) {
  if (!url || typeof url !== "string" || url.trim() === "") return true;
  if (url.startsWith("/")) return false;
  return !isUploadThingUrl(url);
}

async function getLiveBrokenUrls(urls) {
  const unique = Array.from(new Set(urls.filter((u) => typeof u === "string" && /^https?:\/\//i.test(u))));
  const broken = new Set();
  for (const url of unique) {
    try {
      const res = await fetch(url, { method: "HEAD" });
      if (!res.ok) broken.add(url);
    } catch {
      broken.add(url);
    }
  }
  return broken;
}

async function resequenceProductImages(productId) {
  const rows = await prisma.productImage.findMany({
    where: { productId },
    orderBy: { sortOrder: "asc" },
    select: { id: true },
  });
  await Promise.all(
    rows.map((row, idx) =>
      prisma.productImage.update({
        where: { id: row.id },
        data: { sortOrder: idx },
      })
    )
  );
}

try {
  const [images, links] = await Promise.all([
    prisma.productImage.findMany({
      select: { id: true, url: true, productId: true },
    }),
    prisma.assetLink.findMany({
      where: { entityType: "product" },
      include: { asset: { select: { originalUrl: true } } },
    }),
  ]);

  const baseBadImages = images.filter((i) => isSuspicious(i.url));
  const baseBadLinks = links.filter((l) => isSuspicious(l.asset?.originalUrl));

  let liveBrokenUrls = new Set();
  if (checkLive) {
    const liveCandidates = [
      ...images.map((i) => i.url),
      ...links.map((l) => l.asset?.originalUrl),
    ];
    liveBrokenUrls = await getLiveBrokenUrls(liveCandidates);
    console.log(`Live broken URLs detected: ${liveBrokenUrls.size}`);
  }

  const badImages = images.filter(
    (i) => isSuspicious(i.url) || (i.url && liveBrokenUrls.has(i.url))
  );
  const badLinks = links.filter(
    (l) =>
      isSuspicious(l.asset?.originalUrl) ||
      (l.asset?.originalUrl && liveBrokenUrls.has(l.asset.originalUrl))
  );

  console.log(`Mode: ${apply ? "APPLY" : "DRY-RUN"}`);
  console.log(`ProductImage total: ${images.length}`);
  console.log(`ProductImage removable: ${badImages.length}`);
  console.log(`Product AssetLink total: ${links.length}`);
  console.log(`Product AssetLink removable: ${badLinks.length}`);

  if (!apply) {
    console.log("\nNo rows were deleted. Re-run with --apply to execute.");
    process.exit(0);
  }

  if (badImages.length > 0) {
    const imageIds = badImages.map((i) => i.id);
    const res = await prisma.productImage.deleteMany({ where: { id: { in: imageIds } } });
    console.log(`Deleted ProductImage rows: ${res.count}`);

    const touchedProducts = Array.from(new Set(badImages.map((i) => i.productId)));
    for (const productId of touchedProducts) {
      await resequenceProductImages(productId);
    }
    console.log(`Resequenced products: ${touchedProducts.length}`);
  }

  if (badLinks.length > 0) {
    const linkIds = badLinks.map((l) => l.id);
    const res = await prisma.assetLink.deleteMany({ where: { id: { in: linkIds } } });
    console.log(`Deleted AssetLink rows: ${res.count}`);
  }

  if (badImages.length === 0 && badLinks.length === 0) {
    console.log("Nothing to clean up.");
  }
} finally {
  await prisma.$disconnect();
}
