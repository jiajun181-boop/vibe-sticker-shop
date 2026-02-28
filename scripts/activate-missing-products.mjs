// scripts/activate-missing-products.mjs
// Run: node scripts/activate-missing-products.mjs
//
// Activates or creates products that the configurator references but are
// missing / inactive in the database.  This fixes the slug-mismatch issue
// that prevents customers from getting prices.

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const PRODUCTS_TO_ACTIVATE = [
  {
    slug: "rack-cards",
    name: "Rack Cards",
    category: "marketing-business-print",
    type: "other",
    pricingUnit: "per_piece",
    basePrice: 4500,
    description: "Full colour rack cards for brochure holders. Printed on premium 14pt cardstock.",
  },
  {
    slug: "tags",
    name: "Tags & Hang Tags",
    category: "marketing-business-print",
    type: "other",
    pricingUnit: "per_piece",
    basePrice: 3500,
    description: "Custom hang tags, product labels & packaging tags on premium cardstock.",
  },
  {
    slug: "calendars-desk",
    name: "Desk Calendars",
    category: "marketing-business-print",
    type: "other",
    pricingUnit: "per_piece",
    basePrice: 1200,
    description: "Wire-O bound desk calendars with easel stand. 13 sheets (cover + 12 months).",
  },
  {
    slug: "retail-tags",
    name: "Retail Tags",
    category: "marketing-business-print",
    type: "other",
    pricingUnit: "per_piece",
    basePrice: 2500,
    description: "Custom retail hang tags for pricing & branding.",
  },
  {
    slug: "tabletop-displays",
    name: "Tabletop Displays",
    category: "marketing-business-print",
    type: "other",
    pricingUnit: "per_piece",
    basePrice: 5900,
    description: "Custom tabletop displays for trade shows & retail. Retractable, popup, and easel options.",
  },
  {
    slug: "hang-tags",
    name: "Hang Tags",
    category: "marketing-business-print",
    type: "other",
    pricingUnit: "per_piece",
    basePrice: 3500,
    description: "Custom hang tags on premium 14pt cardstock with optional hole punch and string.",
  },
  {
    slug: "inserts-packaging",
    name: "Product Inserts & Packaging Cards",
    category: "marketing-business-print",
    type: "other",
    pricingUnit: "per_piece",
    basePrice: 2500,
    description: "Custom product inserts, packaging cards & thank-you cards on 20lb, 100lb, or 14pt stock.",
  },
  {
    slug: "presentation-folders",
    name: "Presentation Folders",
    category: "marketing-business-print",
    type: "other",
    pricingUnit: "per_piece",
    basePrice: 8500,
    description: "Custom presentation folders with optional business card slits and pockets.",
  },
  {
    slug: "loyalty-cards",
    name: "Loyalty Cards",
    category: "marketing-business-print",
    type: "other",
    pricingUnit: "per_piece",
    basePrice: 3000,
    description: "Custom loyalty & reward cards on premium 14pt cardstock with optional numbering.",
  },
];

async function main() {
  console.log("=== Activating / creating missing products ===\n");

  for (const product of PRODUCTS_TO_ACTIVATE) {
    const existing = await prisma.product.findUnique({
      where: { slug: product.slug },
    });

    if (existing) {
      if (existing.isActive) {
        console.log(`✓ ${product.slug} — already active`);
      } else {
        await prisma.product.update({
          where: { slug: product.slug },
          data: { isActive: true },
        });
        console.log(`✓ ${product.slug} — activated (was inactive)`);
      }
    } else {
      await prisma.product.create({
        data: {
          slug: product.slug,
          name: product.name,
          category: product.category,
          type: product.type,
          pricingUnit: product.pricingUnit,
          basePrice: product.basePrice,
          description: product.description,
          isActive: true,
          acceptedFormats: ["ai", "pdf", "eps", "tiff", "jpg", "png"],
          minDpi: 300,
          requiresBleed: true,
          bleedIn: 0.125,
        },
      });
      console.log(`✓ ${product.slug} — created & activated`);
    }
  }

  console.log("\nDone! All configurator slugs now have active DB products.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
