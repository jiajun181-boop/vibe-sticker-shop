/**
 * Migration script: ProductImage → Asset + AssetLink
 *
 * Usage: node prisma/migrate-assets.mjs
 *
 * This script:
 * 1. Reads all ProductImage records
 * 2. For each unique URL, creates an Asset record
 * 3. Creates AssetLink records binding assets to products
 * 4. Deduplicates: if multiple products share the same image URL, they share the same Asset
 * 5. Reports stats at the end
 */

import { PrismaClient } from "@prisma/client";
import { createHash } from "crypto";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

const prisma = new PrismaClient();

async function main() {
  console.log("=== ProductImage → Asset Migration ===\n");

  // Fetch all product images
  const productImages = await prisma.productImage.findMany({
    include: { product: { select: { id: true, name: true, slug: true } } },
    orderBy: [{ productId: "asc" }, { sortOrder: "asc" }],
  });

  console.log(`Found ${productImages.length} ProductImage records\n`);

  if (productImages.length === 0) {
    console.log("Nothing to migrate.");
    return;
  }

  // Track stats
  let created = 0;
  let deduplicated = 0;
  let linked = 0;
  let errors = 0;

  // Map URL → Asset ID for dedup
  const urlToAssetId = new Map();

  // Check how many assets already exist (in case of re-run)
  const existingAssets = await prisma.asset.count();
  if (existingAssets > 0) {
    console.log(`⚠ ${existingAssets} assets already exist. Loading existing URL map...\n`);
    const existing = await prisma.asset.findMany({
      select: { id: true, originalUrl: true },
    });
    for (const a of existing) {
      urlToAssetId.set(a.originalUrl, a.id);
    }
  }

  for (const img of productImages) {
    try {
      const url = img.url;

      // Check if we already created an Asset for this URL
      let assetId = urlToAssetId.get(url);

      if (!assetId) {
        // Compute SHA256
        let sha256;
        let sizeBytes = 0;
        let widthPx = 600;
        let heightPx = 600;
        let hasAlpha = false;
        let mimeType = "image/jpeg";

        // Check if it's a local SVG
        if (url.startsWith("/products/") || url.startsWith("/public/products/")) {
          const cleanPath = url.replace(/^\/public/, "");
          const fullPath = resolve(process.cwd(), "public", cleanPath.replace(/^\//, ""));

          if (existsSync(fullPath)) {
            const fileBuffer = readFileSync(fullPath);
            sha256 = createHash("sha256").update(fileBuffer).digest("hex");
            sizeBytes = fileBuffer.length;
            mimeType = "image/svg+xml";
            hasAlpha = true;

            // Try to extract SVG dimensions
            const text = fileBuffer.toString("utf8", 0, Math.min(fileBuffer.length, 4096));
            const vbMatch = text.match(/viewBox\s*=\s*["']([^"']+)["']/);
            if (vbMatch) {
              const parts = vbMatch[1].trim().split(/[\s,]+/).map(Number);
              if (parts.length === 4 && parts[2] > 0 && parts[3] > 0) {
                widthPx = Math.round(parts[2]);
                heightPx = Math.round(parts[3]);
              }
            }
          } else {
            // File doesn't exist locally — hash the URL string
            sha256 = createHash("sha256").update(url).digest("hex");
            mimeType = url.endsWith(".svg") ? "image/svg+xml" : "image/jpeg";
          }
        } else {
          // External URL (UploadThing, placehold.co, etc.) — hash the URL string
          sha256 = createHash("sha256").update(url).digest("hex");

          if (url.endsWith(".svg")) mimeType = "image/svg+xml";
          else if (url.endsWith(".png")) mimeType = "image/png";
          else if (url.endsWith(".webp")) mimeType = "image/webp";
          else mimeType = "image/jpeg";
        }

        // Check if SHA256 already exists (could happen if URLs differ but content is same)
        const existingByHash = await prisma.asset.findUnique({
          where: { sha256 },
        });

        if (existingByHash) {
          assetId = existingByHash.id;
          urlToAssetId.set(url, assetId);
          deduplicated++;
        } else {
          // Create new Asset
          const asset = await prisma.asset.create({
            data: {
              sha256,
              originalName: url.split("/").pop() || "unknown",
              originalUrl: url,
              mimeType,
              sizeBytes,
              widthPx,
              heightPx,
              hasAlpha,
              focalX: 0.5,
              focalY: 0.5,
              altText: img.alt || null,
              tags: [],
              status: "published",
              uploadedBy: "migration",
              publishedAt: new Date(),
            },
          });

          assetId = asset.id;
          urlToAssetId.set(url, assetId);
          created++;
        }
      } else {
        deduplicated++;
      }

      // Check if link already exists
      const existingLink = await prisma.assetLink.findFirst({
        where: {
          assetId,
          entityType: "product",
          entityId: img.productId,
          purpose: "gallery",
          sortOrder: img.sortOrder,
        },
      });

      if (!existingLink) {
        await prisma.assetLink.create({
          data: {
            assetId,
            entityType: "product",
            entityId: img.productId,
            purpose: "gallery",
            sortOrder: img.sortOrder,
            altOverride: img.alt || null,
          },
        });
        linked++;
      }
    } catch (err) {
      console.error(`✗ Error migrating image ${img.id} (${img.url}):`, err.message);
      errors++;
    }
  }

  // Verification
  const totalAssets = await prisma.asset.count();
  const totalLinks = await prisma.assetLink.count();
  const productsWithLinks = await prisma.assetLink.groupBy({
    by: ["entityId"],
    where: { entityType: "product" },
  });
  const productsWithImages = await prisma.productImage.groupBy({
    by: ["productId"],
  });

  console.log("\n=== Migration Complete ===");
  console.log(`Assets created:      ${created}`);
  console.log(`Assets deduplicated: ${deduplicated}`);
  console.log(`Links created:       ${linked}`);
  console.log(`Errors:              ${errors}`);
  console.log(`\nTotal assets in DB:  ${totalAssets}`);
  console.log(`Total links in DB:   ${totalLinks}`);
  console.log(`Products with links: ${productsWithLinks.length}`);
  console.log(`Products with imgs:  ${productsWithImages.length}`);

  if (productsWithLinks.length < productsWithImages.length) {
    console.log(
      `\n⚠ ${productsWithImages.length - productsWithLinks.length} products still missing AssetLinks!`
    );
  } else {
    console.log("\n✓ All products with images have corresponding AssetLinks.");
  }
}

main()
  .catch((e) => {
    console.error("Migration failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
