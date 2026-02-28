/**
 * Stickers Restructure — February 2026
 *
 * 1. Deactivate 16 products (merged into parent configurators)
 * 2. Rename 4 products for clarity
 *
 * Run: node scripts/stickers-restructure-2026-02.mjs
 * Safe to re-run (idempotent).
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const SLUGS_TO_DEACTIVATE = [
  // Merged into die-cut-stickers (material options)
  "holographic-stickers",
  "stickers-color-on-clear",
  "stickers-color-on-white",
  "clear-singles",
  "foil-stickers",
  "heavy-duty-vinyl-stickers",

  // Merged into kiss-cut-sticker-sheets
  "stickers-multi-on-sheet",

  // Removed (walk-in / quote only)
  "sticker-packs",

  // Merged into vinyl-lettering
  "transfer-vinyl-lettering",

  // Merged into roll-labels
  "sticker-rolls",
  "clear-labels",
  "kraft-paper-labels",
  "white-bopp-labels",
  "barcode-labels",
  "qr-code-labels",
  "freezer-labels",
];

const RENAMES = [
  { slug: "sticker-sheets", newName: "Sticker Sheets (Same Design)" },
  { slug: "kiss-cut-sticker-sheets", newName: "Sticker Sheets (Multiple Designs)" },
  { slug: "vinyl-lettering", newName: "Vinyl Lettering & Decals" },
  { slug: "roll-labels", newName: "Custom Roll Labels" },
];

async function main() {
  console.log("=== Stickers Restructure — February 2026 ===\n");

  // --- Deactivate products ---
  console.log("--- Deactivating merged/removed products ---\n");
  for (const slug of SLUGS_TO_DEACTIVATE) {
    const product = await prisma.product.findFirst({ where: { slug } });
    if (!product) {
      console.log(`  SKIP  ${slug} — not found in DB`);
      continue;
    }
    if (!product.isActive) {
      console.log(`  SKIP  ${slug} — already inactive`);
      continue;
    }

    await prisma.product.update({
      where: { id: product.id },
      data: { isActive: false },
    });

    console.log(`  DONE  ${slug} — deactivated`);
  }

  // --- Rename products ---
  console.log("\n--- Renaming products ---\n");
  for (const { slug, newName } of RENAMES) {
    const result = await prisma.product.updateMany({
      where: { slug },
      data: { name: newName },
    });
    if (result.count > 0) {
      console.log(`  DONE  ${slug} → "${newName}"`);
    } else {
      console.log(`  SKIP  ${slug} — not found`);
    }
  }

  // --- Summary ---
  console.log("\n=== Summary ===");
  const activeCount = await prisma.product.count({ where: { isActive: true } });
  const inactiveCount = await prisma.product.count({ where: { isActive: false } });
  console.log(`  Active products:   ${activeCount}`);
  console.log(`  Inactive products: ${inactiveCount}`);

  // Verify the 6 core sticker products
  const coreSlugs = ["die-cut-stickers", "kiss-cut-stickers", "sticker-sheets", "kiss-cut-sticker-sheets", "roll-labels", "vinyl-lettering"];
  console.log("\n--- Core sticker products status ---");
  for (const slug of coreSlugs) {
    const p = await prisma.product.findFirst({ where: { slug }, select: { name: true, isActive: true } });
    if (p) {
      console.log(`  ${p.isActive ? "✓" : "✗"}  ${slug} — "${p.name}"`);
    } else {
      console.log(`  ✗  ${slug} — NOT FOUND`);
    }
  }

  console.log("\nDone!");
}

main()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
