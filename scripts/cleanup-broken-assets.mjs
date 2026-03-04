/**
 * cleanup-broken-assets.mjs
 * Checks all Asset URLs by making HEAD requests to the CDN.
 * Deletes assets whose URLs return 404/403 (file gone from UploadThing).
 *
 * Usage:
 *   node scripts/cleanup-broken-assets.mjs          # dry-run (just report)
 *   node scripts/cleanup-broken-assets.mjs --delete  # actually delete broken assets
 */

import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const DELETE_MODE = process.argv.includes("--delete");
const CONCURRENCY = 10; // parallel HEAD requests

async function checkUrl(url) {
  try {
    const res = await fetch(url, { method: "HEAD", redirect: "follow" });
    return { ok: res.ok, status: res.status };
  } catch (err) {
    return { ok: false, status: 0, error: err.message };
  }
}

async function main() {
  console.log(`\n🔍 Fetching all assets from database...\n`);

  const assets = await prisma.asset.findMany({
    select: { id: true, originalName: true, originalUrl: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  console.log(`   Total assets: ${assets.length}`);

  // Filter to those with actual URLs (skip empty / placeholder)
  const toCheck = assets.filter(
    (a) => a.originalUrl && !a.originalUrl.startsWith("/api/placeholder/")
  );
  const alreadyBroken = assets.filter(
    (a) => !a.originalUrl || a.originalUrl.startsWith("/api/placeholder/")
  );

  console.log(`   With CDN URL: ${toCheck.length}`);
  console.log(`   Empty/placeholder URL: ${alreadyBroken.length}`);
  console.log(`\n🌐 Checking CDN URLs (${CONCURRENCY} parallel)...\n`);

  const broken = [];
  const healthy = [];

  // Process in batches
  for (let i = 0; i < toCheck.length; i += CONCURRENCY) {
    const batch = toCheck.slice(i, i + CONCURRENCY);
    const results = await Promise.all(
      batch.map(async (asset) => {
        const result = await checkUrl(asset.originalUrl);
        return { asset, result };
      })
    );

    for (const { asset, result } of results) {
      if (result.ok) {
        healthy.push(asset);
      } else {
        broken.push({ ...asset, status: result.status, error: result.error });
        console.log(
          `   ❌ ${result.status || "ERR"} | ${asset.originalName} | ${asset.originalUrl.slice(0, 80)}...`
        );
      }
    }

    // Progress
    const done = Math.min(i + CONCURRENCY, toCheck.length);
    if (done % 50 === 0 || done === toCheck.length) {
      console.log(`   ... checked ${done}/${toCheck.length}`);
    }
  }

  console.log(`\n📊 Results:`);
  console.log(`   ✅ Healthy: ${healthy.length}`);
  console.log(`   ❌ Broken:  ${broken.length}`);
  console.log(`   ⚠️  Empty:   ${alreadyBroken.length}`);

  if (broken.length === 0 && alreadyBroken.length === 0) {
    console.log(`\n✨ All assets are healthy! Nothing to clean up.\n`);
    await prisma.$disconnect();
    return;
  }

  const toDelete = [...broken, ...alreadyBroken];

  if (!DELETE_MODE) {
    console.log(`\n⚠️  Dry-run mode. Run with --delete to remove ${toDelete.length} broken assets.`);
    console.log(`   node scripts/cleanup-broken-assets.mjs --delete\n`);
    await prisma.$disconnect();
    return;
  }

  // Delete broken assets (cascade deletes AssetLink records too)
  console.log(`\n🗑️  Deleting ${toDelete.length} broken assets...`);
  const ids = toDelete.map((a) => a.id);

  // Delete in batches of 50
  for (let i = 0; i < ids.length; i += 50) {
    const batch = ids.slice(i, i + 50);
    const { count } = await prisma.asset.deleteMany({
      where: { id: { in: batch } },
    });
    console.log(`   Deleted batch: ${count} assets`);
  }

  console.log(`\n✅ Done! Deleted ${ids.length} broken assets from database.\n`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("Fatal error:", err);
  prisma.$disconnect();
  process.exit(1);
});
