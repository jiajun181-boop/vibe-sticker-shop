import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const TARGET_SLUGS = ["brochures", "mp-brochures"];

const QUANTITIES = [25, 50, 100, 250, 500, 1000, 2500, 5000];

// Fold types × Sizes
// Label pattern: "FoldType - Size" so ProductLandingClient groups by FoldType
const VARIANTS = [
  // Bi-Fold (single sheet folded in half)
  { fold: "Bi-Fold", size: '8.5" × 11"',  widthIn: 8.5, heightIn: 11,  notes: "Folds to 5.5\" × 8.5\". 100lb Gloss Text." },
  { fold: "Bi-Fold", size: '8.5" × 14"',  widthIn: 8.5, heightIn: 14,  notes: "Folds to 7\" × 8.5\". 100lb Gloss Text." },
  { fold: "Bi-Fold", size: '11" × 17"',   widthIn: 11,  heightIn: 17,  notes: "Folds to 8.5\" × 11\". 100lb Gloss Text." },

  // Tri-Fold (letter fold, 3 panels)
  { fold: "Tri-Fold", size: '8.5" × 11"',  widthIn: 8.5, heightIn: 11,  notes: "3 panels, folds to 3.67\" × 8.5\". 100lb Gloss Text." },
  { fold: "Tri-Fold", size: '8.5" × 14"',  widthIn: 8.5, heightIn: 14,  notes: "3 panels, folds to 4.67\" × 8.5\". 100lb Gloss Text." },
  { fold: "Tri-Fold", size: '11" × 17"',   widthIn: 11,  heightIn: 17,  notes: "3 panels, folds to 5.67\" × 11\". 100lb Gloss Text." },

  // Z-Fold (accordion fold, 3 panels)
  { fold: "Z-Fold", size: '8.5" × 11"',   widthIn: 8.5, heightIn: 11,  notes: "Accordion fold, 3 panels. 100lb Gloss Text." },
  { fold: "Z-Fold", size: '8.5" × 14"',   widthIn: 8.5, heightIn: 14,  notes: "Accordion fold, 3 panels. 100lb Gloss Text." },
  { fold: "Z-Fold", size: '11" × 17"',    widthIn: 11,  heightIn: 17,  notes: "Accordion fold, 3 panels. 100lb Gloss Text." },
];

// Pricing: total cost (CAD) per quantity — all variants double-sided full color
// Pricing based on competitive market rates (slightly below yinshua.us)
const BASE_PRICING = {
  // Area multipliers relative to 8.5x11 = 1.0
  "8.5×11": 1.0,
  "8.5×14": 1.27,
  "11×17":  2.0,
};

// Base totals for 8.5x11 (the smallest)
const BASE_TOTALS = {
  25: 42.00,
  50: 59.00,
  100: 85.00,
  250: 155.00,
  500: 215.00,
  1000: 335.00,
  2500: 575.00,
  5000: 895.00,
};

// Fold surcharge multiplier (tri/z slightly more than bi)
const FOLD_MULT = {
  "Bi-Fold": 1.0,
  "Tri-Fold": 1.08,
  "Z-Fold": 1.12,
};

function dollarsToCents(d) {
  return Math.round(Number(d) * 100);
}

function getSizeKey(widthIn, heightIn) {
  return `${widthIn}×${heightIn}`;
}

function buildPriceByQty(variant) {
  const sizeKey = getSizeKey(variant.widthIn, variant.heightIn);
  const areaMult = BASE_PRICING[sizeKey] || 1.0;
  const foldMult = FOLD_MULT[variant.fold] || 1.0;
  const out = {};
  for (const q of QUANTITIES) {
    const base = BASE_TOTALS[q];
    if (!base) continue;
    out[String(q)] = dollarsToCents(base * areaMult * foldMult);
  }
  return out;
}

function mergeOptions(existingOptionsConfig) {
  const base = existingOptionsConfig && typeof existingOptionsConfig === "object" ? existingOptionsConfig : {};
  const existingUi = base.ui && typeof base.ui === "object" ? base.ui : {};

  const sizes = VARIANTS.map((v) => ({
    label: `${v.fold} - ${v.size}`,
    widthIn: v.widthIn,
    heightIn: v.heightIn,
    notes: v.notes,
    quantityChoices: QUANTITIES,
    priceByQty: buildPriceByQty(v),
  }));

  // Mark the most popular option
  const recommended = sizes.find((s) => s.label === 'Tri-Fold - 8.5" × 11"');
  if (recommended) recommended.recommended = true;

  return {
    ...base,
    quantityRange: { min: 25, max: 5000, step: 1 },
    sizes,
    ui: {
      ...existingUi,
      hideTierPricing: true,
      hideMaterials: true,
      hideFinishings: false,
      defaultMaterialId: "100lb_gloss_text",
      allowedMaterials: ["100lb_gloss_text", "100lb_matte_text", "80lb_gloss_text"],
      allowedFinishings: ["lam_gloss", "lam_matte"],
    },
  };
}

async function main() {
  const products = await prisma.product.findMany({
    where: { slug: { in: TARGET_SLUGS } },
    select: { id: true, slug: true, optionsConfig: true, description: true },
    orderBy: { slug: "asc" },
  });

  if (products.length === 0) {
    console.log(`No products found for slugs: ${TARGET_SLUGS.join(", ")}`);
    console.log("Make sure brochures product exists in DB with isActive: true");
    return;
  }

  for (const p of products) {
    await prisma.product.update({
      where: { id: p.id },
      data: {
        optionsConfig: mergeOptions(p.optionsConfig),
        description: p.description || "Bi-fold, tri-fold & z-fold brochures. Full-colour, premium paper, scored folds.",
      },
    });
    console.log(`Updated ${p.slug}: ${VARIANTS.length} fold × size variants configured`);
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
