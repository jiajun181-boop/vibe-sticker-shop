// prisma/import-config-products.mjs
// Additive import — creates new products from config/products.js
// NEVER deletes or overwrites existing DB rows.
// Sets tags on existing products if tags are empty.

import { PrismaClient } from "@prisma/client";
import { PRODUCTS } from "../config/products.js";

const prisma = new PrismaClient();

// ─── Enum helpers ────────────────────────────────────────

function inferType(category) {
  if (/sticker/.test(category)) return "sticker";
  if (/label/.test(category)) return "label";
  if (/sign|rigid/.test(category)) return "sign";
  return "other";
}

function inferUnit(p) {
  if (p.pricingModel === "area_tier") return "per_sqft";
  if (p.pricingUnit) return p.pricingUnit;
  return "per_piece";
}

function inferBasePrice(p) {
  const min = p.config?.minimumPrice;
  if (typeof min === "number" && min > 0) return Math.round(min * 100);
  return 0;
}

// ─── Placeholder images (colored per category) ──────────

const CAT_COLORS = {
  "stickers-labels": "F97316/FFFFFF",
  "rigid-signs": "0EA5E9/FFFFFF",
  "banners-displays": "DC2626/FFFFFF",
  "marketing-prints": "EC4899/FFFFFF",
  packaging: "10B981/FFFFFF",
  "window-graphics": "06B6D4/FFFFFF",
  displays: "6366F1/FFFFFF",
  "business-forms": "7C3AED/FFFFFF",
  "retail-promo": "D946EF/FFFFFF",
  "large-format-graphics": "14B8A6/FFFFFF",
  "vehicle-branding-advertising": "F59E0B/FFFFFF",
  "safety-warning-decals": "EF4444/FFFFFF",
  "fleet-compliance-id": "3B82F6/FFFFFF",
  "facility-asset-labels": "8B5CF6/FFFFFF",
};

function placeholderUrl(name, category) {
  const pair = CAT_COLORS[category] || "6B7280/FFFFFF";
  const text = encodeURIComponent((name || "Product").slice(0, 28));
  return `https://placehold.co/600x400/${pair}/png?text=${text}`;
}

// ─── File specs helper (same logic as seed.mjs) ─────────

function getSpecs(name, type) {
  const n = (name || "").toLowerCase();
  const isCutVinyl = n.includes("cut vinyl") || type === "label" || n.includes("lettering");
  if (isCutVinyl) {
    return { acceptedFormats: ["ai", "eps", "pdf", "svg"], minDpi: null, requiresBleed: false, bleedIn: null };
  }
  return { acceptedFormats: ["ai", "pdf", "eps", "tiff", "jpg", "png"], minDpi: 150, requiresBleed: true, bleedIn: 0.125 };
}

// ─── Tag inference ──────────────────────────────────────

const TAG_RULES = [
  // Real estate
  { match: /yard-sign|rider|open-house|real-estate|lawn-sign|directional-arrow/, tags: ["real-estate"] },
  // Safety & Construction
  { match: /safety|ghs|no-smoking|construction-site|ppe|hazard|compliance/, tags: ["safety", "construction"] },
  // Restaurant
  { match: /menu|table-tent|table-display/, tags: ["restaurants", "retail"] },
  // Fleet / Automotive
  { match: /cvor|dot-number|fleet|unit-number|magnetic-car|car-graphic|vehicle/, tags: ["fleet", "automotive"] },
  // Event
  { match: /banner|flag|backdrop|step-repeat|tent|media-wall|pop-up/, tags: ["event"] },
  // Facility
  { match: /floor-decal|floor-graphic|wayfinding|wall-mural|wall-graphic|frosted-privacy/, tags: ["facility"] },
  // Retail
  { match: /wobbler|dangler|shelf-talker|hang-tag|coupon|ticket|window-graphic/, tags: ["retail"] },
  // Medical
  { match: /medical|hospital|clinic/, tags: ["medical"] },
  // Education
  { match: /certificate|bookmark|calendar/, tags: ["education"] },
  // Beauty
  { match: /beauty|salon|spa/, tags: ["beauty"] },
  // Finance
  { match: /invoice|ncr|letterhead|order-form|receipt/, tags: ["finance"] },
];

// Category-level default tags
const CATEGORY_TAGS = {
  "stickers-labels": ["retail"],
  "rigid-signs": ["real-estate", "construction", "retail"],
  "banners-displays": ["event"],
  "marketing-prints": ["retail"],
  "packaging": ["retail"],
  "window-graphics": ["retail", "restaurants"],
  "displays": ["event", "retail"],
  "business-forms": ["finance"],
  "retail-promo": ["retail", "restaurants"],
  "large-format-graphics": ["retail", "facility"],
  "vehicle-branding-advertising": ["fleet", "automotive"],
  "safety-warning-decals": ["safety", "construction"],
  "fleet-compliance-id": ["fleet"],
  "facility-asset-labels": ["facility"],
};

function inferTags(product) {
  // If the config product already has tags, use those
  if (product.tags && Array.isArray(product.tags) && product.tags.length > 0) {
    return product.tags;
  }

  const slug = product.product || "";
  const name = (product.name || "").toLowerCase();
  const combined = `${slug} ${name}`;
  const tagSet = new Set();

  // Apply slug/name-based rules
  for (const rule of TAG_RULES) {
    if (rule.match.test(combined)) {
      rule.tags.forEach(t => tagSet.add(t));
    }
  }

  // Apply category-level defaults if no specific tags matched
  if (tagSet.size === 0) {
    const catTags = CATEGORY_TAGS[product.category] || [];
    catTags.forEach(t => tagSet.add(t));
  }

  return [...tagSet];
}

// ─── Main ────────────────────────────────────────────────

async function main() {
  const before = await prisma.product.count();
  console.log(`📦 Products currently in DB: ${before}`);
  console.log(`📋 Products in config/products.js: ${PRODUCTS.length}`);
  console.log("─".repeat(50));

  let created = 0;
  let skipped = 0;
  let tagged = 0;
  let errors = 0;

  for (const p of PRODUCTS) {
    const slug = p.product;
    if (!slug) {
      console.warn(`⚠  Skipping entry without slug: ${p.name || "(no name)"}`);
      skipped++;
      continue;
    }

    const tags = inferTags(p);

    // Check if slug already exists
    const existing = await prisma.product.findUnique({ where: { slug } });
    if (existing) {
      // If existing product has empty tags, backfill them
      if ((!existing.tags || existing.tags.length === 0) && tags.length > 0) {
        try {
          await prisma.product.update({
            where: { slug },
            data: { tags },
          });
          tagged++;
        } catch (err) {
          console.error(`❌ Tag update ${slug}: ${err.message}`);
          errors++;
        }
      }
      skipped++;
      continue;
    }

    const type = inferType(p.category);
    const specs = getSpecs(p.name, type);

    try {
      await prisma.product.create({
        data: {
          slug,
          name: p.name || slug,
          description: p.description || null,
          category: p.category || "other",
          type: inferType(p.category),
          pricingUnit: inferUnit(p),
          basePrice: inferBasePrice(p),
          isActive: true,
          sortOrder: 0,
          acceptedFormats: specs.acceptedFormats,
          minDpi: specs.minDpi,
          requiresBleed: specs.requiresBleed,
          bleedIn: specs.bleedIn,
          pricingConfig: p.config || undefined,
          optionsConfig: p.options || undefined,
          tags,
          images: {
            create: [{ url: placeholderUrl(p.name, p.category), alt: p.name || slug }],
          },
        },
      });
      created++;
    } catch (err) {
      console.error(`❌ ${slug}: ${err.message}`);
      errors++;
    }
  }

  const after = await prisma.product.count();
  console.log("─".repeat(50));
  console.log(`✅ Created: ${created}`);
  console.log(`🏷  Tags backfilled: ${tagged}`);
  console.log(`⏭  Skipped (already exists): ${skipped}`);
  if (errors) console.log(`❌ Errors: ${errors}`);
  console.log(`📊 Total products in DB now: ${after}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
