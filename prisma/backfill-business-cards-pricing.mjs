import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const TARGET_SLUGS = ["business-cards", "mp-business-cards"];

const SIZE_LABEL = '3.5" x 2" - Double Sided (14pt)';
const SIZE = { label: SIZE_LABEL, widthIn: 3.5, heightIn: 2 };

// Anchor points provided:
// 500 pcs  -> $68.8
// 1000 pcs -> $88.8
// We'll generate a consistent curve: total = qty * $0.04 + $48.8
// (matches both anchors exactly).
const QUANTITIES = [50, 100, 250, 500, 1000, 2500, 5000];
function totalCentsForQty(qty) {
  const totalDollars = qty * 0.04 + 48.8;
  return Math.round(totalDollars * 100);
}

function mergeOptions(existingOptionsConfig) {
  const base = existingOptionsConfig && typeof existingOptionsConfig === "object" ? existingOptionsConfig : {};
  const sizes = Array.isArray(base.sizes) ? base.sizes : [];
  const hasSize = sizes.some((s) => s && typeof s === "object" && s.label === SIZE_LABEL);

  const priceByQty = {};
  for (const q of QUANTITIES) priceByQty[String(q)] = totalCentsForQty(q);

  const nextSize = {
    ...SIZE,
    quantityChoices: QUANTITIES,
    priceByQty,
    notes: "14pt, full color, double sided.",
  };

  const nextSizes = hasSize
    ? sizes.map((s) => (s && typeof s === "object" && s.label === SIZE_LABEL ? { ...s, ...nextSize } : s))
    : [...sizes, nextSize];

  const ui = base.ui && typeof base.ui === "object" ? base.ui : {};
  return {
    ...base,
    quantityRange: { min: 50, max: 5000, step: 1 },
    sizes: nextSizes,
    ui: {
      ...ui,
      hideTierPricing: true,
      hideMaterials: true,
      defaultMaterialId: "14pt_c2s",
      allowedMaterials: ["14pt_c2s"],
      // Keep existing allowlists if present; just ensure rounded exists.
      allowedAddons: Array.isArray(ui.allowedAddons) ? Array.from(new Set([...ui.allowedAddons, "rounded"])) : ["rounded"],
    },
  };
}

async function main() {
  const products = await prisma.product.findMany({
    where: { slug: { in: TARGET_SLUGS } },
    select: { id: true, slug: true, optionsConfig: true },
    orderBy: { slug: "asc" },
  });

  const found = new Set(products.map((p) => p.slug));
  const missing = TARGET_SLUGS.filter((s) => !found.has(s));
  if (missing.length) console.log(`Missing products (skip): ${missing.join(", ")}`);

  for (const p of products) {
    await prisma.product.update({
      where: { id: p.id },
      data: { optionsConfig: mergeOptions(p.optionsConfig) },
    });
    console.log(`Updated ${p.slug}: ${SIZE_LABEL} priceByQty for ${QUANTITIES.join(", ")}`);
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

