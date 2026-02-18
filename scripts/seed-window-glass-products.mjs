#!/usr/bin/env node
/**
 * Seed 10 new window/glass film products (replaces old products).
 * Run: node scripts/seed-window-glass-products.mjs
 *
 * Product lineup (4 series):
 *   Light Effect:     transparent-color, dichroic, gradient
 *   Vision Control:   one-way-vision, blockout
 *   Frosted/Specialty: frosted-printed, frosted-static-cling
 *   Standard Opaque:  standard, double-sided, static-cling
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const PRINT_FORMATS = ["ai", "pdf", "eps", "tiff", "jpg", "png"];

// ─── OLD slugs to deactivate ───
const OLD_SLUGS = [
  "clear-static-cling",
  "frosted-static-cling",
  "frosted-matte-window-film",
  "holographic-iridescent-film",
  "color-white-on-clear-vinyl",
  "color-white-color-clear-vinyl",
  "window-graphics-perforated",
  "window-cut-vinyl-lettering",
  "frosted-privacy-window-film",
  "storefront-hours-door-decal-cut-vinyl",
  "window-lettering-business",
  "window-lettering-cut-vinyl",
  "rear-window-perf-graphic-one-way-vision",
  "vehicle-window-tint-graphic",
];

// ─── 10 NEW Products ───
const NEW_PRODUCTS = [
  // ── Series 1: Light Effect (透光效果系列) ──
  {
    slug: "window-graphics-transparent-color",
    name: "Transparent Color Window Film (Stained Glass Effect)",
    nameCn: "幻彩/透明彩窗贴",
    category: "window-glass-films",
    description:
      "CMYK print on transparent film with no white ink backing. Sunlight passes through creating coloured light projections on interior surfaces — like stained-glass windows. Ideal for mall décor, artistic storefronts, and atmospheric displays.",
    basePrice: 700,
    type: "sticker",
    pricingUnit: "per_sqft",
    sortOrder: 1,
    acceptedFormats: PRINT_FORMATS,
    minDpi: 150,
    requiresBleed: true,
    bleedIn: 0.125,
    environment: "indoor",
  },
  {
    slug: "dichroic-window-film",
    name: "Dichroic Window Film (Iridescent)",
    nameCn: "炫彩/变色龙窗膜",
    category: "window-glass-films",
    description:
      "Pre-manufactured dichroic film that shifts colour as the viewing angle changes — pink to blue, yellow to green, and more. Transparent and light-transmitting. Perfect for high-end retail, tech offices, beauty brands, and Instagram-worthy storefronts.",
    basePrice: 1200,
    type: "sticker",
    pricingUnit: "per_sqft",
    sortOrder: 2,
    acceptedFormats: PRINT_FORMATS,
    minDpi: 150,
    requiresBleed: true,
    bleedIn: 0.125,
    environment: "both",
  },
  {
    slug: "gradient-window-film",
    name: "Gradient Window Film (Clear to Color)",
    nameCn: "渐变窗膜",
    category: "window-glass-films",
    description:
      "Transparent film printed with a gradient from solid colour to fully clear. Provides semi-privacy — the tinted portion obscures while the clear portion lets in full light. Great for conference room glass bands, office partitions, and decorative waistlines.",
    basePrice: 650,
    type: "sticker",
    pricingUnit: "per_sqft",
    sortOrder: 3,
    acceptedFormats: PRINT_FORMATS,
    minDpi: 150,
    requiresBleed: true,
    bleedIn: 0.125,
    environment: "both",
  },

  // ── Series 2: Vision Control (视觉控制系列) ──
  {
    slug: "one-way-vision",
    name: "Perforated Window Film (One-Way Vision)",
    nameCn: "单面透窗贴",
    category: "window-glass-films",
    description:
      "Micro-perforated vinyl covered in tiny holes. Outside shows your full-colour graphics; inside looks through clearly (slightly dimmed). Available in 50/50 and 65/35 perforation ratios. UV-resistant for vehicle windows, storefronts, and building facades.",
    basePrice: 550,
    type: "sticker",
    pricingUnit: "per_sqft",
    sortOrder: 4,
    acceptedFormats: PRINT_FORMATS,
    minDpi: 150,
    requiresBleed: true,
    bleedIn: 0.125,
    environment: "both",
  },
  {
    slug: "window-graphics-blockout",
    name: "Blockout Window Vinyl (100% Opaque)",
    nameCn: "黑底白胶遮光窗贴",
    category: "window-glass-films",
    description:
      "Completely opaque vinyl with black/grey adhesive backing. Blocks 100% of light and visibility. Printed in full colour on the display side. Use to fully cover windows, hide old graphics, or create total blackout for warehouses, studios, and privacy screens.",
    basePrice: 500,
    type: "sticker",
    pricingUnit: "per_sqft",
    sortOrder: 5,
    acceptedFormats: PRINT_FORMATS,
    minDpi: 150,
    requiresBleed: true,
    bleedIn: 0.125,
    environment: "both",
  },

  // ── Series 3: Frosted & Specialty (磨砂与特殊质感) ──
  {
    slug: "frosted-window-graphics",
    name: "Printed Frosted Film (Etched Effect)",
    nameCn: "雾化加白字窗贴",
    category: "window-glass-films",
    description:
      "Frosted base film with white ink printing to simulate an etched-glass look. Text and logos appear as if sandblasted into the glass. Ideal for office partitions, privacy strips, conference rooms, and professional branding.",
    basePrice: 600,
    type: "sticker",
    pricingUnit: "per_sqft",
    sortOrder: 6,
    acceptedFormats: PRINT_FORMATS,
    minDpi: 150,
    requiresBleed: true,
    bleedIn: 0.125,
    environment: "indoor",
  },
  {
    slug: "static-cling-frosted",
    name: "Frosted Static Cling (Glue-Free)",
    nameCn: "磨砂静电贴",
    category: "window-glass-films",
    description:
      "Frosted-finish static cling film — no adhesive, holds by static charge alone. Removes and repositions cleanly with zero residue. Perfect for rental spaces, temporary privacy, seasonal displays, and anywhere you need non-permanent frosted glass.",
    basePrice: 450,
    type: "sticker",
    pricingUnit: "per_sqft",
    sortOrder: 7,
    acceptedFormats: PRINT_FORMATS,
    minDpi: 150,
    requiresBleed: true,
    bleedIn: 0.125,
    environment: "indoor",
  },

  // ── Series 4: Standard Opaque (标准实色系列) ──
  {
    slug: "window-graphics-standard",
    name: "Opaque Window Graphics (White Vinyl)",
    nameCn: "正常全彩白胶窗贴",
    category: "window-glass-films",
    description:
      "Standard white vinyl with full-colour CMYK print. Opaque backing ensures the most vivid, accurate colours — graphics look like a poster on glass. The go-to choice for window advertising, promotional posters, and seasonal campaigns.",
    basePrice: 400,
    type: "sticker",
    pricingUnit: "per_sqft",
    sortOrder: 8,
    acceptedFormats: PRINT_FORMATS,
    minDpi: 150,
    requiresBleed: true,
    bleedIn: 0.125,
    environment: "both",
  },
  {
    slug: "window-graphics-double-sided",
    name: "Double-Sided Window Graphics",
    nameCn: "彩白彩双面窗贴",
    category: "window-glass-films",
    description:
      "Three-layer print: Colour + White + Colour on clear vinyl. Both sides display independent full-colour graphics with no bleed-through. Ideal for glass doors (push/pull signs), mall partitions, and any window viewed from both sides.",
    basePrice: 900,
    type: "sticker",
    pricingUnit: "per_sqft",
    sortOrder: 9,
    acceptedFormats: PRINT_FORMATS,
    minDpi: 150,
    requiresBleed: true,
    bleedIn: 0.125,
    environment: "both",
  },
  {
    slug: "static-cling-standard",
    name: "Static Cling (Clear/White)",
    nameCn: "静电贴",
    category: "window-glass-films",
    description:
      "Adhesive-free static cling in clear or white base. Clings to glass by static charge, removes cleanly, and can be repositioned. Available in clear (transparent) or white (opaque). Great for oil-change reminders, seasonal snowflakes, and temporary promos.",
    basePrice: 350,
    type: "sticker",
    pricingUnit: "per_sqft",
    sortOrder: 10,
    acceptedFormats: PRINT_FORMATS,
    minDpi: 150,
    requiresBleed: true,
    bleedIn: 0.125,
    environment: "indoor",
  },
];

async function main() {
  console.log("🪟 Seeding 10 new window/glass film products...\n");

  // 1. Deactivate old window products
  let deactivated = 0;
  for (const slug of OLD_SLUGS) {
    const existing = await prisma.product.findUnique({ where: { slug } });
    if (existing && existing.isActive) {
      await prisma.product.update({
        where: { slug },
        data: { isActive: false },
      });
      console.log(`  ❌ Deactivated: ${slug}`);
      deactivated++;
    }
  }

  // 2. Create new products
  let created = 0;
  let skipped = 0;
  for (const p of NEW_PRODUCTS) {
    const existing = await prisma.product.findUnique({ where: { slug: p.slug } });
    if (existing) {
      // Update existing product instead of skipping
      await prisma.product.update({
        where: { slug: p.slug },
        data: {
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
        },
      });
      console.log(`  🔄 Updated: ${p.name}`);
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

  console.log(`\n✨ Done! Created: ${created}, Updated: ${skipped}, Deactivated: ${deactivated}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
