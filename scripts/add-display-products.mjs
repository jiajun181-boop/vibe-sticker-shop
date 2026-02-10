import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const displayProducts = [
  {
    name: "Retractable Banner Stand - Premium",
    slug: "retractable-banner-stand-premium",
    category: "display-stands",
    type: "sign",
    pricingUnit: "per_piece",
    basePrice: 14500,
    description: "Premium retractable stand with padded carrying case. 33\" x 81\" (85cm x 200cm). Easy setup in seconds.",
    minWidthIn: 33, maxWidthIn: 33, minHeightIn: 81, maxHeightIn: 81,
    acceptedFormats: ["ai", "pdf", "eps", "tiff", "jpg", "png"],
    minDpi: 150, requiresBleed: true, bleedIn: 0.125,
  },
  {
    name: "X-Banner Stand - Standard",
    slug: "x-banner-stand-standard",
    category: "display-stands",
    type: "sign",
    pricingUnit: "per_piece",
    basePrice: 4500,
    description: "Lightweight portable X-frame stand. 24\" x 63\" (60cm x 160cm). Budget-friendly display solution.",
    minWidthIn: 24, maxWidthIn: 24, minHeightIn: 63, maxHeightIn: 63,
    acceptedFormats: ["ai", "pdf", "eps", "tiff", "jpg", "png"],
    minDpi: 150, requiresBleed: true, bleedIn: 0.125,
  },
  {
    name: "X-Banner Stand - Large",
    slug: "x-banner-stand-large",
    category: "display-stands",
    type: "sign",
    pricingUnit: "per_piece",
    basePrice: 6500,
    description: "Large format X-frame for maximum visibility. 31\" x 71\" (80cm x 180cm). Great for trade shows.",
    minWidthIn: 31, maxWidthIn: 31, minHeightIn: 71, maxHeightIn: 71,
    acceptedFormats: ["ai", "pdf", "eps", "tiff", "jpg", "png"],
    minDpi: 150, requiresBleed: true, bleedIn: 0.125,
  },
  {
    name: "Tabletop Banner - A4",
    slug: "tabletop-banner-a4",
    category: "display-stands",
    type: "sign",
    pricingUnit: "per_piece",
    basePrice: 3500,
    description: "Perfect for trade show tables and counters. 8.3\" x 11.7\" (A4 size). Compact and professional.",
    minWidthIn: 8.3, maxWidthIn: 8.3, minHeightIn: 11.7, maxHeightIn: 11.7,
    acceptedFormats: ["ai", "pdf", "eps", "tiff", "jpg", "png"],
    minDpi: 300, requiresBleed: true, bleedIn: 0.125,
  },
  {
    name: "Tabletop Banner - A3",
    slug: "tabletop-banner-a3",
    category: "display-stands",
    type: "sign",
    pricingUnit: "per_piece",
    basePrice: 5500,
    description: "Larger tabletop display for better visibility. 11.7\" x 16.5\" (A3 size). Ideal for reception desks.",
    minWidthIn: 11.7, maxWidthIn: 11.7, minHeightIn: 16.5, maxHeightIn: 16.5,
    acceptedFormats: ["ai", "pdf", "eps", "tiff", "jpg", "png"],
    minDpi: 300, requiresBleed: true, bleedIn: 0.125,
  },
  {
    name: "Deluxe Tabletop Retractable - A3",
    slug: "deluxe-tabletop-retractable-a3",
    category: "display-stands",
    type: "sign",
    pricingUnit: "per_piece",
    basePrice: 7500,
    description: "Premium tabletop with retractable mechanism. 11.7\" x 16.5\" (A3). Sleek aluminum base.",
    minWidthIn: 11.7, maxWidthIn: 11.7, minHeightIn: 16.5, maxHeightIn: 16.5,
    acceptedFormats: ["ai", "pdf", "eps", "tiff", "jpg", "png"],
    minDpi: 300, requiresBleed: true, bleedIn: 0.125,
  },
  // ─── Hardware & Accessories ───────────────────────────
  {
    name: "H-Wire Stake",
    slug: "h-stake-wire",
    category: "display-stands",
    type: "other",
    pricingUnit: "per_piece",
    basePrice: 350,
    description: "Galvanized H-wire stakes for coroplast yard signs. 10\" x 30\". Sold individually.",
    minWidthIn: 10, maxWidthIn: 10, minHeightIn: 30, maxHeightIn: 30,
  },
  {
    name: "A-Frame Sidewalk Stand",
    slug: "a-frame-stand",
    category: "display-stands",
    type: "sign",
    pricingUnit: "per_piece",
    basePrice: 6500,
    description: "Folding A-frame sidewalk stand. Fits 24\" x 36\" inserts. Frame only — inserts sold separately.",
    minWidthIn: 24, maxWidthIn: 24, minHeightIn: 36, maxHeightIn: 36,
  },
  {
    name: "Real Estate Sign Frame",
    slug: "real-estate-frame",
    category: "display-stands",
    type: "sign",
    pricingUnit: "per_piece",
    basePrice: 4500,
    description: "Heavy-duty metal rider frame for real estate signs. Fits 18\" x 24\" panels. Includes ground stake.",
    minWidthIn: 18, maxWidthIn: 18, minHeightIn: 24, maxHeightIn: 24,
  },
  {
    name: "L-Base Banner Stand",
    slug: "l-base-banner-stand",
    category: "display-stands",
    type: "sign",
    pricingUnit: "per_piece",
    basePrice: 3500,
    description: "L-base banner stand hardware. 24\" x 63\" (60cm x 160cm). Frame only — print sold separately.",
    minWidthIn: 24, maxWidthIn: 24, minHeightIn: 63, maxHeightIn: 63,
  },
  {
    name: "Tabletop X-Banner Stand",
    slug: "tabletop-x-banner",
    category: "display-stands",
    type: "sign",
    pricingUnit: "per_piece",
    basePrice: 2500,
    description: "Compact tabletop X-banner stand. 11.5\" x 16.5\" (290mm x 420mm). Perfect for counters and desks.",
    minWidthIn: 11.5, maxWidthIn: 11.5, minHeightIn: 16.5, maxHeightIn: 16.5,
    acceptedFormats: ["ai", "pdf", "eps", "tiff", "jpg", "png"],
    minDpi: 300, requiresBleed: true, bleedIn: 0.125,
  },
  {
    name: "Deluxe Roll-Up Banner Stand",
    slug: "deluxe-rollup-banner",
    category: "display-stands",
    type: "sign",
    pricingUnit: "per_piece",
    basePrice: 16500,
    description: "Premium retractable roll-up banner with padded carrying case. 33.5\" x 79\". Wide aluminum base.",
    minWidthIn: 33.5, maxWidthIn: 33.5, minHeightIn: 79, maxHeightIn: 79,
    acceptedFormats: ["ai", "pdf", "eps", "tiff", "jpg", "png"],
    minDpi: 150, requiresBleed: true, bleedIn: 0.125,
  },
  {
    name: "Telescopic Backdrop Stand",
    slug: "telescopic-backdrop",
    category: "display-stands",
    type: "sign",
    pricingUnit: "per_piece",
    basePrice: 28500,
    description: "Adjustable telescopic backdrop frame 10' x 10' (120\" x 120\"). Events and trade shows. Frame only.",
    minWidthIn: 120, maxWidthIn: 120, minHeightIn: 120, maxHeightIn: 120,
  },
];

const placeholderUrls = {
  "retractable-banner-stand-premium": "https://placehold.co/400x600/1a1a2e/ffffff/png?text=Retractable+Stand",
  "x-banner-stand-standard": "https://placehold.co/400x600/2d3436/ffffff/png?text=X-Banner+24x63",
  "x-banner-stand-large": "https://placehold.co/400x600/0984e3/ffffff/png?text=X-Banner+31x71",
  "tabletop-banner-a4": "https://placehold.co/400x300/6c5ce7/ffffff/png?text=Tabletop+A4",
  "tabletop-banner-a3": "https://placehold.co/400x300/00b894/ffffff/png?text=Tabletop+A3",
  "deluxe-tabletop-retractable-a3": "https://placehold.co/400x300/e17055/ffffff/png?text=Deluxe+A3",
  "h-stake-wire": "https://placehold.co/400x400/636e72/ffffff/png?text=H-Stake",
  "a-frame-stand": "https://placehold.co/400x400/2d3436/ffffff/png?text=A-Frame",
  "real-estate-frame": "https://placehold.co/400x400/d63031/ffffff/png?text=RE+Frame",
  "l-base-banner-stand": "https://placehold.co/400x600/6c5ce7/ffffff/png?text=L-Base",
  "tabletop-x-banner": "https://placehold.co/400x300/00b894/ffffff/png?text=Tabletop+X",
  "deluxe-rollup-banner": "https://placehold.co/400x600/0984e3/ffffff/png?text=Deluxe+Rollup",
  "telescopic-backdrop": "https://placehold.co/400x400/1a1a2e/ffffff/png?text=Backdrop+10x10",
};

async function main() {
  console.log(`Adding ${displayProducts.length} display stand products...`);
  for (const p of displayProducts) {
    const existing = await prisma.product.findUnique({ where: { slug: p.slug } });
    if (existing) {
      console.log(`  ⏭ ${p.name} already exists, skipping.`);
      continue;
    }
    await prisma.product.create({
      data: {
        ...p,
        isActive: true,
        sortOrder: -10, // show first
        images: {
          create: [{ url: placeholderUrls[p.slug], alt: p.name }],
        },
      },
    });
    console.log(`  ✅ ${p.name}`);
  }
  console.log("Done!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
