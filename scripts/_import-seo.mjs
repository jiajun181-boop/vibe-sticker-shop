/**
 * _import-seo.mjs
 *
 * Reads SEO content from task1-products-seo-content.json and updates
 * matching products in the database via Prisma.
 *
 * Usage:  node scripts/_import-seo.mjs
 */

import { createRequire } from 'module';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const { PrismaClient } = require('@prisma/client');

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// ---------------------------------------------------------------------------
// 1. Read the JSON file
// ---------------------------------------------------------------------------
const jsonPath = join(ROOT, 'docs', 'lalunar-deliverables', 'task1-products-seo-content.json');
const raw = readFileSync(jsonPath, 'utf-8');
const data = JSON.parse(raw);
const products = data.products;

if (!Array.isArray(products) || products.length === 0) {
  console.error('No products found in the JSON file.');
  process.exit(1);
}

console.log(`Loaded ${products.length} products from JSON.\n`);

// ---------------------------------------------------------------------------
// Codex slug → DB slug(s) alias map (parent → children)
// ---------------------------------------------------------------------------
const SLUG_ALIASES = {
  "business-cards": ["business-cards-classic","business-cards-gloss","business-cards-matte","business-cards-soft-touch","business-cards-gold-foil","business-cards-linen","business-cards-pearl","business-cards-thick","magnets-business-card"],
  "brochures": ["brochures-bi-fold","brochures-tri-fold","brochures-z-fold"],
  "menus": ["menus-laminated","menus-takeout"],
  "door-hangers": ["door-hangers-standard","door-hangers-large","door-hangers-perforated"],
  "ncr-forms": ["ncr-forms-duplicate","ncr-forms-triplicate"],
  "greeting-cards-invitations": ["greeting-cards","invitation-cards","invitations-flat"],
  "posters-small-format": ["posters","posters-glossy","posters-matte","posters-adhesive","posters-backlit"],
  "tickets-coupons": ["tickets","coupons","loyalty-cards","cardstock-prints"],
  "calendars": ["calendars-wall-desk","calendars-wall"],
  "table-tents": ["table-tents","table-tents-4x6","table-tent-cards","table-display-cards"],
  "hang-tags": ["hang-tags"],
  "envelopes-10": ["envelopes-standard","envelopes-10-business","envelopes-6x9-catalog","envelopes-9x12-catalog","envelopes-a7-invitation"],
  "letterheads": ["letterhead","letterhead-standard"],
  "paper-labels": ["kraft-paper-labels"],
  "yard-signs-coroplast": ["yard-sign"],
  "real-estate-signs": ["real-estate-sign","real-estate-frame"],
  "construction-signs": [],
  "foam-board-prints": [],
  "a-frame-signs": ["a-frame-sign-stand"],
  "retractable-roll-up-banners": ["roll-up-banners","deluxe-tabletop-retractable-a3"],
  "x-banners": ["x-banner-prints"],
  "tabletop-banners": ["tabletop-displays","deluxe-tabletop-retractable-a3","tabletop-x-banner"],
  "backdrop-step-repeat": ["step-repeat-backdrops","telescopic-backdrop"],
  "custom-tent-10x10": ["outdoor-canopy-tent-10x10"],
  "adjustable-telescopic-backdrop": ["telescopic-backdrop"],
  "fabric-pop-up-display": ["tension-fabric-display-3x3"],
  "canvas-print": ["canvas-standard"],
  "gallery-wrap-canvas": ["canvas-gallery-wrap"],
  "framed-canvas": ["canvas-framed"],
  "multi-panel-canvas": ["canvas-split-2","canvas-panoramic","canvas-collages","triptych-canvas-split"],
  "static-clings": ["static-cling"],
  "window-decals": ["opaque-window-graphics"],
  "one-way-vision-film": ["one-way-vision"],
  "frosted-privacy-film": ["frosted-window-film"],
  "wall-decals": ["wall-graphics"],
  "floor-decals": ["floor-graphics"],
  "custom-vinyl-lettering": ["custom-cut-vinyl-lettering-any-text"],
  "van-truck-logo-decals": ["printed-truck-door-decals-full-color","custom-truck-door-lettering-kit"],
  "fleet-unit-numbers": ["fleet-unit-number-stickers"],
  "truck-door-lettering-kit": ["custom-truck-door-lettering-kit"],
  "equipment-id-decals": ["equipment-id-decals-cut-vinyl","equipment-rating-plates"],
  "magnetic-vehicle-signs": ["magnetic-car-signs","magnetic-truck-door-signs","magnetic-rooftop-sign","magnets-flexible","car-door-magnets-pair"],
};

// ---------------------------------------------------------------------------
// 2. Connect to the database and process each product
// ---------------------------------------------------------------------------
const prisma = new PrismaClient();

let matchedCount = 0;
let notFoundCount = 0;
const unmatchedSlugs = [];

try {
  for (const item of products) {
    const { slug, seoTitle, metaDescription, description } = item;

    if (!slug) {
      console.warn('  [SKIP] Entry missing slug, skipping.');
      continue;
    }

    // Resolve target slugs: direct match first, then aliases
    const targetSlugs = SLUG_ALIASES[slug] || [slug];
    let anyMatched = false;

    for (const dbSlug of targetSlugs) {
      const existing = await prisma.product.findUnique({ where: { slug: dbSlug } });
      if (existing) {
        await prisma.product.update({
          where: { slug: dbSlug },
          data: {
            metaTitle: seoTitle,
            metaDescription,
            description,
          },
        });
        matchedCount++;
        anyMatched = true;
        console.log(`  [OK]  ${slug} -> ${dbSlug}`);
      }
    }

    // Also try direct match if not in alias map
    if (!anyMatched && !SLUG_ALIASES[slug]) {
      const existing = await prisma.product.findUnique({ where: { slug } });
      if (existing) {
        await prisma.product.update({
          where: { slug },
          data: {
            metaTitle: seoTitle,
            metaDescription,
            description,
          },
        });
        matchedCount++;
        anyMatched = true;
        console.log(`  [OK]  ${slug}`);
      }
    }

    if (!anyMatched) {
      notFoundCount++;
      unmatchedSlugs.push(slug);
      console.log(`  [NOT FOUND]  ${slug}`);
    }
  }

  // ---------------------------------------------------------------------------
  // 3. Print summary
  // ---------------------------------------------------------------------------
  console.log('\n========== SUMMARY ==========');
  console.log(`  Matched & updated : ${matchedCount}`);
  console.log(`  Not found         : ${notFoundCount}`);

  if (unmatchedSlugs.length > 0) {
    console.log('\n  Unmatched slugs:');
    for (const s of unmatchedSlugs) {
      console.log(`    - ${s}`);
    }
  }

  console.log('\nDone.');
} catch (err) {
  console.error('Error during import:', err);
  process.exit(1);
} finally {
  await prisma.$disconnect();
}
