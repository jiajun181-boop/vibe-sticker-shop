import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const APPLY = process.argv.includes("--apply");

const BATCH1_PRESETS = [
  {
    key: "batch1_die_cut_stickers",
    name: "Batch1 — Die-Cut Stickers",
    model: "QTY_TIERED",
    config: {
      tiers: [
        { minQty: 50, unitPrice: 1.1 },
        { minQty: 100, unitPrice: 0.82 },
        { minQty: 250, unitPrice: 0.55 },
        { minQty: 500, unitPrice: 0.4 },
        { minQty: 1000, unitPrice: 0.28 },
      ],
      minimumPrice: 25,
      fileFee: 0,
      finishings: [
        { id: "laminate", name: "Laminate", type: "per_unit", price: 0.05 },
        { id: "holographic", name: "Holographic", type: "per_unit", price: 0.12 },
        { id: "kiss_cut_sheet", name: "Kiss Cut Sheet", type: "per_unit", price: 0.08 },
      ],
    },
    slugs: ["die-cut-stickers"],
  },
  {
    key: "batch1_roll_labels",
    name: "Batch1 — Roll Labels",
    model: "QTY_TIERED",
    config: {
      tiers: [
        { minQty: 250, unitPrice: 0.42 },
        { minQty: 500, unitPrice: 0.26 },
        { minQty: 1000, unitPrice: 0.15 },
        { minQty: 2500, unitPrice: 0.09 },
        { minQty: 5000, unitPrice: 0.065 },
      ],
      minimumPrice: 50,
      fileFee: 0,
      finishings: [
        { id: "clear_bopp", name: "Clear BOPP", type: "per_unit", price: 0.03 },
        { id: "kraft_paper", name: "Kraft Paper", type: "per_unit", price: 0.02 },
        { id: "gloss_laminate", name: "Gloss Laminate", type: "per_unit", price: 0.02 },
      ],
    },
    slugs: ["roll-labels"],
  },
  {
    key: "batch1_postcards_standard",
    name: "Batch1 — Postcards Standard",
    model: "QTY_TIERED",
    config: {
      tiers: [
        { minQty: 100, unitPrice: 0.45 },
        { minQty: 250, unitPrice: 0.28 },
        { minQty: 500, unitPrice: 0.18 },
        { minQty: 1000, unitPrice: 0.12 },
        { minQty: 2500, unitPrice: 0.08 },
      ],
      minimumPrice: 25,
      fileFee: 0,
      finishings: [
        { id: "uv_coating", name: "UV Coating", type: "per_unit", price: 0.02 },
        { id: "rounded", name: "Rounded Corners", type: "per_unit", price: 0.01 },
      ],
    },
    slugs: ["postcards-standard"],
  },
  {
    key: "batch1_flyers_standard",
    name: "Batch1 — Flyers Standard",
    model: "QTY_TIERED",
    config: {
      tiers: [
        { minQty: 100, unitPrice: 0.55 },
        { minQty: 250, unitPrice: 0.35 },
        { minQty: 500, unitPrice: 0.25 },
        { minQty: 1000, unitPrice: 0.17 },
        { minQty: 2500, unitPrice: 0.1 },
      ],
      minimumPrice: 25,
      fileFee: 0,
      finishings: [
        { id: "double_sided", name: "Double Sided", type: "per_unit", price: 0.06 },
        { id: "uv_gloss", name: "UV Gloss", type: "per_unit", price: 0.03 },
        { id: "cardstock_14pt_upgrade", name: "14pt Cardstock Upgrade", type: "per_unit", price: 0.08 },
      ],
    },
    slugs: ["flyers-standard"],
  },
  {
    key: "batch1_posters_matte",
    name: "Batch1 — Posters Matte",
    model: "QTY_TIERED",
    config: {
      tiers: [
        { minQty: 1, unitPrice: 9.5 },
        { minQty: 5, unitPrice: 6.5 },
        { minQty: 10, unitPrice: 5.0 },
        { minQty: 25, unitPrice: 3.8 },
        { minQty: 50, unitPrice: 3.2 },
      ],
      minimumPrice: 9.5,
      fileFee: 0,
      finishings: [
        { id: "gloss_laminate", name: "Gloss Laminate", type: "per_unit", price: 1.5 },
        { id: "foam_board_mount", name: "Foam Board Mount", type: "per_unit", price: 8.0 },
      ],
    },
    slugs: ["posters-matte"],
  },
  {
    key: "batch1_coroplast_signs",
    name: "Batch1 — Coroplast Signs",
    model: "QTY_TIERED",
    config: {
      tiers: [
        { minQty: 1, unitPrice: 19.5 },
        { minQty: 5, unitPrice: 14.5 },
        { minQty: 10, unitPrice: 11.5 },
        { minQty: 25, unitPrice: 9.0 },
        { minQty: 50, unitPrice: 7.5 },
        { minQty: 100, unitPrice: 6.5 },
      ],
      minimumPrice: 19.5,
      fileFee: 0,
      finishings: [
        { id: "double_sided", name: "Double Sided", type: "per_unit", price: 6.0 },
        { id: "h_stake", name: "H-Stake", type: "per_unit", price: 3.5 },
        { id: "grommets", name: "Grommets", type: "per_unit", price: 2.0 },
      ],
    },
    slugs: ["coroplast-signs"],
  },
  {
    key: "batch1_aluminum_signs",
    name: "Batch1 — Aluminum Signs",
    model: "QTY_TIERED",
    config: {
      tiers: [
        { minQty: 1, unitPrice: 48.0 },
        { minQty: 5, unitPrice: 38.0 },
        { minQty: 10, unitPrice: 32.0 },
        { minQty: 25, unitPrice: 28.0 },
      ],
      minimumPrice: 48.0,
      fileFee: 0,
      finishings: [
        { id: "upgrade_080", name: "0.080 Upgrade", type: "per_unit", price: 18.0 },
        { id: "rounded", name: "Rounded Corners", type: "per_unit", price: 3.0 },
        { id: "drill_holes", name: "Drill Holes", type: "per_unit", price: 2.0 },
      ],
    },
    slugs: ["aluminum-signs"],
  },
  {
    key: "batch1_stamps_s520",
    name: "Batch1 — Stamps S520",
    model: "QTY_TIERED",
    config: {
      tiers: [
        { minQty: 1, unitPrice: 28.0 },
        { minQty: 5, unitPrice: 24.0 },
        { minQty: 10, unitPrice: 20.0 },
        { minQty: 25, unitPrice: 17.0 },
      ],
      minimumPrice: 28.0,
      fileFee: 0,
      finishings: [
        { id: "logo_upload", name: "Logo Upload", type: "per_unit", price: 5.0 },
        { id: "rush_2day", name: "Rush 2 Day", type: "per_unit", price: 8.0 },
        { id: "extra_ink_pad", name: "Extra Ink Pad", type: "per_unit", price: 6.0 },
      ],
    },
    slugs: ["stamps-s520"],
  },
  {
    key: "batch1_retractable_banner_premium",
    name: "Batch1 — Retractable Banner Premium",
    model: "QTY_TIERED",
    config: {
      tiers: [
        { minQty: 1, unitPrice: 145.0 },
        { minQty: 3, unitPrice: 128.0 },
        { minQty: 5, unitPrice: 115.0 },
        { minQty: 10, unitPrice: 105.0 },
      ],
      minimumPrice: 145.0,
      fileFee: 0,
      finishings: [
        { id: "led_spotlight", name: "LED Spotlight", type: "per_unit", price: 35.0 },
        { id: "carry_case_upgrade", name: "Carry Case Upgrade", type: "per_unit", price: 15.0 },
        { id: "replacement_print_only", name: "Replacement Print Only", type: "per_unit", price: 55.0 },
      ],
    },
    slugs: ["retractable-banner-stand-premium"],
  },
  {
    key: "batch1_x_banner_standard",
    name: "Batch1 — X-Banner Stand Standard",
    model: "QTY_TIERED",
    config: {
      tiers: [
        { minQty: 1, unitPrice: 72.0 },
        { minQty: 3, unitPrice: 62.0 },
        { minQty: 5, unitPrice: 55.0 },
        { minQty: 10, unitPrice: 48.0 },
      ],
      minimumPrice: 72.0,
      fileFee: 0,
      finishings: [
        { id: "double_sided_print", name: "Double Sided Print", type: "per_unit", price: 25.0 },
        { id: "replacement_print_only", name: "Replacement Print Only", type: "per_unit", price: 35.0 },
      ],
    },
    slugs: ["x-banner-stand-standard"],
  },
  {
    key: "batch1_tabletop_banner_a4",
    name: "Batch1 — Tabletop Banner A4",
    model: "QTY_TIERED",
    config: {
      tiers: [
        { minQty: 1, unitPrice: 55.0 },
        { minQty: 3, unitPrice: 48.0 },
        { minQty: 5, unitPrice: 42.0 },
        { minQty: 10, unitPrice: 38.0 },
      ],
      minimumPrice: 55.0,
      fileFee: 0,
      finishings: [{ id: "replacement_print_only", name: "Replacement Print Only", type: "per_unit", price: 22.0 }],
    },
    slugs: ["tabletop-banner-a4"],
  },
  {
    key: "batch1_vinyl_banners",
    name: "Batch1 — Vinyl Banners",
    model: "AREA_TIERED",
    config: {
      tiers: [
        { upToSqft: 6, rate: 4.5 },
        { upToSqft: 18, rate: 3.8 },
        { upToSqft: 32, rate: 3.2 },
        { upToSqft: 72, rate: 2.8 },
        { upToSqft: 200, rate: 2.4 },
      ],
      minimumPrice: 35,
      fileFee: 5,
      finishings: [
        { id: "double_sided", name: "Double Sided", type: "per_sqft", price: 1.5 },
        { id: "pole_pockets", name: "Pole Pockets", type: "flat", price: 3.0 },
        { id: "wind_slits", name: "Wind Slits", type: "flat", price: 0.5 },
      ],
    },
    slugs: ["vinyl-banners"],
  },
  {
    key: "batch1_window_graphics",
    name: "Batch1 — Window Graphics",
    model: "AREA_TIERED",
    config: {
      tiers: [
        { upToSqft: 4, rate: 12.0 },
        { upToSqft: 12, rate: 9.5 },
        { upToSqft: 32, rate: 7.5 },
        { upToSqft: 72, rate: 6.0 },
        { upToSqft: 200, rate: 5.0 },
      ],
      minimumPrice: 35,
      fileFee: 5,
      finishings: [
        { id: "lamination", name: "Lamination", type: "per_sqft", price: 2.0 },
        { id: "static_cling_upgrade", name: "Static Cling Upgrade", type: "per_sqft", price: 3.0 },
      ],
    },
    slugs: ["window-graphics"],
  },
];

const CLASSIC_DOUBLE_TIERS = [
  { qty: 50, unitPrice: 0.52 },
  { qty: 100, unitPrice: 0.34 },
  { qty: 250, unitPrice: 0.2 },
  { qty: 500, unitPrice: 0.125 },
  { qty: 1000, unitPrice: 0.082 },
  { qty: 2500, unitPrice: 0.062 },
  { qty: 5000, unitPrice: 0.048 },
];

const BC_MULTIPLIER = {
  classic: 1.0,
  matte: 1.12,
  gloss: 1.18,
  linen: 1.22,
  pearl: 1.28,
  "soft-touch": 1.3,
  thick: 1.35,
  "gold-foil": 1.55,
};

function scaleTiers(baseTiers, mul) {
  return baseTiers.map((t) => ({
    qty: t.qty,
    unitPrice: Number((t.unitPrice * mul).toFixed(4)),
  }));
}

function singleFromDouble(doubleTiers) {
  return doubleTiers.map((t) => ({
    qty: t.qty,
    unitPrice: Number((t.unitPrice * 0.85).toFixed(4)),
  }));
}

function buildBusinessCardsConfig(previousConfig) {
  const base = previousConfig && typeof previousConfig === "object" ? previousConfig : {};
  const sizes = [];
  const keys = Object.keys(BC_MULTIPLIER);
  for (const key of keys) {
    const doubleTiers = scaleTiers(CLASSIC_DOUBLE_TIERS, BC_MULTIPLIER[key]);
    if (key === "thick") {
      sizes.push({ label: "thick-double-layer", tiers: doubleTiers });
      sizes.push({
        label: "thick-triple-layer",
        tiers: doubleTiers.map((t) => ({ qty: t.qty, unitPrice: Number((t.unitPrice * 1.185).toFixed(4)) })),
      });
      continue;
    }
    sizes.push({ label: `${key}-single`, tiers: singleFromDouble(doubleTiers) });
    sizes.push({ label: `${key}-double`, tiers: doubleTiers });
  }

  return {
    ...base,
    sizes,
    addons: [
      { id: "rounded", name: "Rounded Corners", type: "per_unit", price: 0.01 },
      { id: "lam-single", name: "Lamination (Front)", type: "per_unit", price: 0.015 },
      { id: "lam-double", name: "Lamination (Both)", type: "per_unit", price: 0.025 },
      { id: "foil-single", name: "Gold Foil (Front)", type: "per_unit", price: 0.04 },
      { id: "foil-double", name: "Gold Foil (Both)", type: "per_unit", price: 0.07 },
      { id: "finish-gloss", name: "Gloss Finish", type: "per_unit", price: 0.02 },
      { id: "finish-matte", name: "Matte Finish", type: "per_unit", price: 0.02 },
      { id: "finish-softtouch", name: "Soft Touch Finish", type: "per_unit", price: 0.03 },
    ],
    minimumPrice: 25,
    fileFee: 5,
    multiName: {
      enabled: true,
      maxNames: 20,
      fileFees: [
        { upToNames: 4, feePerName: 800 },
        { upToNames: 9, feePerName: 500 },
        { upToNames: 999, feePerName: 300 },
      ],
    },
  };
}

async function main() {
  const targetSlugs = BATCH1_PRESETS.flatMap((p) => p.slugs);
  const existingProducts = await prisma.product.findMany({
    where: {
      slug: {
        in: [
          ...targetSlugs,
          "business-cards-classic",
          "business-cards-matte",
          "business-cards-gloss",
          "business-cards-linen",
          "business-cards-pearl",
          "business-cards-soft-touch",
          "business-cards-thick",
          "business-cards-gold-foil",
        ],
      },
    },
    select: { id: true, slug: true },
  });

  const found = new Set(existingProducts.map((p) => p.slug));
  const missing = [...targetSlugs].filter((s) => !found.has(s));
  if (missing.length > 0) {
    throw new Error(`Missing target products: ${missing.join(", ")}`);
  }

  console.log(`[batch1] products found: ${existingProducts.length}`);

  const actions = [];
  for (const preset of BATCH1_PRESETS) {
    actions.push(`upsert preset ${preset.key} (${preset.model})`);
    for (const slug of preset.slugs) actions.push(`assign ${slug} -> ${preset.key}`);
  }
  actions.push("update preset business_cards_premium config");

  if (!APPLY) {
    console.log("[batch1] dry-run actions:");
    console.log(actions.join("\n"));
    console.log("[batch1] pass --apply to write changes.");
    return;
  }

  for (const preset of BATCH1_PRESETS) {
    const row = await prisma.pricingPreset.upsert({
      where: { key: preset.key },
      create: {
        key: preset.key,
        name: preset.name,
        model: preset.model,
        config: preset.config,
        isActive: true,
      },
      update: {
        name: preset.name,
        model: preset.model,
        config: preset.config,
        isActive: true,
      },
    });

    await prisma.product.updateMany({
      where: { slug: { in: preset.slugs } },
      data: { pricingPresetId: row.id },
    });
  }

  const bcPreset = await prisma.pricingPreset.findUnique({ where: { key: "business_cards_premium" } });
  if (!bcPreset) throw new Error("Missing preset: business_cards_premium");
  const nextBcConfig = buildBusinessCardsConfig(bcPreset.config);
  await prisma.pricingPreset.update({
    where: { id: bcPreset.id },
    data: { config: nextBcConfig, isActive: true },
  });

  console.log("[batch1] applied successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

