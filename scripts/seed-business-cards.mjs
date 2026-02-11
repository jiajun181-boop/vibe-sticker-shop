// scripts/seed-business-cards.mjs
// Seeds the Business Cards product with 8 card types + multi-name pricing.
// Safe to re-run — upserts preset, skips existing product slug.

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// ─── Anchor pricing: Classic double-sided ────────────────
// 500 pcs = $68.80 → $0.1376/ea
// 1000 pcs = $88.80 → $0.0888/ea

const CLASSIC_DOUBLE_TIERS = [
  { qty: 50,   unitPrice: 0.58 },
  { qty: 100,  unitPrice: 0.368 },
  { qty: 250,  unitPrice: 0.218 },
  { qty: 300,  unitPrice: 0.20 },
  { qty: 500,  unitPrice: 0.1376 },
  { qty: 1000, unitPrice: 0.0888 },
  { qty: 2500, unitPrice: 0.068 },
  { qty: 3000, unitPrice: 0.063 },
  { qty: 4000, unitPrice: 0.057 },
  { qty: 5000, unitPrice: 0.052 },
];

// Card type multipliers relative to classic-double
const CARD_TYPES = [
  { id: "classic",    singleMul: 0.85, doubleMul: 1.0 },
  { id: "gloss",      singleMul: 1.0,  doubleMul: 1.18 },
  { id: "matte",      singleMul: 0.95, doubleMul: 1.12 },
  { id: "soft-touch", singleMul: 1.1,  doubleMul: 1.30 },
  { id: "gold-foil",  singleMul: 1.3,  doubleMul: 1.55 },
  { id: "linen",      singleMul: 1.05, doubleMul: 1.22 },
  { id: "pearl",      singleMul: 1.1,  doubleMul: 1.28 },
];

// Thick cards use layers instead of sides — always double-sided print
const THICK_TYPES = [
  { id: "thick-double-layer", mul: 1.35 },
  { id: "thick-triple-layer", mul: 1.60 },
];

function buildTiers(multiplier) {
  return CLASSIC_DOUBLE_TIERS.map((t) => ({
    qty: t.qty,
    unitPrice: Math.round(t.unitPrice * multiplier * 10000) / 10000,
  }));
}

// ─── Build sizes array ───────────────────────────────────
const sizes = [];

for (const ct of CARD_TYPES) {
  sizes.push({ label: `${ct.id}-single`, tiers: buildTiers(ct.singleMul) });
  sizes.push({ label: `${ct.id}-double`, tiers: buildTiers(ct.doubleMul) });
}

for (const tt of THICK_TYPES) {
  sizes.push({ label: tt.id, tiers: buildTiers(tt.mul) });
}

// ─── PricingPreset config ────────────────────────────────
const PRESET_CONFIG = {
  sizes,
  addons: [
    { id: "rounded",          name: "Rounded Corners",        price: 0.01,  type: "per_unit" },
    { id: "lam-single",       name: "Lamination (Front)",     price: 0.015, type: "per_unit" },
    { id: "lam-double",       name: "Lamination (Both)",      price: 0.025, type: "per_unit" },
    { id: "foil-single",      name: "Gold Foil (Front)",      price: 0.04,  type: "per_unit" },
    { id: "foil-double",      name: "Gold Foil (Both)",       price: 0.07,  type: "per_unit" },
    { id: "triple-layer",     name: "Triple Layer Upgrade",   price: 0.03,  type: "per_unit" },
    { id: "finish-gloss",     name: "Gloss Finish",           price: 0,     type: "flat" },
    { id: "finish-matte",     name: "Matte Finish",           price: 0,     type: "flat" },
    { id: "finish-softtouch", name: "Soft Touch Finish",      price: 0.01,  type: "per_unit" },
  ],
  fileFee: 5.0,
  minimumPrice: 25.0,
  multiName: {
    enabled: true,
    maxNames: 20,
    fileFees: [
      { upToNames: 4,   feePerName: 800 },
      { upToNames: 9,   feePerName: 500 },
      { upToNames: 999, feePerName: 300 },
    ],
  },
};

// ─── Product optionsConfig (UI layout) ───────────────────
const OPTIONS_CONFIG = {
  cardTypes: [
    { id: "classic",    label: "Classic",    desc: "Standard 14pt card stock" },
    { id: "gloss",      label: "Gloss",      desc: "Glossy UV coating" },
    { id: "matte",      label: "Matte",      desc: "Matte finish" },
    { id: "soft-touch", label: "Soft Touch",  desc: "Velvety soft-touch coating" },
    { id: "gold-foil",  label: "Gold Foil",   desc: "Hot foil stamping" },
    { id: "linen",      label: "Linen",      desc: "Textured linen stock" },
    { id: "pearl",      label: "Pearl",      desc: "Pearlescent shimmer finish" },
    { id: "thick",      label: "Thick",      desc: "Double or triple layered" },
  ],
  sidesOptions: [
    { id: "single", label: "Single Side" },
    { id: "double", label: "Double Side" },
  ],
  addonRules: {
    "classic":    ["rounded"],
    "gloss":      ["rounded", "lam-single", "lam-double"],
    "matte":      ["rounded", "lam-single", "lam-double"],
    "soft-touch": ["rounded", "lam-single", "lam-double"],
    "gold-foil":  ["rounded", "lam-single", "lam-double", "foil-single", "foil-double"],
    "linen":      ["rounded"],
    "pearl":      ["rounded"],
    "thick":      ["rounded", "lam-single", "lam-double", "finish-gloss", "finish-matte", "finish-softtouch"],
  },
  thickLayers: [
    { id: "double-layer", label: "Double Layer" },
    { id: "triple-layer", label: "Triple Layer" },
  ],
  multiName: {
    enabled: true,
    maxNames: 20,
    fileFees: [
      { upToNames: 4,   feePerName: 800 },
      { upToNames: 9,   feePerName: 500 },
      { upToNames: 999, feePerName: 300 },
    ],
  },
  quantityChoices: [50, 100, 250, 300, 500, 1000, 2500, 3000, 4000, 5000],
};

// ─── Main ────────────────────────────────────────────────
async function main() {
  console.log("── Seeding Business Cards ──\n");

  // 1. Upsert pricing preset
  const preset = await prisma.pricingPreset.upsert({
    where: { key: "business_cards_premium" },
    create: {
      key: "business_cards_premium",
      name: "Business Cards — Premium (8 Types + Multi-Name)",
      model: "QTY_OPTIONS",
      config: PRESET_CONFIG,
    },
    update: {
      name: "Business Cards — Premium (8 Types + Multi-Name)",
      config: PRESET_CONFIG,
    },
  });
  console.log(`  ✅ Preset: ${preset.key} (${preset.id})`);

  // 2. Create product (skip if exists)
  const existing = await prisma.product.findUnique({ where: { slug: "business-cards" } });
  if (existing) {
    // Update existing product
    await prisma.product.update({
      where: { slug: "business-cards" },
      data: {
        name: "Business Cards",
        category: "marketing-prints",
        description: "Premium business cards with 8 card types. Choose from Classic, Gloss, Matte, Soft Touch, Gold Foil, Linen, Pearl, or Thick layered options. Multi-name ordering available — combine team designs for volume pricing.",
        pricingUnit: "per_piece",
        basePrice: 1376,
        isActive: true,
        optionsConfig: OPTIONS_CONFIG,
        pricingPresetId: preset.id,
        sortOrder: 1,
      },
    });
    console.log(`  ✅ Product updated: business-cards`);
  } else {
    await prisma.product.create({
      data: {
        slug: "business-cards",
        name: "Business Cards",
        category: "marketing-prints",
        description: "Premium business cards with 8 card types. Choose from Classic, Gloss, Matte, Soft Touch, Gold Foil, Linen, Pearl, or Thick layered options. Multi-name ordering available — combine team designs for volume pricing.",
        pricingUnit: "per_piece",
        basePrice: 1376,
        isActive: true,
        optionsConfig: OPTIONS_CONFIG,
        pricingPresetId: preset.id,
        sortOrder: 1,
        type: "print",
        acceptedFormats: ["ai", "pdf", "eps", "psd", "tiff", "jpg", "png"],
        minDpi: 300,
        requiresBleed: true,
        bleedIn: 0.125,
      },
    });
    console.log(`  ✅ Product created: business-cards`);
  }

  // 3. Verify
  const check = await prisma.product.findUnique({
    where: { slug: "business-cards" },
    include: { pricingPreset: true },
  });
  console.log(`\n  Product: ${check.name} (${check.slug})`);
  console.log(`  Category: ${check.category}`);
  console.log(`  Preset: ${check.pricingPreset?.key} (${check.pricingPreset?.model})`);
  console.log(`  Sizes: ${check.pricingPreset?.config?.sizes?.length} variants`);
  console.log(`  Addons: ${check.pricingPreset?.config?.addons?.length} options`);
  console.log(`  Multi-name: ${check.optionsConfig?.multiName?.enabled ? "enabled" : "disabled"}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
