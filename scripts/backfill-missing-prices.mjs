import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function hasSizePricing(optionsConfig) {
  if (!optionsConfig || typeof optionsConfig !== "object") return false;
  const sizes = Array.isArray(optionsConfig.sizes) ? optionsConfig.sizes : [];
  return sizes.some((s) => {
    if (!s || typeof s !== "object") return false;
    if (s.priceByQty && typeof s.priceByQty === "object" && Object.keys(s.priceByQty).length > 0) return true;
    if (typeof s.unitCents === "number" || typeof s.unitPriceCents === "number") return true;
    if (Array.isArray(s.tiers) && s.tiers.length > 0) return true;
    return false;
  });
}

function inferPriceCents(product) {
  const slug = String(product.slug || "").toLowerCase();
  const category = String(product.category || "").toLowerCase();

  const explicit = {
    "grommets-service": 300,
    "banner-hems": 500,
    "pole-pockets": 700,
    "drilled-holes-service": 400,
    "double-sided-tape": 600,
    "velcro-strips": 800,
    "installation-service": 15000,
    "h-stakes": 900,
    "flag-base-ground-stake": 2400,
    "flag-bases-cross": 4900,
    "flag-base-water-bag": 3500,
    "standoff-hardware-set": 2800,
    "packing-slips": 80,
    "sticker-seals": 120,
    "label-sets": 300,
    "hang-tags": 220,
    "packaging-inserts": 180,
    "thank-you-cards": 150,
  };
  if (explicit[slug]) return explicit[slug];

  if (category === "display-stands") {
    if (slug.includes("roll-up") || slug.includes("rollup")) return 7900;
    if (slug.includes("x-stand")) return 4900;
    if (slug.includes("l-base")) return 5900;
    if (slug.includes("a-frame")) return 12900;
    if (slug.includes("teardrop") || slug.includes("feather")) return 8900;
    if (slug.includes("tent")) return 19900;
    if (slug.includes("backdrop")) return 14900;
    return 6500;
  }

  if (category === "packaging") {
    return 200;
  }

  if (category === "rigid-signs") {
    if (slug.includes("acrylic")) return 8900;
    if (slug.includes("aluminum") || slug.includes("acm") || slug.includes("dibond")) return 7900;
    if (slug.includes("coroplast")) return 3900;
    if (slug.includes("yard-sign") || slug.includes("lawn-sign")) return 3500;
    if (slug.includes("foam-board") || slug.includes("kt-board")) return 4500;
    if (slug.includes("menu") || slug.includes("tabletop")) return 3200;
    if (slug.includes("construction") || slug.includes("safety")) return 3900;
    return 4900;
  }

  return 3900;
}

async function main() {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    select: {
      id: true,
      slug: true,
      name: true,
      category: true,
      type: true,
      basePrice: true,
      pricingUnit: true,
      pricingPresetId: true,
      optionsConfig: true,
    },
  });

  const targets = products.filter((p) => {
    const hasPreset = !!p.pricingPresetId;
    const hasBase = Number.isFinite(p.basePrice) && p.basePrice > 0;
    const hasOptionsPrice = hasSizePricing(p.optionsConfig);
    return !hasPreset && !hasBase && !hasOptionsPrice;
  });

  if (targets.length === 0) {
    console.log("No missing-price products found.");
    return;
  }

  let updated = 0;
  for (const p of targets) {
    const basePrice = inferPriceCents(p);
    await prisma.product.update({
      where: { id: p.id },
      data: {
        basePrice,
        pricingUnit: p.pricingUnit || "per_piece",
      },
    });
    updated += 1;
    console.log(`Updated ${p.slug} -> ${basePrice} cents`);
  }

  console.log(`Done. Updated ${updated} products.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

