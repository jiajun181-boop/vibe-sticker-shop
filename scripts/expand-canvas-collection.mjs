import { PrismaClient, PricingModel, ProductType, PricingUnit } from "@prisma/client";

const prisma = new PrismaClient();

function toPresetSizes(sizes) {
  return sizes.map((size) => ({
    label: size.label,
    recommended: !!size.recommended,
    tiers: Object.entries(size.priceByQty)
      .map(([qty, totalCents]) => ({
        qty: Number(qty),
        unitPrice: Number((Number(totalCents) / Number(qty) / 100).toFixed(4)),
      }))
      .sort((a, b) => a.qty - b.qty),
  }));
}

function baseOptionsConfig(sizes, allowedAddons = [], quantityRange = { min: 1, max: 10, step: 1 }) {
  return {
    ui: {
      hideMaterials: true,
      hideFinishings: false,
      hideAddons: false,
      allowedAddons,
    },
    sizes,
    quantityRange,
  };
}

const CANVAS_SKUS = [
  {
    slug: "canvas-prints-standard",
    name: "Canvas Prints - Standard",
    basePrice: 4900,
    description:
      "Classic stretched canvas prints on durable artist canvas. Perfect for photos, interiors, and branded wall decor.",
    presetKey: "la_canvas_standard_v1",
    addons: [
      { id: "edge-mirror", name: "Mirrored Edge Wrap", type: "per_unit", price: 8.0 },
      { id: "hanging-kit", name: "Hanging Kit Installed", type: "per_unit", price: 6.0 },
    ],
    sizes: [
      { label: '8" × 10"', widthIn: 8, heightIn: 10, recommended: false, priceByQty: { 1: 4900, 2: 9200, 3: 13200, 5: 20500, 10: 39000 } },
      { label: '12" × 16"', widthIn: 12, heightIn: 16, recommended: false, priceByQty: { 1: 6900, 2: 13000, 3: 18600, 5: 29000, 10: 55000 } },
      { label: '16" × 20"', widthIn: 16, heightIn: 20, recommended: true, priceByQty: { 1: 8900, 2: 16800, 3: 24000, 5: 37500, 10: 71000 } },
      { label: '18" × 24"', widthIn: 18, heightIn: 24, recommended: false, priceByQty: { 1: 10900, 2: 20500, 3: 29400, 5: 46000, 10: 87000 } },
      { label: '24" × 36"', widthIn: 24, heightIn: 36, recommended: false, priceByQty: { 1: 15900, 2: 30200, 3: 43400, 5: 68000, 10: 129000 } },
    ],
  },
  {
    slug: "framed-canvas-prints",
    name: "Framed Canvas Prints",
    basePrice: 10900,
    description:
      "Stretched canvas mounted with a premium floating frame. Designed for high-end interiors, offices, and gallery presentation.",
    presetKey: "la_canvas_framed_v1",
    addons: [
      { id: "frame-black", name: "Black Floating Frame", type: "per_unit", price: 45.0 },
      { id: "frame-oak", name: "Oak Floating Frame", type: "per_unit", price: 55.0 },
      { id: "hanging-kit", name: "Hanging Kit Installed", type: "per_unit", price: 6.0 },
    ],
    sizes: [
      { label: '12" × 16"', widthIn: 12, heightIn: 16, recommended: false, priceByQty: { 1: 10900, 2: 20800, 3: 29900, 5: 46800, 10: 89000 } },
      { label: '16" × 20"', widthIn: 16, heightIn: 20, recommended: true, priceByQty: { 1: 12900, 2: 24600, 3: 35400, 5: 55400, 10: 105000 } },
      { label: '18" × 24"', widthIn: 18, heightIn: 24, recommended: false, priceByQty: { 1: 14900, 2: 28400, 3: 40800, 5: 63800, 10: 121000 } },
      { label: '24" × 36"', widthIn: 24, heightIn: 36, recommended: false, priceByQty: { 1: 21900, 2: 41800, 3: 60000, 5: 93800, 10: 178000 } },
    ],
  },
  {
    slug: "gallery-wrap-canvas-prints",
    name: "Gallery Wrap Canvas Prints",
    basePrice: 6900,
    description:
      "Deep-edge gallery wrap canvas with mirrored or stretched edges. A modern, frame-free finish popular in retail and hospitality spaces.",
    presetKey: "la_canvas_gallery_wrap_v1",
    addons: [
      { id: "edge-stretch", name: "Image Stretch Edge", type: "per_unit", price: 10.0 },
      { id: "edge-mirror", name: "Mirrored Edge Wrap", type: "per_unit", price: 8.0 },
      { id: "protective-coat", name: "Protective UV Coat", type: "per_unit", price: 12.0 },
    ],
    sizes: [
      { label: '12" × 16"', widthIn: 12, heightIn: 16, recommended: false, priceByQty: { 1: 6900, 2: 13000, 3: 18600, 5: 29000, 10: 55000 } },
      { label: '16" × 20"', widthIn: 16, heightIn: 20, recommended: true, priceByQty: { 1: 9200, 2: 17400, 3: 24900, 5: 38900, 10: 74000 } },
      { label: '20" × 30"', widthIn: 20, heightIn: 30, recommended: false, priceByQty: { 1: 13900, 2: 26400, 3: 37800, 5: 59000, 10: 112000 } },
      { label: '24" × 36"', widthIn: 24, heightIn: 36, recommended: false, priceByQty: { 1: 17900, 2: 34000, 3: 48600, 5: 76000, 10: 144000 } },
    ],
  },
  {
    slug: "panoramic-canvas-prints",
    name: "Panoramic Canvas Prints",
    basePrice: 12900,
    description:
      "Wide panoramic canvas formats for landscapes, skyline photography, and hero wall branding in offices and showrooms.",
    presetKey: "la_canvas_panoramic_v1",
    addons: [
      { id: "edge-mirror", name: "Mirrored Edge Wrap", type: "per_unit", price: 12.0 },
      { id: "hanging-kit", name: "Hanging Kit Installed", type: "per_unit", price: 8.0 },
    ],
    sizes: [
      { label: '12" × 36"', widthIn: 12, heightIn: 36, recommended: false, priceByQty: { 1: 12900, 2: 24600, 3: 35400, 5: 55400 } },
      { label: '16" × 40"', widthIn: 16, heightIn: 40, recommended: true, priceByQty: { 1: 15900, 2: 30400, 3: 43800, 5: 68600 } },
      { label: '20" × 60"', widthIn: 20, heightIn: 60, recommended: false, priceByQty: { 1: 23900, 2: 45800, 3: 66000, 5: 103500 } },
      { label: '24" × 72"', widthIn: 24, heightIn: 72, recommended: false, priceByQty: { 1: 29900, 2: 57400, 3: 82800, 5: 129500 } },
    ],
    quantityRange: { min: 1, max: 5, step: 1 },
  },
  {
    slug: "split-panel-canvas-prints",
    name: "Split Panel Canvas Sets",
    basePrice: 18900,
    description:
      "Multi-panel canvas sets (triptych and 5-panel) for statement walls. Ideal for restaurants, offices, and premium residential projects.",
    presetKey: "la_canvas_split_panel_v1",
    addons: [
      { id: "layout-proof", name: "Layout Proof & Alignment Check", type: "flat", price: 25.0 },
      { id: "hanging-kit", name: "Hanging Kit Installed", type: "per_unit", price: 6.0 },
    ],
    sizes: [
      { label: "3-Panel Set (12x24 each)", widthIn: 36, heightIn: 24, recommended: true, priceByQty: { 1: 18900, 2: 36000, 3: 51900, 5: 81000 } },
      { label: "3-Panel Set (16x32 each)", widthIn: 48, heightIn: 32, recommended: false, priceByQty: { 1: 25900, 2: 49400, 3: 71100, 5: 111000 } },
      { label: "5-Panel Set (8x20 each)", widthIn: 40, heightIn: 20, recommended: false, priceByQty: { 1: 21900, 2: 41800, 3: 60300, 5: 94200 } },
      { label: "5-Panel Set (12x30 each)", widthIn: 60, heightIn: 30, recommended: false, priceByQty: { 1: 31900, 2: 61000, 3: 87900, 5: 137500 } },
    ],
    quantityRange: { min: 1, max: 5, step: 1 },
  },
];

async function upsertPresetForSku(sku) {
  const presetConfig = {
    sizes: toPresetSizes(sku.sizes),
    minimumPrice: Number((sku.basePrice / 100).toFixed(2)),
    fileFee: 0,
    addons: sku.addons,
  };

  return prisma.pricingPreset.upsert({
    where: { key: sku.presetKey },
    create: {
      key: sku.presetKey,
      name: sku.name,
      model: PricingModel.QTY_OPTIONS,
      config: presetConfig,
      isActive: true,
    },
    update: {
      name: sku.name,
      model: PricingModel.QTY_OPTIONS,
      config: presetConfig,
      isActive: true,
    },
    select: { id: true },
  });
}

async function upsertProductForSku(sku, presetId) {
  const optionsConfig = baseOptionsConfig(
    sku.sizes,
    sku.addons.map((a) => a.id),
    sku.quantityRange || { min: 1, max: 10, step: 1 }
  );

  const product = await prisma.product.upsert({
    where: { slug: sku.slug },
    create: {
      type: ProductType.other,
      category: "banners-displays",
      slug: sku.slug,
      name: sku.name,
      description: sku.description,
      basePrice: sku.basePrice,
      pricingUnit: PricingUnit.per_piece,
      pricingPresetId: presetId,
      optionsConfig,
      metaTitle: `${sku.name} | La Lunar Printing`,
      metaDescription: `${sku.name} with multiple size options and fast Canadian turnaround.`,
      keywords: ["canvas prints", "wall art", "custom canvas", "photo canvas"],
      tags: [
        "subseries:canvas-prints",
        "placement:banners-displays:canvas-prints",
      ],
      isActive: true,
    },
    update: {
      category: "banners-displays",
      name: sku.name,
      description: sku.description,
      basePrice: sku.basePrice,
      pricingUnit: PricingUnit.per_piece,
      pricingPresetId: presetId,
      optionsConfig,
      metaTitle: `${sku.name} | La Lunar Printing`,
      metaDescription: `${sku.name} with multiple size options and fast Canadian turnaround.`,
      tags: [
        "subseries:canvas-prints",
        "placement:banners-displays:canvas-prints",
      ],
      isActive: true,
    },
    select: { id: true, slug: true, name: true, basePrice: true },
  });

  await prisma.productImage.upsert({
    where: { id: `img_${product.id}_0` },
    create: {
      id: `img_${product.id}_0`,
      productId: product.id,
      url: "/products/canvas-prints.png",
      alt: product.name,
      sortOrder: 0,
    },
    update: {
      url: "/products/canvas-prints.png",
      alt: product.name,
      sortOrder: 0,
    },
  });

  return product;
}

async function main() {
  // Keep parent slug as collection landing endpoint, not a sellable SKU card.
  await prisma.product.updateMany({
    where: { slug: "canvas-prints" },
    data: { isActive: false },
  });

  const results = [];
  for (const sku of CANVAS_SKUS) {
    const preset = await upsertPresetForSku(sku);
    const product = await upsertProductForSku(sku, preset.id);
    results.push(product);
  }

  const activeInGroup = await prisma.product.findMany({
    where: {
      category: "banners-displays",
      isActive: true,
      OR: [
        { slug: { contains: "canvas" } },
        { tags: { has: "subseries:canvas-prints" } },
      ],
    },
    select: { slug: true, name: true, basePrice: true, isActive: true },
    orderBy: [{ sortOrder: "asc" }, { slug: "asc" }],
  });

  console.log("Canvas collection expanded:");
  console.log(JSON.stringify(results, null, 2));
  console.log("Active canvas-related products:");
  console.log(JSON.stringify(activeInGroup, null, 2));
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

