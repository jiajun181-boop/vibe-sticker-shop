#!/usr/bin/env node
// prisma/backfill-business-cards-pricing.mjs
// Creates/updates all business card material variant products with pricing.
// Each material is its own product slug with single/double sided options.
// Run: node prisma/backfill-business-cards-pricing.mjs

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// ── Base pricing (classic, single sided) ──
// Market-competitive anchor points — low entry price for "starting from" appeal.
// VistaPrint ~$25-35/250, Staples ~$30-40/250, MOO ~$20 USD/50
// Our curve: attractive entry at 50 pcs, strong volume discounts.
const QUANTITIES = [50, 100, 250, 500, 1000, 2500, 5000];

const BASE_SINGLE = {
  50:   12.99,   // $0.260/ea — low "from" price
  100:  18.99,   // $0.190/ea
  250:  29.99,   // $0.120/ea — beats VistaPrint
  500:  49.99,   // $0.100/ea
  1000: 74.99,   // $0.075/ea
  2500: 149.99,  // $0.060/ea
  5000: 234.99,  // $0.047/ea — best bulk rate
};

function buildPriceByQty(material, sideMult) {
  const base = material.prices || BASE_SINGLE;
  const mult = material.mult || 1.0;
  const result = {};
  for (const q of QUANTITIES) {
    const dollars = base[q] * mult * sideMult;
    result[String(q)] = Math.round(dollars * 100);
  }
  return result;
}

// ── Material variants ──
// Each has: slug, name, description, multiplier
const MATERIALS = [
  {
    slug: "business-cards-classic",
    name: "Business Cards — Classic (14pt)",
    mult: 1.0,
    desc: "Classic 14pt C2S business cards with full-colour printing. The industry standard — sturdy, professional, and affordable. Perfect for networking, sales teams, and everyday business use. Printed in Toronto with fast turnaround across Ontario and Canada.",
  },
  {
    slug: "business-cards-gloss",
    name: "Business Cards — Gloss UV",
    mult: 1.05,
    desc: "Gloss UV coated business cards on 14pt cardstock. High-shine finish that makes colours pop and protects against fingerprints. Ideal for photographers, designers, restaurants, and retail businesses wanting vibrant, eye-catching cards. Toronto printing with GTA delivery.",
  },
  {
    slug: "business-cards-matte",
    name: "Business Cards — Matte Laminated",
    mult: 1.1,
    desc: "Matte laminated business cards on 14pt cardstock. Smooth, non-reflective finish with a sophisticated feel. Resists fingerprints and smudges. Popular with lawyers, consultants, financial advisors, and luxury brands. Printed in Toronto, shipped across Canada.",
  },
  {
    slug: "business-cards-soft-touch",
    name: "Business Cards — Soft Touch",
    mult: 1.25,
    desc: "Soft-touch laminated business cards with a velvety, suede-like texture. Premium tactile finish that leaves a lasting impression. Favoured by luxury brands, boutique hotels, spas, and high-end professionals. Printed in Toronto with shipping across Ontario.",
  },
  {
    slug: "business-cards-gold-foil",
    name: "Business Cards — Gold Foil",
    mult: 1.0,
    // Gold foil is expensive — custom dies + metallic foil material.
    // Own price table, not a multiplier on classic.
    prices: {
      50:   49.99,   // $1.00/ea
      100:  79.99,   // $0.80/ea
      250:  149.99,  // $0.60/ea
      500:  249.99,  // $0.50/ea
      1000: 399.99,  // $0.40/ea
      2500: 849.99,  // $0.34/ea
      5000: 1499.99, // $0.30/ea
    },
    desc: "Gold foil stamped business cards for maximum impact. Metallic gold accents on premium cardstock — ideal for jewellery brands, real estate agents, wedding planners, and luxury services. Hot foil stamping with full-colour printing. Toronto studio with Canada-wide delivery.",
  },
  {
    slug: "business-cards-linen",
    name: "Business Cards — Linen Texture",
    mult: 1.15,
    desc: "Linen textured business cards with a subtle woven pattern. Classic, elegant feel reminiscent of fine stationery. Perfect for accountants, law firms, financial services, and heritage brands. Full-colour on premium linen stock. Printed in Toronto.",
  },
  {
    slug: "business-cards-pearl",
    name: "Business Cards — Pearl / Shimmer",
    mult: 1.2,
    desc: "Pearl shimmer business cards with an iridescent, pearlescent finish. Subtle sparkle that catches the light beautifully. Ideal for beauty salons, event planners, photographers, and creative professionals. Premium stock printed in Toronto.",
  },
  {
    slug: "business-cards-thick",
    name: "Business Cards — Thick (18pt)",
    mult: 1.15,
    desc: "Extra thick 18pt business cards for a substantial, premium feel. 30% thicker than standard cards — makes an immediate impression of quality. Popular with executives, architects, premium brands, and anyone wanting to stand out. Toronto printing.",
  },
  {
    slug: "magnets-business-card",
    name: "Business Card Magnets",
    mult: 2.0,
    desc: "Business card magnets — full-colour printed on magnetic backing. Stick to fridges, filing cabinets, and metal surfaces for constant brand visibility. Perfect for real estate agents, HVAC companies, plumbers, pizza shops, and any service business. Toronto printing with Canada-wide shipping.",
  },
];

// ── Build optionsConfig for each material ──
function buildOptionsConfig(material) {
  const sizeLabel = '3.5" × 2"';
  const singleLabel = `${sizeLabel} - Single Sided`;
  const doubleLabel = `${sizeLabel} - Double Sided`;

  return {
    quantityRange: { min: 50, max: 5000, step: 1 },
    sizes: [
      {
        label: singleLabel,
        widthIn: 3.5,
        heightIn: 2,
        quantityChoices: QUANTITIES,
        priceByQty: buildPriceByQty(material, 1.0),
        notes: `${material.name}, single sided, full colour.`,
      },
      {
        label: doubleLabel,
        widthIn: 3.5,
        heightIn: 2,
        quantityChoices: QUANTITIES,
        priceByQty: buildPriceByQty(material, 1.1),
        notes: `${material.name}, double sided, full colour.`,
      },
    ],
    addons: [
      { id: "rounded", name: "Rounded Corners", type: "per_unit", unitCents: 2 },
    ],
    ui: {
      hideTierPricing: true,
      hideMaterials: true,
      allowedAddons: ["rounded"],
    },
  };
}

// ── Main ──
async function main() {
  let created = 0;
  let updated = 0;

  for (const mat of MATERIALS) {
    const existing = await prisma.product.findFirst({ where: { slug: mat.slug } });

    const optionsConfig = buildOptionsConfig(mat);

    if (existing) {
      await prisma.product.update({
        where: { id: existing.id },
        data: {
          name: mat.name,
          description: mat.desc,
          optionsConfig,
          isActive: true,
        },
      });
      console.log(`  ~ Updated: ${mat.slug} (${mat.mult}x)`);
      updated++;
    } else {
      await prisma.product.create({
        data: {
          slug: mat.slug,
          name: mat.name,
          description: mat.desc,
          category: "business-cards",
          basePrice: 0,
          isActive: true,
          optionsConfig,
        },
      });
      console.log(`  + Created: ${mat.slug} (${mat.mult}x)`);
      created++;
    }

    // Print sample pricing for verification
    const singlePrice = optionsConfig.sizes[0].priceByQty;
    const doublePrice = optionsConfig.sizes[1].priceByQty;
    console.log(`    Single: 250=$${(singlePrice["250"] / 100).toFixed(2)}, 500=$${(singlePrice["500"] / 100).toFixed(2)}, 1000=$${(singlePrice["1000"] / 100).toFixed(2)}`);
    console.log(`    Double: 250=$${(doublePrice["250"] / 100).toFixed(2)}, 500=$${(doublePrice["500"] / 100).toFixed(2)}, 1000=$${(doublePrice["1000"] / 100).toFixed(2)}`);
  }

  console.log(`\nDone — ${created} created, ${updated} updated.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
