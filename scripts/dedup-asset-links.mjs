#!/usr/bin/env node
/**
 * Deduplicate AssetLink records.
 *
 * Groups by (assetId, entityType, entityId, purpose) and keeps only the row
 * with the lowest sortOrder in each group, deleting the rest.
 *
 * Usage:
 *   node scripts/dedup-asset-links.mjs            # dry-run (default)
 *   node scripts/dedup-asset-links.mjs --execute   # actually delete duplicates
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const execute = process.argv.includes("--execute");

async function main() {
  console.log(`AssetLink dedup — mode: ${execute ? "EXECUTE" : "DRY-RUN"}\n`);

  const allLinks = await prisma.assetLink.findMany({
    orderBy: { sortOrder: "asc" },
  });

  // Group by (assetId, entityType, entityId, purpose)
  const groups = new Map();
  for (const link of allLinks) {
    const key = `${link.assetId}|${link.entityType}|${link.entityId}|${link.purpose}`;
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key).push(link);
  }

  const toDelete = [];
  for (const [key, links] of groups) {
    if (links.length > 1) {
      // Keep the first (lowest sortOrder), delete the rest
      const [keep, ...dupes] = links;
      console.log(
        `Group "${key}": keeping id=${keep.id} (sortOrder=${keep.sortOrder}), deleting ${dupes.length} duplicate(s)`
      );
      toDelete.push(...dupes.map((d) => d.id));
    }
  }

  if (toDelete.length === 0) {
    console.log("No duplicates found.");
    return;
  }

  console.log(`\nTotal duplicates to remove: ${toDelete.length}`);

  if (execute) {
    const result = await prisma.assetLink.deleteMany({
      where: { id: { in: toDelete } },
    });
    console.log(`Deleted ${result.count} duplicate AssetLink record(s).`);
  } else {
    console.log("Run with --execute to actually delete these records.");
  }
}

main()
  .catch((err) => {
    console.error("Error:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
