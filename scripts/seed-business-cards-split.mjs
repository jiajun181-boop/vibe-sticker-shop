// scripts/seed-business-cards-split.mjs
// Splits the single business-cards product into 8 separate products (one per card type).
// Shares the existing business_cards_premium PricingPreset.
// Safe to re-run — upserts all records.

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// Classic-double anchor tiers ($/ea)
const CLASSIC_DOUBLE_TIERS = [
  { qty: 50, unitPrice: 0.58 },
  { qty: 100, unitPrice: 0.368 },
  { qty: 250, unitPrice: 0.218 },
  { qty: 300, unitPrice: 0.20 },
  { qty: 500, unitPrice: 0.1376 },
  { qty: 1000, unitPrice: 0.0888 },
  { qty: 2500, unitPrice: 0.068 },
  { qty: 3000, unitPrice: 0.063 },
  { qty: 4000, unitPrice: 0.057 },
  { qty: 5000, unitPrice: 0.052 },
];

const QTY_CHOICES = [50, 100, 250, 300, 500, 1000, 2500, 3000, 4000, 5000];

const MULTI_NAME = {
  enabled: true,
  maxNames: 20,
  fileFees: [
    { upToNames: 4, feePerName: 800 },
    { upToNames: 9, feePerName: 500 },
    { upToNames: 999, feePerName: 300 },
  ],
};

// ─── Product definitions ──────────────────────────────────
const PRODUCTS = [
  {
    slug: "business-cards-classic",
    name: "Classic Business Cards",
    sortOrder: 1,
    doubleMul: 1.0,
    sizePrefix: "classic",
    allowedAddons: ["rounded"],
    description:
      "Professional 14pt card stock with a clean, timeless finish. The industry standard for business networking. Crisp printing with sharp text and vibrant colors.",
    specs: {
      dimensions: '3.5 × 2 inches (89 × 51 mm) — North American standard',
      paper: "14pt C2S card stock",
      finish: "Uncoated (writable surface)",
      corners: "Square (rounded corners available)",
    },
  },
  {
    slug: "business-cards-gloss",
    name: "Gloss Business Cards",
    sortOrder: 2,
    doubleMul: 1.18,
    sizePrefix: "gloss",
    allowedAddons: ["rounded", "lam-single", "lam-double"],
    description:
      "Vibrant UV-coated finish that makes colors pop and photos shine. Water-resistant with a polished, eye-catching look. Ideal for photographers, designers, and creative professionals.",
    specs: {
      dimensions: '3.5 × 2 inches (89 × 51 mm) — North American standard',
      paper: "14pt C2S card stock",
      finish: "Glossy UV coating (both sides)",
      corners: "Square (rounded corners available)",
    },
  },
  {
    slug: "business-cards-matte",
    name: "Matte Business Cards",
    sortOrder: 3,
    doubleMul: 1.12,
    sizePrefix: "matte",
    allowedAddons: ["rounded", "lam-single", "lam-double"],
    description:
      "Elegant matte finish for a sophisticated, non-reflective look. Easy to write on and fingerprint-resistant. Perfect for minimalist and corporate designs.",
    specs: {
      dimensions: '3.5 × 2 inches (89 × 51 mm) — North American standard',
      paper: "14pt C2S card stock",
      finish: "Matte coating (smooth, non-reflective)",
      corners: "Square (rounded corners available)",
    },
  },
  {
    slug: "business-cards-soft-touch",
    name: "Soft Touch Business Cards",
    sortOrder: 4,
    doubleMul: 1.30,
    sizePrefix: "soft-touch",
    allowedAddons: ["rounded", "lam-single", "lam-double"],
    description:
      "Premium velvety coating that feels luxurious to the touch. Creates a memorable tactile impression that sets you apart. The go-to choice for luxury brands and executives.",
    specs: {
      dimensions: '3.5 × 2 inches (89 × 51 mm) — North American standard',
      paper: "16pt C2S card stock",
      finish: "Soft-touch lamination (velvet feel)",
      corners: "Square (rounded corners available)",
    },
  },
  {
    slug: "business-cards-gold-foil",
    name: "Gold Foil Business Cards",
    sortOrder: 5,
    doubleMul: 1.55,
    sizePrefix: "gold-foil",
    allowedAddons: ["rounded", "lam-single", "lam-double", "foil-single", "foil-double"],
    description:
      "Hot foil stamping adds metallic brilliance to your design. Available for logos, text, borders, or full-coverage patterns. Makes a bold statement for premium brands.",
    specs: {
      dimensions: '3.5 × 2 inches (89 × 51 mm) — North American standard',
      paper: "16pt C2S card stock",
      finish: "Hot foil stamping (gold metallic)",
      corners: "Square (rounded corners available)",
    },
  },
  {
    slug: "business-cards-linen",
    name: "Linen Business Cards",
    sortOrder: 6,
    doubleMul: 1.22,
    sizePrefix: "linen",
    allowedAddons: ["rounded"],
    description:
      "Textured linen stock with a woven pattern that adds depth and character. A refined, classic texture that conveys tradition and craftsmanship.",
    specs: {
      dimensions: '3.5 × 2 inches (89 × 51 mm) — North American standard',
      paper: "14pt linen-textured stock",
      finish: "Natural linen texture (woven pattern)",
      corners: "Square (rounded corners available)",
    },
  },
  {
    slug: "business-cards-pearl",
    name: "Pearl Business Cards",
    sortOrder: 7,
    doubleMul: 1.28,
    sizePrefix: "pearl",
    allowedAddons: ["rounded"],
    description:
      "Pearlescent shimmer finish that catches light beautifully. A subtle iridescent effect for a premium feel. Ideal for beauty, fashion, and luxury industries.",
    specs: {
      dimensions: '3.5 × 2 inches (89 × 51 mm) — North American standard',
      paper: "14pt pearlescent stock",
      finish: "Pearlescent shimmer (iridescent)",
      corners: "Square (rounded corners available)",
    },
  },
  {
    slug: "business-cards-thick",
    name: "Thick Layered Business Cards",
    sortOrder: 8,
    doubleMul: 1.35, // double-layer
    sizePrefix: "thick",
    isThick: true,
    allowedAddons: ["rounded", "lam-single", "lam-double", "finish-gloss", "finish-matte", "finish-softtouch"],
    description:
      "Double or triple layered card stock for a substantial, ultra-premium card. The extra thickness makes a powerful first impression. Color core options available for a distinctive edge.",
    specs: {
      dimensions: '3.5 × 2 inches (89 × 51 mm) — North American standard',
      paper: "32pt+ multi-layered stock",
      finish: "Choose gloss, matte, or soft-touch outer finish",
      corners: "Square (rounded corners available)",
    },
  },
];

function buildOptionsConfig(prod) {
  const sizes = prod.isThick
    ? [
        { label: "thick-double-layer", displayLabel: "Double Layer", id: "double-layer" },
        { label: "thick-triple-layer", displayLabel: "Triple Layer", id: "triple-layer" },
      ]
    : [
        { label: `${prod.sizePrefix}-single`, displayLabel: "Single Side", id: "single" },
        { label: `${prod.sizePrefix}-double`, displayLabel: "Double Side", id: "double" },
      ];

  return {
    sizes,
    quantityChoices: QTY_CHOICES,
    multiName: MULTI_NAME,
    specs: prod.specs,
    ui: {
      hideTierPricing: true,
      hideMaterials: true,
      hideFinishings: true,
      allowedAddons: prod.allowedAddons,
      showFromPrice: true,
      sizeToggleLabel: prod.isThick ? "Layers" : "Sides",
    },
  };
}

function computeBasePrice(doubleMul) {
  // basePrice = total for 50 pcs double-sided (minimum common order)
  const unitPrice = CLASSIC_DOUBLE_TIERS[0].unitPrice * doubleMul;
  const total = unitPrice * 50;
  return Math.round(Math.max(total, 25) * 100); // cents, respect $25 minimum
}

async function main() {
  console.log("── Seeding 8 Business Card Products ──\n");

  // 1. Ensure preset exists
  const preset = await prisma.pricingPreset.findUnique({
    where: { key: "business_cards_premium" },
  });
  if (!preset) {
    console.error("ERROR: PricingPreset 'business_cards_premium' not found. Run seed-business-cards.mjs first.");
    process.exit(1);
  }
  console.log(`  Preset: ${preset.key} (${preset.id})\n`);

  // 2. Deactivate old combined product
  const old = await prisma.product.findUnique({ where: { slug: "business-cards" } });
  if (old && old.isActive) {
    await prisma.product.update({
      where: { slug: "business-cards" },
      data: { isActive: false },
    });
    console.log("  Deactivated old 'business-cards' product\n");
  }

  // 3. Upsert 8 products
  for (const prod of PRODUCTS) {
    const optionsConfig = buildOptionsConfig(prod);
    const basePrice = computeBasePrice(prod.doubleMul);

    const existing = await prisma.product.findUnique({ where: { slug: prod.slug } });
    if (existing) {
      await prisma.product.update({
        where: { slug: prod.slug },
        data: {
          name: prod.name,
          category: "marketing-prints",
          description: prod.description,
          pricingUnit: "per_piece",
          basePrice,
          isActive: true,
          optionsConfig,
          pricingPresetId: preset.id,
          sortOrder: prod.sortOrder,
        },
      });
      console.log(`  Updated: ${prod.slug} (basePrice: $${(basePrice / 100).toFixed(2)})`);
    } else {
      await prisma.product.create({
        data: {
          slug: prod.slug,
          name: prod.name,
          category: "marketing-prints",
          description: prod.description,
          pricingUnit: "per_piece",
          basePrice,
          isActive: true,
          optionsConfig,
          pricingPresetId: preset.id,
          sortOrder: prod.sortOrder,
          type: "other",
          acceptedFormats: ["ai", "pdf", "eps", "psd", "tiff", "jpg", "png"],
          minDpi: 300,
          requiresBleed: true,
          bleedIn: 0.125,
        },
      });
      console.log(`  Created: ${prod.slug} (basePrice: $${(basePrice / 100).toFixed(2)})`);
    }
  }

  // 4. Summary
  const count = await prisma.product.count({
    where: { slug: { startsWith: "business-cards-" }, isActive: true },
  });
  console.log(`\n  Total active business card products: ${count}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
