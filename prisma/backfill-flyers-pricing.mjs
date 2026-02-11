import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const TARGET_SLUGS = ["flyers", "mp-flyers"];

const QUANTITIES = [25, 50, 75, 100, 250, 500, 750, 1000, 2500, 5000, 10000];

const CORE_SIZES = [
  { baseLabel: '4.25" x 5.5" (Quarter)', widthIn: 4.25, heightIn: 5.5 },
  { baseLabel: '4" x 6" (Postcard/Flyer)', widthIn: 4, heightIn: 6 },
  { baseLabel: '3.5" x 8.5" (Strip)', widthIn: 3.5, heightIn: 8.5 },
  { baseLabel: '5" x 7"', widthIn: 5, heightIn: 7 },
  { baseLabel: '5.5" x 8.5" (Half Letter)', widthIn: 5.5, heightIn: 8.5 },
  { baseLabel: '6" x 9"', widthIn: 6, heightIn: 9 },
  { baseLabel: '8.5" x 11" (Letter)', widthIn: 8.5, heightIn: 11 },
];

// NOTE: Some rows in the source have "x/y" values (e.g. "$17.04/$18").
// We use the first number as the configured total; the unit price shown in parentheses matches the first value.
const SINGLE_SIDED_TOTALS = {
  25: [17.04, 17.04, 21.35, 21.91, 23.14, 23.14, 34.8],
  50: [23.99, 23.99, 30.07, 30.85, 32.59, 32.59, 49.0],
  75: [29.38, 29.38, 36.82, 37.77, 39.9, 39.9, 60.0],
  100: [35.26, 35.26, 44.18, 45.33, 47.88, 47.88, 72.0],
  250: [67.58, 67.58, 84.68, 86.87, 91.78, 91.78, 138.0],
  500: [87.16, 87.16, 109.23, 112.05, 118.38, 118.38, 178.0],
  750: [102.83, 102.83, 128.87, 132.2, 139.66, 139.66, 210.0],
  1000: [116.54, 116.54, 146.05, 149.83, 158.28, 158.28, 238.0],
  2500: [156.1, 156.1, 195.63, 200.69, 212.01, 212.01, 318.79],
  5000: [222.81, 222.81, 279.23, 286.45, 302.61, 302.61, 455.02],
  10000: [388.82, 388.82, 487.28, 499.89, 528.08, 528.08, 794.06],
};

const DOUBLE_SIDED_TOTALS = {
  25: [19.23, 19.23, 24.09, 24.72, 26.11, 26.11, 39.26],
  50: [27.07, 27.07, 33.92, 34.8, 36.76, 36.76, 55.28],
  75: [33.15, 33.15, 41.54, 42.61, 45.02, 45.02, 67.69],
  100: [39.78, 39.78, 49.85, 51.14, 54.02, 54.02, 81.23],
  250: [76.24, 76.24, 95.54, 98.01, 103.54, 103.54, 155.69],
  500: [98.34, 98.34, 123.23, 126.42, 133.55, 133.55, 200.82],
  750: [116.02, 116.02, 145.39, 149.15, 157.56, 157.56, 236.92],
  1000: [131.49, 131.49, 164.77, 169.03, 178.57, 178.57, 268.51],
  2500: [161.91, 161.91, 202.89, 208.13, 219.88, 219.88, 330.63],
  5000: [243.05, 243.05, 304.56, 312.44, 330.07, 330.07, 496.32],
  10000: [433.9, 433.9, 543.72, 557.78, 589.26, 589.26, 886.05],
};

function dollarsToCents(d) {
  return Math.round(Number(d) * 100);
}

function buildPriceByQty(table, idx) {
  const out = {};
  for (const q of QUANTITIES) {
    const row = table[q];
    if (!row || row[idx] == null) continue;
    out[String(q)] = dollarsToCents(row[idx]);
  }
  return out;
}

function upsertSize(existing, next) {
  if (!existing || typeof existing !== "object") return next;
  return { ...existing, ...next };
}

function mergeOptions(existingOptionsConfig) {
  const base = existingOptionsConfig && typeof existingOptionsConfig === "object" ? existingOptionsConfig : {};
  const existingUi = base.ui && typeof base.ui === "object" ? base.ui : {};
  const existingAddons = Array.isArray(base.addons) ? base.addons : [];
  const hasRounded = existingAddons.some((a) => a && typeof a === "object" && a.id === "rounded");
  const addons = hasRounded
    ? existingAddons
    : [...existingAddons, { id: "rounded", name: "Rounded Corners", type: "per_unit", unitCents: 2 }];

  const existingSizes = Array.isArray(base.sizes) ? base.sizes : [];

  const nextSizes = [];
  for (let i = 0; i < CORE_SIZES.length; i++) {
    const s = CORE_SIZES[i];

    const singleLabel = `${s.baseLabel} - Single Sided (14pt)`;
    const doubleLabel = `${s.baseLabel} - Double Sided (14pt)`;

    const singleNext = {
      label: singleLabel,
      widthIn: s.widthIn,
      heightIn: s.heightIn,
      quantityChoices: QUANTITIES,
      priceByQty: buildPriceByQty(SINGLE_SIDED_TOTALS, i),
      notes: "14pt, full color.",
    };
    const doubleNext = {
      label: doubleLabel,
      widthIn: s.widthIn,
      heightIn: s.heightIn,
      quantityChoices: QUANTITIES,
      priceByQty: buildPriceByQty(DOUBLE_SIDED_TOTALS, i),
      notes: "14pt, full color, double sided.",
    };

    const singleExisting = existingSizes.find((x) => x && typeof x === "object" && x.label === singleLabel);
    const doubleExisting = existingSizes.find((x) => x && typeof x === "object" && x.label === doubleLabel);

    nextSizes.push(upsertSize(singleExisting, singleNext));
    nextSizes.push(upsertSize(doubleExisting, doubleNext));
  }

  // Preserve any other existing sizes that are not part of the core set.
  const coreLabels = new Set(nextSizes.map((x) => x.label));
  const passthrough = existingSizes.filter((x) => x && typeof x === "object" && typeof x.label === "string" && !coreLabels.has(x.label));

  return {
    ...base,
    quantityRange: { min: 25, max: 10000, step: 1 },
    sizes: [...nextSizes, ...passthrough],
    addons,
    ui: {
      ...existingUi,
      hideTierPricing: true,
      hideMaterials: true,
      hideFinishings: false,
      defaultMaterialId: "14pt_c2s",
      allowedMaterials: ["14pt_c2s"],
      allowedAddons: ["rounded"],
      allowedFinishings: ["lam_gloss", "lam_matte", "lam_soft_touch"],
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
    console.log(`Updated ${p.slug}: flyers core sizes (single + double) w/ exact totals`);
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

