// prisma/seed-pricing-presets.mjs
// Seeds 3 default PricingPresets and assigns them to products by category.
// Safe to re-run — uses upsert on key.

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ─── Default Presets ────────────────────────────────────

const PRESETS = [
  {
    key: "largeformat_roll_default",
    name: "Large Format Roll — Default",
    model: "AREA_TIERED",
    config: {
      tiers: [
        { upToSqft: 4, rate: 2.50 },
        { upToSqft: 12, rate: 2.00 },
        { upToSqft: 32, rate: 1.50 },
        { upToSqft: 100, rate: 1.20 },
        { upToSqft: 9999, rate: 1.00 },
      ],
      fileFee: 5.0,
      minimumPrice: 25.0,
    },
  },
  {
    key: "stickers_default",
    name: "Stickers & Labels — Default",
    model: "QTY_TIERED",
    config: {
      tiers: [
        { minQty: 50, unitPrice: 1.20 },
        { minQty: 100, unitPrice: 0.95 },
        { minQty: 250, unitPrice: 0.80 },
        { minQty: 500, unitPrice: 0.65 },
        { minQty: 1000, unitPrice: 0.50 },
      ],
      fileFee: 0,
      minimumPrice: 25.0,
    },
  },
  {
    key: "business_cards_default",
    name: "Business Cards — Default",
    model: "QTY_OPTIONS",
    config: {
      sizes: [
        {
          label: "3.5x2",
          tiers: [
            { qty: 250, unitPrice: 0.12 },
            { qty: 500, unitPrice: 0.08 },
            { qty: 1000, unitPrice: 0.06 },
            { qty: 2500, unitPrice: 0.045 },
          ],
        },
        {
          label: "3.5x2 (Folded)",
          tiers: [
            { qty: 250, unitPrice: 0.18 },
            { qty: 500, unitPrice: 0.14 },
            { qty: 1000, unitPrice: 0.10 },
          ],
        },
      ],
      addons: [
        { id: "rounded", name: "Rounded Corners", price: 0.02, type: "per_unit" },
        { id: "uv_gloss", name: "UV Gloss Coating", price: 0.03, type: "per_unit" },
        { id: "spot_uv", name: "Spot UV", price: 0.05, type: "per_unit" },
        { id: "foil", name: "Foil Stamping", price: 15.0, type: "flat" },
      ],
      fileFee: 5.0,
      minimumPrice: 15.0,
    },
  },
];

// ─── Category → Preset key mapping ─────────────────────

const CATEGORY_TO_PRESET = {
  // AREA_TIERED — large format, roll-based products
  "vehicle-branding-advertising": "largeformat_roll_default",
  "facility-asset-labels": "largeformat_roll_default",
  "window-graphics": "largeformat_roll_default",
  "large-format-graphics": "largeformat_roll_default",
  "banners-displays": "largeformat_roll_default",

  // QTY_TIERED — stickers, labels, safety decals
  "stickers-labels": "stickers_default",
  "safety-warning-decals": "stickers_default",
  "fleet-compliance-id": "stickers_default",

  // QTY_OPTIONS — paper goods, marketing prints
  "marketing-prints": "business_cards_default",
  "business-forms": "business_cards_default",
  "retail-promo": "business_cards_default",
};

// ─── Main ───────────────────────────────────────────────

async function main() {
  console.log("── Seeding pricing presets ──");

  // Upsert presets
  const presetMap = {};
  for (const p of PRESETS) {
    const row = await prisma.pricingPreset.upsert({
      where: { key: p.key },
      create: { key: p.key, name: p.name, model: p.model, config: p.config },
      update: { name: p.name, model: p.model, config: p.config },
    });
    presetMap[p.key] = row.id;
    console.log(`  ✅ ${p.key} → ${row.id}`);
  }

  // Assign presets to products by category
  console.log("\n── Assigning presets to products ──");
  let assigned = 0;
  let skipped = 0;

  for (const [category, presetKey] of Object.entries(CATEGORY_TO_PRESET)) {
    const presetId = presetMap[presetKey];
    if (!presetId) continue;

    const result = await prisma.product.updateMany({
      where: {
        category,
        pricingPresetId: null, // only assign if not already set
      },
      data: { pricingPresetId: presetId },
    });

    if (result.count > 0) {
      console.log(`  ${category} → ${presetKey}: ${result.count} products`);
      assigned += result.count;
    } else {
      skipped++;
    }
  }

  // Count unassigned
  const unassigned = await prisma.product.count({
    where: { pricingPresetId: null },
  });

  console.log("\n── Summary ──");
  console.log(`  Presets created/updated: ${PRESETS.length}`);
  console.log(`  Products assigned: ${assigned}`);
  console.log(`  Categories with no new assignments: ${skipped}`);
  console.log(`  Products without preset (uses legacy pricing): ${unassigned}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
