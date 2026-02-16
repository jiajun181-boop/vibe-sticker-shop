import { PrismaClient, PricingModel } from "@prisma/client";

const prisma = new PrismaClient();

const PRESET_KEY = "la_canvas_prints_v1";

const QTY_CHOICES = [1, 2, 3, 5, 10];

const SIZE_TOTALS = [
  {
    label: '8" × 10"',
    widthIn: 8,
    heightIn: 10,
    totals: { 1: 4900, 2: 9200, 3: 13200, 5: 20500, 10: 39000 },
  },
  {
    label: '12" × 16"',
    widthIn: 12,
    heightIn: 16,
    totals: { 1: 6900, 2: 13000, 3: 18600, 5: 29000, 10: 55000 },
  },
  {
    label: '16" × 20"',
    widthIn: 16,
    heightIn: 20,
    totals: { 1: 8900, 2: 16800, 3: 24000, 5: 37500, 10: 71000 },
  },
  {
    label: '18" × 24"',
    widthIn: 18,
    heightIn: 24,
    totals: { 1: 10900, 2: 20500, 3: 29400, 5: 46000, 10: 87000 },
  },
  {
    label: '24" × 36"',
    widthIn: 24,
    heightIn: 36,
    totals: { 1: 15900, 2: 30200, 3: 43400, 5: 68000, 10: 129000 },
  },
];

function buildOptionsSizes() {
  return SIZE_TOTALS.map((size, idx) => ({
    id: `canvas-${size.widthIn}x${size.heightIn}`,
    label: size.label,
    widthIn: size.widthIn,
    heightIn: size.heightIn,
    recommended: idx === 2, // 16x20
    quantityChoices: QTY_CHOICES,
    priceByQty: Object.fromEntries(
      QTY_CHOICES.map((qty) => [String(qty), Number(size.totals[qty])])
    ),
  }));
}

function buildPresetSizes() {
  return SIZE_TOTALS.map((size, idx) => ({
    label: size.label,
    recommended: idx === 2,
    tiers: QTY_CHOICES.map((qty) => ({
      qty,
      unitPrice: Number((size.totals[qty] / qty / 100).toFixed(4)),
    })),
  }));
}

async function main() {
  const product = await prisma.product.findUnique({
    where: { slug: "canvas-prints" },
    select: { id: true, slug: true, name: true },
  });

  if (!product) {
    throw new Error('Product "canvas-prints" not found. Please seed product first.');
  }

  const presetConfig = {
    sizes: buildPresetSizes(),
    minimumPrice: 49,
    fileFee: 0,
    addons: [
      { id: "edge-mirror", name: "Mirrored Edge Wrap", type: "per_unit", price: 8.0 },
      { id: "floating-frame", name: "Floating Frame", type: "per_unit", price: 45.0 },
      { id: "hanging-kit", name: "Hanging Kit Installed", type: "per_unit", price: 6.0 },
    ],
  };

  const preset = await prisma.pricingPreset.upsert({
    where: { key: PRESET_KEY },
    create: {
      key: PRESET_KEY,
      name: "Canvas Prints (Stretched) - CAD",
      model: PricingModel.QTY_OPTIONS,
      config: presetConfig,
      isActive: true,
    },
    update: {
      name: "Canvas Prints (Stretched) - CAD",
      model: PricingModel.QTY_OPTIONS,
      config: presetConfig,
      isActive: true,
    },
    select: { id: true, key: true },
  });

  const optionsConfig = {
    ui: {
      hideMaterials: true,
      hideFinishings: false,
      hideAddons: false,
      allowedAddons: ["edge-mirror", "floating-frame", "hanging-kit"],
    },
    quantityRange: { min: 1, max: 10, step: 1 },
    sizes: buildOptionsSizes(),
  };

  await prisma.product.update({
    where: { id: product.id },
    data: {
      category: "banners-displays",
      pricingUnit: "per_piece",
      basePrice: 4900,
      pricingPresetId: preset.id,
      description:
        "Premium stretched canvas prints with rich color and sharp detail. Ideal for home decor, office walls, and branded environments.",
      metaTitle: "Canvas Prints | Custom Stretched Canvas Printing in Canada",
      metaDescription:
        "Order custom canvas prints in popular sizes with optional floating frame and hanging kit. Fast Canadian turnaround and professional print quality.",
      keywords: [
        "canvas prints",
        "stretched canvas",
        "custom wall art",
        "photo canvas",
        "canvas printing canada",
      ],
      optionsConfig,
      tags: [
        "subseries:canvas-prints",
        "placement:banners-displays:canvas-prints",
      ],
      isActive: true,
    },
  });

  const check = await prisma.product.findUnique({
    where: { id: product.id },
    select: {
      slug: true,
      name: true,
      category: true,
      basePrice: true,
      pricingUnit: true,
      pricingPreset: { select: { key: true, model: true } },
      optionsConfig: true,
    },
  });

  console.log("Canvas prints enabled:");
  console.log(JSON.stringify(check, null, 2));
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

