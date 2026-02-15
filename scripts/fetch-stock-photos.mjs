#!/usr/bin/env node
/**
 * Fetch stock photos from Unsplash for products missing real images.
 *
 * Usage:
 *   UNSPLASH_ACCESS_KEY=xxx node scripts/fetch-stock-photos.mjs
 *
 * Options:
 *   --dry-run     Preview matches without downloading
 *   --limit N     Process at most N products (default: all)
 *   --category X  Only process products in category X
 *
 * Free tier: 50 requests/hour, 5000/month.
 * The script automatically rate-limits to 1 request per 2 seconds.
 */

import { existsSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";

const UNSPLASH_KEY = process.env.UNSPLASH_ACCESS_KEY;
if (!UNSPLASH_KEY) {
  console.error("Error: Set UNSPLASH_ACCESS_KEY environment variable.");
  console.error("Get a free key at https://unsplash.com/developers");
  process.exit(1);
}

// Parse CLI args
const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const limitIdx = args.indexOf("--limit");
const limit = limitIdx !== -1 ? parseInt(args[limitIdx + 1], 10) : Infinity;
const catIdx = args.indexOf("--category");
const onlyCategory = catIdx !== -1 ? args[catIdx + 1] : null;

const PRODUCTS_DIR = path.join(process.cwd(), "public", "products");
const IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp"];
const RATE_LIMIT_MS = 2000; // 2 seconds between API calls

// Category-specific search terms for better results
const SEARCH_TERMS = {
  "stickers-labels": "custom stickers printing",
  "banners-displays": "vinyl banner printing outdoor",
  "marketing-prints": "print shop marketing materials",
  "rigid-signs": "custom sign printing aluminum",
  "window-glass-films": "window graphics storefront",
  "display-stands": "trade show display banner stand",
  "large-format-graphics": "large format printing wall graphics",
  "vehicle-branding-advertising": "vehicle wrap car graphics",
  "fleet-compliance-id": "fleet truck DOT number lettering",
  "safety-warning-decals": "safety warning signs workplace",
  "facility-asset-labels": "industrial labels barcode asset tags",
  packaging: "custom packaging labels printing",
  "retail-promo": "retail promotional materials printing",
};

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function hasExistingPhoto(slug) {
  for (const ext of IMAGE_EXTENSIONS) {
    if (existsSync(path.join(PRODUCTS_DIR, `${slug}${ext}`))) {
      return true;
    }
  }
  return false;
}

function buildSearchQuery(product) {
  const categoryTerm = SEARCH_TERMS[product.category] || "";
  const name = product.name || product.slug.replace(/-/g, " ");
  // Combine product name + category hint for better results
  return categoryTerm ? `${name} ${categoryTerm}` : `${name} printing`;
}

async function searchUnsplash(query) {
  const url = new URL("https://api.unsplash.com/search/photos");
  url.searchParams.set("query", query);
  url.searchParams.set("orientation", "landscape");
  url.searchParams.set("per_page", "1");

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Client-ID ${UNSPLASH_KEY}` },
  });

  if (res.status === 403 || res.status === 429) {
    console.error("Rate limited by Unsplash. Wait and try again later.");
    process.exit(1);
  }

  if (!res.ok) {
    console.error(`Unsplash API error: ${res.status} ${res.statusText}`);
    return null;
  }

  const data = await res.json();
  if (!data.results || data.results.length === 0) return null;

  const photo = data.results[0];
  return {
    url: photo.urls.regular, // 1080px wide
    downloadUrl: photo.links.download_location,
    photographer: photo.user.name,
    unsplashUrl: photo.links.html,
  };
}

async function downloadImage(imageUrl, destPath) {
  const res = await fetch(imageUrl);
  if (!res.ok) throw new Error(`Download failed: ${res.status}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  writeFileSync(destPath, buffer);
  return buffer.length;
}

async function triggerDownload(downloadLocationUrl) {
  // Required by Unsplash API guidelines to track downloads
  await fetch(downloadLocationUrl, {
    headers: { Authorization: `Client-ID ${UNSPLASH_KEY}` },
  }).catch(() => {});
}

async function main() {
  // Dynamically import Prisma
  let prisma;
  try {
    const mod = await import("../lib/prisma.js");
    prisma = mod.prisma;
  } catch {
    console.error("Could not import Prisma. Run from project root.");
    process.exit(1);
  }

  // Fetch products
  const where = { isActive: true };
  if (onlyCategory) where.category = onlyCategory;

  const products = await prisma.product.findMany({
    where,
    select: { id: true, slug: true, name: true, category: true },
    orderBy: { slug: "asc" },
  });

  console.log(`Found ${products.length} active products.`);

  // Filter: only those without existing photos
  const needsPhoto = products.filter((p) => !hasExistingPhoto(p.slug));
  console.log(`${needsPhoto.length} products need photos (no existing .jpg/.png).`);

  const toProcess = needsPhoto.slice(0, limit);
  console.log(`Processing ${toProcess.length} products${dryRun ? " (DRY RUN)" : ""}...\n`);

  if (!existsSync(PRODUCTS_DIR)) mkdirSync(PRODUCTS_DIR, { recursive: true });

  const results = { matched: 0, downloaded: 0, noMatch: 0, errors: 0 };
  const report = [];

  for (let i = 0; i < toProcess.length; i++) {
    const p = toProcess[i];
    const query = buildSearchQuery(p);
    const progress = `[${i + 1}/${toProcess.length}]`;

    try {
      const match = await searchUnsplash(query);

      if (!match) {
        console.log(`${progress} ${p.slug}: no match for "${query}"`);
        report.push({ slug: p.slug, status: "no_match", query });
        results.noMatch++;
        await sleep(RATE_LIMIT_MS);
        continue;
      }

      results.matched++;
      const dest = path.join(PRODUCTS_DIR, `${p.slug}.jpg`);

      if (dryRun) {
        console.log(`${progress} ${p.slug}: MATCH -> ${match.photographer} (${match.unsplashUrl})`);
        report.push({
          slug: p.slug,
          status: "match",
          photographer: match.photographer,
          url: match.unsplashUrl,
        });
      } else {
        const bytes = await downloadImage(match.url, dest);
        await triggerDownload(match.downloadUrl);
        const kb = Math.round(bytes / 1024);
        console.log(`${progress} ${p.slug}: downloaded ${kb}KB (by ${match.photographer})`);
        report.push({
          slug: p.slug,
          status: "downloaded",
          photographer: match.photographer,
          size: `${kb}KB`,
        });
        results.downloaded++;
      }
    } catch (err) {
      console.error(`${progress} ${p.slug}: ERROR - ${err.message}`);
      report.push({ slug: p.slug, status: "error", error: err.message });
      results.errors++;
    }

    await sleep(RATE_LIMIT_MS);
  }

  // Summary
  console.log("\n--- Summary ---");
  console.log(`Matched: ${results.matched}`);
  console.log(`Downloaded: ${results.downloaded}`);
  console.log(`No match: ${results.noMatch}`);
  console.log(`Errors: ${results.errors}`);

  // Save report
  const reportPath = path.join(process.cwd(), "output", "stock-photo-report.json");
  mkdirSync(path.dirname(reportPath), { recursive: true });
  writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\nReport saved to: ${reportPath}`);

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
