#!/usr/bin/env node
/**
 * Seed 11 consumer-facing custom sticker products into the "custom-stickers" category.
 * Uses OPTIONS_EXACT_QTY pricing model with explicit price-by-qty tables.
 *
 * Run:  node scripts/seed-custom-stickers.mjs           (dry-run)
 * Run:  node scripts/seed-custom-stickers.mjs --apply   (write to DB)
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const apply = process.argv.includes("--apply");

// ─── Product Definitions ────────────────────────────────────────

const PRODUCTS = [
  // === Consumer-visible (sortOrder 0–6) ===
  {
    slug: "die-cut-singles",
    name: "Custom Die-Cut Stickers",
    description: "Precision die-cut to any shape. Durable waterproof vinyl with vibrant full-color printing.",
    basePrice: 2900,
    sortOrder: 0,
    optionsConfig: {
      pricingModel: "OPTIONS_EXACT_QTY",
      sizes: [
        { label: '2" \u00d7 2"', w: 2, h: 2, priceByQty: { 25: 2900, 50: 3900, 100: 5900, 250: 9900, 500: 15900, 1000: 24900 } },
        { label: '3" \u00d7 3"', w: 3, h: 3, priceByQty: { 25: 3900, 50: 5500, 100: 7900, 250: 13900, 500: 21900, 1000: 34900 } },
        { label: '4" \u00d7 4"', w: 4, h: 4, priceByQty: { 25: 4900, 50: 6900, 100: 9900, 250: 17900, 500: 27900, 1000: 44900 } },
      ],
    },
  },
  {
    slug: "holographic-singles",
    name: "Holographic Stickers",
    description: "Eye-catching rainbow holographic finish. Die-cut to any shape with full-color printing.",
    basePrice: 4100,
    sortOrder: 1,
    optionsConfig: {
      pricingModel: "OPTIONS_EXACT_QTY",
      sizes: [
        { label: '2" \u00d7 2"', w: 2, h: 2, priceByQty: { 25: 4100, 50: 5500, 100: 8300, 250: 13900, 500: 22300, 1000: 34900 } },
        { label: '3" \u00d7 3"', w: 3, h: 3, priceByQty: { 25: 5500, 50: 7700, 100: 11100, 250: 19500, 500: 30700, 1000: 48900 } },
        { label: '4" \u00d7 4"', w: 4, h: 4, priceByQty: { 25: 6900, 50: 9700, 100: 13900, 250: 25100, 500: 39100, 1000: 62900 } },
      ],
    },
  },
  {
    slug: "removable-stickers",
    name: "Kiss-Cut Stickers",
    description: "Easy-peel kiss-cut on backing sheet. Perfect for giveaways, packaging, and branding.",
    basePrice: 2500,
    sortOrder: 2,
    optionsConfig: {
      pricingModel: "OPTIONS_EXACT_QTY",
      sizes: [
        { label: '2" \u00d7 2"', w: 2, h: 2, priceByQty: { 25: 2500, 50: 3500, 100: 5400, 250: 8900, 500: 14400, 1000: 22900 } },
        { label: '3" \u00d7 3"', w: 3, h: 3, priceByQty: { 25: 3500, 50: 4900, 100: 7200, 250: 12500, 500: 19900, 1000: 31900 } },
        { label: '4" \u00d7 6"', w: 4, h: 6, priceByQty: { 25: 4500, 50: 6400, 100: 9500, 250: 16900, 500: 26900, 1000: 42900 } },
      ],
    },
  },
  {
    slug: "sticker-sheets",
    name: "Sticker Sheets",
    description: "Multiple stickers on one sheet. Kiss-cut for easy peeling — great for sets and bundles.",
    basePrice: 2900,
    sortOrder: 3,
    optionsConfig: {
      pricingModel: "OPTIONS_EXACT_QTY",
      sizes: [
        { label: '4" \u00d7 6"', w: 4, h: 6, priceByQty: { 10: 2900, 25: 4900, 50: 7900, 100: 12900, 250: 24900, 500: 39900 } },
        { label: '5" \u00d7 7"', w: 5, h: 7, priceByQty: { 10: 3500, 25: 5900, 50: 9500, 100: 15900, 250: 29900, 500: 47900 } },
        { label: '8.5" \u00d7 11"', w: 8.5, h: 11, priceByQty: { 10: 4900, 25: 7900, 50: 12900, 100: 21900, 250: 39900, 500: 64900 } },
      ],
    },
  },
  {
    slug: "roll-labels",
    name: "Custom Roll Labels",
    description: "Professional labels on rolls. White BOPP — tear-proof, water-resistant, perfect for packaging.",
    basePrice: 15900,
    sortOrder: 4,
    optionsConfig: {
      pricingModel: "OPTIONS_EXACT_QTY",
      sizes: [
        { label: '1" \u00d7 1"', w: 1, h: 1, priceByQty: { 500: 15900, 1000: 25900, 2500: 49900, 5000: 84900, 10000: 149900 } },
        { label: '2" \u00d7 2"', w: 2, h: 2, priceByQty: { 500: 22900, 1000: 37900, 2500: 72900, 5000: 119900, 10000: 209900 } },
        { label: '3" \u00d7 2"', w: 3, h: 2, priceByQty: { 500: 26900, 1000: 44900, 2500: 84900, 5000: 139900, 10000: 244900 } },
      ],
    },
  },
  {
    slug: "window-decals",
    name: "Custom Vinyl Decals",
    description: "Durable vinyl decals for windows, walls, and vehicles. Indoor/outdoor use.",
    basePrice: 999,
    sortOrder: 5,
    optionsConfig: {
      pricingModel: "OPTIONS_EXACT_QTY",
      sizes: [
        { label: '3" \u00d7 3"', w: 3, h: 3, priceByQty: { 1: 999, 5: 3500, 10: 5900, 25: 11900, 50: 19900, 100: 34900 } },
        { label: '6" \u00d7 6"', w: 6, h: 6, priceByQty: { 1: 1599, 5: 5900, 10: 9900, 25: 19900, 50: 34900, 100: 59900 } },
        { label: '12" \u00d7 12"', w: 12, h: 12, priceByQty: { 1: 2999, 5: 11900, 10: 19900, 25: 39900, 50: 69900, 100: 119900 } },
      ],
    },
  },
  {
    slug: "vinyl-lettering",
    name: "Custom Vinyl Lettering",
    description: "Computer-cut vinyl lettering for storefronts, vehicles, and signage. Any font, any color.",
    basePrice: 1500,
    sortOrder: 6,
    optionsConfig: {
      pricingModel: "OPTIONS_EXACT_QTY",
      sizes: [
        { label: '6" \u00d7 2"', w: 6, h: 2, priceByQty: { 1: 1500, 5: 5500, 10: 9900, 25: 19900, 50: 34900, 100: 59900 } },
        { label: '12" \u00d7 3"', w: 12, h: 3, priceByQty: { 1: 2500, 5: 9900, 10: 17900, 25: 34900, 50: 59900, 100: 99900 } },
        { label: '24" \u00d7 6"', w: 24, h: 6, priceByQty: { 1: 4500, 5: 17900, 10: 29900, 25: 59900, 50: 99900, 100: 169900 } },
      ],
    },
  },

  // === Material variants (sortOrder 10+) ===
  {
    slug: "clear-singles",
    name: "Clear Die-Cut Stickers",
    description: "Transparent vinyl stickers — die-cut to shape with a see-through background.",
    basePrice: 3300,
    sortOrder: 10,
    optionsConfig: {
      pricingModel: "OPTIONS_EXACT_QTY",
      sizes: [
        { label: '2" \u00d7 2"', w: 2, h: 2, priceByQty: { 25: 3300, 50: 4500, 100: 6800, 250: 11400, 500: 18300, 1000: 28600 } },
        { label: '3" \u00d7 3"', w: 3, h: 3, priceByQty: { 25: 4500, 50: 6300, 100: 9100, 250: 16000, 500: 25200, 1000: 40100 } },
        { label: '4" \u00d7 4"', w: 4, h: 4, priceByQty: { 25: 5600, 50: 7900, 100: 11400, 250: 20600, 500: 32100, 1000: 51600 } },
      ],
    },
  },
  {
    slug: "clear-labels",
    name: "Clear Roll Labels",
    description: "Transparent BOPP labels on rolls. No-label look for premium packaging.",
    basePrice: 18900,
    sortOrder: 11,
    optionsConfig: {
      pricingModel: "OPTIONS_EXACT_QTY",
      sizes: [
        { label: '1" \u00d7 1"', w: 1, h: 1, priceByQty: { 500: 18900, 1000: 29900, 2500: 57900, 5000: 97900, 10000: 172900 } },
        { label: '2" \u00d7 2"', w: 2, h: 2, priceByQty: { 500: 26900, 1000: 43900, 2500: 83900, 5000: 139900, 10000: 241900 } },
        { label: '3" \u00d7 2"', w: 3, h: 2, priceByQty: { 500: 30900, 1000: 51900, 2500: 97900, 5000: 161900, 10000: 281900 } },
      ],
    },
  },
  {
    slug: "kraft-paper-labels",
    name: "Kraft Paper Labels",
    description: "Natural brown kraft paper labels on rolls. Eco-friendly look for artisan products.",
    basePrice: 16900,
    sortOrder: 12,
    optionsConfig: {
      pricingModel: "OPTIONS_EXACT_QTY",
      sizes: [
        { label: '1" \u00d7 1"', w: 1, h: 1, priceByQty: { 500: 16900, 1000: 27900, 2500: 52900, 5000: 89900, 10000: 157900 } },
        { label: '2" \u00d7 2"', w: 2, h: 2, priceByQty: { 500: 23900, 1000: 39900, 2500: 76900, 5000: 125900, 10000: 219900 } },
        { label: '3" \u00d7 2"', w: 3, h: 2, priceByQty: { 500: 28900, 1000: 47900, 2500: 89900, 5000: 146900, 10000: 256900 } },
      ],
    },
  },
  {
    slug: "floor-decals",
    name: "Floor Decals",
    description: "Anti-slip laminated vinyl decals for floors. Safety-rated for commercial spaces.",
    basePrice: 1449,
    sortOrder: 13,
    optionsConfig: {
      pricingModel: "OPTIONS_EXACT_QTY",
      sizes: [
        { label: '3" \u00d7 3"', w: 3, h: 3, priceByQty: { 1: 1449, 5: 5100, 10: 8600, 25: 17300, 50: 28900, 100: 50600 } },
        { label: '6" \u00d7 6"', w: 6, h: 6, priceByQty: { 1: 2319, 5: 8600, 10: 14400, 25: 28900, 50: 50600, 100: 86900 } },
        { label: '12" \u00d7 12"', w: 12, h: 12, priceByQty: { 1: 4349, 5: 17300, 10: 28900, 25: 57900, 50: 101400, 100: 173900 } },
      ],
    },
  },

  // === New specialty products (sortOrder 14–18) ===
  {
    slug: "sticker-packs",
    name: "Custom Sticker Packs",
    description: "Pre-packaged sticker sets on sheets. Great for retail, events, and promotional bundles.",
    basePrice: 3200,
    sortOrder: 14,
    optionsConfig: {
      pricingModel: "OPTIONS_EXACT_QTY",
      sizes: [
        { label: '4" \u00d7 6"', w: 4, h: 6, priceByQty: { 10: 3200, 25: 5400, 50: 8700, 100: 14200, 250: 27400, 500: 43900 } },
        { label: '5" \u00d7 7"', w: 5, h: 7, priceByQty: { 10: 3900, 25: 6500, 50: 10500, 100: 17500, 250: 32900, 500: 52700 } },
        { label: '8.5" \u00d7 11"', w: 8.5, h: 11, priceByQty: { 10: 5400, 25: 8700, 50: 14200, 100: 24100, 250: 43900, 500: 71400 } },
      ],
    },
  },
  {
    slug: "transfer-stickers",
    name: "Transfer Stickers",
    description: "Transfer vinyl stickers for smooth application on curved and textured surfaces.",
    basePrice: 3500,
    sortOrder: 15,
    optionsConfig: {
      pricingModel: "OPTIONS_EXACT_QTY",
      sizes: [
        { label: '2" \u00d7 2"', w: 2, h: 2, priceByQty: { 25: 3500, 50: 4700, 100: 7100, 250: 11900, 500: 19100, 1000: 29900 } },
        { label: '3" \u00d7 3"', w: 3, h: 3, priceByQty: { 25: 4700, 50: 6600, 100: 9500, 250: 16700, 500: 26300, 1000: 41900 } },
        { label: '4" \u00d7 4"', w: 4, h: 4, priceByQty: { 25: 5900, 50: 8300, 100: 11900, 250: 21500, 500: 33500, 1000: 53900 } },
      ],
    },
  },
  {
    slug: "static-cling-stickers",
    name: "Static Cling Stickers",
    description: "Removable static cling stickers with no adhesive. Easy on, easy off \u2014 perfect for windows and glass.",
    basePrice: 4300,
    sortOrder: 16,
    optionsConfig: {
      pricingModel: "OPTIONS_EXACT_QTY",
      sizes: [
        { label: '3" \u00d7 3"', w: 3, h: 3, priceByQty: { 25: 4300, 50: 6100, 100: 8700, 250: 15300, 500: 24100, 1000: 38400 } },
        { label: '4" \u00d7 4"', w: 4, h: 4, priceByQty: { 25: 5400, 50: 7600, 100: 10900, 250: 19700, 500: 30700, 1000: 49400 } },
        { label: '6" \u00d7 6"', w: 6, h: 6, priceByQty: { 25: 7500, 50: 10600, 100: 15200, 250: 27500, 500: 42900, 1000: 69000 } },
      ],
    },
  },
  {
    slug: "magnet-stickers",
    name: "Magnet Stickers",
    description: "Flexible magnetic vinyl stickers. Stick to any metal surface without adhesive \u2014 reusable and repositionable.",
    basePrice: 2900,
    sortOrder: 17,
    optionsConfig: {
      pricingModel: "OPTIONS_EXACT_QTY",
      sizes: [
        { label: '2" \u00d7 3.5"', w: 2, h: 3.5, priceByQty: { 10: 2900, 25: 4900, 50: 7900, 100: 12900, 250: 24900, 500: 39900 } },
        { label: '4" \u00d7 6"', w: 4, h: 6, priceByQty: { 10: 4900, 25: 8900, 50: 14900, 100: 24900, 250: 44900, 500: 74900 } },
        { label: '5" \u00d7 7"', w: 5, h: 7, priceByQty: { 10: 5900, 25: 10900, 50: 17900, 100: 29900, 250: 54900, 500: 89900 } },
      ],
    },
  },
  {
    slug: "reflective-stickers",
    name: "Reflective Stickers",
    description: "High-visibility reflective vinyl stickers. Reflect light for safety and visibility in low-light conditions.",
    basePrice: 3300,
    sortOrder: 18,
    optionsConfig: {
      pricingModel: "OPTIONS_EXACT_QTY",
      sizes: [
        { label: '2" \u00d7 2"', w: 2, h: 2, priceByQty: { 25: 3300, 50: 4500, 100: 6800, 250: 11400, 500: 18300, 1000: 28600 } },
        { label: '3" \u00d7 3"', w: 3, h: 3, priceByQty: { 25: 4500, 50: 6300, 100: 9100, 250: 16000, 500: 25200, 1000: 40100 } },
        { label: '4" \u00d7 4"', w: 4, h: 4, priceByQty: { 25: 5600, 50: 7900, 100: 11400, 250: 20600, 500: 32100, 1000: 51600 } },
      ],
    },
  },
];

// ─── Main ────────────────────────────────────────────────────────

async function main() {
  console.log(`${apply ? "APPLY" : "DRY-RUN"} — seeding ${PRODUCTS.length} custom sticker products\n`);

  let created = 0;
  let updated = 0;
  let unchanged = 0;

  for (const def of PRODUCTS) {
    const existing = await prisma.product.findUnique({ where: { slug: def.slug } });

    if (existing) {
      // Always update pricing even if already in custom-stickers
      console.log(`  UPD   ${def.slug.padEnd(30)} — update pricing`);
      if (apply) {
        await prisma.product.update({
          where: { slug: def.slug },
          data: {
            category: "custom-stickers",
            name: def.name,
            description: def.description,
            basePrice: def.basePrice,
            sortOrder: def.sortOrder,
            type: "sticker",
            pricingUnit: "per_piece",
            optionsConfig: def.optionsConfig,
          },
        });
      }
      updated++;
    } else {
      // Create new product
      console.log(`  NEW   ${def.slug.padEnd(30)} — create (base: $${(def.basePrice / 100).toFixed(2)})`);
      if (apply) {
        await prisma.product.create({
          data: {
            slug: def.slug,
            name: def.name,
            description: def.description,
            basePrice: def.basePrice,
            category: "custom-stickers",
            type: "sticker",
            pricingUnit: "per_piece",
            isActive: true,
            sortOrder: def.sortOrder,
            optionsConfig: def.optionsConfig,
          },
        });
      }
      created++;
    }
  }

  console.log(`\nDone: ${created} created, ${updated} updated, ${unchanged} unchanged`);
  if (!apply) console.log("  (re-run with --apply to write to DB)");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
