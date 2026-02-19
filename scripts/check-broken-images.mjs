import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const checkLive = process.argv.includes("--check-live");

function isUploadThingUrl(url) {
  if (!url || typeof url !== "string") return false;
  return url.includes("utfs.io") || url.includes("ufs.sh") || url.includes("uploadthing");
}

function isSuspicious(url) {
  if (!url || typeof url !== "string" || url.trim() === "") return true;
  // Keep local/static assets valid for fallback visuals.
  if (url.startsWith("/")) return false;
  return !isUploadThingUrl(url);
}

try {
  const productImages = await prisma.productImage.findMany({
    select: { id: true, url: true, productId: true, alt: true },
    orderBy: { createdAt: "asc" },
  });

  const assetLinks = await prisma.assetLink.findMany({
    where: { entityType: "product" },
    include: { asset: { select: { id: true, originalUrl: true } } },
    orderBy: { sortOrder: "asc" },
  });

  const brokenProductImages = productImages.filter((i) => isSuspicious(i.url));
  const brokenAssetLinks = assetLinks.filter((l) => isSuspicious(l.asset?.originalUrl));

  const openAiLike = productImages.filter(
    (i) =>
      i.url &&
      (i.url.includes("openai") || i.url.includes("oaidalleapi") || i.url.includes("dalle"))
  );

  console.log("=== Product Image Audit ===");
  console.log("Total product images:", productImages.length);
  console.log("OpenAI/DALL-E-like URLs:", openAiLike.length);
  console.log("Suspicious ProductImage URLs:", brokenProductImages.length);

  if (brokenProductImages.length > 0) {
    console.log("\nSuspicious ProductImage rows (first 30):");
    brokenProductImages.slice(0, 30).forEach((i) => {
      console.log(`  ${i.id} | product=${i.productId} | ${String(i.url).slice(0, 140)}`);
    });
  }

  console.log("\n=== Product AssetLink Audit ===");
  console.log("Total product AssetLinks:", assetLinks.length);
  console.log("Suspicious AssetLink URLs:", brokenAssetLinks.length);

  if (brokenAssetLinks.length > 0) {
    console.log("\nSuspicious AssetLink rows (first 30):");
    brokenAssetLinks.slice(0, 30).forEach((l) => {
      console.log(
        `  link=${l.id} | product=${l.entityId} | asset=${l.assetId} | ${String(l.asset?.originalUrl || "").slice(0, 140)}`
      );
    });
  }

  console.log("\nSuggested cleanup targets:");
  console.log("  ProductImage IDs:", JSON.stringify(brokenProductImages.map((i) => i.id)));
  console.log("  AssetLink IDs:", JSON.stringify(brokenAssetLinks.map((l) => l.id)));

  if (checkLive) {
    const candidateUrls = Array.from(
      new Set(
        [
          ...productImages.map((i) => i.url),
          ...assetLinks.map((l) => l.asset?.originalUrl),
        ].filter((u) => typeof u === "string" && /^https?:\/\//i.test(u))
      )
    );

    const limit = 120;
    const sample = candidateUrls.slice(0, limit);
    const brokenLive = [];
    let ok = 0;

    for (const url of sample) {
      try {
        const res = await fetch(url, { method: "HEAD" });
        if (!res.ok) {
          brokenLive.push({ url, status: res.status });
        } else {
          ok += 1;
        }
      } catch {
        brokenLive.push({ url, status: "NETWORK_ERR" });
      }
    }

    console.log("\n=== Live URL Check (sampled) ===");
    console.log(`Checked: ${sample.length} / ${candidateUrls.length}`);
    console.log(`Live OK: ${ok}`);
    console.log(`Live broken: ${brokenLive.length}`);
    if (brokenLive.length > 0) {
      console.log("Broken URLs (first 30):");
      brokenLive.slice(0, 30).forEach((r) => console.log(`  [${r.status}] ${r.url}`));
    }
  }
} finally {
  await prisma.$disconnect();
}
