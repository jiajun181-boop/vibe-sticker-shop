import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const TARGET_SLUGS = new Set([
  "foam-board-easel",
  "gatorboard-signs",
  "pvc-sintra-signs",
  "clear-acrylic-signs",
  "double-sided-lawn-signs",
  "directional-arrow-signs",
  "foam-board-prints",
  "frosted-acrylic-signs",
  "acm-dibond-signs",
  "aluminum-signs",
  "magnetic-car-signs",
  "handheld-signs",
  "safety-signs",
  "construction-site-signs",
  "a-frame-stand",
  "packaging-inserts",
  "hang-tags",
  "label-sets",
  "sticker-seals",
  "packing-slips",
  "wayfinding-signs",
  "menu-boards",
  "tabletop-signs",
  "standoff-mounted-signs",
  "coroplast-signs",
  "parking-property-signs",
  "yard-sign-panel-only",
  "real-estate-agent-sign",
  "tags-tickets-rigid",
  "calendars-wall-desk",
  "backdrop-board",
  "yard-sign-h-frame",
  "lawn-signs-h-stake",
  "acrylic-signs",
  "thank-you-cards",
  "rigid-foam-board-prints",
  "banner-stand-rollup",
  "banner-stand-l-base",
  "h-stakes",
  "a-frame-insert-prints",
  "teardrop-flag-pole-set",
  "flag-bases-cross",
  "flag-base-ground-stake",
  "flag-base-water-bag",
  "banner-stand-x",
  "backdrop-stand-hardware",
  "step-and-repeat-stand-kit",
  "tent-frame-10x10",
  "feather-flag-pole-set",
  "grommets-service",
  "banner-hems",
  "pole-pockets",
  "drilled-holes-service",
  "standoff-hardware-set",
  "double-sided-tape",
  "velcro-strips",
  "roll-up-stand-hardware",
  "x-stand-hardware",
  "tent-walls-set",
  "a-frame-sign-stand",
  "installation-service",
  "rigid-tabletop-signs",
]);

function tunedPrice(slug, category) {
  const s = String(slug || "").toLowerCase();
  const c = String(category || "").toLowerCase();

  const explicit = {
    // packaging
    "packing-slips": 120,
    "sticker-seals": 180,
    "packaging-inserts": 220,
    "thank-you-cards": 220,
    "hang-tags": 280,
    "label-sets": 350,

    // service / accessories
    "grommets-service": 500,
    "banner-hems": 700,
    "pole-pockets": 900,
    "drilled-holes-service": 600,
    "double-sided-tape": 900,
    "velcro-strips": 1200,
    "h-stakes": 1200,
    "flag-base-ground-stake": 2900,
    "flag-base-water-bag": 3900,
    "flag-bases-cross": 5900,
    "standoff-hardware-set": 3200,
    "installation-service": 19900,

    // display hardware
    "x-stand-hardware": 4500,
    "banner-stand-x": 4900,
    "banner-stand-l-base": 6900,
    "banner-stand-rollup": 9900,
    "roll-up-stand-hardware": 9900,
    "teardrop-flag-pole-set": 9900,
    "feather-flag-pole-set": 9900,
    "backdrop-stand-hardware": 12900,
    "step-and-repeat-stand-kit": 12900,
    "tent-frame-10x10": 25900,
    "tent-walls-set": 12900,
    "a-frame-stand": 14900,
    "a-frame-sign-stand": 14900,

    // rigid signs
    "acrylic-signs": 9900,
    "clear-acrylic-signs": 9900,
    "frosted-acrylic-signs": 9900,
    "acm-dibond-signs": 8900,
    "aluminum-signs": 8900,
    "gatorboard-signs": 5900,
    "pvc-sintra-signs": 5900,
    "foam-board-easel": 5200,
    "foam-board-prints": 5200,
    "rigid-foam-board-prints": 5200,
    "coroplast-signs": 4200,
    "double-sided-lawn-signs": 4200,
    "yard-sign-panel-only": 4200,
    "yard-sign-h-frame": 4200,
    "lawn-signs-h-stake": 4200,
    "menu-boards": 3900,
    "tabletop-signs": 3900,
    "rigid-tabletop-signs": 3900,
  };
  if (explicit[s]) return explicit[s];

  if (c === "packaging") return 250;

  if (c === "display-stands") {
    if (s.includes("tent")) return 15900;
    if (s.includes("stand") || s.includes("frame")) return 9900;
    return 5500;
  }

  if (c === "rigid-signs") {
    if (s.includes("wayfinding") || s.includes("parking") || s.includes("directional")) return 4500;
    if (s.includes("safety") || s.includes("construction")) return 4500;
    if (s.includes("magnetic")) return 5900;
    return 5200;
  }

  return 3900;
}

async function main() {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    select: { id: true, slug: true, category: true, basePrice: true, pricingPresetId: true },
  });

  let updated = 0;
  for (const p of products) {
    if (!TARGET_SLUGS.has(p.slug)) continue;
    if (p.pricingPresetId) continue;

    const next = tunedPrice(p.slug, p.category);
    if (!Number.isFinite(next) || next <= 0) continue;
    if (p.basePrice === next) continue;

    await prisma.product.update({
      where: { id: p.id },
      data: { basePrice: next },
    });
    updated += 1;
    console.log(`Tuned ${p.slug}: ${p.basePrice} -> ${next}`);
  }

  console.log(`Done. Tuned ${updated} products.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

