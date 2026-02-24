#!/usr/bin/env node
/**
 * Update metaTitle & metaDescription for 11 products that are missing them.
 * Run:  node scripts/update-product-meta.mjs
 * Safe to re-run (upsert by slug).
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const PRODUCT_META = [
  {
    slug: "safety-labels",
    metaTitle: "Custom Safety Labels & Warning Stickers | Durable OSHA Compliant Decals",
    metaDescription:
      "Order custom safety labels and warning stickers for workplace compliance. UV-resistant, waterproof materials with OSHA-compliant designs. Fast turnaround across Canada.",
  },
  {
    slug: "industrial-labels",
    metaTitle: "Industrial Labels & Asset Tags | Heavy-Duty Custom Printing",
    metaDescription:
      "Custom industrial labels and asset tags built for harsh environments. Chemical-resistant, heat-tolerant materials for equipment tracking, inventory, and compliance labelling.",
  },
  {
    slug: "transparent-color-film",
    metaTitle: "Transparent Color Window Film | Custom Tinted Glass Graphics",
    metaDescription:
      "Custom transparent color window film for storefronts, offices, and retail displays. Vibrant translucent hues that let light through while adding branded color to any glass surface.",
  },
  {
    slug: "blockout-vinyl",
    metaTitle: "Blockout Vinyl Window Graphics | Full Opacity Privacy Film",
    metaDescription:
      "Custom blockout vinyl for complete light-blocking window coverage. Ideal for privacy, room darkening, and bold storefront graphics. Professional installation-ready prints.",
  },
  {
    slug: "glass-waistline",
    metaTitle: "Glass Waistline Strips | Frosted Safety Band Decals",
    metaDescription:
      "Custom glass waistline strips for safety compliance and branding. Frosted, etched, or printed bands that meet building code visibility requirements on glass doors and partitions.",
  },
  {
    slug: "canvas-split-3",
    metaTitle: "3-Panel Split Canvas Prints | Custom Triptych Wall Art",
    metaDescription:
      "Custom 3-panel split canvas prints for home and office decor. Gallery-wrapped triptych art printed on premium canvas with precision colour matching. Ready to hang.",
  },
  {
    slug: "canvas-split-5",
    metaTitle: "5-Panel Split Canvas Prints | Custom Multi-Panel Wall Art",
    metaDescription:
      "Custom 5-panel split canvas prints for dramatic wall displays. Premium gallery-wrapped panels with seamless image continuation. Perfect for large feature walls.",
  },
  {
    slug: "document-printing",
    metaTitle: "Document Printing Services | Reports, Manuals & Presentations",
    metaDescription:
      "Professional document printing for reports, manuals, training materials, and presentations. High-quality colour or B&W prints with binding options. Fast bulk printing across Canada.",
  },
  {
    slug: "sticker-rolls",
    metaTitle: "Custom Roll Labels & Stickers | Die-Cut Roll Printing",
    metaDescription:
      "Custom roll labels and stickers for product packaging, branding, and shipping. Durable BOPP, vinyl, and paper stocks with any shape die-cut. Quantities from 250 to 100,000+.",
  },
  {
    slug: "shelf-danglers",
    metaTitle: "Custom Shelf Danglers | Die-Cut Hanging Shelf Signs",
    metaDescription:
      "Custom shelf danglers for retail point-of-purchase displays. Die-cut hanging signs printed on rigid PVC or cardstock with drill holes for easy hook mounting.",
  },
  {
    slug: "shelf-wobblers",
    metaTitle: "Custom Shelf Wobblers | Spring-Mounted POP Displays",
    metaDescription:
      "Custom shelf wobblers for attention-grabbing retail merchandising. Spring-mounted PVC cards that wobble to catch shoppers' eyes. Full-colour printing with wobbler arm included.",
  },
];

async function main() {
  let updated = 0;
  for (const { slug, metaTitle, metaDescription } of PRODUCT_META) {
    const result = await prisma.product.updateMany({
      where: { slug },
      data: { metaTitle, metaDescription },
    });
    if (result.count > 0) {
      console.log(`✓ ${slug} — meta updated`);
      updated++;
    } else {
      console.log(`⚠ ${slug} — product not found in DB, skipped`);
    }
  }
  console.log(`\nDone. Updated ${updated}/${PRODUCT_META.length} products.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
