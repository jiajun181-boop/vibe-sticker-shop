#!/usr/bin/env node
// scripts/update-postcard-config.mjs
// Cleans up postcard product: adds friendly labels, recommended flags, dropdown mode.

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// Friendly names for common postcard sizes
const FRIENDLY_NAMES = {
  '4" x 6"': "4\" × 6\" (Standard Postcard)",
  '5" x 7"': "5\" × 7\" (Photo Card)",
  '8.5" x 5.5"': '8.5\" × 5.5\" (Half Letter)',
  '8.5" x 3.5"': '8.5\" × 3.5\" (Rack Card)',
  '4" x 9"': '4\" × 9\" (DL / Rack)',
  '6" x 9"': '6\" × 9\" (Jumbo)',
  '4" x 4"': '4\" × 4\" (Square)',
  '2.5" x 2.5"': '2.5\" × 2.5\" (Mini Square)',
  '8.5" x 11"': '8.5\" × 11\" (Letter)',
  '11" x 17"': '11\" × 17\" (Tabloid)',
  '6" x 12"': '6\" × 12\" (Trifold)',
  '4.25" x 5.5"': '4.25\" × 5.5\" (Quarter)',
  '4.25" x 6"': '4.25\" × 6\" (USPS Standard)',
  '4.25" x 11"': '4.25\" × 11\" (Trifold)',
  '2" x 8"': '2\" × 8\" (Bookmark)',
  '3" x 4"': '3\" × 4\" (Mini)',
  '8" x 5"': '8\" × 5\"',
  '8.5" x 6"': '8.5\" × 6\"',
  '3.5" x 2.5"': '3.5\" × 2.5\" (Business Card)',
  '5.5" x 2.125"': '5.5\" × 2.125\" (Ticket)',
  '4.25" x 2.75"': '4.25\" × 2.75\" (Mini Card)',
  '4.25" x 3.66"': '4.25\" × 3.66\" (A2 Response)',
  '8.5" x 3.66"': '8.5\" × 3.66\" (Slim)',
  '3.75" x 9"': '3.75\" × 9\" (#10 Envelope Insert)',
  '8.5" x 2.75"': '8.5\" × 2.75\" (Slim Strip)',
  '3.75" x 9.25"': '3.75\" × 9.25\" (#10 Envelope)',
};

// Most popular postcard sizes
const POPULAR = new Set(['4" x 6"', '5" x 7"', '4.25" x 6"', '6" x 9"']);

async function main() {
  const product = await prisma.product.findFirst({ where: { slug: "postcards" } });
  if (!product) {
    console.log("Postcard product not found");
    return;
  }

  const cfg = product.optionsConfig || {};
  const sizes = (cfg.sizes || []).map((s) => {
    const friendly = FRIENDLY_NAMES[s.label];
    const result = { ...s };
    if (friendly) result.displayLabel = friendly;
    if (POPULAR.has(s.label)) result.recommended = true;
    return result;
  });

  // Sort: recommended first, then by area (smallest to largest)
  sizes.sort((a, b) => {
    if (a.recommended && !b.recommended) return -1;
    if (!a.recommended && b.recommended) return 1;
    return (a.widthIn * a.heightIn) - (b.widthIn * b.heightIn);
  });

  const newConfig = {
    ...cfg,
    sizes,
    ui: {
      ...cfg.ui,
      sizeMode: "dropdown",
    },
  };

  await prisma.product.update({
    where: { id: product.id },
    data: { optionsConfig: newConfig },
  });

  console.log("Updated postcard optionsConfig:");
  sizes.forEach((s) => {
    const display = s.displayLabel || s.label;
    console.log(`  ${display}${s.recommended ? " [POPULAR]" : ""}`);
  });
  console.log(`\n${sizes.length} sizes total, sizeMode: dropdown`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
