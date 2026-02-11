import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const TARGET_SLUGS = ["door-hangers", "mp-door-hangers"];

function mergeUi(existingOptionsConfig) {
  const base = existingOptionsConfig && typeof existingOptionsConfig === "object" ? existingOptionsConfig : {};
  const existingUi = base.ui && typeof base.ui === "object" ? base.ui : {};
  const existingAddons = Array.isArray(base.addons) ? base.addons : [];
  const hasRounded = existingAddons.some((a) => a && typeof a === "object" && a.id === "rounded");
  const addons = hasRounded
    ? existingAddons
    : [
        ...existingAddons,
        { id: "rounded", name: "Rounded Corners", type: "per_unit", unitCents: 2 },
      ];
  return {
    ...base,
    quantityRange: base.quantityRange && typeof base.quantityRange === "object"
      ? base.quantityRange
      : { min: 50, max: 10000, step: 1 },
    addons,
    ui: {
      ...existingUi,
      hideTierPricing: true,
      hideFinishings: true,
      hideMaterials: true,
      defaultMaterialId: "14pt_c2s",
      allowedMaterials: ["14pt_c2s"],
      allowedAddons: ["rounded"],
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
    const nextOptionsConfig = mergeUi(p.optionsConfig);
    await prisma.product.update({
      where: { id: p.id },
      data: { optionsConfig: nextOptionsConfig },
    });
    console.log(`Updated ${p.slug}: optionsConfig.ui (hide tier + rounded corners + 14pt)`);
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
