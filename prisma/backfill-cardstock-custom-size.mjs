import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const PRESET_KEY = "cardstock_14pt_custom_size";
const PRESET_NAME = "Cardstock 14pt — Custom Size";

// Derived from anchor points (3.5" x 2", double sided):
// total = $48.80 + qty * (areaSqIn * $0.0057142857)
// Convert $/sqin → $/sqft: * 144 = $0.8228571429 / sqft
const RATE_PER_SQFT = 0.8228571429;
const FILE_FEE = 48.8;
const MINIMUM_PRICE = 48.8;

async function upsertPreset() {
  return prisma.pricingPreset.upsert({
    where: { key: PRESET_KEY },
    create: {
      key: PRESET_KEY,
      name: PRESET_NAME,
      model: "AREA_TIERED",
      config: {
        tiers: [{ upToSqft: 9999, rate: RATE_PER_SQFT }],
        fileFee: FILE_FEE,
        minimumPrice: MINIMUM_PRICE,
        materials: [{ id: "14pt_c2s", name: "14pt C2S", multiplier: 1.0 }],
        finishings: [
          { id: "lam_gloss", name: "Gloss Lamination", type: "per_unit", price: 0.03 },
          { id: "lam_matte", name: "Matte Lamination", type: "per_unit", price: 0.03 },
          { id: "lam_soft_touch", name: "Soft Touch Lamination", type: "per_unit", price: 0.05 },
          { id: "rounded", name: "Rounded Corners", type: "per_unit", price: 0.02 },
          { id: "foil_stamping", name: "Foil Stamping", type: "flat", price: 15.0 },
          { id: "die_cut", name: "Die Cut", type: "flat", price: 35.0 },
        ],
      },
    },
    update: {
      name: PRESET_NAME,
      model: "AREA_TIERED",
      config: {
        tiers: [{ upToSqft: 9999, rate: RATE_PER_SQFT }],
        fileFee: FILE_FEE,
        minimumPrice: MINIMUM_PRICE,
        materials: [{ id: "14pt_c2s", name: "14pt C2S", multiplier: 1.0 }],
        finishings: [
          { id: "lam_gloss", name: "Gloss Lamination", type: "per_unit", price: 0.03 },
          { id: "lam_matte", name: "Matte Lamination", type: "per_unit", price: 0.03 },
          { id: "lam_soft_touch", name: "Soft Touch Lamination", type: "per_unit", price: 0.05 },
          { id: "rounded", name: "Rounded Corners", type: "per_unit", price: 0.02 },
          { id: "foil_stamping", name: "Foil Stamping", type: "flat", price: 15.0 },
          { id: "die_cut", name: "Die Cut", type: "flat", price: 35.0 },
        ],
      },
    },
  });
}

async function ensureProduct(presetId) {
  const slug = "cardstock-prints";
  const existing = await prisma.product.findUnique({
    where: { slug },
    include: { images: { take: 1, orderBy: { sortOrder: "asc" } } },
  });

  const optionsConfig = {
    quantityRange: { min: 50, max: 10000, step: 1 },
    ui: {
      hideTierPricing: true,
      hideMaterials: true,
      hideAddons: true,
      hideFinishings: false,
      defaultMaterialId: "14pt_c2s",
      allowedMaterials: ["14pt_c2s"],
      allowedFinishings: [
        "lam_gloss",
        "lam_matte",
        "lam_soft_touch",
        "rounded",
        "foil_stamping",
        "die_cut",
      ],
    },
  };

  const data = {
    type: "other",
    category: "marketing-prints",
    slug,
    name: "Cardstock Prints (14pt) — Custom Size",
    description: "Choose a custom size up to 12×18 inches. Full color. Add lamination, foil, rounded corners, or die cut.",
    basePrice: 0,
    pricingUnit: "per_sqft",
    minWidthIn: 2,
    minHeightIn: 2,
    maxWidthIn: 12,
    maxHeightIn: 18,
    minDpi: 150,
    requiresBleed: true,
    bleedIn: 0.125,
    optionsConfig,
    pricingPresetId: presetId,
    isActive: true,
    sortOrder: 0,
    keywords: [],
    tags: ["retail"],
  };

  if (!existing) {
    const created = await prisma.product.create({
      data: {
        ...data,
        images: {
          create: [
            {
              url: "https://placehold.co/600x400/EC4899/FFFFFF/png?text=Cardstock%2014pt",
              alt: "Cardstock Prints (14pt) — Custom Size",
              sortOrder: 0,
            },
          ],
        },
      },
    });
    console.log(`Created product: ${created.slug}`);
    return;
  }

  await prisma.product.update({
    where: { id: existing.id },
    data,
  });

  if (!existing.images || existing.images.length === 0) {
    await prisma.productImage.create({
      data: {
        productId: existing.id,
        url: "https://placehold.co/600x400/EC4899/FFFFFF/png?text=Cardstock%2014pt",
        alt: "Cardstock Prints (14pt) — Custom Size",
        sortOrder: 0,
      },
    });
  }

  console.log(`Updated product: ${existing.slug}`);
}

async function main() {
  const preset = await upsertPreset();
  console.log(`Upserted preset: ${preset.key} (${preset.id})`);
  await ensureProduct(preset.id);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

