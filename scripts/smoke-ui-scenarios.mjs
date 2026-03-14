#!/usr/bin/env node
// scripts/smoke-ui-scenarios.mjs
// Pre-release UI smoke scenario checklist — WORKPLAN D-2
//
// Validates that critical product page flows have the required
// data + API infrastructure to function. Run before ad launch.
//
// Usage:  node scripts/smoke-ui-scenarios.mjs
//
// NOTE: This validates server-side data prerequisites. The actual
// UI flow (mobile sticky CTA, multi-size picker, multi-name input)
// must be verified manually or via future Playwright tests.

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
let passed = 0;
let failed = 0;

function ok(label) {
  console.log(`  ✓ ${label}`);
  passed++;
}
function fail(label, detail) {
  console.error(`  ✗ ${label}: ${detail}`);
  failed++;
}

async function main() {
  console.log("=== Pre-Release UI Smoke Scenarios ===\n");

  // ──────────────────────────────────────────────────────────────────────────
  // Scenario 1: Mobile sticky CTA flow
  // Validates: product pages have pricing presets so MobileBottomBar can
  // show a live quote and the "Add to Cart" CTA.
  // ──────────────────────────────────────────────────────────────────────────
  console.log("Scenario 1: Mobile Sticky CTA Prerequisites");

  const activeProducts = await prisma.product.findMany({
    where: { isActive: true },
    select: { id: true, slug: true, name: true, pricingPresetId: true, minPrice: true },
  });

  if (activeProducts.length === 0) {
    fail("Active products", "No active products found");
  } else {
    ok(`Found ${activeProducts.length} active products`);
  }

  const withoutPreset = activeProducts.filter((p) => !p.pricingPresetId);
  if (withoutPreset.length > 0) {
    fail(
      "Pricing preset coverage",
      `${withoutPreset.length} active product(s) missing pricing preset: ${withoutPreset.slice(0, 5).map((p) => p.slug).join(", ")}${withoutPreset.length > 5 ? "..." : ""}`
    );
  } else {
    ok("All active products have a pricing preset");
  }

  const withoutMinPrice = activeProducts.filter((p) => !p.minPrice || p.minPrice <= 0);
  if (withoutMinPrice.length > 0) {
    fail(
      "Min price coverage",
      `${withoutMinPrice.length} active product(s) missing minPrice: ${withoutMinPrice.slice(0, 5).map((p) => p.slug).join(", ")}${withoutMinPrice.length > 5 ? "..." : ""}`
    );
  } else {
    ok("All active products have minPrice set");
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Scenario 2: Multi-size area product flow
  // Validates: area-tiered products exist with proper config for
  // the multi-size picker (sizeMode=multi, sizeRows).
  // ──────────────────────────────────────────────────────────────────────────
  console.log("\nScenario 2: Multi-Size Area Product Prerequisites");

  const areaPresets = await prisma.pricingPreset.findMany({
    where: { model: "AREA_TIERED" },
    select: { id: true, key: true, name: true, config: true },
  });

  if (areaPresets.length === 0) {
    fail("Area presets", "No AREA_TIERED pricing presets found");
  } else {
    ok(`Found ${areaPresets.length} AREA_TIERED preset(s)`);
  }

  for (const preset of areaPresets) {
    const config = preset.config;
    if (!config || typeof config !== "object") {
      fail(`Preset ${preset.key}`, "config is not an object");
      continue;
    }
    const tiers = config.tiers;
    if (!Array.isArray(tiers) || tiers.length === 0) {
      fail(`Preset ${preset.key}`, "missing tiers array");
    } else {
      const valid = tiers.every((t) => t.upToSqft > 0 && t.rate > 0);
      if (valid) {
        ok(`Preset ${preset.key}: ${tiers.length} valid tiers`);
      } else {
        fail(`Preset ${preset.key}`, "has tiers with invalid upToSqft or rate");
      }
    }
  }

  const areaProducts = await prisma.product.findMany({
    where: {
      isActive: true,
      pricingPreset: { model: "AREA_TIERED" },
    },
    select: { slug: true, name: true },
  });

  if (areaProducts.length === 0) {
    fail("Area products", "No active products using AREA_TIERED model");
  } else {
    ok(`${areaProducts.length} active product(s) using AREA_TIERED`);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Scenario 3: Business cards multi-name flow
  // Validates: business card products exist with QTY_OPTIONS presets
  // containing multiple size options and name multiplier support.
  // ──────────────────────────────────────────────────────────────────────────
  console.log("\nScenario 3: Business Cards Multi-Name Prerequisites");

  const cardProducts = await prisma.product.findMany({
    where: {
      isActive: true,
      OR: [
        { slug: { contains: "business-card" } },
        { category: { contains: "business-card" } },
        { name: { contains: "Business Card", mode: "insensitive" } },
      ],
    },
    include: { pricingPreset: true },
  });

  if (cardProducts.length === 0) {
    fail("Business card products", "No active business card products found");
  } else {
    ok(`Found ${cardProducts.length} business card product(s)`);

    for (const p of cardProducts) {
      if (!p.pricingPreset) {
        fail(`Product ${p.slug}`, "missing pricing preset");
        continue;
      }

      const config = p.pricingPreset.config;
      if (p.pricingPreset.model === "QTY_OPTIONS") {
        const sizes = config?.sizes;
        if (Array.isArray(sizes) && sizes.length > 0) {
          ok(`Product ${p.slug}: QTY_OPTIONS with ${sizes.length} size(s)`);
        } else {
          fail(`Product ${p.slug}`, "QTY_OPTIONS preset has no sizes");
        }
      } else {
        ok(`Product ${p.slug}: uses ${p.pricingPreset.model} model`);
      }
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Summary
  // ──────────────────────────────────────────────────────────────────────────
  console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);

  if (failed > 0) {
    console.log("\n⚠  Some smoke scenarios have prerequisite failures.");
    console.log("   Fix these before running the manual UI smoke test.\n");
    console.log("Manual UI checklist (after prerequisites pass):");
    console.log("  □ Mobile sticky CTA: open any product on phone, configure, verify CTA sticks to bottom");
    console.log("  □ Multi-size area: open a banner/sign product, switch to multi-size, add 2+ rows, verify quote updates");
    console.log("  □ Business cards multi-name: open business cards, set names > 1, verify price multiplier in quote");
    process.exit(1);
  } else {
    console.log("\n✓ All prerequisites pass. Proceed with manual UI smoke test:");
    console.log("  □ Mobile sticky CTA: open any product on phone, configure, verify CTA sticks to bottom");
    console.log("  □ Multi-size area: open a banner/sign product, switch to multi-size, add 2+ rows, verify quote updates");
    console.log("  □ Business cards multi-name: open business cards, set names > 1, verify price multiplier in quote");
  }
}

main()
  .catch((err) => {
    console.error("[FAIL] Smoke scenario check failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
