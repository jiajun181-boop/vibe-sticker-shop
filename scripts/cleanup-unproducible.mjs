#!/usr/bin/env node
// cleanup-unproducible.mjs
// Deletes products that the factory cannot produce.
// Usage:
//   node scripts/cleanup-unproducible.mjs          # dry-run (list only)
//   node scripts/cleanup-unproducible.mjs --delete  # actually delete

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const DRY_RUN = !process.argv.includes("--delete");

// ── Products to delete by exact slug ──
const EXACT_SLUGS = [
  "parking-lot-stencils",       // LDPE plastic stencil, not a print product
  "valve-tags-engraved",        // Engraved brass/plastic tags, needs engraving machine
  "equipment-rating-plates",    // Metal etched plates, needs engraving machine
  "aisle-markers-hanging",      // Double-sided aluminum hanging signs, hardware product
];

// ── Products to delete by slug pattern ──
const PATTERNS = [
  { label: "Acrylic signs (no UV flatbed printer)", match: "acrylic" },
  { label: "IFTA cab card holders (plastic accessories)", match: "ifta" },
  { label: "Cab card holders (plastic accessories)", match: "cab-card" },
  { label: "Log book / inspection book (not printed)", match: "log-book" },
  { label: "Fleet inspection book (not printed)", match: "inspection-book" },
  { label: "Hours-of-service log holder (plastic)", match: "hours-of-service-log" },
  { label: "Fleet vehicle inspection book (NCR booklet → keep if NCR)", match: "fleet-vehicle-inspection-book" },
];

async function main() {
  console.log(DRY_RUN ? "\n🔍 DRY RUN — listing products to delete:\n" : "\n🗑️  DELETING products...\n");

  // 1. Find exact slug matches
  const exactProducts = await prisma.product.findMany({
    where: { slug: { in: EXACT_SLUGS } },
    select: { id: true, slug: true, name: true, category: true, isActive: true },
  });

  // 2. Find pattern matches
  const allProducts = await prisma.product.findMany({
    select: { id: true, slug: true, name: true, category: true, isActive: true },
  });

  const patternProducts = [];
  for (const p of allProducts) {
    for (const pattern of PATTERNS) {
      if (p.slug.includes(pattern.match) && !exactProducts.find((ep) => ep.id === p.id)) {
        patternProducts.push({ ...p, matchReason: pattern.label });
        break;
      }
    }
  }

  const allToDelete = [...exactProducts, ...patternProducts];

  if (allToDelete.length === 0) {
    console.log("✅ No matching products found. Nothing to delete.");
    await prisma.$disconnect();
    return;
  }

  // Print table
  console.log("Products to delete:");
  console.log("─".repeat(100));
  console.log(
    "Slug".padEnd(35) +
    "Name".padEnd(35) +
    "Category".padEnd(25) +
    "Active"
  );
  console.log("─".repeat(100));

  for (const p of allToDelete) {
    console.log(
      p.slug.padEnd(35) +
      (p.name || "").slice(0, 33).padEnd(35) +
      (p.category || "").padEnd(25) +
      (p.isActive ? "✓" : "✗")
    );
  }
  console.log("─".repeat(100));
  console.log(`Total: ${allToDelete.length} products\n`);

  if (DRY_RUN) {
    console.log("👆 This is a DRY RUN. Run with --delete to actually remove these products.");
    console.log("   node scripts/cleanup-unproducible.mjs --delete\n");
    await prisma.$disconnect();
    return;
  }

  // Actually delete
  const ids = allToDelete.map((p) => p.id);

  // Delete reviews (no cascade)
  const reviewResult = await prisma.review.deleteMany({
    where: { productId: { in: ids } },
  });
  console.log(`Deleted ${reviewResult.count} reviews`);

  // Delete products (ProductImage cascades automatically)
  const productResult = await prisma.product.deleteMany({
    where: { id: { in: ids } },
  });
  console.log(`Deleted ${productResult.count} products (images auto-cascaded)`);

  // Nullify orderItem references (optional field, preserve order history)
  const orderItemResult = await prisma.orderItem.updateMany({
    where: { productId: { in: ids } },
    data: { productId: null },
  });
  if (orderItemResult.count > 0) {
    console.log(`Nullified productId on ${orderItemResult.count} order items (history preserved)`);
  }

  console.log("\n✅ Cleanup complete!\n");
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
