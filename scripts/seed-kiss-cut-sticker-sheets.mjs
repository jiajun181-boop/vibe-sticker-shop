/**
 * Seed kiss-cut-sticker-sheets product
 *
 * This product was never in the DB — it needs to be created.
 * Uses sticker-sheets as a template with a multi-design premium.
 *
 * Run: node scripts/seed-kiss-cut-sticker-sheets.mjs
 * Safe to re-run (upsert by slug).
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("=== Seed kiss-cut-sticker-sheets ===\n");

  // Look up the category from an existing sticker product
  const stickerSheets = await prisma.product.findFirst({
    where: { slug: "sticker-sheets" },
    select: { id: true, category: true, type: true, pricingConfig: true, optionsConfig: true },
  });

  if (!stickerSheets) {
    console.error("ERROR: sticker-sheets product not found — cannot determine category");
    process.exit(1);
  }

  console.log(`Using sticker-sheets (id: ${stickerSheets.id}) as template`);
  console.log(`  category: ${stickerSheets.category}`);
  console.log(`  type: ${stickerSheets.type}`);

  // Check if kiss-cut-sticker-sheets already exists
  const existing = await prisma.product.findFirst({
    where: { slug: "kiss-cut-sticker-sheets" },
  });

  if (existing) {
    console.log(`\nProduct already exists (id: ${existing.id}, active: ${existing.isActive})`);
    // Just ensure it's active and has the right name
    await prisma.product.update({
      where: { id: existing.id },
      data: {
        isActive: true,
        name: "Sticker Sheets (Multiple Designs)",
      },
    });
    console.log("  Updated: isActive=true, name='Sticker Sheets (Multiple Designs)'");
  } else {
    console.log("\nCreating new product...");

    // Multi-design sheets are ~10% more expensive than same-design
    // because each design requires separate setup
    const created = await prisma.product.create({
      data: {
        type: stickerSheets.type || "sticker",
        category: stickerSheets.category,
        slug: "kiss-cut-sticker-sheets",
        name: "Sticker Sheets (Multiple Designs)",
        description:
          "Custom sticker sheets with multiple different designs kiss-cut on a single sheet. Perfect for variety packs, product samplers, and promotional sets.",
        basePrice: 3500,
        displayFromPrice: 1999,
        pricingUnit: "per_piece",
        isActive: true,
        sortOrder: 4,
        pricingConfig: {
          fileFee: 5,
          unitPrice: 18,
          minimumPrice: 35,
        },
        optionsConfig: {
          ui: { hideTierPricing: true },
          sizes: [
            {
              label: 'Letter (8.5" × 11")',
              widthIn: 8.5,
              heightIn: 11,
              priceByQty: {
                10: 1999,
                25: 3999,
                50: 6599,
                100: 10599,
                250: 19799,
              },
              quantityChoices: [10, 25, 50, 100, 250],
            },
            {
              label: 'Tabloid (11" × 17")',
              widthIn: 11,
              heightIn: 17,
              priceByQty: {
                10: 2899,
                25: 5799,
                50: 9659,
                100: 15459,
                250: 28999,
              },
              quantityChoices: [10, 25, 50, 100, 250],
            },
          ],
        },
      },
    });

    console.log(`  CREATED: id=${created.id}, slug=${created.slug}`);
  }

  // Verify all 6 core products
  console.log("\n--- Core sticker products status ---");
  const coreSlugs = [
    "die-cut-stickers",
    "kiss-cut-stickers",
    "sticker-sheets",
    "kiss-cut-sticker-sheets",
    "roll-labels",
    "vinyl-lettering",
  ];
  for (const slug of coreSlugs) {
    const p = await prisma.product.findFirst({
      where: { slug },
      select: { name: true, isActive: true },
    });
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
