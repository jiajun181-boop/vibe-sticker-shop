#!/usr/bin/env node
/**
 * Replace $0.01 placeholder pricing presets with real Canadian market-rate prices.
 *
 * Run:  node scripts/fix-placeholder-prices.mjs           (dry-run)
 * Run:  node scripts/fix-placeholder-prices.mjs --apply   (write to DB)
 *
 * Prices are based on Canadian print industry market rates (CAD) for 2024-2025.
 * Sources: StickerMule.ca, 4Over, PrintingForLess, VistaPrint.ca, BannerBuzz.ca, SignWarehouse
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const apply = process.argv.includes("--apply");

// ─── Market-rate pricing definitions ──────────────────────────────

// Helper: generate tiers with volume discounts
// basePriceEach = single unit price (CAD dollars)
// discountCurve = array of [minQty, discountPct] — cumulative discount
function makeTiers(basePriceEach, breakpoints) {
  return breakpoints.map(([minQty, price]) => ({
    minQty,
    unitPrice: Number(price.toFixed(2)),
  }));
}

// ─── STICKERS & LABELS (per-piece, ~3"x3" standard size) ──────────

// Die-cut / kiss-cut custom stickers — 3"x3" vinyl
// Market: StickerMule 50pc=$69 ($1.38ea), 100pc=$89 ($0.89ea), 500pc=$189 ($0.38ea), 1000pc=$259 ($0.26ea)
const STICKER_CUSTOM = {
  key: "market_sticker_custom",
  name: "Custom Stickers (die-cut / kiss-cut)",
  tiers: makeTiers(1.50, [
    [1, 1.50], [25, 1.20], [50, 0.95], [100, 0.75],
    [250, 0.55], [500, 0.40], [1000, 0.28],
  ]),
  minimumPrice: 25,
  fileFee: 0,
};

// Sticker sheets (kiss-cut sheets, multi-on-sheet)
// Market: Higher per-sheet since multiple stickers per sheet
const STICKER_SHEETS = {
  key: "market_sticker_sheets",
  name: "Sticker Sheets (kiss-cut)",
  tiers: makeTiers(3.50, [
    [1, 3.50], [10, 2.80], [25, 2.25], [50, 1.85],
    [100, 1.50], [250, 1.20], [500, 0.95],
  ]),
  minimumPrice: 25,
  fileFee: 0,
};

// Sticker packs (pre-made assorted packs)
const STICKER_PACKS = {
  key: "market_sticker_packs",
  name: "Sticker Packs",
  tiers: makeTiers(5.00, [
    [1, 5.00], [10, 4.25], [25, 3.75], [50, 3.25],
    [100, 2.75], [250, 2.25],
  ]),
  minimumPrice: 25,
  fileFee: 0,
};

// Foil / holographic stickers — premium material, higher price
// Market: 20-40% above standard vinyl
const STICKER_FOIL = {
  key: "market_sticker_foil",
  name: "Foil / Holographic Stickers",
  tiers: makeTiers(2.00, [
    [1, 2.00], [25, 1.65], [50, 1.35], [100, 1.10],
    [250, 0.85], [500, 0.60],
  ]),
  minimumPrice: 30,
  fileFee: 0,
};

// Heavy-duty outdoor vinyl — thicker material
const STICKER_HEAVYDUTY = {
  key: "market_sticker_heavyduty",
  name: "Heavy-Duty Outdoor Vinyl Stickers",
  tiers: makeTiers(1.75, [
    [1, 1.75], [25, 1.40], [50, 1.10], [100, 0.90],
    [250, 0.65], [500, 0.48], [1000, 0.35],
  ]),
  minimumPrice: 25,
  fileFee: 0,
};

// Removable stickers — repositionable adhesive
const STICKER_REMOVABLE = {
  key: "market_sticker_removable",
  name: "Removable Stickers",
  tiers: makeTiers(1.60, [
    [1, 1.60], [25, 1.30], [50, 1.05], [100, 0.82],
    [250, 0.60], [500, 0.45], [1000, 0.32],
  ]),
  minimumPrice: 25,
  fileFee: 0,
};

// Roll labels (BOPP, clear, kraft) — high volume, lower per-unit
// Market: Stickergiant 500pc=$159 ($0.32ea), 1000pc=$209 ($0.21ea), 5000pc=$599 ($0.12ea)
const ROLL_LABELS = {
  key: "market_roll_labels",
  name: "Roll Labels (BOPP / Clear / Kraft)",
  tiers: makeTiers(0.45, [
    [1, 0.45], [100, 0.35], [250, 0.28], [500, 0.22],
    [1000, 0.16], [2500, 0.12], [5000, 0.09],
  ]),
  minimumPrice: 35,
  fileFee: 0,
};

// Barcode / QR code labels — simple print, high volume
const BARCODE_LABELS = {
  key: "market_barcode_labels",
  name: "Barcode / QR Code Labels",
  tiers: makeTiers(0.35, [
    [1, 0.35], [100, 0.25], [250, 0.18], [500, 0.14],
    [1000, 0.10], [2500, 0.07], [5000, 0.05],
  ]),
  minimumPrice: 25,
  fileFee: 0,
};

// ─── BANNERS & DISPLAYS (per-piece, larger items) ─────────────────

// Feather / teardrop flags — complete kit (print + pole + base)
// Market: BannerBuzz 8ft=$89, 10ft=$109, 12ft=$139; quantity discounts ~10-15% per tier
const FLAG_KIT = {
  key: "market_flag_kit",
  name: "Feather / Teardrop Flag Kit",
  tiers: makeTiers(119, [
    [1, 119], [2, 109], [5, 99], [10, 89],
    [25, 79], [50, 69],
  ]),
  minimumPrice: 99,
  fileFee: 0,
};

// Roll-up / pull-up banner stands (print + hardware)
// Market: VistaPrint 33"x80" retractable ~$79-$129; BannerBuzz $89 single
const ROLLUP_BANNER = {
  key: "market_rollup_banner",
  name: "Roll-Up / Pull-Up Banner Stand",
  tiers: makeTiers(99, [
    [1, 99], [2, 89], [5, 79], [10, 72],
    [25, 65], [50, 59],
  ]),
  minimumPrice: 89,
  fileFee: 0,
};

// X-banner stands with print
// Market: Cheaper than rollup — $39-$59
const XBANNER = {
  key: "market_xbanner_print",
  name: "X-Banner Stand with Print",
  tiers: makeTiers(55, [
    [1, 55], [2, 49], [5, 44], [10, 39],
    [25, 35], [50, 32],
  ]),
  minimumPrice: 49,
  fileFee: 0,
};

// Step & repeat / telescopic backdrops — large format
// Market: 8x8 step-repeat ~$199-$349
const BACKDROP = {
  key: "market_backdrop",
  name: "Step & Repeat / Telescopic Backdrop",
  tiers: makeTiers(249, [
    [1, 249], [2, 229], [3, 215], [5, 199],
    [10, 179],
  ]),
  minimumPrice: 199,
  fileFee: 0,
};

// Media wall / popup display — large hardware
// Market: $299-$499 for 8ft popup
const MEDIA_WALL = {
  key: "market_media_wall",
  name: "Media Wall / Pop-Up Display",
  tiers: makeTiers(399, [
    [1, 399], [2, 369], [3, 349], [5, 319],
    [10, 289],
  ]),
  minimumPrice: 349,
  fileFee: 0,
};

// Pillowcase display (fabric tension frame)
// Market: $129-$189
const PILLOWCASE = {
  key: "market_pillowcase_display",
  name: "Pillowcase Display Frame",
  tiers: makeTiers(159, [
    [1, 159], [2, 145], [3, 135], [5, 125],
    [10, 115],
  ]),
  minimumPrice: 129,
  fileFee: 0,
};

// Table cloth / table cover — printed
// Market: 6ft fitted $89-$149, branded $129-$179
const TABLE_COVER = {
  key: "market_table_cover",
  name: "Branded Table Cloth / Cover",
  tiers: makeTiers(129, [
    [1, 129], [2, 119], [5, 109], [10, 99],
    [25, 89],
  ]),
  minimumPrice: 99,
  fileFee: 0,
};

// ─── VEHICLE ──────────────────────────────────────────────────────

// Flexible magnets (car door magnets 12"x18")
// Market: $25-$45 each, volume to $15
const MAGNETS = {
  key: "market_magnets_flexible",
  name: "Flexible Vehicle Magnets",
  tiers: makeTiers(35, [
    [1, 35], [2, 30], [5, 25], [10, 22],
    [25, 18], [50, 15],
  ]),
  minimumPrice: 30,
  fileFee: 0,
};

// ─── WINDOWS ──────────────────────────────────────────────────────

// Window decals (small per-piece items like "OPEN" signs, hours decals)
// Market: $5-$12 each, volume to $3
const WINDOW_DECALS = {
  key: "market_window_decals",
  name: "Window Decals",
  tiers: makeTiers(8, [
    [1, 8], [5, 6.50], [10, 5.50], [25, 4.50],
    [50, 3.75], [100, 3.25], [250, 2.75],
  ]),
  minimumPrice: 8,
  fileFee: 0,
};

// ─── Slug → preset mapping ───────────────────────────────────────

const SLUG_PRESET_MAP = {
  // Stickers
  "stickers-single-diecut": STICKER_CUSTOM,
  "stickers-color-on-clear": STICKER_CUSTOM,
  "stickers-color-on-white": STICKER_CUSTOM,
  "heavy-duty-vinyl-stickers": STICKER_HEAVYDUTY,
  "removable-stickers": STICKER_REMOVABLE,
  "foil-stickers": STICKER_FOIL,
  "holographic-stickers": STICKER_FOIL,

  // Sticker sheets
  "kiss-cut-sticker-sheets": STICKER_SHEETS,
  "stickers-sheet-kisscut": STICKER_SHEETS,
  "stickers-multi-on-sheet": STICKER_SHEETS,
  "sticker-packs": STICKER_PACKS,

  // Roll labels
  "labels-roll-quote": ROLL_LABELS,
  "labels-white-bopp": ROLL_LABELS,
  "labels-clear": ROLL_LABELS,
  "white-bopp-labels": ROLL_LABELS,
  "clear-labels": ROLL_LABELS,
  "kraft-paper-labels": ROLL_LABELS,
  "freezer-labels": ROLL_LABELS,

  // Barcode / QR
  "barcode-labels": BARCODE_LABELS,
  "qr-code-labels": BARCODE_LABELS,

  // Flags
  "feather-flag": FLAG_KIT,
  "feather-flags": FLAG_KIT,
  "teardrop-flag": FLAG_KIT,
  "teardrop-flags": FLAG_KIT,

  // Roll-up banners
  "roll-up-banners": ROLLUP_BANNER,
  "pull-up-banner": ROLLUP_BANNER,

  // X-banners
  "x-banner-prints": XBANNER,
  "x-banner-frame-print": XBANNER,

  // Backdrops
  "step-repeat-backdrops": BACKDROP,
  "telescopic-backdrop": BACKDROP,

  // Large displays
  "media-wall-pop-up": MEDIA_WALL,
  "pillowcase-display-frame": PILLOWCASE,

  // Table
  "table-cloth": TABLE_COVER,

  // Vehicle
  "magnets-flexible": MAGNETS,

  // Windows
  "window-decals": WINDOW_DECALS,
};

// ─── Main ────────────────────────────────────────────────────────

async function main() {
  // Step 1: Create or update preset records
  const presetsToCreate = new Map();
  for (const preset of Object.values(SLUG_PRESET_MAP)) {
    presetsToCreate.set(preset.key, preset);
  }

  console.log(`${apply ? "APPLY" : "DRY-RUN"} — ${presetsToCreate.size} presets to create/update\n`);

  const presetIdMap = {}; // key → id

  for (const [key, preset] of presetsToCreate) {
    const config = {
      tiers: preset.tiers,
      fileFee: preset.fileFee,
      minimumPrice: preset.minimumPrice,
    };

    console.log(`  PRESET  ${key.padEnd(35)} — ${preset.tiers.length} tiers, $${preset.tiers[0].unitPrice} → $${preset.tiers[preset.tiers.length - 1].unitPrice}`);

    if (apply) {
      const record = await prisma.pricingPreset.upsert({
        where: { key },
        create: {
          key,
          name: preset.name,
          model: "QTY_TIERED",
          config,
        },
        update: {
          name: preset.name,
          config,
        },
      });
      presetIdMap[key] = record.id;
    }
  }

  // Step 2: Reassign products to correct presets & update basePrice
  console.log(`\n--- Reassigning ${Object.keys(SLUG_PRESET_MAP).length} products ---\n`);

  const products = await prisma.product.findMany({
    where: { isActive: true, slug: { in: Object.keys(SLUG_PRESET_MAP) } },
    select: { id: true, slug: true, basePrice: true, pricingPresetId: true },
  });

  let updated = 0;
  let notFound = 0;

  for (const [slug, preset] of Object.entries(SLUG_PRESET_MAP)) {
    const product = products.find(p => p.slug === slug);
    if (!product) {
      console.log(`  SKIP  ${slug.padEnd(40)} — product not found`);
      notFound++;
      continue;
    }

    const newBasePrice = Math.round(preset.tiers[0].unitPrice * 100); // cents
    const newMinPrice = Math.round(preset.tiers[preset.tiers.length - 1].unitPrice * 100);

    console.log(`  SET   ${slug.padEnd(40)} — base:$${(newBasePrice/100).toFixed(2)} min:$${(newMinPrice/100).toFixed(2)} preset:${preset.key}`);

    if (apply) {
      const presetId = presetIdMap[preset.key];
      await prisma.product.update({
        where: { id: product.id },
        data: {
          basePrice: newBasePrice,
          minPrice: newMinPrice,
          pricingPresetId: presetId,
        },
      });
    }
    updated++;
  }

  console.log(`\nDone: ${updated} ${apply ? "updated" : "would update"}, ${notFound} not found`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
