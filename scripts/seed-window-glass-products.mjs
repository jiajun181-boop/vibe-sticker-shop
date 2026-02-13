#!/usr/bin/env node
/**
 * Seed new window/glass film products + recategorize existing window products.
 * Run: node scripts/seed-window-glass-products.mjs
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const VINYL_FORMATS = ["ai", "eps", "pdf", "svg"];
const PRINT_FORMATS = ["ai", "pdf", "eps", "tiff", "jpg", "png"];

// ─── NEW Products for window-glass-films category ───
const NEW_PRODUCTS = [
  {
    slug: "clear-static-cling",
    name: "Clear Static Cling",
    category: "window-glass-films",
    description:
      "Repositionable clear static cling — no adhesive. Clings to glass with static charge. Ideal for seasonal promos, storefront signage, and temporary decor. Removes cleanly.",
    basePrice: 1200,
    type: "sticker",
    pricingUnit: "per_sqft",
    sortOrder: 10,
    acceptedFormats: PRINT_FORMATS,
    minDpi: 150,
    requiresBleed: true,
    bleedIn: 0.125,
    environment: "indoor",
  },
  {
    slug: "frosted-static-cling",
    name: "Frosted Static Cling",
    category: "window-glass-films",
    description:
      "Milky frosted static cling film — provides privacy while letting light through. No adhesive, fully removable. Great for office partitions, bathroom windows, and storefront privacy.",
    basePrice: 1400,
    type: "sticker",
    pricingUnit: "per_sqft",
    sortOrder: 11,
    acceptedFormats: PRINT_FORMATS,
    minDpi: 150,
    requiresBleed: true,
    bleedIn: 0.125,
    environment: "indoor",
  },
  {
    slug: "frosted-matte-window-film",
    name: "Frosted Matte Window Film",
    category: "window-glass-films",
    description:
      "Adhesive-backed frosted matte film for permanent privacy and branding. Sandblasted glass effect with optional custom graphics. Durable for long-term interior or exterior use.",
    basePrice: 1800,
    type: "sticker",
    pricingUnit: "per_sqft",
    sortOrder: 12,
    acceptedFormats: PRINT_FORMATS,
    minDpi: 150,
    requiresBleed: true,
    bleedIn: 0.125,
    environment: "both",
  },
  {
    slug: "holographic-iridescent-film",
    name: "Holographic Iridescent Film",
    category: "window-glass-films",
    description:
      "Rainbow holographic film with colour-shifting effect. Turns sunlight into prismatic reflections. Perfect for window displays, event decor, and eye-catching storefronts.",
    basePrice: 2200,
    type: "sticker",
    pricingUnit: "per_sqft",
    sortOrder: 13,
    acceptedFormats: PRINT_FORMATS,
    minDpi: 150,
    requiresBleed: true,
    bleedIn: 0.125,
    environment: "both",
  },
  {
    slug: "color-white-on-clear-vinyl",
    name: "Colour + White on Clear Vinyl",
    category: "window-glass-films",
    description:
      "Full-colour print with white ink backing on optically clear vinyl. Vibrant graphics visible from outside, clean look from inside. Standard for storefront window graphics.",
    basePrice: 2000,
    type: "sticker",
    pricingUnit: "per_sqft",
    sortOrder: 14,
    acceptedFormats: PRINT_FORMATS,
    minDpi: 150,
    requiresBleed: true,
    bleedIn: 0.125,
    environment: "both",
  },
  {
    slug: "color-white-color-clear-vinyl",
    name: "Colour + White + Colour on Clear Vinyl",
    category: "window-glass-films",
    description:
      "Double-sided print on clear vinyl — full-colour graphics visible from BOTH sides. White ink sandwiched between layers prevents bleed-through. Ideal for glass doors, partitions, and hanging window signs.",
    basePrice: 2800,
    type: "sticker",
    pricingUnit: "per_sqft",
    sortOrder: 15,
    acceptedFormats: PRINT_FORMATS,
    minDpi: 150,
    requiresBleed: true,
    bleedIn: 0.125,
    environment: "both",
  },
  {
    slug: "window-graphics-perforated",
    name: "Perforated Window Graphics",
    category: "window-glass-films",
    description:
      "One-way vision perforated vinyl — full graphics from outside, see-through from inside. UV-resistant for storefront windows, office glass, and building facades. Available in 50/50 or 60/40 perforation.",
    basePrice: 1600,
    type: "sticker",
    pricingUnit: "per_sqft",
    sortOrder: 16,
    acceptedFormats: PRINT_FORMATS,
    minDpi: 150,
    requiresBleed: true,
    bleedIn: 0.125,
    environment: "both",
  },
  {
    slug: "window-cut-vinyl-lettering",
    name: "Window Cut Vinyl Lettering",
    category: "window-glass-films",
    description:
      "Precision-cut vinyl letters and logos for storefronts, office doors, and glass partitions. Available in 30+ colours including metallic gold and silver. Indoor or outdoor durability.",
    basePrice: 2000,
    type: "sticker",
    pricingUnit: "per_piece",
    sortOrder: 17,
    acceptedFormats: VINYL_FORMATS,
    minDpi: null,
    requiresBleed: false,
    bleedIn: null,
    environment: "both",
  },
];

// ─── Existing products to MOVE to window-glass-films ───
const RECATEGORIZE = [
  // From facility-asset-labels
  { slug: "frosted-privacy-window-film", newCategory: "window-glass-films", newSortOrder: 2 },
  { slug: "storefront-hours-door-decal-cut-vinyl", newCategory: "window-glass-films", newSortOrder: 3 },
  { slug: "window-lettering-business", newCategory: "window-glass-films", newSortOrder: 4 },
  // From vehicle-branding-advertising (window products)
  { slug: "window-lettering-cut-vinyl", newCategory: "window-glass-films", newSortOrder: 5 },
  { slug: "rear-window-perf-graphic-one-way-vision", newCategory: "window-glass-films", newSortOrder: 6 },
  { slug: "vehicle-window-tint-graphic", newCategory: "window-glass-films", newSortOrder: 7 },
  // Move wall + floor graphics to large-format-graphics
  { slug: "wall-mural-graphic", newCategory: "large-format-graphics", newSortOrder: 10 },
  { slug: "floor-logo-graphic", newCategory: "large-format-graphics", newSortOrder: 11 },
  { slug: "warehouse-floor-safety-graphics", newCategory: "large-format-graphics", newSortOrder: 12 },
  { slug: "floor-direction-arrows-set", newCategory: "large-format-graphics", newSortOrder: 13 },
  { slug: "floor-number-markers-set", newCategory: "large-format-graphics", newSortOrder: 14 },
];

async function main() {
  console.log("🪟 Seeding window & glass film products...\n");

  // 1. Create new products
  let created = 0;
  let skipped = 0;
  for (const p of NEW_PRODUCTS) {
    const existing = await prisma.product.findUnique({ where: { slug: p.slug } });
    if (existing) {
      console.log(`  ⏭  ${p.slug} already exists — skipping`);
      skipped++;
      continue;
    }
    await prisma.product.create({
      data: {
        slug: p.slug,
        name: p.name,
        category: p.category,
        description: p.description,
        basePrice: p.basePrice,
        type: p.type,
        pricingUnit: p.pricingUnit,
        sortOrder: p.sortOrder,
        isActive: true,
        acceptedFormats: p.acceptedFormats,
        minDpi: p.minDpi,
        requiresBleed: p.requiresBleed,
        bleedIn: p.bleedIn,
        images: {
          create: {
            url: `https://placehold.co/600x400/png?text=${encodeURIComponent(p.name.slice(0, 24))}`,
            alt: p.name,
            sortOrder: 0,
          },
        },
      },
    });
    console.log(`  ✅ Created: ${p.name}`);
    created++;
  }

  // 2. Recategorize existing products
  let moved = 0;
  for (const r of RECATEGORIZE) {
    const existing = await prisma.product.findUnique({ where: { slug: r.slug } });
    if (!existing) {
      console.log(`  ⚠️  ${r.slug} not found — cannot recategorize`);
      continue;
    }
    if (existing.category === r.newCategory) {
      console.log(`  ⏭  ${r.slug} already in ${r.newCategory}`);
      continue;
    }
    const oldCat = existing.category;
    await prisma.product.update({
      where: { slug: r.slug },
      data: { category: r.newCategory, sortOrder: r.newSortOrder },
    });
    console.log(`  🔄 Moved: ${r.slug}  ${oldCat} → ${r.newCategory}`);
    moved++;
  }

  console.log(`\n✨ Done! Created: ${created}, Skipped: ${skipped}, Moved: ${moved}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
