/**
 * Category Migration Script
 *
 * Breaks `marketing-prints` into 8 proper categories:
 *   business-cards, flyers-postcards, brochures-booklets, menus,
 *   stationery-forms, cards-invitations, stamps, marketing-promo
 *
 * Run: node scripts/migrate-categories.mjs
 * Reverse: node scripts/migrate-categories.mjs --reverse
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const DRY_RUN = process.argv.includes("--dry-run");
const REVERSE = process.argv.includes("--reverse");

// ── Migration rules ──────────────────────────────────────────────
// Each rule: { newCategory, match } where match is either:
//   - { slugPrefix: "..." }  — matches slugs starting with prefix
//   - { slugs: [...] }       — matches exact slugs

const RULES = [
  {
    newCategory: "business-cards",
    match: { slugPrefix: "business-cards" },
    // Catches: business-cards, business-cards-classic, business-cards-gloss, etc.
  },
  {
    newCategory: "stamps",
    match: { slugPrefix: "stamps-" },
  },
  {
    newCategory: "flyers-postcards",
    match: {
      slugs: [
        // Parent slugs
        "flyers", "postcards",
        // Sub-product slugs
        "flyers-small", "flyers-standard", "flyers-large",
        "postcards-standard", "postcards-medium", "postcards-large", "postcards-eddm",
      ],
    },
  },
  {
    newCategory: "brochures-booklets",
    match: {
      slugs: [
        // Parent slugs
        "brochures", "booklets",
        // Sub-product slugs
        "brochures-bi-fold", "brochures-tri-fold", "brochures-z-fold",
        "booklets-saddle-stitch", "booklets-perfect-bound", "booklets-wire-o",
        "catalog-booklets",
      ],
    },
  },
  {
    newCategory: "menus",
    match: {
      slugs: [
        "menus", "menus-flat", "menus-folded", "menus-laminated", "menus-takeout",
      ],
    },
  },
  {
    newCategory: "stationery-forms",
    match: {
      slugs: [
        // Parent slugs
        "envelopes", "presentation-folders",
        // Envelopes sub-products
        "envelopes-10-business", "envelopes-a7-invitation",
        "envelopes-6x9-catalog", "envelopes-9x12-catalog",
        // Presentation folders sub-products
        "presentation-folders-standard", "presentation-folders-reinforced",
        "presentation-folders-legal", "presentation-folders-die-cut",
        // Standalone stationery
        "letterhead-standard", "letterhead",
        "ncr-forms-duplicate", "ncr-forms-triplicate", "ncr-invoices",
        "notepads-custom", "notepads",
        "order-forms-single", "release-forms",
        "cardstock-prints",
      ],
    },
  },
  {
    newCategory: "cards-invitations",
    match: {
      slugs: [
        "gift-certificates", "loyalty-cards", "bookmarks-custom",
        "invitations-flat", "invitation-cards", "certificates",
        "coupons", "bookmarks", "tickets", "greeting-cards",
        "table-display-cards",
      ],
    },
  },
  {
    newCategory: "stamps",
    match: { slugs: ["self-inking-stamps"] },
    // Additional stamps caught by prefix rule above
  },
  // Everything else in marketing-prints → marketing-promo
  // (posters, rack-cards, door-hangers, tags, calendars, magnets, stickers, etc.)
];

async function migrate() {
  console.log(DRY_RUN ? "=== DRY RUN ===" : "=== MIGRATING ===");

  // First, get all marketing-prints products
  const allMp = await prisma.product.findMany({
    where: { category: "marketing-prints" },
    select: { id: true, slug: true, name: true },
    orderBy: { slug: "asc" },
  });

  console.log(`Found ${allMp.length} products in 'marketing-prints'\n`);

  const assigned = new Set();
  const results = {};

  for (const rule of RULES) {
    const matching = allMp.filter((p) => {
      if (assigned.has(p.id)) return false;
      if (rule.match.slugPrefix) return p.slug.startsWith(rule.match.slugPrefix);
      if (rule.match.slugs) return rule.match.slugs.includes(p.slug);
      return false;
    });

    results[rule.newCategory] = matching;
    for (const p of matching) assigned.add(p.id);

    if (matching.length > 0) {
      console.log(`${rule.newCategory} (${matching.length}):`);
      for (const p of matching) {
        console.log(`  - ${p.slug}`);
      }

      if (!DRY_RUN) {
        await prisma.product.updateMany({
          where: { id: { in: matching.map((p) => p.id) } },
          data: { category: rule.newCategory },
        });
      }
    }
    console.log();
  }

  // Catch-all: remaining marketing-prints → marketing-promo
  const remaining = allMp.filter((p) => !assigned.has(p.id));
  if (remaining.length > 0) {
    console.log(`marketing-promo (catch-all, ${remaining.length}):`);
    for (const p of remaining) {
      console.log(`  - ${p.slug}`);
    }

    if (!DRY_RUN) {
      await prisma.product.updateMany({
        where: { id: { in: remaining.map((p) => p.id) } },
        data: { category: "marketing-promo" },
      });
    }
    console.log();
  }

  // Summary
  const total = allMp.length;
  const assignedCount = assigned.size + remaining.length;
  console.log("─── Summary ───");
  for (const [cat, prods] of Object.entries(results)) {
    console.log(`  ${cat}: ${prods.length}`);
  }
  console.log(`  marketing-promo (catch-all): ${remaining.length}`);
  console.log(`  Total: ${assignedCount} / ${total}`);

  if (DRY_RUN) {
    console.log("\n(Dry run — no changes made. Remove --dry-run to apply.)");
  } else {
    console.log("\nDone! Category migration complete.");
  }
}

async function reverse() {
  console.log("=== REVERSING: Setting all new categories back to 'marketing-prints' ===\n");

  const NEW_CATS = [
    "business-cards", "stamps", "flyers-postcards", "brochures-booklets",
    "menus", "stationery-forms", "cards-invitations", "marketing-promo",
  ];

  for (const cat of NEW_CATS) {
    const result = await prisma.product.updateMany({
      where: { category: cat },
      data: { category: "marketing-prints" },
    });
    console.log(`  ${cat}: ${result.count} products → marketing-prints`);
  }

  console.log("\nReverse complete. All products back in 'marketing-prints'.");
}

async function main() {
  try {
    if (REVERSE) {
      await reverse();
    } else {
      await migrate();
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
