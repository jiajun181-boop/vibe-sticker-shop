import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const TARGET_SLUGS = ["postcards", "mp-postcards"];

const POSTCARD_SIZES = [
  { label: '4" x 6"', widthIn: 4, heightIn: 6 },
  { label: '5" x 7"', widthIn: 5, heightIn: 7 },
  { label: '8.5" x 5.5"', widthIn: 8.5, heightIn: 5.5 },
  { label: '8.5" x 3.5"', widthIn: 8.5, heightIn: 3.5 },
  { label: '2" x 8"', widthIn: 2, heightIn: 8 },

  { label: '4" x 9"', widthIn: 4, heightIn: 9 },
  { label: '6" x 9"', widthIn: 6, heightIn: 9 },
  { label: '4.25" x 3.66"', widthIn: 4.25, heightIn: 3.66 },
  { label: '3" x 4"', widthIn: 3, heightIn: 4 },
  { label: '4" x 4"', widthIn: 4, heightIn: 4 },

  { label: '4.25" x 5.5"', widthIn: 4.25, heightIn: 5.5 },
  { label: '8.5" x 2.75"', widthIn: 8.5, heightIn: 2.75 },
  { label: '4.25" x 6"', widthIn: 4.25, heightIn: 6 },
  { label: '8.5" x 3.66"', widthIn: 8.5, heightIn: 3.66 },
  { label: '3.75" x 9"', widthIn: 3.75, heightIn: 9 },

  { label: '3.75" x 9.25"', widthIn: 3.75, heightIn: 9.25 },
  { label: '8" x 5"', widthIn: 8, heightIn: 5 },
  { label: '4.25" x 11"', widthIn: 4.25, heightIn: 11 },
  { label: '8.5" x 6"', widthIn: 8.5, heightIn: 6 },
  { label: '8.5" x 11"', widthIn: 8.5, heightIn: 11 },

  { label: '11" x 17"', widthIn: 11, heightIn: 17 },
  { label: '2.5" x 2.5"', widthIn: 2.5, heightIn: 2.5 },
  { label: '4.25" x 2.75"', widthIn: 4.25, heightIn: 2.75 },
  { label: '5.5" x 2.125"', widthIn: 5.5, heightIn: 2.125 },
  { label: '3.5" x 2.5"', widthIn: 3.5, heightIn: 2.5 },

  { label: '6" x 12"', widthIn: 6, heightIn: 12 },
];

function mergeOptions(existingOptionsConfig) {
  const base = existingOptionsConfig && typeof existingOptionsConfig === "object" ? existingOptionsConfig : {};
  const existingUi = base.ui && typeof base.ui === "object" ? base.ui : {};
  const existingAddons = Array.isArray(base.addons) ? base.addons : [];
  const hasRounded = existingAddons.some((a) => a && typeof a === "object" && a.id === "rounded");
  const addons = hasRounded
    ? existingAddons
    : [...existingAddons, { id: "rounded", name: "Rounded Corners", type: "per_unit", unitCents: 2 }];

  // Keep any existing size definitions, but replace if empty/missing.
  const sizes = Array.isArray(base.sizes) && base.sizes.length > 0 ? base.sizes : POSTCARD_SIZES;

  return {
    ...base,
    quantityRange: { min: 50, max: 5000, step: 1 },
    sizes,
    addons,
    ui: {
      ...existingUi,
      hideTierPricing: true,
      hideMaterials: true,
      hideFinishings: false,
      defaultMaterialId: "14pt_c2s",
      allowedMaterials: ["14pt_c2s"],
      allowedAddons: ["rounded"],
      allowedFinishings: ["lam_gloss", "lam_matte", "lam_soft_touch", "foil_stamping"],
    },
  };
}

async function main() {
  const products = await prisma.product.findMany({
    where: { slug: { in: TARGET_SLUGS } },
    select: { id: true, slug: true, optionsConfig: true },
    orderBy: { slug: "asc" },
  });

  if (products.length === 0) {
    console.log(`No products found for slugs: ${TARGET_SLUGS.join(", ")}`);
    return;
  }

  for (const p of products) {
    await prisma.product.update({
      where: { id: p.id },
      data: { optionsConfig: mergeOptions(p.optionsConfig) },
    });
    console.log(`Updated ${p.slug}: sizes + qty 50–5000 + rounded + lamination + foil`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

