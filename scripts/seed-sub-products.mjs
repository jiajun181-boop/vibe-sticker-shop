#!/usr/bin/env node
/**
 * Seed all 35 sub-products for the 10 marketing-prints categories.
 * Each sub-product is a standalone Product row linked to category "marketing-prints".
 * Run: node scripts/seed-sub-products.mjs
 *
 * After seeding, you can run:
 *   node prisma/backfill-marketing-prints-all.mjs
 * to populate optionsConfig with detailed pricing.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const CATEGORY = "marketing-prints";
const PRINT_FORMATS = ["ai", "pdf", "eps", "tiff", "jpg", "png"];

const SUB_PRODUCTS = [
  // ── 1. Flyers ──
  {
    slug: "flyers-small",
    name: "Small Flyer",
    description: 'Compact 5.5"×8.5" flyer — budget-friendly for handouts, inserts, and counter displays. Full-colour on premium stock.',
    basePrice: 5900,
    sortOrder: 10,
  },
  {
    slug: "flyers-standard",
    name: "Standard Flyer",
    description: 'Classic 8.5"×11" letter-size flyer — the most popular choice for promotions, menus, and service lists.',
    basePrice: 7900,
    sortOrder: 11,
  },
  {
    slug: "flyers-large",
    name: "Large Flyer",
    description: 'Tabloid 11"×17" flyer — high-impact size for posters and detailed layouts with maximum visibility.',
    basePrice: 10900,
    sortOrder: 12,
  },

  // ── 2. Postcards ──
  {
    slug: "postcards-standard",
    name: "Standard Postcard",
    description: 'Classic 4"×6" postcard on thick cardstock — perfect for thank-you cards, promos, and direct mail campaigns.',
    basePrice: 4900,
    sortOrder: 20,
  },
  {
    slug: "postcards-medium",
    name: "Medium Postcard",
    description: '5"×7" postcard with extra room for photos, coupons, and event invitations. Premium cardstock.',
    basePrice: 5900,
    sortOrder: 21,
  },
  {
    slug: "postcards-large",
    name: "Large Postcard",
    description: '6"×9" jumbo postcard — premium feel for real estate, brand showcases, and high-impact mailers.',
    basePrice: 7900,
    sortOrder: 22,
  },
  {
    slug: "postcards-eddm",
    name: "EDDM Postcard",
    description: '6.5"×9" Every Door Direct Mail compliant postcard for neighborhood-wide marketing drops.',
    basePrice: 8900,
    sortOrder: 23,
  },

  // ── 3. Brochures ──
  {
    slug: "brochures-bi-fold",
    name: "Bi-Fold Brochure",
    description: '8.5"×11" bi-fold brochure — 4-panel layout ideal for product intros, price sheets, and service overviews.',
    basePrice: 9900,
    sortOrder: 30,
  },
  {
    slug: "brochures-tri-fold",
    name: "Tri-Fold Brochure",
    description: '8.5"×11" tri-fold brochure — 6-panel classic for store promos, campaigns, and handouts.',
    basePrice: 11900,
    sortOrder: 31,
  },
  {
    slug: "brochures-z-fold",
    name: "Z-Fold Brochure",
    description: '8.5"×14" Z-fold brochure — accordion fold for guides, maps, catalogs, and detailed content.',
    basePrice: 13900,
    sortOrder: 32,
  },

  // ── 4. Posters ──
  {
    slug: "posters-glossy",
    name: "Glossy Poster",
    description: 'Vibrant glossy paper poster — vivid colours for retail displays, events, and eye-catching signage. Sizes from 18"×24" to 24"×36".',
    basePrice: 9900,
    sortOrder: 40,
  },
  {
    slug: "posters-matte",
    name: "Matte Poster",
    description: 'Glare-free matte paper poster — perfect for galleries, offices, and professional signage. Sizes from 18"×24" to 24"×36".',
    basePrice: 9900,
    sortOrder: 41,
  },
  {
    slug: "posters-adhesive",
    name: "Adhesive Poster",
    description: 'Self-adhesive poster with peel-and-stick backing — apply directly to walls, windows, and smooth surfaces.',
    basePrice: 16900,
    sortOrder: 42,
  },
  {
    slug: "posters-backlit",
    name: "Backlit Poster",
    description: 'Translucent film poster for lightboxes and illuminated displays — vibrant when backlit, professional impact.',
    basePrice: 24900,
    sortOrder: 43,
  },

  // ── 5. Booklets ──
  {
    slug: "booklets-saddle-stitch",
    name: "Saddle Stitch Booklet",
    description: 'Staple-bound booklet ideal for catalogs, event programs, and product guides. Available in 5.5"×8.5" and 8.5"×11".',
    basePrice: 24900,
    sortOrder: 50,
  },
  {
    slug: "booklets-perfect-bound",
    name: "Perfect Bound Booklet",
    description: 'Flat-spine glued binding for brand books, annual reports, and premium catalogs. Professional look and feel.',
    basePrice: 39900,
    sortOrder: 51,
  },
  {
    slug: "booklets-wire-o",
    name: "Wire-O Booklet",
    description: 'Wire-O bound booklet that lays flat — ideal for manuals, planners, notebooks, and reference guides.',
    basePrice: 34900,
    sortOrder: 52,
  },

  // ── 6. Menus ──
  {
    slug: "menus-flat",
    name: "Flat Menu",
    description: 'Single-sheet flat menu for counters, takeout, and fast-casual dining. Quick updates at low cost.',
    basePrice: 7900,
    sortOrder: 60,
  },
  {
    slug: "menus-folded",
    name: "Folded Menu",
    description: 'Bi-fold or tri-fold menu for dine-in restaurants with multiple sections and courses.',
    basePrice: 10900,
    sortOrder: 61,
  },
  {
    slug: "menus-laminated",
    name: "Laminated Menu",
    description: 'Waterproof laminated menu for long-term dine-in use — resists spills, stains, and daily handling.',
    basePrice: 14900,
    sortOrder: 62,
  },
  {
    slug: "menus-takeout",
    name: "Takeout Insert",
    description: 'Lightweight insert for delivery bags — feature deals, QR codes, and your full takeout menu.',
    basePrice: 5900,
    sortOrder: 63,
  },

  // ── 7. Envelopes ──
  {
    slug: "envelopes-10-business",
    name: "#10 Business Envelope",
    description: 'Standard 4.125"×9.5" business envelope for invoices, letters, and official correspondence.',
    basePrice: 8900,
    sortOrder: 70,
  },
  {
    slug: "envelopes-a7-invitation",
    name: "A7 Invitation Envelope",
    description: '5.25"×7.25" envelope — fits 5×7 cards for weddings, events, and premium greeting cards.',
    basePrice: 7900,
    sortOrder: 71,
  },
  {
    slug: "envelopes-6x9-catalog",
    name: "6×9 Catalog Envelope",
    description: 'Mid-size 6"×9" envelope for booklets, brochures, and product samples.',
    basePrice: 9900,
    sortOrder: 72,
  },
  {
    slug: "envelopes-9x12-catalog",
    name: "9×12 Catalog Envelope",
    description: 'Full-size 9"×12" envelope for unfolded documents, contracts, and presentations.',
    basePrice: 11900,
    sortOrder: 73,
  },

  // ── 8. Rack Cards ──
  {
    slug: "rack-cards-standard",
    name: "Standard Rack Card",
    description: 'Classic 4"×9" rack card for hotels, clinics, tourism spots, and lobby displays.',
    basePrice: 5900,
    sortOrder: 80,
  },
  {
    slug: "rack-cards-tear-off",
    name: "Tear Card",
    description: '4"×9" rack card with perforated tear-off section for coupons, contact info, or business cards.',
    basePrice: 6900,
    sortOrder: 81,
  },
  {
    slug: "rack-cards-folded",
    name: "Folded Rack Card",
    description: '4"×9" bi-fold rack card — double the content space for detailed information and offers.',
    basePrice: 6900,
    sortOrder: 82,
  },

  // ── 9. Door Hangers ──
  {
    slug: "door-hangers-standard",
    name: "Standard Door Hanger",
    description: 'Classic 3.5"×8.5" die-cut door hanger for local marketing, service promos, and neighborhood outreach.',
    basePrice: 6900,
    sortOrder: 90,
  },
  {
    slug: "door-hangers-large",
    name: "Large Door Hanger",
    description: 'Oversized 4.25"×11" door hanger with extra space for detailed offers, maps, and multiple services.',
    basePrice: 8900,
    sortOrder: 91,
  },
  {
    slug: "door-hangers-perforated",
    name: "Perforated Door Hanger",
    description: '3.5"×8.5" door hanger with tear-off coupon or business card at the bottom — boosts conversion.',
    basePrice: 7900,
    sortOrder: 92,
  },

  // ── 10. Presentation Folders ──
  {
    slug: "presentation-folders-standard",
    name: "Standard 2-Pocket Folder",
    description: 'Classic 9"×12" folder with two pockets for meetings, proposals, and client presentations.',
    basePrice: 29900,
    sortOrder: 100,
  },
  {
    slug: "presentation-folders-reinforced",
    name: "Reinforced Folder",
    description: 'Heavy-stock 9"×12" folder for premium brand kits, client packages, and trade show materials.',
    basePrice: 34900,
    sortOrder: 101,
  },
  {
    slug: "presentation-folders-legal",
    name: "Legal Size Folder",
    description: '9"×14.5" folder for legal documents, contracts, and oversized inserts.',
    basePrice: 34900,
    sortOrder: 102,
  },
  {
    slug: "presentation-folders-die-cut",
    name: "Custom Die-Cut Folder",
    description: 'Custom die-cut folder with unique shapes — make your brand presentations stand out.',
    basePrice: 44900,
    sortOrder: 103,
  },
];

async function main() {
  let created = 0;
  let skipped = 0;

  for (const sp of SUB_PRODUCTS) {
    const existing = await prisma.product.findUnique({
      where: { slug: sp.slug },
    });

    if (existing) {
      skipped++;
      continue;
    }

    await prisma.product.create({
      data: {
        slug: sp.slug,
        name: sp.name,
        category: CATEGORY,
        description: sp.description,
        type: "other",
        basePrice: sp.basePrice,
        pricingUnit: "per_piece",
        isActive: true,
        sortOrder: sp.sortOrder,
        acceptedFormats: PRINT_FORMATS,
        minDpi: 150,
        requiresBleed: true,
        bleedIn: 0.125,
      },
    });
    created++;
  }

  console.log(`Done. Created: ${created}, Skipped (already exist): ${skipped}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
