/**
 * Update sign product names, descriptions, and sort orders
 * for the 11 canonical products.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const UPDATES = [
  // ── Coroplast Signs (sortOrder 1-4) ──
  {
    slug: "yard-sign",
    name: "Yard & Lawn Signs",
    description: "Elections, events, ads — durable 4mm Coroplast for outdoor use",
    sortOrder: 1,
    isFeatured: false,
  },
  {
    slug: "real-estate-sign",
    name: "Real Estate Signs",
    description: "For Sale, Sold, Open House — professional agent signage",
    sortOrder: 2,
    isFeatured: true,
  },
  {
    slug: "construction-site-signs",
    name: "Construction Signs",
    description: "Safety, site info boards — weatherproof construction signage",
    sortOrder: 3,
    isFeatured: false,
  },
  {
    slug: "coroplast-signs",
    name: "Custom Coroplast",
    description: "Any size, any design — custom Coroplast board printing",
    sortOrder: 4,
    isFeatured: false,
  },
  // ── Foam Board Displays (sortOrder 5-8) ──
  {
    slug: "selfie-frame-board",
    name: "Photo Boards & Selfie Frames",
    description: "Props, cutouts, photo frames for events and parties",
    sortOrder: 5,
    isFeatured: false,
  },
  {
    slug: "welcome-sign-board",
    name: "Welcome & Directional Signs",
    description: "Welcome boards, wayfinding signs for events and venues",
    sortOrder: 6,
    isFeatured: false,
  },
  {
    slug: "tri-fold-presentation-board",
    name: "Presentation Boards",
    description: "Display boards, hand-held signs for presentations",
    sortOrder: 7,
    isFeatured: false,
  },
  {
    slug: "foam-board",
    name: "Custom Foam Board",
    description: "Any size, any design — lightweight foam board printing",
    sortOrder: 8,
    isFeatured: false,
  },
  // ── Accessories (sortOrder 9-11) ──
  {
    slug: "a-frame-sign-stand",
    name: "A-Frame Signs",
    description: "Double-sided sidewalk display stands",
    sortOrder: 9,
    isFeatured: false,
  },
  {
    slug: "h-stakes",
    name: "H-Wire Stakes",
    description: "Push into ground for yard signs — sold in pairs",
    sortOrder: 10,
    isFeatured: false,
  },
  {
    slug: "real-estate-frame",
    name: "Real Estate Frames",
    description: "Metal sign holders for real estate signs",
    sortOrder: 11,
    isFeatured: false,
  },
];

async function main() {
  console.log("Updating 11 sign product details...\n");

  for (const u of UPDATES) {
    const result = await prisma.product.updateMany({
      where: { slug: u.slug, category: "signs-rigid-boards" },
      data: {
        name: u.name,
        description: u.description,
        sortOrder: u.sortOrder,
        isFeatured: u.isFeatured,
      },
    });
    console.log(`  ${result.count > 0 ? "✅" : "⚠️"} ${u.slug} → "${u.name}" (sortOrder: ${u.sortOrder})`);
  }

  console.log("\nDone!");
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
