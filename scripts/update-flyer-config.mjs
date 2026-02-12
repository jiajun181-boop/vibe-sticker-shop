#!/usr/bin/env node
// scripts/update-flyer-config.mjs
// Cleans up flyer product optionsConfig: removes (14pt) from labels,
// adds recommended flag to popular sizes, adds variantLabel for dropdown UI.

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const flyer = await prisma.product.findFirst({ where: { slug: "flyers" } });
  if (!flyer) {
    console.log("Flyer product not found");
    return;
  }

  const cfg = flyer.optionsConfig || {};

  // Clean up size labels: remove "(14pt)" material info
  const cleanSizes = (cfg.sizes || []).map((s) => {
    let label = s.label
      .replace(/\s*\(14pt\)/g, "")
      .replace(/\s*\(16pt\)/g, "")
      .trim();

    // Mark 8.5" x 11" (Letter) as recommended — most popular flyer size
    const recommended = label.includes("8.5") && label.includes("11");

    const result = { ...s, label };
    if (recommended) result.recommended = true;
    return result;
  });

  const newConfig = {
    ...cfg,
    sizes: cleanSizes,
    ui: {
      ...cfg.ui,
      variantLabel: "Sides",
    },
  };

  await prisma.product.update({
    where: { id: flyer.id },
    data: { optionsConfig: newConfig },
  });

  console.log("Updated flyer optionsConfig:");
  console.log("Size labels:");
  cleanSizes.forEach((s) => {
    console.log(`  ${s.label}${s.recommended ? " [RECOMMENDED]" : ""}`);
  });
  console.log("\nUI config:", JSON.stringify(newConfig.ui, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
